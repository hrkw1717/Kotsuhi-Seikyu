from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import pandas as pd
import os
import json
import smtplib
import gspread
from google.oauth2.service_account import Credentials
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.utils import formataddr
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from io import BytesIO
from pypdf import PdfReader, PdfWriter
import calendar
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import openpyxl

# .env ファイルの読み込み（エラーを無視して続行）
try:
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    print("Environment variables loaded successfully.")
except Exception as e:
    print(f"Warning: .env loading issue: {e}")

app = FastAPI(title="Tokeidai Claim API")

# --- 設定と認証 ---
COMPANY_EMAIL_DEFAULT = os.getenv("COMPANY_EMAIL_DEFAULT", "sbs@sobun.net")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
SPREADSHEET_URL = os.getenv("SPREADSHEET_URL", "")
SHARED_PASSWORD = os.getenv("SHARED_PASSWORD", "tokei")

# ファイルパス（backendから見た相対パス）
SHIFT_PATH = os.path.join(os.path.dirname(__file__), "..", "シフト表時計台警備通年.xlsx")
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "..", "テンプレート.pdf")

# React(Next.js)からのアクセスを許可
origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in origins_env.split(",")] if origins_env else [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    userid: str
    password: str

class ClaimRequest(BaseModel):
    year: str
    month: str
    userid: str

def get_gsheet_client():
    creds_json = os.getenv("GCP_SERVICE_ACCOUNT_JSON")
    if not creds_json:
        # デバッグ用にエラーを詳細化
        raise HTTPException(status_code=500, detail="GCP_SERVICE_ACCOUNT_JSON is not set in .env")
    
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    try:
        creds_info = json.loads(creds_json)
        creds = Credentials.from_service_account_info(creds_info, scopes=scopes)
        return gspread.authorize(creds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Auth Error: {str(e)}")

def load_mypage_data() -> pd.DataFrame:
    try:
        client = get_gsheet_client()
        sh = client.open_by_url(SPREADSHEET_URL)
        worksheet = sh.worksheet("My-page")
        data = worksheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        print(f"Error loading sheet: {e}")
        return pd.DataFrame()

def load_shift_days(year: int, month: int, kanji_name: str) -> List[int]:
    """シフト表Excelから指定ユーザーの勤務日（日付のリスト）を取得"""
    if not os.path.exists(SHIFT_PATH):
        print(f"Shift file not found: {SHIFT_PATH}")
        return []

    try:
        wb = openpyxl.load_workbook(SHIFT_PATH, data_only=True)
        month_label = f"{month}月"
        target_ws = None
        start_row = None
        
        # 月の場所を探す
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            for row in range(1, 100):
                for col in range(1, 10):
                    if ws.cell(row=row, column=col).value == month_label:
                        target_ws = ws
                        start_row = row
                        break
                if target_ws: break
            if target_ws: break
        
        if not target_ws or start_row is None:
            print(f"Sheet or month label not found for {month_label}")
            return []

        # 日付列の特定
        day_cols = {}
        for c in range(1, target_ws.max_column + 1):
            val = target_ws.cell(row=start_row, column=c).value
            if isinstance(val, (int, float)) or (isinstance(val, str) and val.isdigit()):
                day_cols[int(val)] = c

        # ユーザーの行を探す
        row_idx = None
        for r in range(start_row, start_row + 100):
            for c in range(1, 5):
                if target_ws.cell(row=r, column=c).value == kanji_name:
                    row_idx = r
                    break
            if row_idx: break
        
        if not row_idx:
            print(f"User {kanji_name} not found in sheet")
            return []

        days = []
        for day, col in day_cols.items():
            val = target_ws.cell(row=row_idx, column=col).value
            if isinstance(val, str) and val.strip() in ["出", "朝", "夜"]:
                days.append(day)
        
        # 1月以外、または1/4以降の重複（1日1名ルール）は上位ロジックで扱うか一旦そのまま
        # とりあえず日付のリストを返す
        return sorted(list(set(days)))
    except Exception as e:
        print(f"Error reading shift: {e}")
        return []

def generate_pdf_buffer(user_name, year, month, route, fare, shift_days):
    packet = BytesIO()
    pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
    c = canvas.Canvas(packet, pagesize=A4)
    
    # 既存のテンプレートを読み込むパス
    template_path = os.path.join(os.path.dirname(__file__), "..", "テンプレート.pdf")
    if not os.path.exists(template_path):
        c.setFont('HeiseiKakuGo-W5', 12)
        c.drawString(100, 700, "Template PDF not found. Please check paths.")
        c.save()
        packet.seek(0)
        return packet

    c.setFont('HeiseiKakuGo-W5', 18)
    c.setFillColorRGB(1, 1, 1) # 白
    c.rect(38, 789, 150, 25, fill=1, stroke=0)
    c.setFillColorRGB(0, 0, 0) # 黒
    c.drawString(38.88, 790.68, f"{year}年 {month}月分")
    
    c.setFont('HeiseiKakuGo-W5', 12)
    c.drawString(205, 768, user_name)

    x_fare_right = 450
    y_start = 719.64
    row_gap = 19.68
    total_fare = 0
    
    for day in shift_days:
        curr_y = y_start - (day - 1) * row_gap
        c.setFont('HeiseiKakuGo-W5', 10)
        c.drawCentredString(96, curr_y, "MMS")
        c.drawCentredString(158, curr_y, "時計台")
        
        display_route = route
        font_size = 10
        if len(display_route) > 25: font_size = 7
        elif len(display_route) > 20: font_size = 8
        c.setFont('HeiseiKakuGo-W5', font_size)
        c.drawString(194, curr_y, display_route)
        
        c.drawRightString(x_fare_right, curr_y, f"{fare}")
        total_fare += fare

    c.setFont('HeiseiKakuGo-W5', 10)
    c.drawRightString(x_fare_right, 111.00, f"{total_fare}")
    c.save()
    packet.seek(0)

    reader = PdfReader(template_path)
    new_pdf = PdfReader(packet)
    output = PdfWriter()
    page = reader.pages[0]
    page.merge_page(new_pdf.pages[0])
    output.add_page(page)
    
    final_buffer = BytesIO()
    output.write(final_buffer)
    final_buffer.seek(0)
    return final_buffer

@app.get("/")
async def root():
    return {"message": "Tokeidai Claim API is running"}

@app.post("/api/login")
async def login(req: LoginRequest):
    df = load_mypage_data()
    if df.empty:
        # シートが空、または読み込めない場合も一応チェック
        if req.userid == "hori" and req.password == "tokei":
             return {"status": "success", "user": {"name": "堀川 勉 (Offline)", "id": "hori"}}
        raise HTTPException(status_code=500, detail="Could not load user data from Google Sheets")
    
    user_row = df[df["ID"] == req.userid]
    if user_row.empty:
        return {"status": "error", "message": "IDが見つかりません"}
    
    expected_pass = str(user_row.iloc[0].get("pass", SHARED_PASSWORD))
    if str(req.password) == expected_pass:
        user_info = {
            "name": user_row.iloc[0]["氏名"],
            "id": req.userid,
            "email": user_row.iloc[0]["メアド"],
            "company_email": user_row.iloc[0].get("会社メアド", COMPANY_EMAIL_DEFAULT)
        }
        return {"status": "success", "user": user_info}
    
    return {"status": "error", "message": "合言葉が違います"}

def send_claim_email(to_email, subject, body, from_name, pdf_buffer, pdf_filename):
    try:
        msg = MIMEMultipart()
        msg['From'] = formataddr((from_name, SENDER_EMAIL))
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        if pdf_buffer:
            part = MIMEApplication(pdf_buffer.getvalue(), Name=pdf_filename)
            part['Content-Disposition'] = f'attachment; filename="{pdf_filename}"'
            msg.attach(part)

        # Gmail以外を使う可能性も考慮し、設定を共通化できるようにする
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

@app.post("/api/claims/preview")
async def get_preview(req: ClaimRequest):
    df = load_mypage_data()
    if df.empty:
         raise HTTPException(status_code=500, detail="Google Sheets could not be loaded")
    
    user_row = df[df["ID"] == req.userid]
    if user_row.empty:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_info = user_row.iloc[0]
    surname = user_info.get("苗字", user_info["氏名"].split()[0])
    
    # 実際はシフト表Excelから取得するが、一旦ダミー
    # TODO: load_shift_data の移植
    dummy_days = [1, 5, 10, 15, 20] 
    
    return {
        "status": "success",
        "data": {
            "recipient": user_info.get("会社メアド", COMPANY_EMAIL_DEFAULT),
            "subject": f"交通費請求書_{req.year}{req.month}_{surname}",
            "body": f"高橋 様\n\n時計台警備の{surname}です。お疲れ様です。\n交通費請求書（{req.year}年{req.month}月分）をお送りします。\n\n以上、どうぞよろしくお願い致します。",
            "days_count": len(dummy_days),
            "total_fare": len(dummy_days) * int(user_info["運賃"]),
            "days": dummy_days
        }
    }

@app.post("/api/claims/send")
async def send_claim(req: ClaimRequest):
    df = load_mypage_data()
    user_row = df[df["ID"] == req.userid]
    if user_row.empty:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_info = user_row.iloc[0]
    surname = user_info.get("苗字", user_info["氏名"].split()[0])
    
    # 本物のシフトデータ取得
    id_to_kanji = {"yama": "山口", "saka": "坂下", "hori": "堀川"}
    kanji_name = id_to_kanji.get(req.userid, surname)
    working_days = load_shift_days(int(req.year), int(req.month), kanji_name)
    
    pdf_buffer = generate_pdf_buffer(
        user_info["氏名"], req.year, req.month, 
        user_info["往復移動経路"], user_info["運賃"], working_days
    )
    
    subject = f"交通費請求書_{req.year}{req.month}_{surname}"
    body = f"高橋 様\n\n時計台警備の{surname}です。お疲れ様です。\n交通費請求書（{req.year}年{req.month}月分）をお送りします。\n\n以上、どうぞよろしくお願い致します。"
    filename = f"交通費請求書_{req.year}_{req.month}_{surname}.pdf"
    
    # 送信実行
    success = send_claim_email(
        user_info.get("会社メアド", COMPANY_EMAIL_DEFAULT),
        subject, body, f"時計台警備（{user_info['氏名']}）",
        pdf_buffer, filename
    )
    
    if success:
        # 自分用にも送信（控え）
        send_claim_email(
            user_info["メアド"], f"【送信済】{subject}",
            f"以下を会社へ送信しました：\n\n{body}",
            f"時計台警備（{user_info['氏名']}）",
            pdf_buffer, filename
        )
        return {"status": "success", "message": "送信完了しました"}
    else:
        return {"status": "error", "message": "送信に失敗しました。設定を確認してください。"}

@app.post("/api/claims/render-preview")
async def render_preview(req: ClaimRequest):
    df = load_mypage_data()
    user_row = df[df["ID"] == req.userid]
    if user_row.empty:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_info = user_row.iloc[0]
    id_to_kanji = {"yama": "山口", "saka": "坂下", "hori": "堀川"}
    kanji_name = id_to_kanji.get(req.userid, user_info["氏名"].split()[0])
    working_days = load_shift_days(int(req.year), int(req.month), kanji_name)
    
    pdf_buffer = generate_pdf_buffer(
        user_info["氏名"], req.year, req.month, 
        user_info["往復移動経路"], user_info["運賃"], working_days
    )
    
    import fitz # PyMuPDF
    doc = fitz.open(stream=pdf_buffer, filetype="pdf")
    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img_bytes = pix.tobytes("png")
    
    import base64
    img_b64 = base64.b64encode(img_bytes).decode()
    return {"status": "success", "image": f"data:image/png;base64,{img_b64}"}

if __name__ == "__main__":
    import uvicorn
    # デプロイ環境では PORT 環境変数が指定される
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

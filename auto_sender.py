import pandas as pd
import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os

# 本番環境では環境変数から取得することを推奨します
SENDER_EMAIL = "horikawa1717@gmail.com"
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "kekke1062")
COMPANY_EMAIL = "sbs@sobun.net"

def auto_send_job():
    today = datetime.date.today()
    if today.day != 1:
        print("今日は1日ではありません。終了します。")
        return

    print("1日です。自動送信処理を開始します。")
    # ユーザーリスト（My-page.xlsx）を読み込み
    if not os.path.exists("My-page.xlsx"):
        return
        
    df_mypage = pd.read_excel("My-page.xlsx")
    auto_users = df_mypage[df_mypage["送信設定"] == "1日に自動"]
    
    for _, user in auto_users.iterrows():
        user_id = user["ID"]
        target_email = user["メールアドレス"]
        print(f"ユーザー {user_id} の自動送信を実行中...")
        
        # 本来はここでPDF生成ロジックを呼び出す
        # pdf_path = generate_pdf(user_id, month)
        
        # メール送信
        # send_email(target_email, ...)
        # send_email(COMPANY_EMAIL, ...)

if __name__ == "__main__":
    auto_send_job()

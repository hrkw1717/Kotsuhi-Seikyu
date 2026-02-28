import sys
import os
from io import BytesIO
import pandas as pd
# app.py をインポートするためにパスを通す
sys.path.append(os.getcwd())
from app import generate_claim_pdf

def test_output():
    user_id = "堀川 勉"
    month = 2
    year = 2026
    route = "東屯田通～西4丁目～東屯田通"
    fare = 460
    # シフトデータ (2026年2月の実際の出勤日)
    shift_data = {
        3: "出", 6: "出", 9: "出", 12: "出", 15: "出", 
        18: "出", 21: "出", 24: "出", 27: "出"
    }
    
    pdf_buffer = generate_claim_pdf(user_id, month, year, route, fare, shift_data)
    
    output_path = "test_output_v6.pdf"
    with open(output_path, "wb") as f:
        f.write(pdf_buffer.getvalue())
    print(f"Generated test PDF: {output_path}")

if __name__ == "__main__":
    test_output()

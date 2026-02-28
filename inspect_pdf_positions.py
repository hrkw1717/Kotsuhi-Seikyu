import os
import sys
from pypdf import PdfReader

def inspect_pdf_positions(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    
    reader = PdfReader(path)
    page = reader.pages[0]
    
    print(f"File: {path}")
    
    parts = []
    def visitor_body(text, cm, tm, font_dict, font_size):
        clean_text = text.replace('\n', ' ').strip()
        if clean_text:
            parts.append((tm[5], tm[4], clean_text)) # (y, x, text)

    page.extract_text(visitor_text=visitor_body)
    
    # y座標でソート（上から順）
    parts.sort(key=lambda x: x[0], reverse=True)
    
    for y, x, text in parts:
            print(f"[{text}] at (x={x:.2f}, y={y:.2f})")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "テンプレート.pdf"
    inspect_pdf_positions(target)

from pypdf import PdfReader

def inspect_pdf(path):
    reader = PdfReader(path)
    page = reader.pages[0]
    print(f"Page size: {page.mediabox}")
    print(f"Num pages: {len(reader.pages)}")
    # Extract text to see where things roughly are
    text = page.extract_text()
    print("\n--- Extracted Text ---")
    print(text)

inspect_pdf("テンプレート.pdf")

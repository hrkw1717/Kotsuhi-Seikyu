import openpyxl

def investigate_layout(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    print(f"Sheet: {ws.title}")
    
    # セルの結合状態の確認
    print("\n--- Merged Cells ---")
    for merged_range in ws.merged_cells.ranges:
        print(merged_range)
        
    # 主要なセルの内容と書式の確認
    print("\n--- Key Cells Content ---")
    rows = list(ws.iter_rows(min_row=1, max_row=10, min_col=1, max_col=10, values_only=True))
    for i, row in enumerate(rows, 1):
        print(f"Row {i}: {row}")

investigate_layout("テンプレート.xlsx")

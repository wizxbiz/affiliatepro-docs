import pdfplumber

# Try to extract whatever data we can from yushin.pdf
with pdfplumber.open("yushin.pdf") as pdf:
    all_data = []
    
    for i, page in enumerate(pdf.pages):
        all_data.append(f"\n=== Page {i+1} ===")
        
        # Try tables
        tables = page.extract_tables()
        if tables:
            for t_idx, table in enumerate(tables):
                all_data.append(f"\n--- Table {t_idx+1} ---")
                for row in table:
                    # Filter out None values
                    row_data = [str(cell) if cell else "" for cell in row]
                    if any(cell.strip() for cell in row_data):
                        all_data.append(" | ".join(row_data))
    
    result = "\n".join(all_data)
    with open("yushin_tables.txt", "w", encoding="utf-8") as f:
        f.write(result)
    
    print(f"Extracted table data: {len(result)} chars")
    print("\n--- Preview ---")
    print(result[:2000])

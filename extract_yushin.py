import pdfplumber

with pdfplumber.open("yushin.pdf") as pdf:
    content = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            content.append(f"=== Page {i+1} ===")
            content.append(text)
    
    result = "\n".join(content)
    with open("yushin_content.txt", "w", encoding="utf-8") as f:
        f.write(result)
    
    print(f"Extracted {len(pdf.pages)} pages")
    print(f"Total lines: {len(result.splitlines())}")
    print(f"Total chars: {len(result)}")

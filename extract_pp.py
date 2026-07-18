import pdfplumber

pdf_path = 'polypropylene.pdf'
output_file = 'polypropylene_content.txt'

print(f'Extracting: {pdf_path}')

with pdfplumber.open(pdf_path) as pdf:
    total_pages = len(pdf.pages)
    print(f'Total pages: {total_pages}')
    
    all_text = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            all_text.append(f'=== Page {i+1} ===')
            all_text.append(text)
        if (i+1) % 10 == 0:
            print(f'Progress: {i+1}/{total_pages}')
    
    content = '\n'.join(all_text)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Done! Saved to {output_file}')
    print(f'Total characters: {len(content):,}')

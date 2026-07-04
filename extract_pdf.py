import pdfplumber

pdf_path = r'd:\Flutterapp\caculateapp\Injection-Moulding.pdf'
output_path = r'd:\Flutterapp\caculateapp\injection_moulding_content.txt'

with pdfplumber.open(pdf_path) as pdf:
    total_pages = len(pdf.pages)
    print(f'Total pages: {total_pages}')
    
    all_text = []
    for i, page in enumerate(pdf.pages):
        try:
            text = page.extract_text()
            if text:
                all_text.append(f'\n\n=== PAGE {i+1} ===\n{text}')
            if (i+1) % 10 == 0:
                print(f'Processed {i+1}/{total_pages} pages...')
        except Exception as e:
            print(f'Error on page {i+1}: {e}')
    
    full_content = ''.join(all_text)
    
    with open(output_path, 'w', encoding='utf-8') as out:
        out.write(full_content)
    
    print(f'\nSaved to: {output_path}')
    print(f'Total characters: {len(full_content)}')
    
    # Preview first pages
    print('\n\n========== PREVIEW (First 5 pages) ==========')
    for i in range(min(5, total_pages)):
        try:
            text = pdf.pages[i].extract_text()
            print(f'\n--- PAGE {i+1} ---')
            print(text[:1500] if text else 'No text')
        except Exception as e:
            print(f'Error: {e}')

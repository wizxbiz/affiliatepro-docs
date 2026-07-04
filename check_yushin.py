import pdfplumber
import os

# Try with different settings
with pdfplumber.open("yushin.pdf") as pdf:
    print(f"Total pages: {len(pdf.pages)}")
    
    for i, page in enumerate(pdf.pages[:3]):  # Check first 3 pages
        print(f"\n=== Page {i+1} ===")
        print(f"Page size: {page.width} x {page.height}")
        
        # Try extract text
        text = page.extract_text()
        if text:
            print(f"Text found: {len(text)} chars")
            print(text[:500] if len(text) > 500 else text)
        else:
            print("No text found (likely image-based PDF)")
        
        # Check for tables
        tables = page.extract_tables()
        if tables:
            print(f"Tables found: {len(tables)}")
            
        # Check for images
        images = page.images
        if images:
            print(f"Images found: {len(images)}")

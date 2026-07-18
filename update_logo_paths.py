import os

public_dir = r"d:\Flutterapp\caculateapp\public"
old_src = 'src="/images/logo.png"'
new_src = 'src="/assets/images/logo.png"'

for root, dirs, files in os.walk(public_dir):
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                replacements = {
                    'src="/images/logo.png"': 'src="/assets/images/logo.png"',
                    'href="/images/logo.png"': 'href="/assets/images/logo.png"',
                    'url("/images/logo.png")': 'url("/assets/images/logo.png")',
                    'url(\'/images/logo.png\')': 'url(\'/assets/images/logo.png\')',
                }
                
                new_content = content
                for old, new in replacements.items():
                    if old in new_content:
                        new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

import os

public_dir = r"d:\Flutterapp\caculateapp\public"
old_icon_link = '<link rel="icon" type="image/x-icon" href="/favicon.ico">'
new_icon_link = '<link rel="icon" type="image/png" href="/assets/images/logo.png">'

# Also handle cases where it might be simple favicon.ico or apple-touch-icon
for root, dirs, files in os.walk(public_dir):
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                updated = False
                if '/favicon.ico' in content:
                    content = content.replace('/favicon.ico', '/assets/images/logo.png')
                    updated = True
                
                # Update apple-touch-icon if present to use the new logo too
                if 'rel="apple-touch-icon"' in content and '/images/logo.png' in content:
                    content = content.replace('/images/logo.png', '/assets/images/logo.png')
                    updated = True
                
                if updated:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Updated favicon link in {filepath}")
            except Exception as e:
                print(f"Error in {filepath}: {e}")

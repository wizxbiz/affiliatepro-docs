
import os

def check_file(path):
    print(f"Checking {path}...")
    try:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return
        with open(path, 'rb') as f:
            content = f.read()
            # Check for null bytes
            if b'\x00' in content:
                print(f"Found NULL byte in {path}")
            # Check for non-UTF8
            try:
                content.decode('utf-8')
            except UnicodeDecodeError as e:
                print(f"Unicode error in {path}: {e}")
            
            # Check specifically for the 'token' error in JS by looking for weird quotes
            text = content.decode('utf-8', errors='ignore')
            if '“' in text or '”' in text or '‘' in text or '’' in text:
                print(f"Found smart quotes in {text.count('“') + text.count('”') + text.count('‘') + text.count('’')} locations in {path}")
                
    except Exception as e:
        print(f"Error checking {path}: {e}")

files = [
    r'd:\Flutterapp\caculateapp\public\js\mobile-header.js',
    r'd:\Flutterapp\caculateapp\public\js\feed-renderer.js',
    r'd:\Flutterapp\caculateapp\public\js\tuktuk-engine.js',
    r'd:\Flutterapp\caculateapp\public\index.html'
]

for f in files:
    check_file(f)

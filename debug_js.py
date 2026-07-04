
import os

filepath = r'd:\Flutterapp\caculateapp\public\js\tuktuk_feed_logic.js'

with open(filepath, 'rb') as f:
    content = f.read()

# Replace any sequence of non-printable or corrupt looking bytes if we can identify them
# or just look for the "const maxI" area

try:
    decoded = content.decode('utf-8')
    print("File is valid UTF-8")
except UnicodeDecodeError as e:
    print(f"Broken at: {e.start}")
    # Try with latin-1 to see what's there
    decoded = content.decode('latin-1')
    
# Let's try to just find the marker "maxI" and see what surrounds it
maxi_pos = decoded.find('maxI')
if maxi_pos != -1:
    print(f"maxI found at {maxi_pos}: {decoded[maxi_pos:maxi_pos+100]}")

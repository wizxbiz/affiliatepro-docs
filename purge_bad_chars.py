
import os

filepath = r'd:\Flutterapp\caculateapp\public\js\tuktuk_feed_logic.js'
fixpath = r'd:\Flutterapp\caculateapp\public\js\tuktuk_feed_logic_fixed.js'

with open(filepath, 'rb') as f:
    content = f.read()

# Replace known corrupted sequences or just try to recover as much as possible
# Since I can't see the file, I'll try to find the area and replace it with a placeholder that I can then edit.

# 🚀 Is often where it breaks if it's UTF-8 related
# Let's try to just clean non-ascii / common thai utf8
new_content = bytearray()
for b in content:
    if b < 128:
        new_content.append(b)
    else:
        # Keep Thai characters (E0 A4.. to E0 B9..)
        # This is a bit complex, let's just replace everything > 127 with '?' for now to make it readable
        new_content.append(ord('?'))

with open(fixpath, 'wb') as f:
    f.write(new_content)

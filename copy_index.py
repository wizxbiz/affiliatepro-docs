import shutil
import os

src = r'd:\Flutterapp\caculateapp\public\index.html'
dst = r'd:\Flutterapp\caculateapp\public\official.html'

try:
    shutil.copy2(src, dst)
    print(f"Copied {src} to {dst}")
except Exception as e:
    print(f"Error: {e}")

import shutil
import os

src = r"d:\Flutterapp\caculateapp\build\web"
dst = r"d:\Flutterapp\caculateapp\public\app"

if not os.path.exists(src):
    print("Source not found")
    exit(1)

shutil.copytree(src, dst, dirs_exist_ok=True)
print("Done")

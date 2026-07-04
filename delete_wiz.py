import shutil
import os

path = r'd:\Flutterapp\caculateapp\wizmobiz.com'
if os.path.exists(path):
    try:
        shutil.rmtree(path)
        print(f"Successfully deleted {path}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"Path {path} does not exist")

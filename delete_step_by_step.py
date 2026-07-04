import os
import shutil

folder = r'd:\Flutterapp\caculateapp\wizmobiz.com'

for root, dirs, files in os.walk(folder, topdown=False):
    for name in files:
        path = os.path.join(root, name)
        try:
            os.remove(path)
            print(f"Removed file: {path}")
        except Exception as e:
            print(f"Error removing file {path}: {e}")
    for name in dirs:
        path = os.path.join(root, name)
        try:
            os.rmdir(path)
            print(f"Removed dir: {path}")
        except Exception as e:
            print(f"Error removing dir {path}: {e}")

try:
    if os.path.exists(folder):
        os.rmdir(folder)
        print(f"Removed root folder: {folder}")
except Exception as e:
    print(f"Error removing root folder {folder}: {e}")

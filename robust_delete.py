import os
import shutil

folder = r'd:\Flutterapp\caculateapp\wizmobiz.com'

def remove_readonly(func, path, excinfo):
    import stat
    os.chmod(path, stat.S_IWRITE)
    func(path)

if os.path.exists(folder):
    try:
        shutil.rmtree(folder, onerror=remove_readonly)
        print(f"DELETED {folder}")
    except Exception as e:
        print(f"ERROR deleting {folder}: {e}")
else:
    print(f"NOT FOUND {folder}")

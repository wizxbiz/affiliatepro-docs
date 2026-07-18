import os
import shutil
import traceback

folder = r'd:\Flutterapp\caculateapp\wizmobiz.com'

def report(msg):
    with open('delete_log.txt', 'a') as f:
        f.write(msg + '\n')
    print(msg)

report(f"Starting deletion of {folder}")

if not os.path.exists(folder):
    report("Folder not found.")
else:
    for root, dirs, files in os.walk(folder, topdown=False):
        for name in files:
            p = os.path.join(root, name)
            try:
                os.chmod(p, 0o777)
                os.remove(p)
                report(f"Deleted file: {p}")
            except Exception:
                report(f"FAILED to delete file: {p}\n{traceback.format_exc()}")
        for name in dirs:
            p = os.path.join(root, name)
            try:
                os.chmod(p, 0o777)
                os.rmdir(p)
                report(f"Deleted dir: {p}")
            except Exception:
                report(f"FAILED to delete dir: {p}\n{traceback.format_exc()}")
    try:
        os.rmdir(folder)
        report(f"Deleted root folder: {folder}")
    except Exception:
        report(f"FAILED to delete root folder: {folder}\n{traceback.format_exc()}")

import os
import json
import time
from urllib.parse import unquote
import shutil

history_dirs = [
    r"C:\Users\Admin\AppData\Roaming\Code\User\History",
    r"C:\Users\Admin\AppData\Roaming\Cursor\User\History"
]

restored = 0

for history_dir in history_dirs:
    if not os.path.exists(history_dir):
        continue
    for folder in os.listdir(history_dir):
        folder_path = os.path.join(history_dir, folder)
        if not os.path.isdir(folder_path):
            continue
        entries_file = os.path.join(folder_path, "entries.json")
        if os.path.exists(entries_file):
            try:
                with open(entries_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    resource = data.get("resource", "")
                    
                    if resource.endswith(".dart"):
                        file_path = resource.replace("file:///", "").replace("file://", "")
                        file_path = unquote(file_path)
                        if file_path.startswith("/") and file_path[2] == ":":
                            file_path = file_path[1:]
                        file_path = file_path.replace("/", "\\")
                        
                        # Only files in the current workspace
                        if "caculateapp" in file_path.lower():
                            latest = data.get("entries", [])
                            if latest:
                                latest_ts = latest[-1].get("timestamp", 0) / 1000
                                if not os.path.exists(file_path):
                                    latest_id = latest[-1].get("id")
                                    src_file = os.path.join(folder_path, latest_id)
                                    print(f"Restoring: {file_path}")
                                    
                                    # Restore it!
                                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                                    shutil.copy2(src_file, file_path)
                                    restored += 1
            except Exception as e:
                pass

print(f"Total dart files restored from local history: {restored}")

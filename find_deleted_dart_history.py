import os
import json
import time
from urllib.parse import unquote

history_dirs = [
    r"C:\Users\Admin\AppData\Roaming\Code\User\History",
    r"C:\Users\Admin\AppData\Roaming\Cursor\User\History"
]

results = []
count = 0

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
                        # Fix path
                        if file_path[1:3] == "%3A" or file_path[1:3] == ":/" or file_path[2] == ":":
                            pass # Looks like a windows path
                        if file_path.startswith("/") and file_path[2] == ":":
                            file_path = file_path[1:]
                        
                        file_path = file_path.replace("/", "\\")
                        count += 1
                        
                        if not os.path.exists(file_path):
                            latest = data.get("entries", [])
                            if latest:
                                results.append({
                                    "file": file_path,
                                    "latest_entry": os.path.join(folder_path, latest[-1].get("id")),
                                    "ts": latest[-1].get("timestamp", 0)
                                })
            except Exception as e:
                pass

print(f"Total dart files found in history: {count}")
for res in results:
    print(f"MISSING: {res['file']} (last modified: {res['ts']})")

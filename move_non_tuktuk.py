import os
import shutil

src_dir = r"d:\Flutterapp\caculateapp\lib"
dest_dir = r"d:\Flutterapp\Restored_Non_TukTuk\lib"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

allowed_items = ["main.dart", "firebase_options.dart", "tuktuk"]

count = 0
for item in os.listdir(src_dir):
    if item not in allowed_items:
        src_path = os.path.join(src_dir, item)
        dest_path = os.path.join(dest_dir, item)
        print(f"Moving {item} to {dest_dir}...")
        try:
            shutil.move(src_path, dest_path)
            count += 1
        except Exception as e:
            print(f"Error moving {item}: {e}")

print(f"Moved {count} items out of lib/")

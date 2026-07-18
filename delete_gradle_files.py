import os

files = [
    r"d:\Flutterapp\caculateapp\android\settings.gradle.kts",
    r"d:\Flutterapp\caculateapp\android\build.gradle.kts",
    r"d:\Flutterapp\caculateapp\android\app\build.gradle.kts"
]

for f in files:
    try:
        if os.path.exists(f):
            os.remove(f)
            print(f"Deleted {f}")
        else:
            print(f"File not found: {f}")
    except Exception as e:
        print(f"Error deleting {f}: {e}")

import shutil
import os

src = r"d:\Flutterapp\caculateapp\build\web"
dst = r"d:\Flutterapp\caculateapp\public\tuktuk"

print(f"Copying from {src} to {dst}...")

if not os.path.exists(src):
    print(f"Error: Source {src} does not exist!")
    exit(1)

# Remove destination if it exists
if os.path.exists(dst):
    print(f"Destination {dst} exists, removing...")
    try:
        # Use a more aggressive removal for Windows
        import subprocess
        subprocess.run(['rmdir', '/s', '/q', dst], shell=True)
    except Exception as e:
        print(f"Failed to remove dst via rmdir: {e}")
        # Fallback to shutil
        shutil.rmtree(dst, ignore_errors=True)

try:
    shutil.copytree(src, dst)
    print("Copy completed successfully!")
    
    # Verify
    files = os.listdir(dst)
    print(f"Files in {dst}: {files}")
    
except Exception as e:
    print(f"Error during copy: {e}")
    exit(1)

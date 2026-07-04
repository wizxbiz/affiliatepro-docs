import sys
from PIL import Image

def convert_to_ico(source_path, dest_path):
    img = Image.open(source_path)
    # create different sizes for the ico
    icon_sizes = [(16,16), (32, 32), (48, 48), (64,64), (128,128), (256,256)]
    img.save(dest_path, format='ICO', sizes=icon_sizes)
    print(f"Created {dest_path}")

convert_to_ico("assets/images/logo.png", "public/favicon.ico")
convert_to_ico("assets/images/logo.png", "web/favicon.ico")

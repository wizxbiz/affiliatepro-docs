import struct

def png_to_ico(png_path, ico_path):
    try:
        with open(png_path, 'rb') as f:
            png_data = f.read()
        
        # ICO Header: Reserved(2), Type(2, 1=Icon), Count(2, 1)
        header = struct.pack('<HHH', 0, 1, 1)
        
        # Icon Directory Entry
        # Width(1), Height(1), Colors(1), Reserved(1), Planes(2, 1), BPP(2, 32), Size(4), Offset(4)
        # Using 0 for width/height often indicates 256px or auto-detect for PNG-in-ICO
        width = 0 
        height = 0
        entry = struct.pack('<BBBBHHII', width, height, 0, 0, 1, 32, len(png_data), 6 + 16)
        
        with open(ico_path, 'wb') as f:
            f.write(header)
            f.write(entry)
            f.write(png_data)
        print(f"Successfully created {ico_path} from {png_path}")
    except Exception as e:
        print(f"Error: {e}")

png_to_ico(r"d:\Flutterapp\caculateapp\public\assets\images\logo.png", r"d:\Flutterapp\caculateapp\public\favicon.ico")

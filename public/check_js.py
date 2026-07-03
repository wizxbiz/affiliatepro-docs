
path = r'd:\Flutterapp\caculateapp\public\js\feed-renderer.js'
try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check backticks count
    backticks = content.count('`')
    print(f"Backticks count: {backticks}")
    if backticks % 2 != 0:
        print("ERROR: Uneven number of backticks!")
    
    # Check braces in template literals ${}
    # This is harder to check strictly but we can look for unclosed ${
    import re
    open_templates = re.findall(r'\${', content)
    # Finding closing braces is harder because they are just }
    print(f"Template starts (${{): {len(open_templates)}")
    
except Exception as e:
    print(f"Error: {e}")

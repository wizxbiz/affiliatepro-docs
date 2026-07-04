
import sys
import os

def count_braces(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    open_count = 0
    close_count = 0
    in_string = False
    string_char = ''
    i = 0
    lines = content.split('\n')
    
    current_open = 0
    for line_num, line in enumerate(lines, 1):
        for char in line:
            if char == '{':
                open_count += 1
                current_open += 1
            elif char == '}':
                close_count += 1
                current_open -= 1
        # Optional: alert if line ends with zero nesting but looks like inside class
        # (Very naive check)
    
    print(f"Total Open: {open_count}, Total Close: {close_count}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        count_braces(sys.argv[1])
    else:
        print("No file path provided")

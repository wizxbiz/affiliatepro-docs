
import sys

def find_zero_nesting(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    nest = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        line_num = i + 1
        # Skip string literals for brace counting (very roughly)
        # This part is tricky but let's try a simpler approach first
        for char in line:
            if char == '{':
                nest += 1
            elif char == '}':
                nest -= 1
        
        if line_num > 44 and nest == 0 and line.strip() == "}":
            print(f"CLASS/METHOD END at line {line_num}: {line}")
        elif nest < 0:
             print(f"NEST ERROR at {line_num}: {line}")
             nest = 0

if __name__ == "__main__":
    find_zero_nesting(sys.argv[1])

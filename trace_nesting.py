
import sys

def trace_nesting(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    nesting = 0
    in_string = False
    string_quote = ""
    
    # Track nesting for _TukTukFeedScreenState (starts at line 44)
    # We expect it to reach 0 only at line 3130 (or whatever the end is)
    
    for i, line in enumerate(lines):
        line_num = i + 1
        # Skip comments simplified
        l = line.split('//')[0]
        for char in l:
            if char == '{':
                nesting += 1
            elif char == '}':
                nesting -= 1
        
        if nesting == 0 and line.strip() == "}":
            print(f"Nesting 0 at line {line_num}: {line.strip()}")
        elif nesting < 0:
            print(f"NEGATIVE NESTING at line {line_num}: {line.strip()}")
            nesting = 0 # reset for recovery

if __name__ == "__main__":
    trace_nesting(sys.argv[1])

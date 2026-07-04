
import sys

def debug_nesting(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    nest = 0
    for i, line in enumerate(lines):
        line_num = i + 1
        old_nest = nest
        for char in line:
            if char == '{':
                nest += 1
            elif char == '}':
                nest -= 1
        
        # Only print when nesting hits 0 or changes significantly around suspected areas
        if line_num > 40 and line_num < 1500:
            if nest == 0 and old_nest != 0:
                 print(f"!!! ZERO NEST at line {line_num}: {line.strip()}")
            # elif line_num % 100 == 0:
            #     print(f"Line {line_num}, Nest {nest}")

if __name__ == "__main__":
    debug_nesting(sys.argv[1])

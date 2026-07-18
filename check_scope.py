"""Use a simple heuristic: is there a function/block that encloses line 3306?
Find nearest UNCLOSED { before line 3306."""

with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

# Build a list of all { and } with their line numbers (outside strings/comments)
brackets = []  # (line_num, char, pos_in_line)

for i, line in enumerate(lines):
    in_sq = False
    in_dq = False
    in_bt = False
    in_lc = False
    in_bc = False
    j = 0
    s = line.rstrip('\n')
    while j < len(s):
        c = s[j]
        if in_bc:
            if c == '*' and j+1 < len(s) and s[j+1] == '/':
                in_bc = False
                j += 2
                continue
        elif in_lc:
            break
        elif c == '\\':
            j += 2
            continue
        elif c == "'" and not in_dq and not in_bt:
            in_sq = not in_sq
        elif c == '"' and not in_sq and not in_bt:
            in_dq = not in_dq
        elif c == '`' and not in_sq and not in_dq:
            in_bt = not in_bt
        elif not in_sq and not in_dq and not in_bt:
            if c == '/' and j+1 < len(s):
                if s[j+1] == '/':
                    in_lc = True
                elif s[j+1] == '*':
                    in_bc = True
            elif c == '$' and j+1 < len(s) and s[j+1] == '{':
                j += 2  # skip ${ in template literal
                continue
            elif c == '{':
                brackets.append((i+1, '{'))
            elif c == '}':
                brackets.append((i+1, '}'))
        j += 1

# Find depth at line 3306
depth = 0
last_open = []  # stack of line numbers of unclosed {
for line_num, ch in brackets:
    if line_num > 3306:
        break
    if ch == '{':
        depth += 1
        last_open.append(line_num)
    else:
        depth -= 1
        if last_open:
            last_open.pop()

print(f'Depth at line 3306: {depth}')
if last_open:
    print(f'Last unclosed {{ was at line: {last_open[-1]}')
    # Show context
    print(f'Context: {lines[last_open[-1]-1].strip()[:100]}')

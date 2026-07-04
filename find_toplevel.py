"""Find all let/const/var declarations in feed-renderer.js that are at block depth 0."""
with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

depth = 0
for i, l in enumerate(lines):
    in_sq = False
    in_dq = False
    in_bt = False
    in_line_comment = False
    in_block_comment = False
    escaped = False
    stripped = l.rstrip('\n')

    # Check if this line starts a let/const/var at depth 0
    s = l.strip()
    if depth == 0 and (s.startswith('let ') or s.startswith('const ') or s.startswith('var ')):
        print(f'Line {i+1} (depth={depth}): {s[:80]}')

    # Update depth AFTER checking
    j = 0
    while j < len(stripped):
        ch = stripped[j]
        if in_block_comment:
            if ch == '*' and j+1 < len(stripped) and stripped[j+1] == '/':
                in_block_comment = False
                j += 2
                continue
        elif in_line_comment:
            break  # rest of line is comment
        elif escaped:
            escaped = False
        elif ch == '\\':
            escaped = True
        elif ch == "'" and not in_dq and not in_bt:
            in_sq = not in_sq
        elif ch == '"' and not in_sq and not in_bt:
            in_dq = not in_dq
        elif ch == '`' and not in_sq and not in_dq:
            in_bt = not in_bt
        elif not in_sq and not in_dq and not in_bt:
            if ch == '/' and j+1 < len(stripped):
                if stripped[j+1] == '/':
                    in_line_comment = True
                elif stripped[j+1] == '*':
                    in_block_comment = True
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
        j += 1

print('Done. Final depth:', depth)

with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

opens = 0
closes = 0
for i, l in enumerate(lines[:3306]):
    in_sq = False
    in_dq = False
    in_bt = False
    escaped = False
    for ch in l.rstrip('\n'):
        if escaped:
            escaped = False
            continue
        if ch == '\\':
            escaped = True
            continue
        if ch == "'" and not in_dq and not in_bt:
            in_sq = not in_sq
        elif ch == '"' and not in_sq and not in_bt:
            in_dq = not in_dq
        elif ch == '`' and not in_sq and not in_dq:
            in_bt = not in_bt
        elif ch == '{' and not in_sq and not in_dq and not in_bt:
            opens += 1
        elif ch == '}' and not in_sq and not in_dq and not in_bt:
            closes += 1

print('Before line 3306: opens=' + str(opens) + ', closes=' + str(closes) + ', depth=' + str(opens - closes))

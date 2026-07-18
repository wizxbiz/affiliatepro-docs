import re

with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

result = []
i = 0
fixed = 0
while i < len(lines):
    line = lines[i]
    stripped = line.rstrip('\n\r')
    # Count unmatched single quotes (ignoring escaped)
    tmp = re.sub(r"\\'", '', stripped)
    sq = tmp.count("'")
    # If odd single quotes → string is open, check next line
    if sq % 2 == 1 and i + 1 < len(lines):
        next_line = lines[i+1].strip()
        # Next line should be plain text continuation (no JS syntax)
        if re.match(r'^[a-zA-Z ,.!?]+$', next_line) and len(next_line) > 2:
            result.append(stripped + ' ' + next_line + '\n')
            i += 2
            fixed += 1
            continue
    result.append(line)
    i += 1

with open('public/js/feed-renderer.js', 'w', encoding='utf-8', errors='replace') as f:
    f.writelines(result)

print('Fixed ' + str(fixed) + ' split string lines')

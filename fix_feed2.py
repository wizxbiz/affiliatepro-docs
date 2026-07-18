import re

with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

fixed = 0

# Pattern: line ends with unclosed single-quoted string (no closing ')
# We join it with the next line by replacing \n<whitespace> with a space
# Only when the continuation line doesn't start with JS keywords

lines = content.split('\n')
result = []
i = 0
while i < len(lines):
    line = lines[i]
    # Check if line has an unclosed single-quoted string
    # Remove escaped quotes, then count
    test = re.sub(r"\\'", 'XX', line)
    parts = test.split("'")
    # If odd number of parts, the string is open
    if len(parts) % 2 == 0 and i + 1 < len(lines):  # even parts = odd quotes = open string
        next_stripped = lines[i+1].strip()
        # Check next line looks like string continuation (not code)
        if next_stripped and not next_stripped.startswith('//') and not next_stripped.startswith('if ') and not next_stripped.startswith('const ') and not next_stripped.startswith('let ') and not next_stripped.startswith('var ') and not next_stripped.startswith('}') and not next_stripped.startswith('function') and not next_stripped.startswith('return') and not next_stripped.startswith('try') and not next_stripped.startswith('await') and not next_stripped.startswith('throw') and not next_stripped.startswith('for ') and not next_stripped.startswith('while') and not next_stripped.startswith('async') and not next_stripped.startswith('document'):
            result.append(line.rstrip() + ' ' + next_stripped)
            i += 2
            fixed += 1
            continue
    result.append(line)
    i += 1

content2 = '\n'.join(result)
with open('public/js/feed-renderer.js', 'w', encoding='utf-8', errors='replace') as f:
    f.write(content2)

print('Fixed ' + str(fixed) + ' split string lines')

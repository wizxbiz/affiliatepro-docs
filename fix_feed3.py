"""
Comprehensive fixer for feed-renderer.js extraction artifacts.
Joins lines that are continuations of broken single-quoted strings.
Does NOT touch comment lines.
"""
import re

with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

def count_unescaped_quotes(s, q):
    count = 0
    i = 0
    while i < len(s):
        if s[i] == '\\':
            i += 2
            continue
        if s[i] == q:
            count += 1
        i += 1
    return count

JS_STARTERS = (
    'var ', 'let ', 'const ', 'return ', 'if (', 'if(', 'else ', 'else{',
    'new ', 'throw ', 'try {', 'try{', 'catch', 'for (', 'for(', 'while',
    'switch', 'async ', 'await ', 'function', 'delete ', 'typeof ', 'void ',
    'yield', 'break', 'continue', 'import', 'export', 'document.',
    'window.', 'console.', '// ', '/*', '*', '}', '{', '</', '<!',
    'db.', 'firebase.', 'auth.', 'storage.'
)

result = []
i = 0
fixed = 0

while i < len(lines):
    line = lines[i]
    stripped = line.rstrip('\n\r')
    s_trimmed = stripped.strip()

    # SKIP comment lines — never join them
    if s_trimmed.startswith('//') or s_trimmed.startswith('/*') or s_trimmed.startswith('*'):
        result.append(line)
        i += 1
        continue

    # Check if this line has an odd number of single quotes (open string)
    sq = count_unescaped_quotes(stripped, "'")
    dq = count_unescaped_quotes(stripped, '"')

    joined = False

    # Single quote string open
    if sq % 2 == 1 and i + 1 < len(lines):
        next_stripped = lines[i+1].strip()
        if next_stripped and not any(next_stripped.startswith(k) for k in JS_STARTERS):
            result.append(stripped + ' ' + next_stripped + '\n')
            i += 2
            fixed += 1
            joined = True

    # Double quote string open
    elif dq % 2 == 1 and i + 1 < len(lines):
        next_stripped = lines[i+1].strip()
        if next_stripped and not any(next_stripped.startswith(k) for k in JS_STARTERS):
            result.append(stripped + ' ' + next_stripped + '\n')
            i += 2
            fixed += 1
            joined = True

    if not joined:
        result.append(line)
        i += 1

with open('public/js/feed-renderer.js', 'w', encoding='utf-8', errors='replace') as f:
    f.writelines(result)

print('Fixed ' + str(fixed) + ' split string lines')

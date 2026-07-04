"""
Comprehensive fixer for feed-renderer.js Phase 2:
- Joins lines ending with = (incomplete assignment)
- Joins lines where arrow fn params split from =>
- Joins async function declarations split across lines
- Joins 'new' split from constructor name
- Joins // comment text that spilled to next line
"""

JS_STARTERS = (
    'var ', 'let ', 'const ', 'return ', 'if (', 'if(', 'else ', 'else{',
    'new ', 'throw ', 'try {', 'try{', 'catch', 'for (', 'for(', 'while(',
    'while ', 'switch', 'async ', 'await ', 'function', 'delete ', 'typeof ',
    'void ', 'yield', 'break', 'continue', 'import', 'export', 'document.',
    'window.', 'console.', '/*', '}', '{', '</', '<!',
    'db.', 'firebase.', 'auth.', 'storage.', 'resolve(', 'reject(',
    'reader.', 'video.', 'canvas.', 'img.', 'ctx.',
)

def should_join(curr_stripped, next_stripped):
    """Return True if next line should be joined to current."""
    if not next_stripped:
        return False
    # Never join if next line is clearly a new statement
    if any(next_stripped.startswith(k) for k in JS_STARTERS):
        return False
    if next_stripped.startswith('//') or next_stripped.startswith('/*') or next_stripped.startswith('*'):
        return False
    return True

with open('public/js/feed-renderer.js', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

result = []
i = 0
fixed = 0

while i < len(lines):
    line = lines[i]
    stripped = line.rstrip('\n\r')
    s = stripped.strip()

    if i + 1 >= len(lines):
        result.append(line)
        i += 1
        continue

    next_line = lines[i+1]
    next_s = next_line.strip()

    joined = False

    # Pattern 1: line ends with ' =' (incomplete assignment like 'const x =')
    if stripped.endswith(' =') and not s.startswith('//'):
        if next_s and not any(next_s.startswith(k) for k in JS_STARTERS):
            result.append(stripped + ' ' + next_s + '\n')
            i += 2
            fixed += 1
            joined = True

    # Pattern 2: arrow function split - line ends with ')' and next is '=>'
    elif stripped.rstrip().endswith(')') and next_s.startswith('=>') and not s.startswith('//'):
        result.append(stripped + ' ' + next_s + '\n')
        i += 2
        fixed += 1
        joined = True

    # Pattern 3: 'async function' on line alone followed by function name
    elif s == 'async function' and next_s:
        result.append(stripped + ' ' + next_s + '\n')
        i += 2
        fixed += 1
        joined = True

    # Pattern 4: 'new' on end of line followed by constructor
    elif stripped.rstrip().endswith(' new') and next_s:
        result.append(stripped + ' ' + next_s + '\n')
        i += 2
        fixed += 1
        joined = True

    # Pattern 5: function params with default value split - ends with param name, next starts with '= default'
    elif next_s.startswith('= ') and not s.startswith('//') and not stripped.rstrip().endswith('{'):
        result.append(stripped + ' ' + next_s + '\n')
        i += 2
        fixed += 1
        joined = True

    # Pattern 6: line ends with '(' (open arg list) — join continuation if not a JS statement
    elif stripped.rstrip().endswith('(') and not s.startswith('//'):
        if next_s and not any(next_s.startswith(k) for k in JS_STARTERS):
            result.append(stripped + next_s + '\n')
            i += 2
            fixed += 1
            joined = True

    # Pattern 7: '//' comment line followed by Thai/plain continuation text
    elif s.startswith('//') and not s.endswith(')') and not s.endswith('{') and not s.endswith('}'):
        if next_s and not any(next_s.startswith(k) for k in JS_STARTERS) and not next_s.startswith('//'):
            # Heuristic: if next line has no '=' or ';' or '(' it's likely comment continuation
            if '=' not in next_s and ';' not in next_s and '(' not in next_s and '{' not in next_s:
                result.append(stripped + ' ' + next_s + '\n')
                i += 2
                fixed += 1
                joined = True

    if not joined:
        result.append(line)
        i += 1

with open('public/js/feed-renderer.js', 'w', encoding='utf-8', errors='replace') as f:
    f.writelines(result)

print('Fixed ' + str(fixed) + ' split lines')

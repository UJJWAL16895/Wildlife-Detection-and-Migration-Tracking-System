path = r'c:\Users\utsav\OneDrive\Documents\wildlife detection\wildlife-vision\index.html'
with open(path, 'rb') as f:
    raw = f.read()

# Replace broken byte sequences directly
replacements = [
    # Arrow right: e2 86 92 broken as c3 a2 c2 86 27
    (b'\xc3\xa2\xc2\x86\x26rsquo;', b'&rarr;'),
    (b'\xc3\xa2\xc2\x86\x26lsquo;', b'&uarr;'),
    # Em dash broken
    (b'\xc3\xa2\xc2\x80\x26rdquo;', b' &mdash; '),
    # Middot broken
    (b'\xc3\x82\x26middot;', b'&middot;'),
    # X mark broken
    (b'\xc3\xa2\xc2\x9c\xc2\x95', b'&times;'),
]

for old, new in replacements:
    if old in raw:
        raw = raw.replace(old, new)
        print(f'Fixed: {old!r}')

# Now convert to string and do text-level fixes
content = raw.decode('utf-8', errors='replace')

# Simple text fixes
text_fixes = [
    ('\u00e2\u0086&rsquo;', '&rarr;'),
    ('\u00e2\u0086&lsquo;', '&uarr;'),
    ('\u00e2\u0080&rdquo;', ' &mdash; '),
    ('\u00c2&middot;', '&middot;'),
    ('\u00e2\u009c\u0095', '&times;'),
]

for old, new in text_fixes:
    if old in content:
        content = content.replace(old, new)
        print(f'Text fixed: {old!r}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')

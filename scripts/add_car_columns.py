import random
import re

# Data options
makers = ['トヨタ', '日産', '本田']
categories = ['セダン', 'SUV', 'ミニバン']

# Read the file
with open('data/testData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract CSV content
match = re.search(r'export const TEST_CSV_RAW = `([^`]+)`', content, re.DOTALL)
if not match:
    print('Could not find TEST_CSV_RAW')
    exit(1)

csv_content = match.group(1)
lines = csv_content.strip().split('\n')

# Update header
header = lines[0].strip()
new_header = header + ',保有車_メーカー,保有車_カテゴリ'

# Update data rows
new_lines = [new_header]
for i in range(1, len(lines)):
    line = lines[i].strip()
    random_maker = random.choice(makers)
    random_category = random.choice(categories)
    new_lines.append(line + ',' + random_maker + ',' + random_category)

# Create new content
new_csv_content = '\n'.join(new_lines)
new_content = f'export const TEST_CSV_RAW = `{new_csv_content}`;\n'

# Write back
with open('data/testData.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'✓ Successfully added 保有車_メーカー and 保有車_カテゴリ columns')
print(f'✓ Total rows: {len(new_lines) - 1}')
print(f'✓ Total columns: {len(new_header.split(","))}')

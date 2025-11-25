import random
import re

# Car image options
car_images = ['都会的な', '高級な', '先進的な', '個性的な', '若々しい', 'スポーティな']

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
header = lines[0]
new_header = header + ',車イメージ'

# Update data rows
new_lines = [new_header]
for i in range(1, len(lines)):
    random_car_image = random.choice(car_images)
    new_lines.append(lines[i] + ',' + random_car_image)

# Create new content
new_csv_content = '\n'.join(new_lines)
new_content = f'export const TEST_CSV_RAW = `{new_csv_content}`;\n'

# Write back
with open('data/testData.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'✓ Successfully added 車イメージ column to test data')
print(f'✓ Total rows: {len(new_lines) - 1}')

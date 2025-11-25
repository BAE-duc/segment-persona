import random
import re

# Car name mapping based on maker and category
car_names = {
    ('トヨタ', 'セダン'): ['クラウン', 'カムリ', 'カローラ'],
    ('トヨタ', 'SUV'): ['RAV4', 'ハリアー', 'ランドクルーザー'],
    ('トヨタ', 'ミニバン'): ['アルファード', 'ヴォクシー', 'シエンタ'],
    ('日産', 'セダン'): ['スカイライン', 'フーガ', 'シルフィ'],
    ('日産', 'SUV'): ['エクストレイル', 'キックス', 'アリア'],
    ('日産', 'ミニバン'): ['セレナ', 'エルグランド', 'ノート'],
    ('本田', 'セダン'): ['アコード', 'シビック', 'インサイト'],
    ('本田', 'SUV'): ['ヴェゼル', 'CR-V', 'ZR-V'],
    ('本田', 'ミニバン'): ['ステップワゴン', 'フリード', 'オデッセイ'],
}

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
new_header = header + ',保有車_車名'

# Update data rows
new_lines = [new_header]
for i in range(1, len(lines)):
    line = lines[i].strip()
    parts = line.split(',')
    
    # Get maker and category (indices 6 and 7 based on current structure)
    # ID,sex,child,age,year,車イメージ,保有車_メーカー,保有車_カテゴリ
    if len(parts) >= 8:
        maker = parts[6]
        category = parts[7]
        
        # Get random car name based on maker and category
        key = (maker, category)
        if key in car_names:
            car_name = random.choice(car_names[key])
        else:
            car_name = 'Unknown'
        
        new_lines.append(line + ',' + car_name)
    else:
        new_lines.append(line + ',Unknown')

# Create new content
new_csv_content = '\n'.join(new_lines)
new_content = f'export const TEST_CSV_RAW = `{new_csv_content}`;\n'

# Write back
with open('data/testData.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'✓ Successfully added 保有車_車名 column')
print(f'✓ Total rows: {len(new_lines) - 1}')
print(f'✓ Total columns: {len(new_header.split(","))}')

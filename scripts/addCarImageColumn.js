// Script to add 車イメージ column to test data
const fs = require('fs');
const path = require('path');

const carImages = ['都会的な', '高級な', '先進的な', '個性的な', '若々しい', 'スポーティな'];

// Read the current test data
const testDataPath = path.join(__dirname, '..', 'data', 'testData.ts');
const content = fs.readFileSync(testDataPath, 'utf-8');

// Extract the CSV content
const match = content.match(/export const TEST_CSV_RAW = `([^`]+)`/);
if (!match) {
    console.error('Could not find TEST_CSV_RAW');
    process.exit(1);
}

const csvContent = match[1];
const lines = csvContent.trim().split('\n');

// Update header
const header = lines[0];
const newHeader = header + ',車イメージ';

// Update data rows
const newLines = [newHeader];
for (let i = 1; i < lines.length; i++) {
    const randomCarImage = carImages[Math.floor(Math.random() * carImages.length)];
    newLines.push(lines[i] + ',' + randomCarImage);
}

// Create new content
const newCsvContent = newLines.join('\n');
const newContent = `export const TEST_CSV_RAW = \`${newCsvContent}\`;
`;

// Write back
fs.writeFileSync(testDataPath, newContent, 'utf-8');
console.log('✓ Successfully added 車イメージ column to test data');
console.log(`✓ Total rows: ${newLines.length - 1}`);

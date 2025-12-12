// レーダーチャート用データ処理ユーティリティ
// Radar Chart Data Processing Utilities

export interface CategoryData {
    category: string;
    value: number;
}

// CSVデータをパースしてカテゴリ別の購入額を集計
export function parsePurchaseData(csvData: string): CategoryData[] {
    const lines = csvData.trim().split('\n');
    const categoryTotals = new Map<string, number[]>();

    // ヘッダーをスキップして各行を処理
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 4) {
            const category = parts[0].trim();
            const amount = parseInt(parts[3].trim(), 10);

            if (!categoryTotals.has(category)) {
                categoryTotals.set(category, []);
            }
            categoryTotals.get(category)!.push(amount);
        }
    }

    // 各カテゴリの平均値を計算
    const result: CategoryData[] = [];
    categoryTotals.forEach((amounts, category) => {
        const average = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
        result.push({ category, value: average });
    });

    return result;
}

// データを0-1の範囲に正規化
export function normalizeData(data: CategoryData[]): CategoryData[] {
    const maxValue = Math.max(...data.map(d => d.value));

    return data.map(d => ({
        category: d.category,
        value: d.value / maxValue
    }));
}

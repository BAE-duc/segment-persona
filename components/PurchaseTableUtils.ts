// 購入データテーブル用ユーティリティ関数
// Purchase Data Table Utilities

export interface PurchaseItem {
    category: string;
    place: string;
    item: string;
    price: number;
    usage: string;
}

// CSVデータをパースして購入アイテムの配列に変換
export function parsePurchaseItems(csvData: string): PurchaseItem[] {
    const lines = csvData.trim().split('\n');
    const items: PurchaseItem[] = [];

    // ヘッダーをスキップして各行を処理
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
            items.push({
                category: parts[0].trim(),
                place: parts[1].trim(),
                item: parts[2].trim(),
                price: parseInt(parts[3].trim(), 10),
                usage: parts[4].trim()
            });
        }
    }

    return items;
}

// カテゴリ別の合計金額を計算
function getCategoryTotal(items: PurchaseItem[], category: string): number {
    return items
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + item.price, 0);
}

// 購入アイテムを並び替え
// 1. カテゴリ別の合計金額が高い順
// 2. 同じカテゴリ内では購入額が高い順
export function sortPurchaseItems(items: PurchaseItem[]): PurchaseItem[] {
    // カテゴリごとの合計金額を計算
    const categoryTotals = new Map<string, number>();
    const categories = [...new Set(items.map(item => item.category))];

    categories.forEach(category => {
        categoryTotals.set(category, getCategoryTotal(items, category));
    });

    return items.sort((a, b) => {
        // カテゴリが異なる場合、カテゴリ合計金額で比較
        if (a.category !== b.category) {
            const totalA = categoryTotals.get(a.category) || 0;
            const totalB = categoryTotals.get(b.category) || 0;
            return totalB - totalA; // 降順
        }

        // 同じカテゴリ内では購入額で比較
        return b.price - a.price; // 降順
    });
}

// ユニークなカテゴリリストを取得
export function getUniqueCategories(items: PurchaseItem[]): string[] {
    const categories = [...new Set(items.map(item => item.category))];
    return categories.sort();
}

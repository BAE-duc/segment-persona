
// エクスポートして他のファイルで型を再利用できるようにします。

export interface SelectedChoice {
  id: number;
  content: string;
}

// 変換設定の詳細を定義します。

export interface ConversionSettings {
  type: 'categorical' | 'numerical';
  categories?: string[];
  range?: { min: string; max: string };
}

// 「変数」という用語を「アイテム」に置き換えるユーザーの要求に合わせて、SelectedVariableをSelectedItemに名称変更しました。

export interface SelectedItem {
  id: string;
  name: string;
  type: string;
  choices: SelectedChoice[];
  // SOM分析用の追加プロパティを追加します。

  somDataType?: string;
  conversionSetting?: string;
  conversionDetails?: ConversionSettings;
}
export type SelectedItemsMap = Record<string, SelectedItem>;

// 構成比比較などで使用するカテゴリ項目の型定義

export interface CategoryItem {
  no: number;
  name: string;
  samples: number;
  ratio: number;
}

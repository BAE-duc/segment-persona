import React, { useState } from 'react';
import { AppButton, AppSelect } from './FormControls';
import { modalStyles } from './modalStyles';
import { TEST_CSV_RAW } from '../../data/testData';
import { InfoModal } from './InfoModal';

interface FilterEditModalProps {
  onClose: () => void;
  onConfirm: (conditions: ConditionListItem[]) => void;
  initialConditions?: ConditionListItem[];
  onShowInfo: (message: string) => void;
  title?: string;
  hideRowControls?: boolean;
}

// ツリービューのデモデータを拡張し、垂直スクロールバーが表示されるようにします。

const testItems = Array.from({ length: 20 }, (_, i) => ({
  id: `test${i + 1}`,
  name: `テスト項目 ${i + 1}`,
}));

// 支払い総額に関連する共通の条件リスト

const paymentConditions = [
  { no: 1, name: '100万円以下', lower: '', upper: '' },
  { no: 2, name: '～150万円', lower: '', upper: '' },
  { no: 3, name: '～200万円', lower: '', upper: '' },
  { no: 4, name: '～250万円', lower: '', upper: '' },
  { no: 5, name: '～300万円', lower: '', upper: '' },
  { no: 6, name: '～350万円', lower: '', upper: '' },
  { no: 7, name: '～400万円', lower: '', upper: '' },
  { no: 8, name: '～450万円', lower: '', upper: '' },
  { no: 9, name: '～500万円', lower: '', upper: '' },
  { no: 10, name: '～550万円', lower: '', upper: '' },
  { no: 11, name: '～600万円', lower: '', upper: '' },
  { no: 12, name: '～650万円', lower: '', upper: '' },
  { no: 13, name: '～700万円', lower: '', upper: '' },
  { no: 14, name: '～750万円', lower: '', upper: '' },
  { no: 15, name: '～800万円', lower: '', upper: '' },
  { no: 16, name: '～850万円', lower: '', upper: '' },
  { no: 17, name: '～900万円', lower: '', upper: '' },
  { no: 18, name: '～950万円', lower: '', upper: '' },
  { no: 19, name: '～1000万円', lower: '', upper: '' },
  { no: 20, name: '1000万円超', lower: '', upper: '' },
];

// 車名コードに関連する共通の条件リスト

const testCodeConditions = [
  { no: 1, name: 'TEST CODE1', lower: '', upper: '' },
  { no: 2, name: 'TEST CODE2', lower: '', upper: '' },
];

const baseItemListData = {
  surveyData: {
    name: '調査データ',
    children: [
      {
        id: 'test',
        name: 'TEST',
        children: [
          { id: 'sex', name: 'sex' },
          { id: 'age', name: 'age' },
        ],
      },
      {
        id: 'currentCar',
        name: '現保有車特性',
        children: [
          { id: 'payment1', name: '[S] AA1 支払い総額 1' },
          { id: 'payment2', name: '[S] AA2 支払い総額 2' },
          { id: 'paymentRaw', name: '[R] AA30 支払い総額 (生数字)' },
          { id: 'carCodeToyota', name: '[C] ABAA0 現) 車名コード (Toyota)' },
          { id: 'carCodeNCBS2013', name: '[C] ABBA013 現) 車名コード (NCBS) (2013-)' },
          { id: 'carCodeNCBS2010', name: '[C] ABBA010 現) 車名コード (NCBS) (2010-2012)' },
          { id: 'ABC', name: '[S] ABC 現 メーク' },
          { id: 'ACA', name: '[S] ACA 現 NCBSボディタイプ' },
          { id: 'AD', name: '[S] AD 現 NCBSカテゴリー' },
          { id: 'AEAA0', name: '[C] AEAA0 グレードコード' },
          { id: 'AF', name: '[S] AF 現 排気量' },
          { id: 'AF0', name: '[R] AF0 現 排気量(生数字)' },
          { id: 'AFA', name: '[S] AFA 現 エンジン最高出力(kW) (2013-)' },
          { id: 'AFA0', name: '[R] AFA0 現 エンジン最高出力(kW)(生数字) (2013-)' },
          { id: 'AFB', name: '[S] AFB 現 エンジン最高出力(BHP) (2013-)' },
          { id: 'AFB0', name: '[R] AFB0 現 エンジン最高出力(BHP)(生数字) (2013-)' },
          { id: 'AGA', name: '[S] AGA 現 ミッション' },
          { id: 'AGB', name: '[S] AGB 現 駆動方式' },
          { id: 'AH', name: '[S] AH 現 エンジンタイプ' },
          { id: 'AI', name: '[M] AI 現 装備 (－2015)' },
          { id: 'AJ', name: '[S] AJ 現 ハンドル位置' },
          { id: 'AK', name: '[S] AK 現 ハンドル位置重要性' },
          { id: 'AL', name: '[S] AL 現 ハンドル位置仮説' },
          { id: 'AMA0', name: '[S] AMA0 登録年' },
          { id: 'AMB0', name: '[S] AMB0 登録月' },
          { id: 'AN', name: '[S] AN 納車後週数(分類)' },
          { id: 'AN0', name: '[R] AN0 納車後週数(生数字)' },
          { id: 'AP', name: '[S] AP 注文から納車までの週数(分類)' },
          { id: 'AP0', name: '[R] AP0 注文から納車までの週数(生数字)' },
          { id: 'AQ', name: '[S] AQ 登録府県コード' },
          { id: 'ARA', name: '[M] ARA 前保有車メーカー非購入理由' },
          { id: 'ARB', name: '[M] ARB 前保有車メーカー非購入理由(中分類)' },
          { id: 'AHA', name: '[S] AHA 現 乗車定員(2010)' },
          { id: 'AHB', name: '[R] AHB 現 乗車定員(生数字)(2010)' },
          { id: 'ABD10', name: '[S] ABD10 現 モデル(2010)' },
          { id: 'ABE10', name: '[S] ABE10 現 モデルファミリー(2010)' },
          { id: 'ABD11', name: '[S] ABD11 現 モデル(2011)' },
          { id: 'ABE11', name: '[S] ABE11 現 モデルファミリー(2011)' },
          { id: 'ABD12', name: '[S] ABD12 現 モデル(2012)' },
          { id: 'ABE12', name: '[S] ABE12 現 モデルファミリー(2012)' },
          { id: 'ABD13', name: '[S] ABD13 現 モデル(2013)' },
          { id: 'ABE13', name: '[S] ABE13 現 モデルファミリー(2013)' },
          { id: 'ABD14', name: '[S] ABD14 現 モデル(2014)' },
          { id: 'ABE14', name: '[S] ABE14 現 モデルファミリー(2014)' },
          { id: 'ABD15', name: '[S] ABD15 現 モデル(2015)' },
          { id: 'ABE15', name: '[S] ABE15 現 モデルファミリー(2015)' },
          { id: 'ABD16', name: '[S] ABD16 現 モデル(2016)' },
          { id: 'ABE16', name: '[S] ABE16 現 モデルファミリー(2016)' },
          { id: 'ABD17', name: '[S] ABD17 現 モデル(2017)' },
          { id: 'ABE17', name: '[S] ABE17 現 モデルファミリー(2017)' },
          { id: 'ABD18', name: '[S] ABD18 現 モデル(2018)' },
          { id: 'ABE18', name: '[S] ABE18 現 モデルファミリー(2018)' },
          { id: 'ABD19', name: '[S] ABD19 現 モデル(2019)' },
          { id: 'ABE19', name: '[S] ABE19 現 モデルファミリー(2019)' },
          { id: 'A2M', name: '[S] A2M 現 座席数(2020－)' },
          { id: 'A2M0', name: '[R] A2M0 現 座席数(生数字)(2020－)' },
          { id: 'A3EV', name: '[S] A3EV [EV]現 バッテリー容量(2020－)' },
          { id: 'A3EV0', name: '[R] A3EV0 [EV]現 バッテリー容量(生数字)(2020－)' },
          { id: 'ABD20', name: '[S] ABD20 現 モデル(2020)' },
          { id: 'ABE20', name: '[S] ABE20 現 モデルファミリー(2020)' },
          { id: 'ABD21', name: '[S] ABD21 現 モデル(2021)' },
          { id: 'ABE21', name: '[S] ABE21 現 モデルファミリー(2021)' },
          { id: 'ABD23', name: '[S] ABD23 現 モデル(2023)' },
          { id: 'ABE23', name: '[S] ABE23 現 モデルファミリー(2023)' },
          { id: 'model_ym', name: '[C] model_ym 現 モデル年月' },
        ],
      },
      {
        id: 'previousCar',
        name: '前保有車特性',
        children: [
          {
            id: 'BCAA0',
            name: '[C] BCAA0 前) 車名コード(Toyota)',
            children: [
              { id: 'NAME', name: 'NAME 通称名称' },
              { id: 'CL_NAME', name: 'CL_NAME 単位車名名称' },
              { id: 'T_CAT_CL2', name: 'T_CAT_CL2 登録日報カテゴリークラス(2020/02～)' },
              {
                id: 'CAT',
                name: 'CAT カテゴリ',
                children: [
                  { id: 'CAT_NAME', name: 'NAME 名称' },
                  {
                    id: 'LCL',
                    name: 'LCL 大分類',
                    children: [
                      { id: 'LCL_NAME', name: 'NAME 名称' },
                      { id: 'K_CAT_CL2', name: 'K_CAT_CL2' },
                      { id: 'S_CAT_CL', name: 'S_CAT_CL' },
                      { id: 'T_CAT_CL', name: 'T_CAT_CL' },
                      { id: 'K_CAT_CL', name: 'K_CAT_CL' },
                      { id: 'BCBA013', name: '[C] BCBA013' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'purchaseSituation',
        name: '購入時状況',
        children: [
          { id: 'purchaseSituation_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'comparison2004',
        name: '比較検討状況(2004－)',
        children: [
          { id: 'comparison2004_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'purchaseFocus',
        name: '購入時重点視点',
        children: [
          { id: 'purchaseFocus_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'purpose2010',
        name: '用途(2010－)',
        children: [
          { id: 'purpose2010_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'usage',
        name: '使用状況',
        children: [
          { id: 'usage_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'concurrentOwnership',
        name: '併有状況',
        children: [
          { id: 'concurrentOwnership_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'satisfaction',
        name: '満足度',
        children: [
          { id: 'satisfaction_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'dealerSatisfaction2004',
        name: 'ディーラー満足度(2004－)',
        children: [
          { id: 'dealerSatisfaction2004_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'brandAwareness',
        name: 'ブランド認知度',
        children: [
          { id: 'brandAwareness_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'carView',
        name: '車観',
        children: [
          { id: 'carView_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'userCharacteristics',
        name: 'ユーザー特性',
        children: [
          { id: 'userCharacteristics_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'surveyInfo',
        name: '調査情報',
        children: [
          { id: 'surveyInfo_testNode', name: 'Test Node' },
        ],
      },
      {
        id: 'others',
        name: 'その他',
        children: [
          { id: 'others_testNode', name: 'Test Node' },
        ],
      },
    ],
  },
};

const buildTestChildrenFromCsv = (options: { includeNumeric?: boolean } = {}) => {
  const { includeNumeric = true } = options;
  const lines = TEST_CSV_RAW.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());

  const targetColumns = [
    'sex',
    'child',
    'age',
    'year',
    '車イメージ',
    '保有車_メーカー',
    '保有車_カテゴリ',
    '保有車_車名',
    'test_SEG'
  ];

  const result: { id: string; name: string }[] = [];

  headers.forEach((header, colIndex) => {
    if (header === 'ID' || !targetColumns.includes(header)) return;

    const values: string[] = [];
    for (let i = 1; i < lines.length; i += 1) {
      const row = lines[i].split(',').map(v => v.trim());
      const value = row[colIndex];
      if (value && value !== 'NA') {
        values.push(value);
      }
    }

    const isNumeric = values.length > 0 && values.every(v => !isNaN(Number(v)));
    if (includeNumeric || !isNumeric) {
      result.push({ id: header, name: header });
    }
  });

  return result;
};

export const itemListData = (() => {
  const cloned = JSON.parse(JSON.stringify(baseItemListData));
  const surveyChildren = cloned?.surveyData?.children || [];
  const testNode = surveyChildren.find((child: any) => child.id === 'test');
  if (testNode) {
    testNode.children = buildTestChildrenFromCsv({ includeNumeric: true });
  }
  return cloned;
})();


// 条件テーブルのデモデータを拡張し、垂直スクロールバーが表示されるようにします。

const buildTestConditionDataFromCsv = () => {
  const lines = TEST_CSV_RAW.trim().split('\n');
  if (lines.length === 0) return {};
  const headers = lines[0].split(',').map(h => h.trim());

  const targetColumns = [
    'sex',
    'child',
    'age',
    'year',
    '車イメージ',
    '保有車_メーカー',
    '保有車_カテゴリ',
    '保有車_車名',
    'test_SEG'
  ];

  const result: Record<string, { no: number; name: string; lower: string; upper: string }[]> = {};

  headers.forEach((header, colIndex) => {
    if (header === 'ID' || !targetColumns.includes(header)) return;

    const values = new Set<string>();
    for (let i = 1; i < lines.length; i += 1) {
      const row = lines[i].split(',').map(v => v.trim());
      const value = row[colIndex];
      if (value && value !== 'NA') {
        values.add(value);
      }
    }

    const sortedValues = Array.from(values).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      const bothNumeric = !isNaN(numA) && !isNaN(numB);
      if (bothNumeric) return numA - numB;
      return a.localeCompare(b);
    });

    result[header] = sortedValues.map((val, idx) => ({
      no: idx + 1,
      name: val,
      lower: '',
      upper: ''
    }));
  });

  return result;
};

const conditionDataBase: Record<string, { no: number; name: string; lower: string; upper: string }[]> = {
  payment1: paymentConditions,
  payment2: paymentConditions,
  paymentRaw: paymentConditions,
  carCodeToyota: testCodeConditions,
  carCodeNCBS2013: testCodeConditions,
  carCodeNCBS2010: testCodeConditions,
  // 現保有車特性の新規項目
  ABC: testCodeConditions,
  ACA: testCodeConditions,
  AD: testCodeConditions,
  AEAA0: testCodeConditions,
  AF: testCodeConditions,
  AF0: testCodeConditions,
  AFA: testCodeConditions,
  AFA0: testCodeConditions,
  AFB: testCodeConditions,
  AFB0: testCodeConditions,
  AGA: testCodeConditions,
  AGB: testCodeConditions,
  AH: testCodeConditions,
  AI: testCodeConditions,
  AJ: testCodeConditions,
  AK: testCodeConditions,
  AL: testCodeConditions,
  AMA0: testCodeConditions,
  AMB0: testCodeConditions,
  AN: testCodeConditions,
  AN0: testCodeConditions,
  AP: testCodeConditions,
  AP0: testCodeConditions,
  AQ: testCodeConditions,
  ARA: testCodeConditions,
  ARB: testCodeConditions,
  AHA: testCodeConditions,
  AHB: testCodeConditions,
  ABD10: testCodeConditions,
  ABE10: testCodeConditions,
  ABD11: testCodeConditions,
  ABE11: testCodeConditions,
  ABD12: testCodeConditions,
  ABE12: testCodeConditions,
  ABD13: testCodeConditions,
  ABE13: testCodeConditions,
  ABD14: testCodeConditions,
  ABE14: testCodeConditions,
  ABD15: testCodeConditions,
  ABE15: testCodeConditions,
  ABD16: testCodeConditions,
  ABE16: testCodeConditions,
  ABD17: testCodeConditions,
  ABE17: testCodeConditions,
  ABD18: testCodeConditions,
  ABE18: testCodeConditions,
  ABD19: testCodeConditions,
  ABE19: testCodeConditions,
  A2M: testCodeConditions,
  A2M0: testCodeConditions,
  A3EV: testCodeConditions,
  A3EV0: testCodeConditions,
  ABD20: testCodeConditions,
  ABE20: testCodeConditions,
  ABD21: testCodeConditions,
  ABE21: testCodeConditions,
  ABD23: testCodeConditions,
  ABE23: testCodeConditions,
  model_ym: testCodeConditions,
  // 前保有車特性 - BCAA0の深い階層
  BCAA0: [
    { no: 1, name: 'BCAA0 CODE1', lower: '', upper: '' },
    { no: 2, name: 'BCAA0 CODE2', lower: '', upper: '' },
  ],
  NAME: testCodeConditions,
  CL_NAME: testCodeConditions,
  T_CAT_CL2: testCodeConditions,
  CAT: testCodeConditions,
  CAT_NAME: testCodeConditions,
  LCL: testCodeConditions,
  LCL_NAME: testCodeConditions,
  K_CAT_CL2: testCodeConditions,
  S_CAT_CL: testCodeConditions,
  T_CAT_CL: testCodeConditions,
  K_CAT_CL: testCodeConditions,
  BCBA013: testCodeConditions,
  // TEST項目
  sex: [
    { no: 1, name: 'sex CODE1', lower: '', upper: '' },
    { no: 2, name: 'sex CODE2', lower: '', upper: '' },
  ],
  age: [
    { no: 1, name: 'age CODE1', lower: '', upper: '' },
    { no: 2, name: 'age CODE2', lower: '', upper: '' },
  ],
  // 2レベル項目の Test Node
  purchaseSituation_testNode: testCodeConditions,
  comparison2004_testNode: testCodeConditions,
  purchaseFocus_testNode: testCodeConditions,
  purpose2010_testNode: testCodeConditions,
  usage_testNode: testCodeConditions,
  concurrentOwnership_testNode: testCodeConditions,
  satisfaction_testNode: testCodeConditions,
  dealerSatisfaction2004_testNode: testCodeConditions,
  brandAwareness_testNode: testCodeConditions,
  carView_testNode: testCodeConditions,
  userCharacteristics_testNode: testCodeConditions,
  surveyInfo_testNode: testCodeConditions,
  others_testNode: testCodeConditions,
};

const conditionData: Record<string, { no: number; name: string; lower: string; upper: string }[]> = {
  ...conditionDataBase,
  ...buildTestConditionDataFromCsv()
};

// 条件一覧テーブルの行データを定義するためのインターフェース。

export interface ConditionListItem {
  id: string;
  bracketOpen: string;
  itemId: string;
  itemName: string;
  symbol: string;
  categoryNo: number;
  categoryName: string;
  bracketClose: string;
  connector: 'AND' | 'OR' | '';
}


// ツリービューの展開/折りたたみを視覚的に示すアイコン。

const TreeCaret = ({ expanded }: { expanded: boolean }) => (
  <div className="w-4 h-4 text-[#586365] flex items-center justify-center mr-1">
    <svg
      className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : 'rotate-0'}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M8 6l6 4-6 4V6z" />
    </svg>
  </div>
);

// 指定されたIDを持つアイテムをツリーデータ構造から検索するヘルパー関数。
// Helper function to find an item with a given ID from the tree data structure.
const findNodeById = (node: any, targetId: string): { id: string, name: string } | null => {
  if (node.id === targetId) {
    return { id: node.id, name: node.name };
  }
  if (node.children) {
    for (const child of node.children) {
      const result = findNodeById(child, targetId);
      if (result) return result;
    }
  }
  return null;
};

const findItemInTree = (data: typeof itemListData, itemId: string | null): { id: string, name: string } | null => {
  if (!itemId) return null;
  for (const key in data) {
    const topLevelItem = data[key as keyof typeof itemListData];
    for (const child of topLevelItem.children) {
      const result = findNodeById(child, itemId);
      if (result) return result;
    }
  }
  return null;
};

// TEST 치환 함수: 'TEST CODE{n}'을 'itemNameFirst5_CODE{n}' 형태로 치환
const formatConditionName = (condName: string, itemName?: string) => {
  if (!condName) return condName;
  if (!itemName) return condName;
  const m = condName.match(/TEST\s*CODE(\d+)/i);
  if (m) {
    const codeNum = m[1];
    const prefix = itemName.slice(0, 5);
    return `${prefix}_CODE${codeNum}`;
  }
  // 일반적인 'TEST' 치환(보수)
  if (/TEST/i.test(condName)) {
    const prefix = itemName.slice(0, 5);
    return condName.replace(/TEST/i, prefix);
  }
  return condName;
};


export const FilterEditModal: React.FC<FilterEditModalProps> = ({
  onClose,
  onConfirm,
  initialConditions = [],
  onShowInfo,
  title = "フィルター編集",
  hideRowControls = false
}) => {
  // ツリービューと条件テーブルの状態を管理するためのstate。

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // 条件テーブルと条件一覧の状態を管理するためのstate。

  const [selectedConditionIndex, setSelectedConditionIndex] = useState<number | null>(null);
  const [conditionList, setConditionList] = useState<ConditionListItem[]>(initialConditions);
  const [selectedConditionListIndex, setSelectedConditionListIndex] = useState<number | null>(null);

  // キャンセル確認モーダルの状態管理
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // 数値型入力の状態管理
  const [numericSymbol, setNumericSymbol] = useState<string>('=');
  const [numericValue, setNumericValue] = useState<string>('');

  // 選択されたアイテムが数値型かどうかを判定
  const isNumericItem = (itemId: string | null): boolean => {
    if (!itemId) return false;
    const conditions = conditionData[itemId];
    if (!conditions || conditions.length === 0) return false;
    
    // 数値型の場合、conditionの名前が数値として解釈可能
    return conditions.every(c => !isNaN(Number(c.name)));
  };

  const selectedItemIsNumeric = isNumericItem(selectedItem);

  // 재귀적 트리 렌더링 함수
  const renderTreeNode = (node: any, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedState[node.id];
    
    // 3레벨 이상(depth >= 2)만 클릭시 조건 표시
    const shouldShowConditions = depth >= 2;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center cursor-pointer p-1 rounded-sm ${
            shouldShowConditions ? modalStyles.interactive.listItem(selectedItem === node.id) : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              setExpandedState(prev => ({ ...prev, [node.id]: !prev[node.id] }));
            }
            if (shouldShowConditions) {
              setSelectedItem(node.id);
              setSelectedConditionIndex(null);
            } else {
              // 최상위나 2번째 레벨 클릭시 조건 표시 지우기
              setSelectedItem(null);
              setSelectedConditionIndex(null);
            }
          }}
          title={node.name}
        >
          {hasChildren && <TreeCaret expanded={isExpanded} />}
          {!hasChildren && <div className="w-4 mr-1"></div>}
          <span className={hasChildren ? "font-semibold" : ""}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="pl-4">
            {node.children.map((child: any) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const currentConditions = selectedItem ? conditionData[selectedItem] || [] : null;

  // 数値型の条件を一覧に追加するハンドラ
  const handleAddNumericCondition = (connectorType: 'AND' | 'OR') => {
    if (selectedItem === null || !numericValue.trim()) return;

    const childItem = findItemInTree(itemListData, selectedItem);
    if (!childItem) return;

    // 数値検証
    if (isNaN(Number(numericValue))) {
      onShowInfo("数値を入力してください。");
      return;
    }

    const newListItem: ConditionListItem = {
      id: `${Date.now()}-${Math.random()}`,
      bracketOpen: '（',
      itemId: 'SUSERSAGE',
      itemName: childItem.name,
      symbol: numericSymbol,
      categoryNo: 0,
      categoryName: numericValue,
      bracketClose: '）',
      connector: '',
    };

    setConditionList(prevList => {
      const updatedList = [...prevList];
      if (updatedList.length > 0) {
        updatedList[updatedList.length - 1].connector = connectorType;
      }
      return [...updatedList, newListItem];
    });

    // 入力値をリセット
    setNumericValue('');
  };

  // 条件を一覧に追加するハンドラ。

  const handleAddCondition = (connectorType: 'AND' | 'OR') => {
    if (selectedItem === null || selectedConditionIndex === null) return;

    const childItem = findItemInTree(itemListData, selectedItem);
    const conditionItem = currentConditions && currentConditions[selectedConditionIndex];

    if (!childItem || !conditionItem) return;

    const isDuplicate = conditionList.some(
      item => item.itemName === childItem.name && item.categoryNo === conditionItem.no
    );

    if (isDuplicate) {
      onShowInfo("すでに選択したデータです");
      return;
    }

    const newListItem: ConditionListItem = {
      id: `${Date.now()}-${Math.random()}`,
      bracketOpen: '（',
      itemId: 'SUSERSAGE',
      itemName: childItem.name,
      symbol: '=',
      categoryNo: conditionItem.no,
      categoryName: formatConditionName(conditionItem.name, childItem.name),
      bracketClose: '）',
      connector: '',
    };

    setConditionList(prevList => {
      const updatedList = [...prevList];
      if (updatedList.length > 0) {
        updatedList[updatedList.length - 1].connector = connectorType;
      }
      return [...updatedList, newListItem];
    });

    setSelectedConditionIndex(null);
  };

  const handleAddRow = () => {
    const newRow: ConditionListItem = {
      id: `cond-${Date.now()}`,
      bracketOpen: '',
      itemId: '',
      itemName: '',
      symbol: '',
      categoryNo: 0,
      categoryName: '',
      bracketClose: '',
      connector: '',
    };
    setConditionList(prev => [...prev, newRow]);
    setSelectedConditionListIndex(conditionList.length);
  };

  const handleDeleteRow = () => {
    if (selectedConditionListIndex === null) return;
    setConditionList(prev => prev.filter((_, index) => index !== selectedConditionListIndex));
    setSelectedConditionListIndex(null);
  };

  const handleDeleteAll = () => {
    setConditionList([]);
    setSelectedConditionListIndex(null);
  };

  const handleMoveUp = () => {
    if (selectedConditionListIndex === null || selectedConditionListIndex === 0) return;
    setConditionList(prev => {
      const newList = [...prev];
      const [movedItem] = newList.splice(selectedConditionListIndex, 1);
      newList.splice(selectedConditionListIndex - 1, 0, movedItem);
      return newList;
    });
    setSelectedConditionListIndex(prev => prev! - 1);
  };

  const handleMoveDown = () => {
    if (selectedConditionListIndex === null || selectedConditionListIndex >= conditionList.length - 1) return;
    setConditionList(prev => {
      const newList = [...prev];
      const [movedItem] = newList.splice(selectedConditionListIndex, 1);
      newList.splice(selectedConditionListIndex + 1, 0, movedItem);
      return newList;
    });
    setSelectedConditionListIndex(prev => prev! + 1);
  };

  const selectedItemDetails = findItemInTree(itemListData, selectedItem);
  const selectedItemName = selectedItemDetails ? selectedItemDetails.name : null;

  const isAndButtonDisabled =
    selectedConditionIndex === null ||
    (!!selectedItemName && conditionList.some(item => item.itemName === selectedItemName));

  const normalizeLastConnector = (list: ConditionListItem[]) => {
    if (list.length === 0) return list;
    const lastIndex = list.length - 1;
    if (list[lastIndex].connector === '') return list;
    return list.map((item, index) =>
      index === lastIndex ? { ...item, connector: '' } : item
    );
  };

  const normalizeBrackets = (list: ConditionListItem[]) => {
    return list.map(item => ({
      ...item,
      bracketOpen: item.bracketOpen === '(' ? '（' : item.bracketOpen,
      bracketClose: item.bracketClose === ')' ? '）' : item.bracketClose,
    }));
  };

  const validateConditionList = (list: ConditionListItem[]) => {
    // 조건이 하나도 없으면 에러
    if (list.length === 0) {
      return '条件を少なくとも1つ追加してください。';
    }

    for (const [index, item] of list.entries()) {
      if (!item.itemName?.trim() || !item.symbol?.trim() || !item.categoryName?.trim()) {
        return `条件一覧の${index + 1}行目に未入力の項目があります。`;
      }
    }

    for (let i = 0; i < list.length - 1; i += 1) {
      if (list[i].connector !== 'AND' && list[i].connector !== 'OR') {
        return `条件一覧の${i + 1}行目に連結（AND/OR）が設定されていません。`;
      }
    }

    let balance = 0;
    for (const [index, item] of list.entries()) {
      const open = item.bracketOpen || '';
      const close = item.bracketClose || '';
      if (/[^()（）]/.test(open) || /[^()（）]/.test(close)) {
        return `条件一覧の${index + 1}行目に不正な括弧が含まれています。`;
      }

      const openCount = (open.match(/[（(]/g) || []).length;
      const closeCount = (close.match(/[）)]/g) || []).length;
      balance += openCount;
      balance -= closeCount;

      if (balance < 0) {
        return '括弧の閉じが先に来ています。括弧の開閉を確認してください。';
      }
    }

    if (balance !== 0) {
      return '括弧の開閉が一致しません。括弧を閉じてください。';
    }

    return null;
  };

  const handleConfirmClick = () => {
    const withNormalizedBrackets = normalizeBrackets(conditionList);
    const normalizedList = normalizeLastConnector(withNormalizedBrackets);
    if (normalizedList !== conditionList) {
      setConditionList(normalizedList);
    }

    const errorMessage = validateConditionList(normalizedList);
    if (errorMessage) {
      onShowInfo(errorMessage);
      return;
    }

    onConfirm(normalizedList);
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onClose();
  };

  return (
    <div
      className={modalStyles.overlay}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${modalStyles.container} max-w-5xl w-full`}
        style={{ height: '40rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}

        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>{title}</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} flex flex-col overflow-hidden`}>
          <div className="flex-1 flex flex-col gap-2 min-h-0 pt-2">
            {/* 上段：項目一覧と条件選択 */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <span className="font-semibold text-xs text-[#586365] mb-1">項目一覧</span>
                <div className="flex items-center space-x-1 mb-1 flex-shrink-0">
                  <input
                    type="text"
                    className="flex-grow w-full h-[30px] px-2 text-xs border border-gray-400 bg-white outline-none focus:ring-1 focus:ring-gray-400 rounded-md"
                    aria-label="項目一覧 検索"
                  />
                  <button
                    className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-[#586365] font-semibold rounded-md"
                    aria-label="項目一覧 オプション"
                  >
                    ↓
                  </button>
                </div>
                {/* ツリービューコンテナ：flex-1で高さを確保し、内部でスクロール */}
                <div className="flex-1 border border-gray-400 rounded-md bg-white overflow-hidden text-xs select-none flex flex-col">
                  <div className="flex-1 overflow-auto p-1">
                    {Object.entries(itemListData).map(([key, topLevelItem]) => (
                      <div key={key}>
                        <div
                          className="flex items-center cursor-pointer p-1 rounded-sm"
                          onClick={() => {
                            setExpandedState(prev => ({ ...prev, [key]: !prev[key] }));
                            // 최상위 노드 클릭시 조건 클리어
                            setSelectedItem(null);
                            setSelectedConditionIndex(null);
                          }}
                        >
                          <TreeCaret expanded={!!expandedState[key]} />
                          <span className="font-semibold">{topLevelItem.name}</span>
                        </div>
                        {expandedState[key] && (
                          <div className="pl-4">
                            {topLevelItem.children.map(child => renderTreeNode(child, 1))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <span className="font-semibold text-xs text-[#586365] mb-1">条件</span>
                <div className="flex items-center space-x-1 mb-1 flex-shrink-0">
                  <input
                    type="text"
                    className="flex-grow w-full h-[30px] px-2 text-xs border border-gray-400 bg-white outline-none focus:ring-1 focus:ring-gray-400 rounded-md"
                    aria-label="条件 検索"
                  />
                  <button
                    className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-[#586365] font-semibold rounded-md"
                    aria-label="条件 オプション"
                  >
                    ↓
                  </button>
                </div>
                
                {/* 数値型の場合：記号と値の入力UI */}
                {selectedItemIsNumeric ? (
                  <div className="flex-1 flex flex-col border border-gray-400 rounded-md bg-white overflow-hidden">
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-4">
                        {/* 記号 */}
                        <div className="flex-shrink-0" style={{ width: '100px' }}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">記号</label>
                          <AppSelect 
                            value={numericSymbol} 
                            onChange={(e) => setNumericSymbol(e.target.value)}
                            className="w-full h-8 text-xs"
                          >
                            <option value="=">=</option>
                            <option value="≠">≠</option>
                            <option value="＜">＜</option>
                            <option value="＞">＞</option>
                            <option value="≦">≦</option>
                            <option value="≧">≧</option>
                          </AppSelect>
                        </div>
                        {/* 数値 */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">数値</label>
                          <input
                            type="text"
                            value={numericValue}
                            onChange={(e) => setNumericValue(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-400 rounded-md outline-none focus:ring-1 focus:ring-gray-400"
                            placeholder="数値を入力してください"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 p-2 flex justify-end gap-2 bg-gray-50 border-t border-gray-300">
                      <AppButton 
                        onClick={() => handleAddNumericCondition('AND')} 
                        className="py-1 px-2 text-xs" 
                        disabled={!numericValue.trim()}
                      >
                        ANDで条件を追加
                      </AppButton>
                      <AppButton 
                        onClick={() => handleAddNumericCondition('OR')} 
                        className="py-1 px-2 text-xs" 
                        disabled={!numericValue.trim()}
                      >
                        ORで条件を追加
                      </AppButton>
                    </div>
                  </div>
                ) : (
                  /* 文字列型の場合：既存のテーブルUI */
                  <div className="flex-1 flex flex-col border border-gray-400 rounded-md bg-white overflow-hidden">
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                          <tr>
                            <th className="p-1 font-semibold text-left border-b border-r border-gray-300 w-16 text-center whitespace-nowrap">No</th>
                            <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2 whitespace-nowrap">名前</th>
                            <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2 whitespace-nowrap">下限値</th>
                            <th className="p-1 font-semibold text-left border-b border-gray-300 pl-2 whitespace-nowrap">上限値</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentConditions && currentConditions.map((item, index) => (
                            <tr
                              key={item.no}
                              className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedConditionIndex === index)}`}
                              onClick={() => setSelectedConditionIndex(index)}
                            >
                              <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.no}</td>
                              <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{formatConditionName(item.name, selectedItemName)}</td>
                              <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.lower}</td>
                              <td className="p-1 border-b border-gray-200 pl-2 whitespace-nowrap">{item.upper}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex-shrink-0 p-2 flex justify-end gap-2 bg-gray-50 border-t border-gray-300">
                      <AppButton onClick={() => handleAddCondition('AND')} className="py-1 px-2 text-xs" disabled={isAndButtonDisabled}>ANDで条件を追加</AppButton>
                      <AppButton onClick={() => handleAddCondition('OR')} className="py-1 px-2 text-xs" disabled={selectedConditionIndex === null}>ORで条件を追加</AppButton>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 下段：条件一覧 */}
            <div className="flex-1 grid grid-cols-8 gap-4 min-h-0 overflow-hidden">
              <div className="col-span-1 flex flex-col items-center justify-start pt-6 space-y-1">
                <span className="font-semibold text-xs text-[#586365] mb-1 invisible">Controls</span>
                {!hideRowControls && (
                  <>
                    <AppButton onClick={handleMoveUp} disabled={selectedConditionListIndex === null || selectedConditionListIndex === 0} className="w-12 h-[30px] flex items-center justify-center p-0 text-sm">↑</AppButton>
                    <AppButton onClick={handleMoveDown} disabled={selectedConditionListIndex === null || selectedConditionListIndex >= conditionList.length - 1} className="w-12 h-[30px] flex items-center justify-center p-0 text-sm">↓</AppButton>
                    <AppButton onClick={handleAddRow} className="w-20 py-1">行追加</AppButton>
                  </>
                )}
                <AppButton onClick={handleDeleteRow} disabled={selectedConditionListIndex === null} className="py-1 w-20">行削除</AppButton>
                <AppButton onClick={handleDeleteAll} disabled={conditionList.length === 0} className="py-1 w-20">全削除</AppButton>
              </div>
              <div className="col-span-7 flex flex-col min-h-0">
                <span className="font-semibold text-xs text-[#586365] mb-1">条件一覧</span>
                {/* 条件一覧コンテナ：flex-1で高さを確保 */}
                <div className="flex-1 border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">（</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">アイテムID</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">アイテム名称</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">記号</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">カテゴリNo</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">カテゴリ名称/文字/数値</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">）</th>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 whitespace-nowrap">連結</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conditionList.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedConditionListIndex === index)}`}
                            onClick={() => setSelectedConditionListIndex(index)}
                          >
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">
                              <AppSelect 
                                value={item.bracketOpen} 
                                onChange={(e) => {
                                  setConditionList(prev => {
                                    const newList = [...prev];
                                    newList[index].bracketOpen = e.target.value;
                                    return newList;
                                  });
                                }} 
                                className="h-6 text-xs w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">　</option>
                                <option value="（">（</option>
                              </AppSelect>
                            </td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.itemId}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap max-w-[120px] truncate" title={item.itemName}>{item.itemName}</td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">
                              <AppSelect 
                                value={item.symbol} 
                                onChange={(e) => {
                                  setConditionList(prev => {
                                    const newList = [...prev];
                                    newList[index].symbol = e.target.value;
                                    return newList;
                                  });
                                }} 
                                className="h-6 text-xs w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">　</option>
                                <option value="=">=</option>
                                <option value="≠">≠</option>
                                <option value="＜">＜</option>
                                <option value="＞">＞</option>
                                <option value="≦">≦</option>
                                <option value="≧">≧</option>
                              </AppSelect>
                            </td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.categoryNo}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap max-w-[150px] truncate" title={formatConditionName(item.categoryName, item.itemName)}>{formatConditionName(item.categoryName, item.itemName)}</td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">
                              <AppSelect 
                                value={item.bracketClose} 
                                onChange={(e) => {
                                  setConditionList(prev => {
                                    const newList = [...prev];
                                    newList[index].bracketClose = e.target.value;
                                    return newList;
                                  });
                                }} 
                                className="h-6 text-xs w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">　</option>
                                <option value="）">）</option>
                              </AppSelect>
                            </td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">
                              {index < conditionList.length - 1 && (() => {
                                // 同じアイテム名称の場合はORのみ選択可能
                                const currentItemName = item.itemName;
                                const nextItemName = conditionList[index + 1]?.itemName;
                                const isSameItem = currentItemName === nextItemName;
                                
                                return (
                                  <AppSelect value={item.connector} onChange={(e) => {
                                    const newConnector = e.target.value as 'AND' | 'OR' | '';
                                    setConditionList(prev => {
                                      const newList = [...prev];
                                      newList[index].connector = newConnector;
                                      return newList;
                                    });
                                  }} className="h-6 text-xs w-20" onClick={(e) => e.stopPropagation()}>
                                    <option value="">　</option>
                                    <option value="AND" disabled={isSameItem}>AND</option>
                                    <option value="OR">OR</option>
                                  </AppSelect>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirmClick}
              className="w-24 py-1"
              isActive={conditionList.length > 0}
              disabled={conditionList.length === 0}
            >
              OK
            </AppButton>
            <AppButton onClick={handleCancelClick} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>

      {/* キャンセル確認モーダル */}
      {showCancelConfirm && (
        <InfoModal
          message="条件式をキャンセルします。よろしいでしょうか。"
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelConfirm(false)}
          showCancel={true}
        />
      )}
    </div>
  );
};
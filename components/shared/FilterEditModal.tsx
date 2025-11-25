import React, { useState } from 'react';
import { AppButton, AppSelect } from './FormControls';
import { modalStyles } from './modalStyles';

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

const itemListData = {
  surveyData: {
    name: '調査データ',
    children: [
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
        ],
      },
    ],
  },
  user: {
    name: 'ユーザ',
    children: [
      { id: 'gender', name: '性別' },
      { id: 'age', name: '年齢' },
      { id: 'unmarried', name: '未既婚' },
      { id: 'income', name: '年収' },
      { id: 'job', name: '職業' },
      { id: 'residence_type', name: '居住地域タイプ' },
      { id: 'household_size', name: '同居家族人数_Scrolling test_123456789_あいうえお_カキクケコ_abcdefghijklmnopqrstuvwxyz' },
      ...testItems
    ],
  },
};


// 条件テーブルのデモデータを拡張し、垂直スクロールバーが表示されるようにします。

const conditionData: Record<string, { no: number; name: string; lower: string; upper: string }[]> = {
  payment1: paymentConditions,
  payment2: paymentConditions,
  paymentRaw: paymentConditions,
  carCodeToyota: testCodeConditions,
  carCodeNCBS2013: testCodeConditions,
  carCodeNCBS2010: testCodeConditions,
  gender: [
    { no: 1, name: '男性', lower: '', upper: '' },
    { no: 2, name: '女性', lower: '', upper: '' },
    { no: 3, name: 'その他', lower: '', upper: '' },
  ],
  age: [
    { no: 1, name: '19歳以下', lower: '', upper: '' },
    { no: 2, name: '20-24歳', lower: '', upper: '' },
    { no: 3, 'name': '25-29歳', lower: '', upper: '' },
    { no: 4, name: '30-34歳', lower: '', upper: '' },
    { no: 5, name: '35-39歳', lower: '', upper: '' },
    { no: 6, name: '40代', lower: '', upper: '' },
    { no: 7, name: '50代', lower: '', upper: '' },
    { no: 8, name: '60代', lower: '', upper: '' },
    { no: 9, name: '70-74歳', lower: '', upper: '' },
    { no: 10, name: '75-79歳', lower: '', upper: '' },
    { no: 11, name: '80歳以上', lower: '', upper: '' },
    { no: 12, name: 'その他', lower: '', upper: '' },
  ],
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
// 指定されたIDを持つアイテムをツリーデータ構造から検索するヘルパー関数。
// Helper function to find an item with a given ID from the tree data structure.
const findItemInTree = (data: typeof itemListData, itemId: string | null): { id: string, name: string } | null => {
  if (!itemId) return null;
  for (const key in data) {
    const topLevelItem = data[key as keyof typeof itemListData];
    for (const child of topLevelItem.children) {
      if (child.id === itemId) return child;
      // FIX: Use 'in' operator for type-safe property checking to resolve TS error.
      // FIX: TSエラーを解決するために、'in'演算子を使用してタイプセーフなプロパティチェックを行います。
      if ('children' in child && child.children) {
        for (const grandchild of child.children) {
          if (grandchild.id === itemId) return grandchild;
        }
      }
    }
  }
  return null;
};


export const FilterEditModal: React.FC<FilterEditModalProps> = ({
  onClose,
  onConfirm,
  initialConditions = [],
  onShowInfo,
  title = "カスタムフィルター設定",
  hideRowControls = false
}) => {
  // ツリービューと条件テーブルの状態を管理するためのstate。

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // 条件テーブルと条件一覧の状態を管理するためのstate。

  const [selectedConditionIndex, setSelectedConditionIndex] = useState<number | null>(null);
  const [conditionList, setConditionList] = useState<ConditionListItem[]>(initialConditions);
  const [selectedConditionListIndex, setSelectedConditionListIndex] = useState<number | null>(null);

  const currentConditions = selectedItem ? conditionData[selectedItem] || [] : null;

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
      bracketOpen: '(',
      itemId: 'SUSERSAGE',
      itemName: childItem.name,
      symbol: '=',
      categoryNo: conditionItem.no,
      categoryName: conditionItem.name,
      bracketClose: ')',
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
                          onClick={() => setExpandedState(prev => ({ ...prev, [key]: !prev[key] }))}
                        >
                          <TreeCaret expanded={!!expandedState[key]} />
                          <span className="font-semibold">{topLevelItem.name}</span>
                        </div>
                        {expandedState[key] && (
                          <div className="pl-4">
                            {topLevelItem.children.map(child => (
                              <div key={child.id}>
                                {'children' in child && child.children && child.children.length > 0 ? (
                                  <>
                                    <div
                                      className="flex items-center cursor-pointer p-1 rounded-sm"
                                      onClick={() => setExpandedState(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                                    >
                                      <TreeCaret expanded={!!expandedState[child.id]} />
                                      <span className="font-semibold">{child.name}</span>
                                    </div>
                                    {expandedState[child.id] && (
                                      <div className="pl-4">
                                        {child.children.map(grandchild => (
                                          <div
                                            key={grandchild.id}
                                            className={`cursor-pointer p-1 rounded-sm whitespace-nowrap ${modalStyles.interactive.listItem(selectedItem === grandchild.id)}`}
                                            onClick={() => { setSelectedItem(grandchild.id); setSelectedConditionIndex(null); }}
                                            title={grandchild.name}
                                          >
                                            {grandchild.name}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div
                                    key={child.id}
                                    className={`cursor-pointer p-1 rounded-sm whitespace-nowrap ${modalStyles.interactive.listItem(selectedItem === child.id)}`}
                                    onClick={() => { setSelectedItem(child.id); setSelectedConditionIndex(null); }}
                                    title={child.name}
                                  >
                                    {child.name}
                                  </div>
                                )}
                              </div>
                            ))}
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
                {/* 条件テーブルコンテナ：flex-1で高さを確保 */}
                <div className="flex-1 flex flex-col border border-gray-400 rounded-md bg-white overflow-hidden">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          <th className="p-1 font-semibold text-left border-b border-r border-gray-300 w-16 text-center whitespace-nowrap">No.</th>
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
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.name}</td>
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
              </div>
            </div>

            {/* 下段：条件一覧 */}
            <div className="flex-1 grid grid-cols-8 gap-4 min-h-0 overflow-hidden">
              <div className="col-span-1 flex flex-col items-center justify-start pt-6 space-y-2">
                <span className="font-semibold text-xs text-[#586365] mb-1 invisible">Controls</span>
                {!hideRowControls && (
                  <>
                    <AppButton onClick={handleMoveUp} disabled={selectedConditionListIndex === null || selectedConditionListIndex === 0} className="w-12 h-[30px] flex items-center justify-center p-0 text-sm">↑</AppButton>
                    <AppButton onClick={handleMoveDown} disabled={selectedConditionListIndex === null || selectedConditionListIndex >= conditionList.length - 1} className="w-12 h-[30px] flex items-center justify-center p-0 text-sm">↓</AppButton>
                    <div className="pt-4"></div>
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
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.bracketOpen}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.itemId}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.itemName}</td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.symbol}</td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.categoryNo}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.categoryName}</td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.bracketClose}</td>
                            <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">
                              {index < conditionList.length - 1 && (
                                <AppSelect value={item.connector} onChange={(e) => {
                                  const newConnector = e.target.value as 'AND' | 'OR';
                                  setConditionList(prev => {
                                    const newList = [...prev];
                                    newList[index].connector = newConnector;
                                    return newList;
                                  });
                                }} className="h-6 text-xs w-20">
                                  <option value="AND">AND</option>
                                  <option value="OR">OR</option>
                                </AppSelect>
                              )}
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
            <AppButton onClick={() => onConfirm(conditionList)} className="w-24 py-1">OK</AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};
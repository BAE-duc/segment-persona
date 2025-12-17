
import React, { useState } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import type { ConditionListItem } from './shared/FilterEditModal';

interface HeatmapVariableModalProps {
    onClose: () => void;
    onConfirm: (conditions: ConditionListItem[]) => void;
    initialConditions?: ConditionListItem[];
    onShowInfo: (message: string) => void;
}
// FilterEditModalと同じデータ構造を使用
const paymentConditions = [
  { no: 1, name: '100万円以下', lower: '', upper: '' },
  { no: 2, name: '～150万円', lower: '', upper: '' },
  { no: 3, name: '～200万円', lower: '', upper: '' },
  { no: 4, name: '～250万円', lower: '', upper: '' },
  { no: 5, name: '～300万円', lower: '', upper: '' },
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
        ],
      },
    ],
  },
  user: {
    name: 'ユーザ',
    children: [
      { id: 'gender', name: '性別' },
      { id: 'age', name: '年齢' },
    ],
  },
};

const conditionData: Record<string, { no: number; name: string; lower: string; upper: string }[]> = {
  payment1: paymentConditions,
  payment2: paymentConditions,
  gender: [
    { no: 1, name: '男性', lower: '', upper: '' },
    { no: 2, name: '女性', lower: '', upper: '' },
    { no: 3, name: 'その他', lower: '', upper: '' },
  ],
  age: [
    { no: 1, name: '19歳以下', lower: '', upper: '' },
    { no: 2, name: '20-24歳', lower: '', upper: '' },
    { no: 3, name: '25-29歳', lower: '', upper: '' },
  ],
};

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

const findItemInTree = (data: typeof itemListData, itemId: string | null): { id: string, name: string } | null => {
  if (!itemId) return null;
  for (const key in data) {
    const topLevelItem = data[key as keyof typeof itemListData];
    for (const child of topLevelItem.children) {
      if (child.id === itemId) return child;
      if ('children' in child && child.children) {
        for (const grandchild of child.children) {
          if (grandchild.id === itemId) return grandchild;
        }
      }
    }
  }
  return null;
};

export const HeatmapVariableModal: React.FC<HeatmapVariableModalProps> = ({
    onClose,
    onConfirm,
    initialConditions = [],
    onShowInfo
}) => {
    const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [selectedConditionIndex, setSelectedConditionIndex] = useState<number | null>(null);
    const [conditionList, setConditionList] = useState<ConditionListItem[]>(initialConditions);
    const [selectedConditionListIndex, setSelectedConditionListIndex] = useState<number | null>(null);

    const currentConditions = selectedItem ? conditionData[selectedItem] || [] : null;

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
        <div className={modalStyles.overlay} aria-modal="true" role="dialog">
            <div className={`${modalStyles.container} max-w-5xl w-full`} style={{ height: '40rem' }} onClick={(e) => e.stopPropagation()}>
                <div className={modalStyles.header.container}>
                    <h2 className={modalStyles.header.title}>ヒートマップの表示条件設定</h2>
                    <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
                </div>

                <div className={`${modalStyles.body.container} flex flex-col overflow-hidden`}>
                    <div className="flex-1 flex flex-col gap-2 min-h-0 pt-2">
                        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                                <span className="font-semibold text-xs text-[#586365] mb-1">項目一覧</span>
                                <div className="flex items-center space-x-1 mb-1 flex-shrink-0">
                                    <input type="text" className="flex-grow w-full h-[30px] px-2 text-xs border border-gray-400 bg-white outline-none focus:ring-1 focus:ring-gray-400 rounded-md" aria-label="項目一覧 検索" />
                                    <button className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-[#586365] font-semibold rounded-md" aria-label="項目一覧 オプション">↓</button>
                                </div>
                                <div className="flex-1 border border-gray-400 rounded-md bg-white overflow-hidden text-xs select-none flex flex-col">
                                    <div className="flex-1 overflow-auto p-1">
                                        {Object.entries(itemListData).map(([key, topLevelItem]) => (
                                            <div key={key}>
                                                <div className="flex items-center cursor-pointer p-1 rounded-sm" onClick={() => setExpandedState(prev => ({ ...prev, [key]: !prev[key] }))}>
                                                    <TreeCaret expanded={!!expandedState[key]} />
                                                    <span className="font-semibold">{topLevelItem.name}</span>
                                                </div>
                                                {expandedState[key] && (
                                                    <div className="pl-4">
                                                        {topLevelItem.children.map(child => (
                                                            <div key={child.id}>
                                                                {'children' in child && child.children && child.children.length > 0 ? (
                                                                    <>
                                                                        <div className="flex items-center cursor-pointer p-1 rounded-sm" onClick={() => setExpandedState(prev => ({ ...prev, [child.id]: !prev[child.id] }))}>
                                                                            <TreeCaret expanded={!!expandedState[child.id]} />
                                                                            <span className="font-semibold">{child.name}</span>
                                                                        </div>
                                                                        {expandedState[child.id] && (
                                                                            <div className="pl-4">
                                                                                {child.children.map(grandchild => (
                                                                                    <div key={grandchild.id} className={`cursor-pointer p-1 rounded-sm whitespace-nowrap ${modalStyles.interactive.listItem(selectedItem === grandchild.id)}`} onClick={() => { setSelectedItem(grandchild.id); setSelectedConditionIndex(null); }} title={grandchild.name}>{grandchild.name}</div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <div key={child.id} className={`cursor-pointer p-1 rounded-sm whitespace-nowrap ${modalStyles.interactive.listItem(selectedItem === child.id)}`} onClick={() => { setSelectedItem(child.id); setSelectedConditionIndex(null); }} title={child.name}>{child.name}</div>
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
                                    <input type="text" className="flex-grow w-full h-[30px] px-2 text-xs border border-gray-400 bg-white outline-none focus:ring-1 focus:ring-gray-400 rounded-md" aria-label="条件 検索" />
                                    <button className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-[#586365] font-semibold rounded-md" aria-label="条件 オプション">↓</button>
                                </div>
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
                                                    <tr key={item.no} className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedConditionIndex === index)}`} onClick={() => setSelectedConditionIndex(index)}>
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
                                        <AppButton onClick={() => handleAddCondition('AND')} className="py-1 px-2 text-xs" disabled={isAndButtonDisabled} isActive={!isAndButtonDisabled}>ANDで条件を追加</AppButton>
                                        <AppButton onClick={() => handleAddCondition('OR')} className="py-1 px-2 text-xs" disabled={selectedConditionIndex === null} isActive={selectedConditionIndex !== null}>ORで条件を追加</AppButton>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-8 gap-4 min-h-0 overflow-hidden">
                            <div className="col-span-1 flex flex-col items-center justify-start pt-6 space-y-2">
                                <span className="font-semibold text-xs text-[#586365] mb-1 invisible">Controls</span>
                                <AppButton onClick={handleMoveUp} disabled={selectedConditionListIndex === null || selectedConditionListIndex === 0} isActive={selectedConditionListIndex !== null && selectedConditionListIndex > 0} className="w-12 h-[30px] flex items-center justify-center p-0 text-sm">↑</AppButton>
                                <AppButton onClick={handleMoveDown} disabled={selectedConditionListIndex === null || selectedConditionListIndex >= conditionList.length - 1} isActive={selectedConditionListIndex !== null && selectedConditionListIndex < conditionList.length - 1} className="w-12 h-[30px] flex items-center justify-center p-0 text-sm">↓</AppButton>
                                <div className="pt-4"></div>
                                <AppButton onClick={handleDeleteRow} disabled={selectedConditionListIndex === null} isActive={selectedConditionListIndex !== null} className="py-1 w-20">行削除</AppButton>
                                <AppButton onClick={handleDeleteAll} disabled={conditionList.length === 0} isActive={conditionList.length > 0} className="py-1 w-20">全削除</AppButton>
                            </div>
                            <div className="col-span-7 flex flex-col min-h-0">
                                <span className="font-semibold text-xs text-[#586365] mb-1">条件一覧</span>
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
                                                    <tr key={item.id} className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedConditionListIndex === index)}`} onClick={() => setSelectedConditionListIndex(index)}>
                                                        <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.bracketOpen}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.itemId}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.itemName}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.symbol}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.categoryNo}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.categoryName}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">{item.bracketClose}</td>
                                                        <td className="p-1 border-b border-r border-gray-200 text-center whitespace-nowrap">
                                                            {index < conditionList.length - 1 && (() => {
                                                                const currentItemName = item.itemName;
                                                                const nextItemName = conditionList[index + 1]?.itemName;
                                                                const isSameItem = currentItemName === nextItemName;
                                                                
                                                                return (
                                                                    <AppSelect value={item.connector} onChange={(e) => {
                                                                        const newConnector = e.target.value as 'AND' | 'OR';
                                                                        setConditionList(prev => {
                                                                            const newList = [...prev];
                                                                            newList[index].connector = newConnector;
                                                                            return newList;
                                                                        });
                                                                    }} className="h-6 text-xs w-20">
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

                <div className={`${modalStyles.footer.container} justify-end`}>
                    <div className={modalStyles.footer.buttonGroup}>
                        <AppButton onClick={() => onConfirm(conditionList)} className="w-24 py-1" isActive={conditionList.length > 0} disabled={conditionList.length === 0}>OK</AppButton>
                        <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

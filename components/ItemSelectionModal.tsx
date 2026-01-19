import React, { useState, useEffect } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import type { SelectedItemsMap, ConversionSettings } from './SegmentVariableSelectionModal';
import { itemListData } from './shared/FilterEditModal';

interface ItemSelectionModalProps {
  onClose: () => void;
  onConfirm: (selection: SelectedItemsMap) => void;
  initialSelectedItems: SelectedItemsMap;
  onShowWarningModal: (message: string) => void;
  onOpenConversionSettings: (itemId: string, somDataType: string) => void;
  items: ItemDetail[];
}

// アイテムの詳細情報を含む新しいデータ構造。

export interface ItemDetail {
  id: string;
  name: string;
  dataType: 'int' | 'string';
  itemType: string;
  conversionSetting: string;
  somDataType: string;
  originalSomDataType?: string; // 最初のデータ型を保持
  variance: number | string;
  validResponseRate: number;
  conversionDetails?: ConversionSettings;
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


export const ItemSelectionModal: React.FC<ItemSelectionModalProps> = ({ onClose, onConfirm, initialSelectedItems, onOpenConversionSettings, items }) => {
  // 採用されたアイテムの状態を管理します。

  const [adoptedItems, setAdoptedItems] = useState<Set<string>>(new Set());
  // 右側のテーブルで選択された行を管理します。

  const [selectedRightPanelItemId, setSelectedRightPanelItemId] = useState<string | null>(null);

  // 右パネルの下部にあるチェックボックスの状態を管理します。

  const [standardize, setStandardize] = useState(true);

  // ツリービューの展開状態を管理します。
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  // ポップアップが開かれるたびに、渡された初期選択状態を同期します。
  // ポップアップが開かれるたびに、渡された初期選択状態を同期します。
  useEffect(() => {
    setAdoptedItems(new Set(Object.keys(initialSelectedItems)));
  }, [initialSelectedItems]);

  // 再귀적 트리 렌더링 함수
  const renderTreeNode = (node: any, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedState[node.id];
    const isAdopted = adoptedItems.has(node.id);
    
    // item 정보 가져오기
    const itemInfo = items.find(item => item.id === node.id);
    const somDataType = itemInfo?.somDataType;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center cursor-pointer p-1 rounded-sm ${
            !hasChildren ? modalStyles.interactive.listItem(isAdopted) : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              setExpandedState(prev => ({ ...prev, [node.id]: !prev[node.id] }));
            } else {
              handleAdoptToggleByNode(node.id);
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

  const handleAdoptToggleByNode = (itemId: string) => {
    setAdoptedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        // 採用が解除されたアイテムが右側で選択されていた場合、その選択も解除します。

        if (selectedRightPanelItemId === itemId) {
          setSelectedRightPanelItemId(null);
        }
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleConfirmClick = () => {
    const result: SelectedItemsMap = {};
    Array.from(adoptedItems).forEach((itemId: string) => {
      const item = items.find(v => v.id === itemId);
      if (item) {
        result[itemId] = {
          id: item.id,
          name: item.name,
          type: item.dataType,
          choices: [], // Populated later by useEffect in parent
          somDataType: item.somDataType,
          conversionSetting: item.conversionSetting,
          conversionDetails: item.conversionDetails,
        };
      }
    });
    onConfirm(result);
  };

  const adoptedItemDetails = items.filter(item => adoptedItems.has(item.id));

  const selectedItemDetail = selectedRightPanelItemId
    ? items.find(item => item.id === selectedRightPanelItemId)
    : null;

  const isConversionDisabled = !selectedRightPanelItemId;

  // 選択値 표시 함수
  const getSelectionValue = (item: ItemDetail): string => {
    if (!item.conversionDetails) return '-';
    
    if (item.conversionDetails.type === 'categorical' && item.conversionDetails.categories) {
      return item.conversionDetails.categories.join(', ');
    } else if (item.conversionDetails.type === 'numerical' && item.conversionDetails.range) {
      return `${item.conversionDetails.range.min} ~ ${item.conversionDetails.range.max}`;
    }
    return '-';
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
        {/* Header */}
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>アイテム選択</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* Body */}
        <div className={`${modalStyles.body.container} flex gap-4 overflow-hidden`}>
          {/* Left Panel: Item List */}
          <div className="w-[320px] flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">アイテム一覧</h3>
            <div className="flex items-center space-x-1 mb-2">
              <input type="text" className="flex-grow h-[28px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400" />
              <button
                className="flex items-center justify-center flex-shrink-0 h-[28px] w-[28px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700 font-semibold rounded-md"
                aria-label="アイテム一覧 オプション"
              >
                ↓
              </button>
            </div>
            <div className="flex-grow border border-gray-400 bg-white overflow-y-auto text-xs rounded-md p-1 select-none">
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
                      {topLevelItem.children.map(child => renderTreeNode(child, 1))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Selected Item Details */}
          <div className="flex-1 flex flex-col pt-7">
            <div className="flex justify-end items-center mb-2 h-[28px]">
              <AppButton
                className="py-1 px-4"
                onClick={() => selectedItemDetail && onOpenConversionSettings(selectedItemDetail.id, selectedItemDetail.somDataType)}
                disabled={isConversionDisabled}
                isActive={!isConversionDisabled}
              >
                変換設定
              </AppButton>
            </div>
            <div className="flex-grow border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col">
              <div className="flex-grow overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">アイテム名称</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">アイテム型</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">変換設定</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">データ型</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">分散</th>
                      <th className="p-1 font-semibold text-left border-b border-gray-300 pl-2">有効回答率(%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adoptedItemDetails.map(item => (
                      <tr
                        key={item.id}
                        className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedRightPanelItemId === item.id)}`}
                        onClick={() => setSelectedRightPanelItemId(item.id)}
                      >
                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.name}</td>
                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.itemType}</td>
                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.conversionSetting}</td>
                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.somDataType}</td>
                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.variance}</td>
                        <td className="p-1 border-b border-gray-200 pl-2 whitespace-nowrap">{item.validResponseRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={standardize}
                  onChange={() => setStandardize(prev => !prev)}
                  className="w-4 h-4"
                />
                <span className="text-xs select-none">標準化</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirmClick}
              className="w-24 py-1"
              isActive={adoptedItems.size > 0}
              disabled={adoptedItems.size === 0}
            >
              OK
            </AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

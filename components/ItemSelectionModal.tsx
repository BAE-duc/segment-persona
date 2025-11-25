import React, { useState, useEffect } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import type { SelectedItemsMap, ConversionSettings } from './SegmentVariableSelectionModal';

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
  variance: number;
  validResponseRate: number;
  conversionDetails?: ConversionSettings;
}


const CustomCheckbox = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-center">
    <label className={`relative flex items-center justify-center w-4 h-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center transition-colors 
                  peer-disabled:bg-gray-200 peer-disabled:cursor-not-allowed
                  bg-white`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        )}
      </div>
    </label>
  </div>
);


export const ItemSelectionModal: React.FC<ItemSelectionModalProps> = ({ onClose, onConfirm, initialSelectedItems, onOpenConversionSettings, items }) => {
  // 採用されたアイテムの状態を管理します。

  const [adoptedItems, setAdoptedItems] = useState<Set<string>>(new Set());
  // 右側のテーブルで選択された行を管理します。

  const [selectedRightPanelItemId, setSelectedRightPanelItemId] = useState<string | null>(null);

  // 右パネルの下部にあるチェックボックスの状態を管理します。

  const [includeNA, setIncludeNA] = useState(true);
  const [standardize, setStandardize] = useState(true);

  // ポップアップが開かれるたびに、渡された初期選択状態を同期します。
  // ポップアップが開かれるたびに、渡された初期選択状態を同期します。
  useEffect(() => {
    setAdoptedItems(new Set(Object.keys(initialSelectedItems)));
  }, [initialSelectedItems]);


  const handleAdoptToggle = (itemId: string) => {
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
            <div className="flex-grow border border-gray-400 bg-white overflow-y-auto text-xs rounded-md">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="p-1 font-bold text-center border-b border-r border-gray-300 w-12">採用</th>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">アイテム名</th>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">データ型</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr
                      key={i.id}
                      className="font-medium even:bg-gray-50 hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleAdoptToggle(i.id)}
                    >
                      <td className="p-1 border-b border-r border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <CustomCheckbox
                          checked={adoptedItems.has(i.id)}
                          onChange={() => handleAdoptToggle(i.id)}
                        />
                      </td>
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{i.name}</td>
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{i.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Selected Item Details */}
          <div className="flex-1 flex flex-col pt-7">
            <div className="flex justify-end items-center mb-2 h-[28px]">
              <AppButton
                className="py-1 px-4"
                onClick={() => selectedItemDetail && onOpenConversionSettings(selectedItemDetail.id, selectedItemDetail.somDataType)}
                disabled={isConversionDisabled}
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
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">SOMデータ型</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">分散</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">有効回答率(%)</th>
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
                        <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{item.validResponseRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <CustomCheckbox
                  checked={includeNA}
                  onChange={() => setIncludeNA(prev => !prev)}
                />
                <span className="text-xs select-none">NAを含める</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <CustomCheckbox
                  checked={standardize}
                  onChange={() => setStandardize(prev => !prev)}
                />
                <span className="text-xs select-none">標準化</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton onClick={handleConfirmClick} className="w-24 py-1">OK</AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};
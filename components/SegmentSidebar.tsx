
import React, { useState, useEffect } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import type { ConditionListItem } from './shared/FilterEditModal';
import type { FilterCategory } from '../pages/SegmentCreationPage';
import type { DataItem } from './DataSelectionModal';
import type { SegmentSettings } from './SegmentSettingsEditModal';
// FIX: Import SelectedItem type to correctly type the mapped item.
// FIX: マップされたアイテムを正しく型付けするためにSelectedItem型をインポートします。
import type { SelectedItem, SelectedItemsMap } from './SegmentVariableSelectionModal';

interface SegmentSidebarProps {
  onSegmentationExecute: () => void;
  filterCategories: FilterCategory;
  selectedData: DataItem | null;
  customFilterConditions: ConditionListItem[];
  segmentSettings: SegmentSettings | null;
  defaultSettings: SegmentSettings;
  selectedVariables: SelectedItemsMap;
  selectedItems: SelectedItemsMap;
  onOpenDataSelectionModal: () => void;
  onOpenFilterModal: () => void;
  onOpenItemSelectionModal: () => void;
  onOpenSettingsEditModal: () => void;
  onOpenConversionSettingsModal: (itemId: string, somDataType: string) => void;
  isExecuteDisabled: boolean;
  onDownload: () => void;
  // 選択中のデータ数を表示するためのプロパティを追加
  // 選択中のデータ数を表示するためのプロパティを追加
  selectedDataCount?: number;
}

import { CaretIcon } from './shared/CaretIcon';


export const SegmentSidebar: React.FC<SegmentSidebarProps> = ({
  onSegmentationExecute,
  filterCategories,
  selectedData,
  customFilterConditions,
  segmentSettings,
  defaultSettings,
  selectedVariables,
  selectedItems,
  onOpenDataSelectionModal,
  onOpenFilterModal,
  onOpenItemSelectionModal,
  onOpenSettingsEditModal,
  onOpenConversionSettingsModal,
  isExecuteDisabled,
  onDownload,
  selectedDataCount
}) => {
  // タブの定義と状態。JSXラベルをサポートするためにオブジェクトの配列を使用します。
  // タブの定義と状態。JSXラベルをサポートするためにオブジェクトの配列を使用します。
  const tabs = [
    { key: 'セグメントアイテム選択', label: <>セグメント<br />アイテム選択</> },
    { key: 'セグメント設定', label: 'パラメータ選択' },
    { key: 'フィルター編集', label: 'フィルター編集' },
  ];
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  // フィルターのツリービューの状態を管理するstate。
  // フィルターのツリービューの状態を管理するstate。
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>(() => {
    // カテゴリに子アイテムがある場合、デフォルトで展開状態にします。
    // カテゴリに子アイテムがある場合、デフォルトで展開状態にします。
    const initialState: Record<string, boolean> = {};
    for (const category in filterCategories) {
      if (filterCategories[category] && filterCategories[category].length > 0) {
        initialState[category] = true;
      }
    }
    return initialState;
  });

  // 選択された変数のツリービューの状態を管理するstate。
  // 選択された変数のツリービューの状態を管理するstate。
  const [expandedSelectedVars, setExpandedSelectedVars] = useState<Record<string, boolean>>({});

  // 「アイテム一覧」で展開されたアイテムの状態を管理します。
  // 「アイテム一覧」で展開されたアイテムの状態を管理します。
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // 選択されたアイテムのツリービューの状態を管理するstate。
  // 選択されたアイテムのツリービューの状態を管理するstate。
  const [isSelectedItemsRootExpanded, setIsSelectedItemsRootExpanded] = useState(true);

  useEffect(() => {
    setExpandedSelectedVars(prev => {
      const newExpandedState = { ...prev };
      for (const varId in selectedVariables) {
        if (!(varId in prev)) { // 新しい変数の場合 // 新しい変数の場合
          newExpandedState[varId] = true;
        }
      }
      return newExpandedState;
    });
  }, [selectedVariables]);

  const toggleSelectedVar = (varId: string) => {
    setExpandedSelectedVars(prev => ({ ...prev, [varId]: !prev[varId] }));
  };

  const toggleSelectedItemsRoot = () => {
    setIsSelectedItemsRootExpanded(prev => !prev);
  };

  // 「アイテム一覧」タブのアイテムの展開/折りたたみを切り替えます。
  // 「アイテム一覧」タブのアイテムの展開/折りたたみを切り替えます。
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };


  const [weightValue, setWeightValue] = useState('default');

  // 表示用の値をマッピングします。
  // 表示用の値をマッピングします。
  const decayFunctionMap: Record<string, string> = {
    'none': 'なし',
    'linear': '線形',
    'exponential': '指数',
    'inverse_t': '1/t',
  };


  const handleSegmentationExecuteClick = () => {
    onSegmentationExecute();
  };

  // フィルターのツリービューの展開/折りたたみを制御するハンドラ。
  // フィルターのツリービューの展開/折りたたみを制御するハンドラ。
  const toggleFilter = (filterName: string) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const currentSettings = segmentSettings || defaultSettings;

  return (
    <aside
      className="w-[290px] pt-2 pb-2 pl-2 pr-1 flex flex-col flex-shrink-0 bg-[#ECECEC]"
    >
      <div className="flex items-center justify-between gap-2 mb-1 -mt-1">
        <div className="flex justify-start gap-2">
        <button
          className="h-[30px] w-[30px] flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors rounded-md"
          aria-label="データベース"
          onClick={onOpenDataSelectionModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12,3C7.58,3,4,4.79,4,7s3.58,4,8,4,8-1.79,8-4S16.42,3,12,3z M4,9v3c0,2.21,3.58,4,8,4s8-1.79,8-4V9c0,2.21-3.58,4-8,4S4,11.21,4,9z M4,15v3c0,2.21,3.58,4,8,4s8-1.79,8-4v-3c0,2.21-3.58,4-8,4S4,17.21,4,15z" />
          </svg>
        </button>
        <button
          className="h-[30px] w-[30px] flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors rounded-md"
          aria-label="ダウンロード"
          onClick={onDownload}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M10.5 3 L10.5 11 L6 11 L12 17 L18 11 L13.5 11 L13.5 3 Z" />
            <path d="M4 17 C4 16.5 4.5 16 5 16 L9 16 C9 16 9 17.5 10 18 C11 18.5 13 18.5 14 18 C15 17.5 15 16 15 16 L19 16 C19.5 16 20 16.5 20 17 L20 20 C20 20.5 19.5 21 19 21 L5 21 C4.5 21 4 20.5 4 20 Z" />
            <circle cx="17.5" cy="18.5" r="1.2" fill="#ffffff" />
          </svg>
        </button>
        </div>
        <div className="text-xs text-gray-500 select-none">v1.0.0</div>
      </div>

      {/* テキスト表示エリア */}
      {/* テキスト表示エリア */}
      <div className="h-56 bg-white p-2 overflow-y-auto mb-1 flex-shrink-0">
        <strong className="font-bold">データ情報</strong>
        {selectedData && (
          <div className="mt-1 pl-2 space-y-1">
            <p className="text-xs text-gray-600">{selectedData.groupName}</p>
            <p className="text-xs">{selectedData.name}</p>
            <AppSelect
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              className="mt-1 w-32"
            >
              <option value="default">ウェイト値</option>
              <option value="ari">有</option>
              <option value="nashi">無</option>
            </AppSelect>
          </div>
        )}
      </div>

      {/* タブパネル */}
      <div className="flex-grow flex flex-col min-h-0">
        <div className="bg-white flex flex-col flex-grow overflow-hidden">
          {/* フィルターセクション */}
          <div className="relative flex flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 relative z-10 py-2 px-0.5 text-xs font-medium text-center focus:outline-none transition-colors duration-150 flex items-center justify-center ${activeTab === tab.key
                  ? 'text-[#586365] border-b-2 border-[#586365]'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="absolute bottom-0 left-[2px] right-[2px] h-px bg-gray-200 z-0"></div>
          </div>

          {/* タブコンテンツ */}
          {/* タブコンテンツ */}
          <div className="p-2 flex flex-col flex-grow min-h-0">
            {activeTab === 'セグメントアイテム選択' && (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0">
                  <button
                    onClick={onOpenItemSelectionModal}
                    className="text-xs text-blue-600 cursor-pointer hover:underline focus:outline-none"
                  >
                    アイテム選択
                  </button>
                </div>
                <div className="mt-2 flex-shrink-0">
                  <label className="text-xs font-medium text-[#586365]">選択中のアイテム</label>
                  <hr className="my-1 border-gray-300" />
                </div>
                <div className="flex-grow overflow-y-auto text-xs">
                  {Object.values(selectedVariables).map((variable: SelectedItem) => (
                    <div key={variable.id}>
                      <div className="flex items-center justify-between p-1 hover:bg-gray-100 rounded-sm">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => toggleSelectedVar(variable.id)}
                        >
                          <CaretIcon expanded={!!expandedSelectedVars[variable.id]} />
                          <span className="font-semibold select-none">{variable.name}</span>
                        </div>
                        <button
                          onClick={() => onOpenConversionSettingsModal(variable.id, variable.somDataType || 'カテゴリ型')}
                          className="text-xs text-blue-600 hover:underline focus:outline-none"
                        >
                          編集
                        </button>
                      </div>
                      {expandedSelectedVars[variable.id] && variable.conversionDetails && (
                        <div className="pl-8 pt-1 space-y-1 text-xs text-gray-600">
                          {variable.somDataType === '数値型' && variable.conversionDetails.range && (
                            <div>値範囲設定: {variable.conversionDetails.range.min} 〜 {variable.conversionDetails.range.max}</div>
                          )}
                          {variable.somDataType === 'カテゴリ型' && variable.conversionDetails.categories && variable.conversionDetails.categories.length > 0 && (
                            <div>
                              <ul className="list-disc pl-5">
                                {variable.conversionDetails.categories.map((cat, index) => (
                                  <li key={index}>{cat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'セグメント設定' && (
              <div className="flex flex-col h-full">
                <div className="flex-shrink-0">
                  <button
                    onClick={onOpenSettingsEditModal}
                    className="text-xs text-blue-600 cursor-pointer hover:underline focus:outline-none"
                  >
                    パラメータ選択
                  </button>
                </div>
                <div className="mt-2 flex-grow overflow-y-auto text-xs space-y-1 pl-1">
                  <p>マップサイズ: {currentSettings.mapSize === 'auto' ? '自動' : `${currentSettings.customWidth}×${currentSettings.customHeight}`}</p>
                  <p>学習率: {currentSettings.learningRate}</p>
                  <p>イテレーション数: {currentSettings.iterations}</p>
                  <p>距離尺度: {currentSettings.distanceMetric}</p>
                  <p>近傍半径: {currentSettings.neighborhoodRadius}</p>
                  <p>近傍関数: {currentSettings.neighborhoodFunction}</p>
                  <p>階層クラスタ-距離関数: {currentSettings.hierarchicalDistanceFunction}</p>
                  <p>階層クラスタ-結合方法: {currentSettings.hierarchicalLinkageMethod}</p>
                </div>
              </div>
            )}
            {activeTab === 'フィルター編集' && (
              <div className="flex-grow overflow-y-auto min-h-0 space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={onOpenFilterModal}
                      className="font-bold text-xs text-blue-600 cursor-pointer hover:underline focus:outline-none"
                    >
                      フィルター編集
                    </button>
                    {selectedData && (
                      <span className="text-xs font-medium text-[#586365]">サンプルサイズ：1000</span>
                    )}
                  </div>
                  <div className="pl-4 my-1 text-xs">
                    {customFilterConditions.map((c, index) => (
                      <div key={c.id}>{`${c.itemName} ${c.symbol} ${c.categoryName} ${index < customFilterConditions.length - 1 ? c.connector : ''}`.trim()}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  {Object.keys(filterCategories).map((name) => (
                    <div key={name}>
                      <div
                        className="flex items-center p-1 bg-gray-100 cursor-pointer hover:bg-gray-200 rounded-sm"
                        onClick={() => toggleFilter(name)}
                      >
                        <CaretIcon expanded={!!expandedFilters[name]} />
                        <span className="font-semibold select-none">{name}</span>
                      </div>
                      {expandedFilters[name] && (
                        <div className="pt-1 pl-5">
                          {filterCategories[name].map(child => (
                            <div
                              key={child}
                              className="py-1 text-xs"
                            >
                              {child}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* セグメンテーション実行ボタン */}
      {/* セグメンテーション実行ボタン */}
      <div className="flex-shrink-0 pt-2">
        <AppButton
          className="w-full"
          onClick={handleSegmentationExecuteClick}
          disabled={isExecuteDisabled}
          isActive={!isExecuteDisabled}
        >
          セグメンテーション実行
        </AppButton>
      </div>
    </aside>
  );
};

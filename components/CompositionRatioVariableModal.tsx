
import React, { useState, useMemo } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import type { ConversionSettings } from './SegmentVariableSelectionModal';
import { TEST_CSV_RAW } from '../data/testData';

// このモーダルで使われる型定義
// このモーダルで使われる型定義
// Type definitions used in this modal
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

export interface SelectedChoice {
  id: number;
  content: string;
}

export interface CompositionRatioSelection {
  variable: ItemDetail;
  adoptedChoices: SelectedChoice[];
}

interface CompositionRatioVariableModalProps {
  onClose: () => void;
  onConfirm: (selection: CompositionRatioSelection) => void;
  items: ItemDetail[];
  choicesData: { [key: string]: SelectedChoice[] };
  initialSelection: CompositionRatioSelection | null;
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


export const CompositionRatioVariableModal: React.FC<CompositionRatioVariableModalProps> = ({
  onClose,
  onConfirm,
  items,
  choicesData,
  initialSelection
}) => {
  // 年齢(age)のカテゴリをCSVから動的に生成するロジック

  // state初期化で使用するため、定義を上に移動しました。
  const ageChoices = useMemo(() => {
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const ageIndex = headers.indexOf('age');

    if (ageIndex === -1) return [];

    const getAgeBin = (val: number): string => {
      if (val <= 19) return '19歳以下';
      if (val >= 60) return '60歳以上';
      const lower = Math.floor(val / 5) * 5;
      return `${lower}-${lower + 4}歳`;
    };

    const bins = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(v => v.trim());
      const ageVal = parseInt(row[ageIndex], 10);
      if (!isNaN(ageVal)) {
        bins.add(getAgeBin(ageVal));
      }
    }

    const getAgeSortOrder = (bin: string): number => {
      if (bin === '19歳以下') return 0;
      if (bin === '60歳以上') return 100;
      if (bin === 'NA') return 999;
      const match = bin.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 50;
    };

    return Array.from(bins)
      .sort((a, b) => getAgeSortOrder(a) - getAgeSortOrder(b))
      .map((bin, index) => ({ id: index + 1000, content: bin })); // IDは衝突しないようにオフセット

  }, []);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialSelection?.variable.id || null);

  const [selectedChoiceIds, setSelectedChoiceIds] = useState<Set<number>>(() => {
    if (initialSelection && initialSelection.adoptedChoices) {
      // ageの場合はコンテンツマッチングでIDを再取得する

      if (initialSelection.variable.id === 'age') {
        const remappedIds = new Set<number>();
        initialSelection.adoptedChoices.forEach(prevChoice => {
          const match = ageChoices.find(c => c.content === prevChoice.content);
          if (match) {
            remappedIds.add(match.id);
          }
        });
        return remappedIds;
      }
      return new Set(initialSelection.adoptedChoices.map(c => c.id));
    }
    return new Set();
  });

  const handleItemSelect = (itemId: string) => {
    if (itemId !== selectedItemId) {
      setSelectedItemId(itemId);
      setSelectedChoiceIds(new Set()); // 変数が変更されたらカテゴリをクリア

    }
  };

  const handleChoiceToggle = (choiceId: number) => {
    setSelectedChoiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(choiceId)) {
        newSet.delete(choiceId);
      } else {
        newSet.add(choiceId);
      }
      return newSet;
    });
  };

  const handleConfirmClick = () => {
    if (!selectedItemId) {
      // 何も選択されていない場合はモーダルを閉じるだけ
      // 何も選択されていない場合はモーダルを閉じるだけ
      onClose();
      return;
    }

    const selectedVariable = items.find(item => item.id === selectedItemId);

    // ageの場合は専用のカテゴリを使用
    const allChoicesForVar = selectedItemId === 'age' ? ageChoices : (choicesData[selectedItemId] || []);
    const adoptedChoices = allChoicesForVar.filter(choice => selectedChoiceIds.has(choice.id));

    if (selectedVariable) {
      onConfirm({
        variable: selectedVariable,
        adoptedChoices: adoptedChoices
      });
    }
  };

  // 選択されたアイテムに応じてカテゴリを切り替え

  const currentChoices = selectedItemId
    ? (selectedItemId === 'age' ? ageChoices : (choicesData[selectedItemId] || []))
    : [];

  const allCurrentChoicesSelected = currentChoices.length > 0 && currentChoices.every(c => selectedChoiceIds.has(c.id));

  const handleSelectAllToggle = () => {
    if (!selectedItemId) return;

    if (allCurrentChoicesSelected) {
      setSelectedChoiceIds(new Set());
    } else {
      const allChoiceIds = new Set(currentChoices.map(c => c.id));
      setSelectedChoiceIds(allChoiceIds);
    }
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
          <h2 className={modalStyles.header.title}>構成比比較グラフの表示条件設定</h2>
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
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">変数名</th>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">データタイプ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr
                      key={i.id}
                      className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedItemId === i.id)}`}
                      onClick={() => handleItemSelect(i.id)}
                    >
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{i.name}</td>
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{i.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Choices of selected item */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">カテゴリ一覧</h3>
            <div className="h-[28px] mb-2"></div>
            <div className="flex-grow border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col">
              <div className="flex-grow overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="p-1 font-semibold text-center border-b border-r border-gray-300 w-12">
                        <CustomCheckbox
                          checked={allCurrentChoicesSelected}
                          onChange={handleSelectAllToggle}
                          disabled={!selectedItemId || currentChoices.length === 0}
                        />
                      </th>
                      <th className="p-1 font-semibold text-center border-b border-r border-gray-300 w-16">No.</th>
                      <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2 flex items-center">
                        内容
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentChoices.length > 0 ? (
                      currentChoices.map((choice, index) => (
                        <tr
                          key={choice.id}
                          className="font-medium even:bg-gray-50 hover:bg-gray-200"
                        >
                          <td className="p-1 border-b border-r border-gray-200 text-center">
                            <CustomCheckbox
                              checked={selectedChoiceIds.has(choice.id)}
                              onChange={() => handleChoiceToggle(choice.id)}
                            />
                          </td>
                          <td className="p-1 border-b border-r border-gray-200 text-center">{index + 1}</td>
                          <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{choice.content}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center p-4 text-gray-500">
                          {selectedItemId ? 'この変数にはカテゴリがありません。' : '左のリストから変数を選択してください。'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-2 flex-shrink-0 flex justify-end">
              <AppButton
                onClick={handleSelectAllToggle}
                disabled={!selectedItemId || currentChoices.length === 0}
                className="py-1"
              >
                全選択/全解除
              </AppButton>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirmClick}
              className="w-24 py-1"
              primary
              disabled={selectedChoiceIds.size === 0}
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

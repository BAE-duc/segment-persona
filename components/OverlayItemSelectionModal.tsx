import React, { useState, useMemo } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import { TEST_CSV_RAW } from '../data/testData';

// 選択されたアイテムの構造を定義します

export interface OverlaySelection {
  variableId: string;
  variableName: string;
  choiceIds: Set<string>;
  choiceNames: string[];
}

// Propsのインターフェース

interface OverlayItemSelectionModalProps {
  onClose: () => void;
  onConfirm: (selection: OverlaySelection | null) => void;
  initialSelection?: OverlaySelection | null;
}

// チェックボックスコンポーネント
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

export const OverlayItemSelectionModal: React.FC<OverlayItemSelectionModalProps> = ({ onClose, onConfirm, initialSelection }) => {
  // TEST_CSV_RAWからデータを動的に抽出
  const { variables, choicesData } = useMemo(() => {
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // 各変数のカテゴリを抽出
    const choices: { [key: string]: { id: string; name: string }[] } = {};
    const categoricalVars: { id: string; name: string; dataType: string }[] = [];

    headers.forEach((header, colIndex) => {
      if (header === 'ID') return;

      const uniqueValues = new Set<string>();
      const allValues: string[] = [];

      // データ行から値を抽出
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(v => v.trim());
        const value = row[colIndex];

        if (value && value !== 'NA') {
          allValues.push(value);
          uniqueValues.add(value);
        }
      }

      // 数値型かどうかを判定（全ての値が数値の場合は除外）
      const isNumeric = allValues.length > 0 && allValues.every(v => !isNaN(Number(v)));

      // 数値型でない場合のみ変数リストに追加
      if (!isNumeric) {
        categoricalVars.push({ id: header, name: header, dataType: 'string' });
        choices[header] = Array.from(uniqueValues).map((val, idx) => ({ id: `${header}_${idx}`, name: val }));
      }
    });

    return { variables: categoricalVars, choicesData: choices };
  }, []);

  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(
    initialSelection?.variableId || null
  );
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<Set<string>>(
    initialSelection?.choiceIds || new Set()
  );

  const handleVariableClick = (id: string) => {
    // 変数が変更されたらカテゴリの選択をリセット
    if (id !== selectedVariableId) {
      setSelectedChoiceIds(new Set());
    }
    setSelectedVariableId(id);
  };

  const handleChoiceToggle = (choiceId: string) => {
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
    if (!selectedVariableId || selectedChoiceIds.size === 0) {
      onConfirm(null);
      return;
    }

    const variable = variables.find(v => v.id === selectedVariableId);
    if (!variable) {
      onConfirm(null);
      return;
    }

    const choiceNames = Array.from(selectedChoiceIds)
      .map(id => choicesData[selectedVariableId]?.find(c => c.id === id)?.name)
      .filter((name): name is string => name !== undefined);

    const selection: OverlaySelection = {
      variableId: variable.id,
      variableName: variable.name,
      choiceIds: selectedChoiceIds,
      choiceNames: choiceNames,
    };
    onConfirm(selection);
  };

  const handleCancelClick = () => {
    onClose();
  };

  const currentChoices = selectedVariableId ? choicesData[selectedVariableId] || [] : [];
  const allCurrentChoicesSelected = currentChoices.length > 0 && currentChoices.every(c => selectedChoiceIds.has(c.id));

  const handleSelectAllToggle = () => {
    if (!selectedVariableId) return;

    if (allCurrentChoicesSelected) {
      setSelectedChoiceIds(new Set());
    } else {
      const allChoiceIds = new Set(currentChoices.map(c => c.id));
      setSelectedChoiceIds(allChoiceIds);
    }
  };

  return (
    <div className={modalStyles.overlay} aria-modal="true" role="dialog">
      <div className={`${modalStyles.container} max-w-5xl w-full`} style={{ height: '40rem' }}>
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>重ね合わせ項目設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        <div className={`${modalStyles.body.container} flex gap-4 overflow-hidden`}>
          {/* 左パネル: アイテム一覧 */}
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
            <div className="flex-grow border border-gray-400 bg-white rounded-md overflow-y-auto text-xs">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">変数名</th>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">データタイプ</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map(v => (
                    <tr
                      key={v.id}
                      className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedVariableId === v.id)}`}
                      onClick={() => handleVariableClick(v.id)}
                    >
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{v.name}</td>
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{v.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 右パネル: カテゴリ一覧 */}
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
                          disabled={!selectedVariableId || currentChoices.length === 0}
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
                        <tr key={choice.id} className="font-medium even:bg-gray-50 hover:bg-gray-200">
                          <td className="p-1 border-b border-r border-gray-200 text-center">
                            <CustomCheckbox
                              checked={selectedChoiceIds.has(choice.id)}
                              onChange={() => handleChoiceToggle(choice.id)}
                            />
                          </td>
                          <td className="p-1 border-b border-r border-gray-200 text-center">{index + 1}</td>
                          <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{choice.name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center p-4 text-gray-500">
                          {selectedVariableId ? 'この変数にはカテゴリがありません。' : '左のリストから変数を選択してください。'}
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
                disabled={!selectedVariableId || currentChoices.length === 0}
                className="py-1"
              >
                全選択/全解除
              </AppButton>
            </div>
          </div>
        </div>

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
            <AppButton onClick={handleCancelClick} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};
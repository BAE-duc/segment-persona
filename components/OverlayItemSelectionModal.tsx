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

// 年齢を年齢帯に変換する関数
const getAgeBin = (val: number): string => {
  if (val <= 19) return '19歳以下';
  if (val >= 60) return '60歳以上';
  const lower = Math.floor(val / 5) * 5;
  return `${lower}-${lower + 4}歳`;
};

// チェックボックスコンポーネント
const CustomCheckbox = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <div className="flex items-center justify-center">
    <label className="relative flex items-center justify-center w-4 h-4 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center transition-colors bg-white">
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

    // 各変数の選択肢を抽出
    const choices: { [key: string]: { id: string; name: string }[] } = {};
    const categoricalVars: { id: string; name: string }[] = [];

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
        categoricalVars.push({ id: header, name: header });
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
    // 変数が変更されたら選択肢の選択をリセット
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

  const selectedVariableName = selectedVariableId ? variables.find(v => v.id === selectedVariableId)?.name : '項目を選択してください';

  return (
    <div className={modalStyles.overlay} aria-modal="true" role="dialog">
      <div className={`${modalStyles.container} max-w-4xl w-full`} style={{ height: '40rem' }}>
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>重ね合わせ項目設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        <div className={`${modalStyles.body.container} flex gap-4 overflow-hidden`}>
          {/* 左パネル: 変数一覧 */}
          <div className="w-1/3 flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">変数一覧</h3>
            <div className="flex items-center space-x-1 mb-2">
              <input type="text" className="flex-grow h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400" placeholder="検索..." />
              <button className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 rounded-md" aria-label="検索">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <div className="flex-grow border border-gray-400 bg-white rounded-md overflow-y-auto text-xs p-1 select-none">
              {variables.map(v => (
                <div key={v.id}
                  className={`p-1 cursor-pointer rounded-sm whitespace-nowrap overflow-hidden text-ellipsis ${modalStyles.interactive.listItem(selectedVariableId === v.id)}`}
                  onClick={() => handleVariableClick(v.id)}
                  title={v.name}>
                  {v.name}
                </div>
              ))}
            </div>
          </div>

          {/* 右パネル: 選択肢一覧（チェックボックス付き） */}
          <div className="w-2/3 flex flex-col">
            <div className="flex-grow flex flex-col border border-gray-400 rounded-md bg-white overflow-hidden">
              {/* ドロップダウン風ヘッダー */}
              <div className="flex-shrink-0 p-2 bg-gray-200 border-b border-gray-300 flex justify-between items-center font-semibold">
                <span>{selectedVariableName}</span>
                <span className="text-xs">▼</span>
              </div>
              {/* 選択肢リスト */}
              <div className="flex-grow overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {currentChoices.map(choice => (
                      <tr key={choice.id} className="hover:bg-gray-50">
                        <td className="p-1 border-b border-gray-200 w-10 text-center">
                          <CustomCheckbox
                            checked={selectedChoiceIds.has(choice.id)}
                            onChange={() => handleChoiceToggle(choice.id)}
                          />
                        </td>
                        <td className="p-1 border-b border-gray-200 pl-2">{choice.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton onClick={handleConfirmClick} className="w-24 py-1">OK</AppButton>
            <AppButton onClick={handleCancelClick} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};
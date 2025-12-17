import React, { useState, useMemo } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import { TEST_CSV_RAW } from '../data/testData';

// 明確にするために型を定義します

export interface AxisSelection {
  variableId: string;
  variableName: string;
  choiceId: string;
  choiceName: string;
}

interface PositioningAxisModalProps {
  onClose: () => void;
  onConfirm: (axes: { vertical: AxisSelection | null; horizontal: AxisSelection | null }) => void;
  onShowWarning: (message: string) => void;
  initialAxes?: { vertical: AxisSelection | null; horizontal: AxisSelection | null };
}

// 年齢を年齢帯に変換する関数
const getAgeBin = (val: number): string => {
  if (val <= 19) return '19歳以下';
  if (val >= 60) return '60歳以上';
  const lower = Math.floor(val / 5) * 5;
  return `${lower}-${lower + 4}歳`;
};

export const PositioningAxisModal: React.FC<PositioningAxisModalProps> = ({ onClose, onConfirm, onShowWarning, initialAxes }) => {
  // TEST_CSV_RAWからデータを動的に抽出
  const { variables, choicesData } = useMemo(() => {
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // IDを除く全てのカラムを変数として追加
    const vars = headers
      .filter(h => h !== 'ID')
      .map(h => ({ id: h, name: h }));

    // 各変数のカテゴリを抽出
    const choices: { [key: string]: { id: string; name: string }[] } = {};

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

      // 数値型かどうかを判定
      const isNumeric = allValues.length > 0 && allValues.every(v => !isNaN(Number(v)));

      if (isNumeric) {
        // 数値型の場合は変数名自体をカテゴリとして追加
        choices[header] = [{ id: `${header}_self`, name: header }];
      } else {
        // カテゴリ型の場合は通常通りカテゴリを追加
        choices[header] = Array.from(uniqueValues).map((val, idx) => ({ id: `${header}_${idx}`, name: val }));
      }
    });

    return { variables: vars, choicesData: choices };
  }, []);

  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const [verticalAxis, setVerticalAxis] = useState<AxisSelection | null>(initialAxes?.vertical || null);
  const [horizontalAxis, setHorizontalAxis] = useState<AxisSelection | null>(initialAxes?.horizontal || null);

  const handleVariableClick = (id: string) => {
    setSelectedVariableId(id);
    setSelectedChoiceId(null); // 変数が変更されたらカテゴリの選択をリセット

  };

  const handleAddAxis = (axis: 'vertical' | 'horizontal') => {
    if (!selectedVariableId || !selectedChoiceId) return;

    const variable = variables.find(v => v.id === selectedVariableId);
    const choice = choicesData[selectedVariableId]?.find(c => c.id === selectedChoiceId);

    if (variable && choice) {
      const selection: AxisSelection = {
        variableId: variable.id,
        variableName: variable.name,
        choiceId: choice.id,
        choiceName: choice.name,
      };
      if (axis === 'vertical') {
        setVerticalAxis(selection);
      } else {
        setHorizontalAxis(selection);
      }
    }
  };

  const handleConfirmClick = () => {
    if (!verticalAxis || !horizontalAxis) {
      let message = '';
      if (!verticalAxis && !horizontalAxis) {
        message = '縦軸と横軸が設定されていません。';
      } else if (!verticalAxis) {
        message = '縦軸が設定されていません。';
      } else {
        message = '横軸が設定されていません。';
      }
      onShowWarning(message);
      return;
    }
    onConfirm({ vertical: verticalAxis, horizontal: horizontalAxis });
  };

  const handleCancelClick = () => {
    // モーダルを閉じます。

    onClose();
  };

  const currentChoices = selectedVariableId ? choicesData[selectedVariableId] || [] : [];

  // 現在選択されているカテゴリが既にいずれかの軸で使用されているかを確認します。
  // Check if the currently selected choice is already used in either axis.
  const isChoiceAlreadyUsed =
    (verticalAxis?.variableId === selectedVariableId && verticalAxis?.choiceId === selectedChoiceId) ||
    (horizontalAxis?.variableId === selectedVariableId && horizontalAxis?.choiceId === selectedChoiceId);

  // カテゴリが選択されていない場合、または既に使われている場合は追加ボタンを無効にします。
  // Disable the add buttons if no choice is selected OR if the selected choice is already used.
  const isAddButtonDisabled = !selectedChoiceId || isChoiceAlreadyUsed;

  const selectedVariableName = selectedVariableId ? variables.find(v => v.id === selectedVariableId)?.name : '項目を選択してください';

  return (
    <div className={modalStyles.overlay} aria-modal="true" role="dialog">
      <div className={`${modalStyles.container} max-w-4xl w-full`} style={{ height: '40rem' }}>
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>ポジショニングマップの軸設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        <div className={`${modalStyles.body.container} flex flex-col gap-4 overflow-hidden`}>
          {/* 上部パネル */}

          <div className="flex-grow flex gap-4 min-h-0">
            {/* 左パネル: アイテム一覧 */}

            <div className="w-1/3 flex flex-col">
              <h3 className="font-semibold text-xs mb-1 text-[#586365]">アイテム一覧</h3>
              <div className="flex items-center space-x-1 mb-2">
                <input type="text" className="flex-grow h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400" placeholder="検索..." />
                <button className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700 font-semibold rounded-md" aria-label="アイテム一覧 オプション">
                  ↓
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

            {/* 右パネル: カテゴリ一覧 */}

            <div className="w-2/3 flex flex-col">
              <div className="flex-grow flex flex-col border border-gray-400 rounded-md bg-white overflow-hidden">
                {/* ドロップダウン風ヘッダー */}

                <div className="flex-shrink-0 p-2 bg-gray-200 border-b border-gray-300 flex justify-between items-center font-semibold">
                  <span>{selectedVariableName}</span>
                </div>
                {/* カテゴリリスト */}

                <div className="flex-grow overflow-y-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {currentChoices.map(choice => (
                        <tr key={choice.id}
                          className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedChoiceId === choice.id)}`}
                          onClick={() => setSelectedChoiceId(choice.id)}>
                          <td className="p-1 border-b border-gray-200 pl-2">{choice.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* アクションボタン */}

                <div className="flex-shrink-0 p-2 flex justify-end gap-2 bg-gray-50 border-t border-gray-300">
                  <AppButton onClick={() => handleAddAxis('vertical')} className="py-1 px-3 text-xs" disabled={isAddButtonDisabled}>縦軸追加</AppButton>
                  <AppButton onClick={() => handleAddAxis('horizontal')} className="py-1 px-3 text-xs" disabled={isAddButtonDisabled}>横軸追加</AppButton>
                </div>
              </div>
            </div>
          </div>

          {/* 下部パネル: 選択結果表示 */}

          <div className="flex-shrink-0 flex gap-4">
            {/* 左パネルの幅に合わせるためのスペーサー */}

            <div className="w-1/3" />
            <div className="w-2/3">
              <div className="border border-gray-400 bg-white rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="bg-gray-50">
                      <td className="font-semibold p-1 border-b border-r border-gray-200 w-20 text-center">縦軸</td>
                      <td className="p-1 border-b border-r border-gray-200 w-48 pl-2">{verticalAxis?.variableName || ''}</td>
                      <td className="p-1 border-b border-gray-200 pl-2">{verticalAxis?.choiceName || ''}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold p-1 border-r border-gray-200 w-20 text-center">横軸</td>
                      <td className="p-1 border-r border-gray-200 w-48 pl-2">{horizontalAxis?.variableName || ''}</td>
                      <td className="p-1 pl-2">{horizontalAxis?.choiceName || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirmClick}
              className="w-24 py-1"
              isActive={!!verticalAxis && !!horizontalAxis}
              disabled={!verticalAxis || !horizontalAxis}
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
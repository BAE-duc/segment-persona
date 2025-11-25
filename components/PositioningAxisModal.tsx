import React, { useState } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';

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

// モーダルの静的データ

const variables = [
  { id: 'car_image', name: '車イメージ' },
];

const choicesData: { [key: string]: { id: string; name: string }[] } = {
  car_image: [
    { id: 'tokaiteki', name: '都会的な' },
    { id: 'kokyuna', name: '高級な' },
    { id: 'senshinteki', name: '先進的な' },
    { id: 'koseiteki', name: '個性的な' },
    { id: '60dai', name: '60代以上' },
    { id: 'wakawakashii', name: '若々しい' },
    { id: 'sporty', name: 'スポーティな' },
  ],

};

export const PositioningAxisModal: React.FC<PositioningAxisModalProps> = ({ onClose, onConfirm, onShowWarning, initialAxes }) => {
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const [verticalAxis, setVerticalAxis] = useState<AxisSelection | null>(initialAxes?.vertical || null);
  const [horizontalAxis, setHorizontalAxis] = useState<AxisSelection | null>(initialAxes?.horizontal || null);

  const handleVariableClick = (id: string) => {
    setSelectedVariableId(id);
    setSelectedChoiceId(null); // 変数が変更されたら選択肢の選択をリセット

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

  // 現在選択されている選択肢が既にいずれかの軸で使用されているかを確認します。
  // Check if the currently selected choice is already used in either axis.
  const isChoiceAlreadyUsed =
    (verticalAxis?.variableId === selectedVariableId && verticalAxis?.choiceId === selectedChoiceId) ||
    (horizontalAxis?.variableId === selectedVariableId && horizontalAxis?.choiceId === selectedChoiceId);

  // 選択肢が選択されていない場合、または既に使われている場合は追加ボタンを無効にします。
  // Disable the add buttons if no choice is selected OR if the selected choice is already used.
  const isAddButtonDisabled = !selectedChoiceId || isChoiceAlreadyUsed;

  const selectedVariableName = selectedVariableId ? variables.find(v => v.id === selectedVariableId)?.name : '項目を選択してください';

  return (
    <div className={modalStyles.overlay} aria-modal="true" role="dialog">
      <div className={`${modalStyles.container} max-w-4xl w-full`} style={{ height: '40rem' }}>
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>ポジショニング軸の設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        <div className={`${modalStyles.body.container} flex flex-col gap-4 overflow-hidden`}>
          {/* 上部パネル */}

          <div className="flex-grow flex gap-4 min-h-0">
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

            {/* 右パネル: 選択肢一覧 */}

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
            <AppButton onClick={handleConfirmClick} className="w-24 py-1">OK</AppButton>
            <AppButton onClick={handleCancelClick} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import { TEST_CSV_RAW } from '../data/testData';
import { itemListData } from './shared/FilterEditModal';

// Caret アイコンコンポーネント
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
  // TEST_CSV_RAWからTESTカテゴリのデータのみを抽出（数値型を除外）
  // これはカテゴリ選択用のデータ
  const { testVariables, choicesData } = useMemo(() => {
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // 対象項目のみをフィルタリング
    const targetColumns = ['sex', 'child', 'age', 'year', '車イメージ', '保有車_メーカー', '保有車_カテゴリ', '保有車_車名', 'test_SEG'];

    // 各変数のカテゴリを抽出
    const choices: { [key: string]: { id: string; name: string }[] } = {};
    const vars: { id: string; name: string }[] = [];

    headers.forEach((header, colIndex) => {
      if (header === 'ID' || !targetColumns.includes(header)) return;

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

      // 数値型は除外
      if (!isNumeric) {
        vars.push({ id: header, name: header });
        // カテゴリ型の場合は通常通りカテゴリを追加
        const sortedValues = Array.from(uniqueValues).sort();
        choices[header] = sortedValues.map((val, idx) => ({ id: `${header}_${idx}`, name: val }));
      }
    });

    return { testVariables: vars, choicesData: choices };
  }, []);

  // TESTノードのchildrenを動的に生成
  const testChildren = useMemo(() => {
    return testVariables.map(v => ({
      id: v.id,
      name: v.name,
      children: []
    }));
  }, [testVariables]);

  // ツリービューの展開状態を管理
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({
    'surveyData': false,
    'test': false
  });

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

    const variable = testVariables.find(v => v.id === selectedVariableId);
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

  // ツリーノードを再帰的にレンダリング
  const renderTreeNode = (node: any, depth: number = 0): React.ReactNode => {
    // TESTノードの場合は動的に生成したchildrenを使用
    const nodeChildren = node.id === 'test' ? testChildren : (node.children || []);
    const hasChildren = nodeChildren && nodeChildren.length > 0;
    const isExpanded = !!expandedState[node.id];
    
    // TESTカテゴリの変数かどうか判定
    const isTestVariable = testVariables.some(v => v.id === node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center cursor-pointer p-1 rounded-sm ${
            isTestVariable ? modalStyles.interactive.listItem(selectedVariableId === node.id) : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              setExpandedState(prev => ({ ...prev, [node.id]: !prev[node.id] }));
            } else if (isTestVariable) {
              handleVariableClick(node.id);
            }
          }}
          title={node.name}
        >
          {hasChildren && <TreeCaret expanded={isExpanded} />}
          {!hasChildren && <div className="w-4 mr-1"></div>} {/* Placeholder for alignment */}
          <span className={hasChildren ? "font-semibold" : ""}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="pl-4">
            {nodeChildren.map((child: any) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const currentChoices = selectedVariableId ? choicesData[selectedVariableId] || [] : [];
  
  // 選択された変数がTESTカテゴリに属しているかチェック
  const isTestVariable = selectedVariableId ? testVariables.some(v => v.id === selectedVariableId) : false;

  // 現在選択されているカテゴリが既にいずれかの軸で使用されているかを確認します。
  // Check if the currently selected choice is already used in either axis.
  const isChoiceAlreadyUsed =
    (verticalAxis?.variableId === selectedVariableId && verticalAxis?.choiceId === selectedChoiceId) ||
    (horizontalAxis?.variableId === selectedVariableId && horizontalAxis?.choiceId === selectedChoiceId);

  // カテゴリが選択されていない場合、または既に使われている場合は追加ボタンを無効にします。
  // Disable the add buttons if no choice is selected OR if the selected choice is already used.
  const isAddButtonDisabled = !selectedChoiceId || isChoiceAlreadyUsed;

  const selectedVariableName = selectedVariableId || '項目を選択してください';

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
                {/* 調査データとその全ての子ノードを表示 */}
                {Object.entries(itemListData).map(([key, topLevelItem]: [string, any]) => (
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
                        {topLevelItem.children.map((child: any) => renderTreeNode(child, 1))}
                      </div>
                    )}
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
                  {isTestVariable ? (
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">
                      {selectedVariableId ? 'カテゴリデータがありません' : '左側からアイテムを選択してください'}
                    </div>
                  )}
                </div>
                {/* アクションボタン */}

                <div className="flex-shrink-0 p-2 flex justify-end gap-2 bg-gray-50 border-t border-gray-300">
                  <AppButton onClick={() => handleAddAxis('vertical')} className="py-1 px-3 text-xs" disabled={isAddButtonDisabled || !isTestVariable}>縦軸に設定</AppButton>
                  <AppButton onClick={() => handleAddAxis('horizontal')} className="py-1 px-3 text-xs" disabled={isAddButtonDisabled || !isTestVariable}>横軸に設定</AppButton>
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
import React, { useState, useMemo } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import { TEST_CSV_RAW } from '../data/testData';
import { itemListData } from './shared/FilterEditModal';

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

export const OverlayItemSelectionModal: React.FC<OverlayItemSelectionModalProps> = ({ onClose, onConfirm, initialSelection }) => {
  // TEST_CSV_RAWからTESTカテゴリのデータのみを抽出（数値型を除外）
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

    const variable = testVariables.find(v => v.id === selectedVariableId);
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
          {!hasChildren && <div className="w-4 mr-1"></div>}
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
            <div className="flex-grow border border-gray-400 bg-white rounded-md overflow-y-auto text-xs p-1 select-none">
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
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">カテゴリ一覧</h3>
            <div className="h-[28px] mb-2"></div>
            <div className="flex-grow border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col">
              <div className="flex-grow overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="p-1 font-semibold text-center border-b border-r border-gray-300 w-12">
                        採用
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
                className={`py-1 ${(selectedVariableId && currentChoices.length > 0) ? 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300' : ''}`}
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
              isActive={selectedChoiceIds.size > 0}
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
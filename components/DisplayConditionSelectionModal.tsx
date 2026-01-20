
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
// ItemDetail 型をインポートします。

import type { ItemDetail } from './ItemSelectionModal';
import { TEST_CSV_RAW } from '../data/testData';
import * as d3 from 'd3';
import { itemListData } from './shared/FilterEditModal';

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

// エクスポートして他のファイルで型を再利用できるようにします。

export interface SelectedChoice {
  id: number;
  content: string;
}

// SegmentVariableSelectionModal.tsx からインポートする代わりに、必要な型をここで定義します。

// Instead of importing from SegmentVariableSelectionModal.tsx, define the necessary types here.
export interface ConversionSettings {
  type: 'categorical' | 'numerical';
  categories?: string[];
  range?: { min: string; max: string };
}

export interface SelectedItem {
  id: string;
  name: string;
  type: string;
  choices: SelectedChoice[];
  somDataType?: string;
  conversionSetting?: string;
  conversionDetails?: ConversionSettings;
}
export type SelectedItemsMap = Record<string, SelectedItem>;


interface DisplayConditionSelectionModalProps {
  onClose: () => void;
  onConfirm: (
    adoptedVariableIds: Set<string>,
    adoptedVariableNames: string[],
    newRangeConfigs: Record<string, { min: number; max: number }>,
    newCategoryConfigs: Record<string, string[]>,
    selectedSegments: number[],
    intervalConfigs?: Record<string, number>
  ) => void;
  initialSelectedItems: SelectedItemsMap;
  segmentCount: number;
  // 全てのアイテムとカテゴリデータを受け取るように追加

  items: ItemDetail[];
  choicesData: { [key: string]: { id: number; content: string }[] };
  // rangeConfigsを追加

  rangeConfigs?: Record<string, { min: number; max: number }>;
  // 表示条件での一時的な上書き設定
  displayRangeConfigs?: Record<string, { min: number; max: number }>;
  displayCategoryConfigs?: Record<string, string[]>;
  displayAdoptedIds?: Set<string> | null;
  displaySelectedSegments?: number[] | null;
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

// 数値型ビュー用のスタイル付き入力コンポーネント
const StyledNumInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    type="text"
    {...props}
    className={`h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 ${props.className}`}
  />
);

/**
 * 数値の年齢範囲から該当する年齢カテゴリを計算
 * @param min 最小年齢
 * @param max 最大年齢
 * @returns 該当する年齢カテゴリの配列
 */
const mapAgeRangeToCategories = (min: number, max: number): string[] => {
  const categories: string[] = [];

  // 19歳以下 (1-19)
  if (min <= 19) {
    categories.push('19歳以下');
  }

  // 20-24歳, 25-29歳, ..., 55-59歳
  for (let lower = 20; lower <= 55; lower += 5) {
    const upper = lower + 4;
    // 範囲が重なっているかチェック
    if (max >= lower && min <= upper) {
      categories.push(`${lower}-${upper}歳`);
    }
  }

  // 60歳以上
  if (max >= 60) {
    categories.push('60歳以上');
  }

  return categories;
};

export const DisplayConditionSelectionModal: React.FC<DisplayConditionSelectionModalProps> = ({
  onClose,
  onConfirm,
  initialSelectedItems,
  segmentCount,
  items,
  choicesData,
  rangeConfigs,
  displayRangeConfigs,
  displayCategoryConfigs,
  displayAdoptedIds,
  displaySelectedSegments
}) => {
  // initialSelectedItems ではなく、items (全変数) から変数リストを生成します。

  const variables = useMemo(() =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.dataType,
    })),
    [items]
  );

  // 選択された変数、採用された変数、選択されたカテゴリの状態を管理します。

  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);

  // ツリービューの展開状態を管理
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  // 初期表示時、セグメントアイテム選択で選択した項目が選択された状態にします。
  // もし表示条件選択で以前に設定された値があれば（displayAdoptedIds）、それを優先します。

  const [adoptedVariables, setAdoptedVariables] = useState<Set<string>>(() => {
    if (displayAdoptedIds) {
      return new Set(displayAdoptedIds);
    }
    const initial = new Set<string>();
    // initialSelectedItemsに含まれるキー（ID）を採用済みとします。

    for (const varId in initialSelectedItems) {
      initial.add(varId);
    }
    return initial;
  });

  // 数値型の範囲設定の状態を管理します。

  const [selectedRanges, setSelectedRanges] = useState<Record<string, { min: string; max: string }>>(() => {
    const initial: Record<string, { min: string; max: string }> = {};

    items.forEach(item => {
      const itemId = item.id;
      let min = '';
      let max = '';

      // 優先順位 1: 表示条件での一時的な上書き設定
      if (displayRangeConfigs && displayRangeConfigs[itemId]) {
        min = String(displayRangeConfigs[itemId].min);
        max = String(displayRangeConfigs[itemId].max);
      }
      // 優先順位 2: サイドバーでの変換設定 (ユーザー設定)
      else if (item.conversionDetails?.type === 'numerical' && item.conversionDetails.range) {
        min = item.conversionDetails.range.min;
        max = item.conversionDetails.range.max;
      }
      // 優先順位 3: グローバルなデフォルト範囲 (CSV全データ範囲)
      else if (rangeConfigs && rangeConfigs[itemId]) {
        min = String(rangeConfigs[itemId].min);
        max = String(rangeConfigs[itemId].max);
      }

      if (min !== '' && max !== '') {
        initial[itemId] = { min, max };
      }
    });

    return initial;
  });

  // Range 입력エラーの状態
  const [rangeErrors, setRangeErrors] = useState<Record<string, { min?: string; max?: string }>>({});

  // 初期表示時、セグメントアイテム選択で選択したカテゴリが選択された状態にします。
  // 変換設定（カテゴリ型）がある場合は、その設定内容を反映させます。
  // 表示条件選択での上書き設定（displayCategoryConfigs）がある場合はそれを優先します。

  const [selectedChoices, setSelectedChoices] = useState<Record<string, Set<number>>>(() => {
    const initial: Record<string, Set<number>> = {};

    // 全てのアイテムについて初期化

    items.forEach(item => {
      const varId = item.id;
      const choices = choicesData[varId];
      if (!choices) return;

      // 優先順位 1: 表示条件での上書き設定
      if (displayCategoryConfigs && displayCategoryConfigs[varId]) {
        const categoryNames = new Set(displayCategoryConfigs[varId]);
        const filteredIds = choices
          .filter(c => categoryNames.has(c.content))
          .map(c => c.id);
        initial[varId] = new Set(filteredIds);
      }
      // 優先順位 2: サイドバーでの変換設定 (initialSelectedItemsに含まれる場合)
      else if (initialSelectedItems[varId] && initialSelectedItems[varId].conversionDetails?.type === 'categorical' && initialSelectedItems[varId].conversionDetails.categories) {
        const categorySet = new Set(initialSelectedItems[varId].conversionDetails!.categories);
        const filteredIds = choices
          .filter(c => categorySet.has(c.content))
          .map(c => c.id);
        initial[varId] = new Set(filteredIds);
      }
      // 優先順位 3: initialSelectedItemsに含まれるがカテゴリ設定がない
      else if (initialSelectedItems[varId]) {
        initial[varId] = new Set(choices.map(c => c.id));
      }
      // 優先順位 4: グローバル選択に含まれていない場合でも、デフォルトですべて選択しておく
      // (テーブルで選択可能にするため)
      else {
        initial[varId] = new Set(choices.map(c => c.id));
      }
    });

    return initial;
  });

  const segmentNumbers = Array.from({ length: segmentCount }, (_, i) => i + 1);

  // セグメントアイテム選択で選択された変数を取得 (locked items)
  const lockedVariables = useMemo(() => {
    return new Set(Object.keys(initialSelectedItems));
  }, [initialSelectedItems]);

  // セグメント選択の状態を管理します。初期状態ですべて選択にします。

  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(() => {
    if (displaySelectedSegments && displaySelectedSegments.length > 0) {
      return new Set(displaySelectedSegments);
    }
    return new Set(segmentNumbers);
  });

  // D3 ヒストグラム用
  const histogramRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 選択された変数の数値データを抽出
  const histData = useMemo(() => {
    const emptyData = { bins: [] as number[], min: 0, max: 0 };
    if (!selectedVariableId) return emptyData;
    const selectedItem = items.find(i => i.id === selectedVariableId);

    if (!selectedItem || selectedItem.conversionDetails?.type !== 'numerical') return emptyData;

    // TEST_CSV_RAWをパースして数値データを抽出
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const colIndex = headers.indexOf(selectedVariableId);

    if (colIndex === -1) return emptyData;

    const values: number[] = [];
    // 1行目(ヘッダ)を除く
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(v => v.trim());
      const valStr = row[colIndex];
      const val = Number(valStr);
      if (!isNaN(val) && valStr !== '' && valStr !== 'NA') {
        values.push(val);
      }
    }

    // データをビン分割 (簡易的)
    // グローバルな範囲設定を基準にする (グラフの形状を固定するため)
    // fallbackとしてデータの最小最大を使用
    const globalRange = rangeConfigs && rangeConfigs[selectedVariableId];
    const min = globalRange ? globalRange.min : (values.length ? Math.min(...values) : 0);
    const max = globalRange ? globalRange.max : (values.length ? Math.max(...values) : 0);

    // データがなく、デフォルト範囲もない場合は空データを返す
    if (values.length === 0 && !globalRange) return emptyData;

    const span = Math.max(1, max - min + 1);

    // ビン数は最大100程度に制限するか、範囲に合わせて調整
    const binCount = Math.min(span, 100);
    const bins = new Array(binCount).fill(0);
    const binSize = span / binCount;

    values.forEach(v => {
      const idx = Math.floor((v - min) / binSize);
      if (idx >= 0 && idx < binCount) {
        bins[idx]++;
      }
    });

    return { bins, min, max };
  }, [selectedVariableId, items, rangeConfigs]);


  const handleAdoptToggle = (variableId: string) => {
    setAdoptedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variableId)) {
        // 変数の採用を解除する場合
        // 変数の採用を解除する場合
        newSet.delete(variableId);
        // この変数の選択されたカテゴリをクリアします。
        // この変数の選択されたカテゴリをクリアします。
        setSelectedChoices(prevChoices => {
          const newChoices = { ...prevChoices };
          delete newChoices[variableId];
          return newChoices;
        });
      } else {
        // 変数を採用する場合
        // 変数を採用する場合
        newSet.add(variableId);
        // ユーザーの要求に応じて、変数を採用する際にその変数のカテゴリを表示し、すべてを選択します。

        setSelectedVariableId(variableId);

        // カテゴリ型の場合のみ全選択処理を行う
        const item = items.find(i => i.id === variableId);
        if (!item || item.conversionDetails?.type !== 'numerical') {
          const choices = choicesData[variableId] || [];
          const allChoiceIds = choices.map(c => c.id);
          setSelectedChoices(prevChoices => ({
            ...prevChoices,
            [variableId]: new Set(allChoiceIds),
          }));
        } else {
          // 数値型の場合、初期範囲を設定（未設定なら）
          if (!selectedRanges[variableId]) {
            const defMin = item.conversionDetails?.range?.min || '1';
            const defMax = item.conversionDetails?.range?.max || '100';
            setSelectedRanges(prev => ({
              ...prev,
              [variableId]: { min: defMin, max: defMax }
            }));
          }
        }
      }
      return newSet;
    });
  };

  // 変数リストの項目をクリックしたときのハンドラ。

  const handleVariableClick = (id: string) => {
    // 既に採用されている場合は解除、されていない場合は採用
    if (adoptedVariables.has(id)) {
      // 採用解除
      setAdoptedVariables(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      // カテゴリ選択もクリア
      setSelectedChoices(prev => {
        const newChoices = { ...prev };
        delete newChoices[id];
        return newChoices;
      });
      // 範囲選択もクリア
      setSelectedRanges(prev => {
        const newRanges = { ...prev };
        delete newRanges[id];
        return newRanges;
      });
      // 現在の選択をクリア
      if (selectedVariableId === id) {
        setSelectedVariableId(null);
      }
    } else {
      // 採用
      setAdoptedVariables(prev => new Set(prev).add(id));
      setSelectedVariableId(id);
    }
  };


  const handleChoiceToggle = (variableId: string, choiceId: number) => {
    const isAdding = !(selectedChoices[variableId]?.has(choiceId));

    // カテゴリを追加する際に、変数がまだ採用されていなければ自動で採用します。

    if (isAdding && !adoptedVariables.has(variableId)) {
      setAdoptedVariables(prev => new Set(prev).add(variableId));
    }

    setSelectedChoices(prev => {
      const newChoices = { ...prev };
      const choiceSet = new Set(newChoices[variableId] || []);
      if (isAdding) {
        choiceSet.add(choiceId);
      } else {
        choiceSet.delete(choiceId);
      }
      newChoices[variableId] = choiceSet;

      // カテゴリがなくなった場合、変数の採用を解除します。
      // If there are no more selected choices, un-adopt the variable.
      if (!isAdding && choiceSet.size === 0) {
        setAdoptedVariables(prevAdopted => {
          const newAdopted = new Set(prevAdopted);
          newAdopted.delete(variableId);
          return newAdopted;
        });
      }

      return newChoices;
    });
  };

  // 数値型の範囲変更ハンドラ

  const handleRangeChange = (variableId: string, type: 'min' | 'max', value: string) => {
    // 値が入力されたら変数を自動採用

    if (!adoptedVariables.has(variableId)) {
      setAdoptedVariables(prev => new Set(prev).add(variableId));
    }

    // 数値のみ許可
    if (!/^\d*$/.test(value)) return;

    // 範囲を更新
    const newRange = {
      ...selectedRanges[variableId] || { min: '', max: '' },
      [type]: value
    };
    
    setSelectedRanges(prev => ({
      ...prev,
      [variableId]: newRange
    }));
    
    // バリデーション
    validateRange(variableId, newRange.min, newRange.max);
  };
  
  // Range バリデーション関数
  const validateRange = (variableId: string, minStr: string, maxStr: string) => {
    const errors: { min?: string; max?: string } = {};
    
    // アイテム情報取得
    const item = items.find(i => i.id === variableId);
    if (!item) return;
    
    // 全体データ範囲取得（初期範囲）
    let globalMin: number | undefined;
    let globalMax: number | undefined;
    
    if (rangeConfigs && rangeConfigs[variableId]) {
      globalMin = rangeConfigs[variableId].min;
      globalMax = rangeConfigs[variableId].max;
    } else if (item.conversionDetails?.range) {
      globalMin = parseFloat(item.conversionDetails.range.min);
      globalMax = parseFloat(item.conversionDetails.range.max);
    }
    
    const min = minStr ? parseFloat(minStr) : undefined;
    const max = maxStr ? parseFloat(maxStr) : undefined;
    
    // 1. 空値チェック（両方入力されている場合のみ他の検証を行う）
    if (!minStr || !maxStr) {
      // 片方だけ入力されている場合
      if (minStr && !maxStr) {
        errors.max = '範囲選択 (MIN:' + (globalMin || '?') + ', MAX:' + (globalMax || '?') + ') 内の値を入力してください';
      } else if (!minStr && maxStr) {
        errors.min = '範囲選択 (MIN:' + (globalMin || '?') + ', MAX:' + (globalMax || '?') + ') 内の値を入力してください';
      }
      setRangeErrors(prev => ({
        ...prev,
        [variableId]: errors
      }));
      return;
    }
    
    // 2. MIN > MAX チェック
    if (min !== undefined && max !== undefined && min > max) {
      errors.min = 'MIN値はMAX値以下である必要があります';
      errors.max = 'MAX値はMIN値以上である必要があります';
    }
    
    // 3. 全体データ範囲チェック
    if (globalMin !== undefined && min !== undefined && min < globalMin) {
      errors.min = '範囲選択 (MIN:' + globalMin + ', MAX:' + (globalMax || '?') + ') 内の値を入力してください';
    }
    
    if (globalMax !== undefined && max !== undefined && max > globalMax) {
      errors.max = '範囲選択 (MIN:' + (globalMin || '?') + ', MAX:' + globalMax + ') 内の値を入力してください';
    }
    
    // 4. MIN = MAX チェック（警告のみ、エラーではない）
    // MIN = MAX は Interval=1 で有効なので許可
    
    // エラーを設定
    if (Object.keys(errors).length > 0) {
      setRangeErrors(prev => ({
        ...prev,
        [variableId]: errors
      }));
    } else {
      // エラーをクリア
      setRangeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variableId];
        return newErrors;
      });
    }
  };

  const handleSelectAllToggle = () => {
    if (!selectedVariableId) return;

    const choices = choicesData[selectedVariableId] || [];
    const allChoiceIds = choices.map(c => c.id);
    const selected = selectedChoices[selectedVariableId] || new Set();
    const allSelected = allChoiceIds.length > 0 && allChoiceIds.every(id => selected.has(id));

    if (allSelected) {
      // 全解除する場合、変数の採用も解除します。
      // When deselecting all, also un-adopt the variable.
      setAdoptedVariables(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedVariableId);
        return newSet;
      });
      setSelectedChoices(prev => {
        const newChoices = { ...prev };
        newChoices[selectedVariableId] = new Set();
        return newChoices;
      });
    } else {
      // 全選択する場合、変数を採用します。
      // When selecting all, adopt the variable.
      setAdoptedVariables(prev => new Set(prev).add(selectedVariableId));
      setSelectedChoices(prev => {
        const newChoices = { ...prev };
        newChoices[selectedVariableId] = new Set(allChoiceIds);
        return newChoices;
      });
    }
  };

  const handleSelectAllVariablesToggle = () => {
    const allVariableIds = variables.map(v => v.id);
    const allCurrentlySelected = allVariableIds.length > 0 && allVariableIds.every(id => adoptedVariables.has(id));

    if (allCurrentlySelected) {
      // 全解除
      // Deselect all
      setAdoptedVariables(new Set());
      setSelectedChoices({});
    } else {
      // 全選択
      // Select all
      setAdoptedVariables(new Set(allVariableIds));
      const newAllSelectedChoices: Record<string, Set<number>> = {};
      allVariableIds.forEach(varId => {
        const choices = choicesData[varId] || [];
        const allChoiceIds = choices.map(c => c.id);
        if (allChoiceIds.length > 0) {
          newAllSelectedChoices[varId] = new Set(allChoiceIds);
        }
      });
      setSelectedChoices(newAllSelectedChoices);
    }
  };

  const handleSegmentToggle = (segmentNumber: number) => {
    setSelectedSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentNumber)) {
        newSet.delete(segmentNumber);
      } else {
        newSet.add(segmentNumber);
      }
      return newSet;
    });
  };

  const handleSelectAllSegmentsToggle = () => {
    const allSelected = segmentNumbers.length > 0 && segmentNumbers.every(num => selectedSegments.has(num));
    if (allSelected) {
      setSelectedSegments(new Set());
    } else {
      setSelectedSegments(new Set(segmentNumbers));
    }
  };

  const handleConfirm = () => {
    // Range エラーチェック
    const hasRangeError = Object.keys(rangeErrors).length > 0;
    if (hasRangeError) {
      alert('範囲選択の値が正しくありません。エラーメッセージを確認してください。');
      return;
    }
    
    // 数値型変数で範囲が未入力の場合チェック
    const adoptedNumericVars = Array.from(adoptedVariables).filter(varId => {
      const item = items.find(i => i.id === varId);
      return item && item.dataType === 'int';
    });
    
    for (const varId of adoptedNumericVars) {
      const range = selectedRanges[varId];
      if (!range || !range.min || !range.max) {
        const item = items.find(i => i.id === varId);
        alert(`数値型変数「${item?.name || varId}」の範囲選択（MIN、MAX）を入力してください。`);
        return;
      }
    }
    
    const adoptedVariableNames = Array.from(adoptedVariables)
      .map((varId: string) => {
        const item = items.find(i => i.id === varId);
        return item ? item.name : null;
      })
      .filter((name): name is string => !!name);

    // 数値型の範囲設定も返す
    const rangesToReturn: Record<string, { min: number; max: number }> = {};
    for (const varId in selectedRanges) {
      const item = items.find(i => i.id === varId);
      if (item && item.dataType === 'int') {
        const r = selectedRanges[varId];
        if (r.min !== '' && r.max !== '') {
          rangesToReturn[varId] = { min: parseInt(r.min, 10), max: parseInt(r.max, 10) };
        }
      }
    }

    // カテゴリ型の選択設定を返す
    const categoriesToReturn: Record<string, string[]> = {};
    for (const varId in selectedChoices) {
      const item = items.find(i => i.id === varId);
      if (item) {
        const isNum = item.conversionDetails?.type === 'numerical';
        if (!isNum) {
          const choices = choicesData[varId];
          if (choices) {
            const selectedIds = selectedChoices[varId];
            if (selectedIds && selectedIds.size > 0) {
              const names = choices
                .filter(c => selectedIds.has(c.id))
                .map(c => c.content);
              categoriesToReturn[varId] = names;
            }
          }
        }
      }
    }

    // adoptedVariables (IDのSet) も返す
    onConfirm(adoptedVariables, adoptedVariableNames, rangesToReturn, categoriesToReturn, Array.from(selectedSegments).sort((a, b) => a - b), {});
  };

  const selectedVariableItem = selectedVariableId ? items.find(i => i.id === selectedVariableId) : null;
  const isNumerical = selectedVariableItem?.conversionDetails?.type === 'numerical';

  const currentChoices = selectedVariableId ? (choicesData[selectedVariableId] || []) : [];
  const allCurrentChoicesSelected = selectedVariableId ? (currentChoices.length > 0 && currentChoices.every(c => selectedChoices[selectedVariableId]?.has(c.id))) : false;
  const allSegmentsSelected = segmentNumbers.length > 0 && segmentNumbers.every(num => selectedSegments.has(num));

  // 範囲設定の表示用ラベル
  const rangeLabelMin = selectedVariableId && rangeConfigs && rangeConfigs[selectedVariableId]
    ? rangeConfigs[selectedVariableId].min
    : (selectedVariableItem?.conversionDetails?.range?.min || '未設定');

  const rangeLabelMax = selectedVariableId && rangeConfigs && rangeConfigs[selectedVariableId]
    ? rangeConfigs[selectedVariableId].max
    : (selectedVariableItem?.conversionDetails?.range?.max || '未設定');


  // ResizeObserver logic for D3 container
  useEffect(() => {
    if (!histogramRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    if (histogramRef.current.parentElement) {
      resizeObserver.observe(histogramRef.current.parentElement);
    }
    return () => resizeObserver.disconnect();
  }, [isNumerical]); // 数値型の時のみ監視

  // 最新の値を参照するためのRef
  const selectedRangesRef = useRef(selectedRanges);
  useEffect(() => {
    selectedRangesRef.current = selectedRanges;
  }, [selectedRanges]);

  // D3 Drawing Logic
  useEffect(() => {
    if (!isNumerical || !histogramRef.current || dimensions.width === 0 || dimensions.height === 0 || !selectedVariableId || histData.bins.length === 0) return;

    const svg = d3.select(histogramRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .attr("class", "chart-group");

    const globalMin = histData.min;
    const globalMax = histData.max;
    const displayData = histData.bins;

    const yDomainMax = Math.max(...displayData, 1) * 1.1;

    // ドメインを[Min, Max + 1]に拡張して、最後のビンまで表示できるようにする
    // The domain is extended to [Min, Max + 1] so that the last bin can be displayed.
    const x = d3.scaleLinear()
      .domain([globalMin, globalMax + 1])
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, yDomainMax])
      .range([chartHeight, 0]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(Math.min(10, displayData.length)).tickFormat(d3.format("d")));
    g.append("g")
      .call(d3.axisLeft(y).ticks(5));

    // Bars
    // 拡張されたドメインに合わせてバーの幅を計算
    const oneUnitWidth = Math.abs(x(globalMin + 1) - x(globalMin));
    const barWidth = Math.max(1, oneUnitWidth - 1);

    g.selectAll(".bar-rect")
      .data(displayData)
      .enter()
      .append("rect")
      .attr("class", "bar-rect")
      .attr("x", (d, i) => x(globalMin + i))
      .attr("y", d => y(d))
      .attr("width", barWidth)
      .attr("height", d => chartHeight - y(d))
      .attr("fill", "#e5e7eb")
      .attr("stroke", "#d1d5db");

    // Drag Handles (Initialization)
    const minLineGroup = g.append("g")
      .attr("class", "drag-min")
      .attr("cursor", "ew-resize");

    minLineGroup.append("line")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 2);
    minLineGroup.append("rect")
      .attr("x", -10)
      .attr("width", 20)
      .attr("height", chartHeight)
      .attr("fill", "transparent");

    const maxLineGroup = g.append("g")
      .attr("class", "drag-max")
      .attr("cursor", "ew-resize");

    maxLineGroup.append("line")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 2);
    maxLineGroup.append("rect")
      .attr("x", -10)
      .attr("width", 20)
      .attr("height", chartHeight)
      .attr("fill", "transparent");

    // Drag Behavior
    const dragMin = d3.drag<SVGGElement, unknown>()
      .on("drag", (event) => {
        if (!selectedVariableId) return;
        const currentMaxVal = parseInt(selectedRangesRef.current[selectedVariableId]?.max || String(globalMax), 10);
        let newVal = Math.round(x.invert(event.x));

        const maxLimit = isNaN(currentMaxVal) ? globalMax : currentMaxVal;
        newVal = Math.max(globalMin, Math.min(newVal, maxLimit));

        // 値が変更されたら変数を採用
        if (!adoptedVariables.has(selectedVariableId)) {
          setAdoptedVariables(prev => new Set(prev).add(selectedVariableId));
        }

        setSelectedRanges(prev => ({
          ...prev,
          [selectedVariableId]: {
            ...prev[selectedVariableId],
            min: String(newVal)
          }
        }));
      });

    const dragMax = d3.drag<SVGGElement, unknown>()
      .on("drag", (event) => {
        if (!selectedVariableId) return;
        const currentMinVal = parseInt(selectedRangesRef.current[selectedVariableId]?.min || String(globalMin), 10);

        // マックスハンドルの位置は (値 + 1) を指しているので、値を逆算するときは -1 する
        let rawVal = x.invert(event.x);
        let newVal = Math.round(rawVal) - 1;

        const minLimit = isNaN(currentMinVal) ? globalMin : currentMinVal;
        newVal = Math.max(minLimit, Math.min(newVal, globalMax));

        // 値が変更されたら変数を採用
        if (!adoptedVariables.has(selectedVariableId)) {
          setAdoptedVariables(prev => new Set(prev).add(selectedVariableId));
        }

        setSelectedRanges(prev => ({
          ...prev,
          [selectedVariableId]: {
            ...prev[selectedVariableId],
            max: String(newVal)
          }
        }));
      });

    minLineGroup.call(dragMin);
    maxLineGroup.call(dragMax);

  }, [isNumerical, dimensions, histData, selectedVariableId]); // Re-draw if variable changes or dimensions change

  // Visual Update (Coloring and Line Position)
  useEffect(() => {
    if (!isNumerical || !histogramRef.current || !selectedVariableId || histData.bins.length === 0) return;

    const svg = d3.select(histogramRef.current);
    const g = svg.select(".chart-group");
    if (g.empty()) return;

    const { width } = dimensions;
    const margin = { left: 40, right: 20 };
    const chartWidth = width - margin.left - margin.right;

    const globalMin = histData.min;
    const globalMax = histData.max;
    // ドメインを[Min, Max + 1]に設定
    const x = d3.scaleLinear()
      .domain([globalMin, globalMax + 1])
      .range([0, chartWidth]);

    const currentRange = selectedRanges[selectedVariableId] || { min: String(globalMin), max: String(globalMax) };
    const minVal = parseInt(currentRange.min, 10);
    const maxVal = parseInt(currentRange.max, 10);

    // ビンサイズ計算
    const binCount = histData.bins.length;
    const binSize = (globalMax - globalMin + 1) / binCount;

    // Bar colors
    g.selectAll(".bar-rect")
      .attr("fill", (d, i) => {
        // ビンの範囲が選択範囲に含まれているか判定
        // 簡易的にビンの中心値を使用
        const barCenter = globalMin + i * binSize + binSize / 2;
        return (barCenter >= minVal && barCenter <= maxVal + (binSize / 2)) ? "#93c5fd" : "#e5e7eb";
      })
      .attr("stroke", (d, i) => {
        const barCenter = globalMin + i * binSize + binSize / 2;
        return (barCenter >= minVal && barCenter <= maxVal + (binSize / 2)) ? "#60a5fa" : "#d1d5db";
      });

    // Line positions
    const safeMin = isNaN(minVal) ? globalMin : minVal;
    const safeMax = isNaN(maxVal) ? globalMax : maxVal;

    g.select(".drag-min").attr("transform", `translate(${x(safeMin)}, 0)`);
    // Maxラインは選択範囲の「終わり」を示すため、safeMax + 1 の位置に表示
    g.select(".drag-max").attr("transform", `translate(${x(safeMax + 1)}, 0)`);

  }, [selectedRanges, selectedVariableId, histData, dimensions, isNumerical]);

  // 再귀적 트리 렌더링 함수 (ItemSelectionModal과 동일한 구조)
  const renderTreeNode = (node: any, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedState[node.id];
    const isAdopted = adoptedVariables.has(node.id);
    const isSelected = selectedVariableId === node.id;
    const isLocked = lockedVariables.has(node.id); // セグメントアイテム選択で選択済み
    
    // Check if this node is an actual variable
    const isVariable = variables.find(v => v.id === node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center p-1 rounded-sm ${
            !hasChildren && isVariable 
              ? isLocked
                ? 'bg-gray-200 cursor-not-allowed opacity-60' // Locked: gray background
                : isAdopted 
                  ? 'bg-blue-200 hover:bg-blue-300 cursor-pointer' 
                  : modalStyles.interactive.listItem(isSelected) + ' cursor-pointer'
              : 'cursor-pointer'
          }`}
          onClick={() => {
            if (hasChildren) {
              setExpandedState(prev => ({ ...prev, [node.id]: !prev[node.id] }));
            } else if (isVariable && !isLocked) { // locked 아이템은 클릭 불가
              handleVariableClick(node.id);
            }
          }}
          title={isLocked ? `${node.name} (セグメントアイテム選択で選択済み)` : node.name}
        >
          {hasChildren && <TreeCaret expanded={isExpanded} />}
          {!hasChildren && <div className="w-4 mr-1"></div>}
          <span className={hasChildren ? "font-semibold" : ""}>{node.name}</span>
          {isLocked && <span className="ml-auto text-xs text-gray-500">🔒</span>}
        </div>
        {hasChildren && isExpanded && (
          <div className="pl-4">
            {node.children.map((child: any) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
          <h2 className={modalStyles.header.title}>集計表の表示条件設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* Body */}
        <div className={`${modalStyles.body.container} flex gap-4 overflow-hidden`}>
          {/* Left Panel: Variable List */}
          <div className="w-[280px] flex flex-col pr-4 border-r border-gray-300">
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
                      {topLevelItem.children.map((child: any) => renderTreeNode(child, 1))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2 flex-shrink-0 flex justify-end">
              <AppButton 
                onClick={handleSelectAllVariablesToggle} 
                className="py-1 bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300"
              >
                全選択/全解除
              </AppButton>
            </div>
          </div>

          {/* Middle Panel: Choices or Range Input */}
          <div className="w-[320px] flex flex-col pr-4 border-r border-gray-300">
            <h3 className="font-semibold text-xs mb-2 text-[#586365]">
              {isNumerical ? '値範囲設定' : 'カテゴリ一覧'}
            </h3>

            {isNumerical ? (
              // 数値型の場合の範囲設定UI (簡素化版)
              <div className="flex-grow border border-gray-400 bg-white overflow-hidden flex flex-col rounded-md p-4 gap-4">
                {selectedVariableId && lockedVariables.has(selectedVariableId) ? (
                  // Locked: 範囲は表示のみ
                  <div className="text-center text-gray-500 text-sm">
                    🔒 セグメントアイテム選択で選択済み<br/>
                    MIN: {selectedRanges[selectedVariableId]?.min || rangeLabelMin}<br/>
                    MAX: {selectedRanges[selectedVariableId]?.max || rangeLabelMax}
                  </div>
                ) : (
                  // 範囲選択 (MIN, MAX)
                  <div>
                    <div className="mb-2 text-xs text-[#586365] font-semibold">
                      範囲選択 (MIN:{rangeLabelMin}, MAX:{rangeLabelMax})
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[#586365] w-12">MIN</label>
                          <StyledNumInput
                            value={selectedVariableId ? (selectedRanges[selectedVariableId]?.min || '') : ''}
                            onChange={(e) => selectedVariableId && handleRangeChange(selectedVariableId, 'min', e.target.value)}
                            placeholder="Min"
                            className={`flex-1 ${selectedVariableId && rangeErrors[selectedVariableId]?.min ? 'border-red-500 bg-red-50' : ''}`}
                          />
                          <span className="text-xs text-[#586365]">~</span>
                        </div>
                        {selectedVariableId && rangeErrors[selectedVariableId]?.min && (
                          <div className="text-xs text-red-500 ml-14">
                            {rangeErrors[selectedVariableId].min}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[#586365] w-12">MAX</label>
                          <StyledNumInput
                            value={selectedVariableId ? (selectedRanges[selectedVariableId]?.max || '') : ''}
                            onChange={(e) => selectedVariableId && handleRangeChange(selectedVariableId, 'max', e.target.value)}
                            placeholder="Max"
                            className={`flex-1 ${selectedVariableId && rangeErrors[selectedVariableId]?.max ? 'border-red-500 bg-red-50' : ''}`}
                          />
                        </div>
                        {selectedVariableId && rangeErrors[selectedVariableId]?.max && (
                          <div className="text-xs text-red-500 ml-14">
                            {rangeErrors[selectedVariableId].max}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // カテゴリ型またはその他の場合のカテゴリリスト
              <div className="flex-grow border border-gray-400 bg-white overflow-hidden flex flex-col rounded-md">
                {selectedVariableId && lockedVariables.has(selectedVariableId) ? (
                  // Locked: カテゴリは表示のみ
                  <div className="flex-grow overflow-y-auto p-4">
                    <div className="text-center text-gray-500 text-sm mb-4">
                      🔒 セグメントアイテム選択で選択済み
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold mb-2">選択済みカテゴリ:</div>
                      {currentChoices
                        .filter(c => selectedChoices[selectedVariableId]?.has(c.id))
                        .map(c => (
                          <div key={c.id} className="p-1 bg-gray-100 mb-1 rounded">
                            {c.id}: {c.content}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-1 font-bold text-center border-b border-r border-gray-300 w-12">
                              採用
                            </th>
                            <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2 w-20">No.</th>
                            <th className="p-1 font-bold text-left border-b border-gray-300 pl-2 flex items-center">
                              内容
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {currentChoices.map((c) => (
                            <tr key={c.id} className="font-medium even:bg-gray-50 hover:bg-gray-200">
                              <td className="p-1 border-b border-r border-gray-200 w-12 text-center">
                                <CustomCheckbox
                                  checked={selectedVariableId ? selectedChoices[selectedVariableId]?.has(c.id) ?? false : false}
                                  onChange={() => selectedVariableId && handleChoiceToggle(selectedVariableId, c.id)}
                                  disabled={!selectedVariableId}
                                />
                              </td>
                              <td className="p-1 border-b border-r border-gray-200 pl-2 w-20">{c.id}</td>
                              <td className="p-1 border-b border-gray-200 pl-2 whitespace-nowrap">{c.content}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="pt-2 flex-shrink-0 flex justify-end">
              {!isNumerical && (
                <AppButton 
                  onClick={handleSelectAllToggle} 
                  disabled={!selectedVariableId} 
                  className={`py-1 ${selectedVariableId ? 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300' : ''}`}
                >
                  全選択/全解除
                </AppButton>
              )}
            </div>
          </div>

          {/* Right Panel: Segment Selection */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">セグメント選択</h3>
            <div className="flex-grow border border-gray-400 bg-white overflow-hidden flex flex-col rounded-md mt-1">
              <div className="flex-shrink-0">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-1 font-bold text-center border-b border-r border-gray-300 w-12">
                        採用
                      </th>
                      <th className="p-1 font-bold text-left border-b border-gray-300 pl-2">
                        セグメント番号
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="flex-grow overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {segmentNumbers.map((num) => (
                      <tr key={num} className="font-medium even:bg-gray-50 hover:bg-gray-200">
                        <td className="p-1 border-b border-r border-gray-200 w-12 text-center">
                          <CustomCheckbox
                            checked={selectedSegments.has(num)}
                            onChange={() => handleSegmentToggle(num)}
                          />
                        </td>
                        <td className="p-1 border-b border-gray-200 pl-2 whitespace-nowrap">{num}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-2 flex-shrink-0 flex justify-end">
              <AppButton 
                onClick={handleSelectAllSegmentsToggle} 
                className="py-1 bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300"
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
              onClick={handleConfirm}
              className="w-24 py-1"
              isActive={adoptedVariables.size > 0 && selectedSegments.size > 0}
              disabled={!(adoptedVariables.size > 0 && selectedSegments.size > 0)}
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

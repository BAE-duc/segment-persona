
import React, { useState, useEffect, useMemo } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import type { DataItem } from './DataSelectionModal';
import type { SelectedItemsMap, SelectedItem } from './SegmentVariableSelectionModal';
import { DisplayConditionSelectionModal } from './DisplayConditionSelectionModal';
import { PositioningAxisModal, type AxisSelection } from './PositioningAxisModal';
import { OverlayItemSelectionModal, type OverlaySelection } from './OverlayItemSelectionModal';
import { FilterEditModal, type ConditionListItem } from './shared/FilterEditModal';
import type { ItemDetail } from './ItemSelectionModal';
import { HeatmapVariableModal } from './HeatmapVariableModal';
import { ComparisonTable, type ComparisonRow } from './ComparisonTable';
import { TEST_CSV_RAW } from '../data/testData';
import { PositioningMapGraph } from './PositioningMapGraph';
import somMapImage from '../data/sommap.png';
import heatmapImage from '../data/hitmap.png';


// 右パネルのタブボタンのラベルを定義します。

const rightPanelTabs = ['集計表', 'ポジショニングマップ', 'ヒートマップ'];

interface SegmentMainContentProps {
  isSegmentationExecuted: boolean;
  executionTrigger: number;
  selectedData: DataItem | null;
  selectedVariables: SelectedItemsMap;
  onShowWarningModal: (message: string) => void;
  itemDetails: ItemDetail[];
  choicesData: { [key: string]: { id: number; content: string }[] };
  isSegmentComparisonExecuted: boolean;
  setIsSegmentComparisonExecuted: (isExecuted: boolean) => void;
  isPositioningExecuted: boolean;
  setIsPositioningExecuted: (isExecuted: boolean) => void;
  isHeatmapExecuted: boolean;
  setIsHeatmapExecuted: (isExecuted: boolean) => void;
  onExportCommonFilter: () => void;
  // rangeConfigsを追加

  rangeConfigs?: Record<string, { min: number; max: number }>;
  customFilterConditions: ConditionListItem[];
  onOpenPersonaPopup?: () => void;
}

// ポジショニングタブの設定コンポーネントのPropsインターフェース

interface PositioningSettingsProps {
  onExecute: () => void;
  onOpenAxisModal: () => void;
  onOpenOverlayModal: () => void;
  verticalAxisDisplay: string;
  horizontalAxisDisplay: string;
  overlayItemDisplay: string;
  isExecuteDisabled: boolean;
}

// ポジショニングタブの設定コンポーネント

const PositioningSettings: React.FC<PositioningSettingsProps> = ({ onExecute, onOpenAxisModal, onOpenOverlayModal, verticalAxisDisplay, horizontalAxisDisplay, overlayItemDisplay, isExecuteDisabled }) => {
  // スタイル付きテキスト入力コンポーネント

  const StyledTextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type="text"
      readOnly
      {...props}
      // ボタンと同じ高さに設定します。

      className="h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 w-full"
    />
  );

  return (
    // flexboxを使用して、画像のように要素を配置します。

    <div className="flex items-start gap-2 w-full">
      {/* ポジショニング軸の設定 */}


      <div className="flex flex-col space-y-1">
        <AppButton className="w-52" onClick={onOpenAxisModal}>ポジショニングマップの軸設定</AppButton>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
          <label htmlFor="vertical-axis" className="text-xs font-medium text-[#586365] justify-self-end">縦軸</label>
          <StyledTextInput id="vertical-axis" value={verticalAxisDisplay} />
        </div>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
          <label htmlFor="horizontal-axis" className="text-xs font-medium text-[#586365] justify-self-end">横軸</label>
          <StyledTextInput id="horizontal-axis" value={horizontalAxisDisplay} />
        </div>
      </div>

      {/* 重ね合わせ項目設定 */}


      <div className="flex flex-col space-y-1">
        <AppButton className="w-44" onClick={onOpenOverlayModal}>重ね合わせ項目設定</AppButton>
        <textarea
          id="overlay-item"
          value={overlayItemDisplay}
          readOnly
          className="h-[64px] px-2 py-1 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 w-full resize-none overflow-y-auto"
        />
      </div>

      {/* 実行ボタン */}

      <div className="pt-0"> {/* ボタンを他のボタンと揃える */}
        <AppButton className="px-6 whitespace-nowrap" onClick={onExecute} disabled={isExecuteDisabled} isActive={!isExecuteDisabled}>実行</AppButton>
      </div>
    </div>
  );
};


// ヒートマップタブの設定コンポーネントのPropsインターフェース

interface HeatmapSettingsProps {
  onExecute: () => void;
  onOpenConditionsModal: () => void;
  onEditCondition: (index: number) => void;
  onDeleteCondition: (index: number) => void;
  variableDisplayTexts: string[];
  isExecuteDisabled: boolean;
}

// ヒートマップタブの設定コンポーネント

const HeatmapSettings: React.FC<HeatmapSettingsProps> = ({ onExecute, onOpenConditionsModal, onEditCondition, onDeleteCondition, variableDisplayTexts, isExecuteDisabled }) => {
  return (

    <div className="w-full flex flex-col gap-1 h-full">
      {/* 1行目：設定ボタンと実行ボタン */}

      <div className="flex items-center gap-2">
        <AppButton onClick={onOpenConditionsModal}>ヒートマップの表示条件追加</AppButton>
        <AppButton className="px-6 whitespace-nowrap" onClick={onExecute} disabled={isExecuteDisabled} isActive={!isExecuteDisabled}>実行</AppButton>
      </div>
      {/* 2行目：条件表示フィールド */}

      <div className="flex-grow min-h-0">
        <div className="w-full border border-gray-400 bg-white rounded-md text-gray-500 text-xs overflow-y-auto h-full">
          {variableDisplayTexts.length > 0 ? (
            variableDisplayTexts.map((text, index) => (
              <div key={index} className={`flex items-stretch ${index > 0 ? 'border-t border-gray-300' : ''}`}>
                {/* 条件表示領域 */}
                <div className="flex-1 px-2 py-1 border-r border-gray-300 min-h-[32px] flex items-center">
                  <span className="break-words">条件{index + 1}: {text}</span>
                </div>
                {/* ボタン表示領域 (固定サイズ) */}
                <div className="w-20 px-1 py-1 flex gap-1 items-center justify-center bg-gray-50">
                  <button
                    onClick={() => onEditCondition(index)}
                    className="px-1 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300 transition-colors whitespace-nowrap flex-shrink-0"
                    title="条件を編集"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => onDeleteCondition(index)}
                    className="px-1 py-0.5 text-[10px] bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors whitespace-nowrap flex-shrink-0"
                    title="条件を削除"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-2 py-1 text-gray-500 text-xs break-words">
              選択した内容が表示されます
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SegmentMainContent: React.FC<SegmentMainContentProps> = ({
  isSegmentationExecuted,
  executionTrigger,
  selectedData,
  selectedVariables,
  onShowWarningModal,
  itemDetails,
  choicesData,
  isSegmentComparisonExecuted,
  setIsSegmentComparisonExecuted,
  isPositioningExecuted,
  setIsPositioningExecuted,
  isHeatmapExecuted,
  setIsHeatmapExecuted,
  onExportCommonFilter,
  rangeConfigs,
  customFilterConditions,
  onOpenPersonaPopup
}) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isDisplayConditionModalOpen, setIsDisplayConditionModalOpen] = useState(false);

  // Manage the number of applied segments.
  const [segmentCount, setSegmentCount] = useState(5);

  // Manage the temporary segment count selected in the dropdown.
  const [tempSegmentCount, setTempSegmentCount] = useState(segmentCount);

  // SOMマップの選択状態を管理
  const [isSomMapSelected, setIsSomMapSelected] = useState(false);

  // 適用ボタンの活性化状態を管理
  const [isApplyButtonActive, setIsApplyButtonActive] = useState(false);


  // Positioning axis settings modal state
  const [isPositioningAxisModalOpen, setIsPositioningAxisModalOpen] = useState(false);
  const [positioningAxes, setPositioningAxes] = useState<{ vertical: AxisSelection | null; horizontal: AxisSelection | null }>({ vertical: null, horizontal: null });


  // Overlay item settings modal state
  const [isOverlayItemModalOpen, setIsOverlayItemModalOpen] = useState(false);
  const [overlaySelections, setOverlaySelections] = useState<OverlaySelection | null>(null);
  const [overlayItemDisplay, setOverlayItemDisplay] = useState('');


  // Heatmap condition setting modal state (最大4個まで)
  const [isHeatmapConditionsModalOpen, setIsHeatmapConditionsModalOpen] = useState(false);
  const [heatmapConditionsList, setHeatmapConditionsList] = useState<ConditionListItem[][]>([]);
  const [executedHeatmapConditionsList, setExecutedHeatmapConditionsList] = useState<ConditionListItem[][]>([]);
  const [editingConditionIndex, setEditingConditionIndex] = useState<number | null>(null);


  // Manage whether the heatmap execute button is enabled (pending changes). Initial value is true (enabled).
  const [heatmapPending, setHeatmapPending] = useState(true);

  const [segmentComparisonConditions, setSegmentComparisonConditions] = useState<string[]>([]);

  // 集計表の表示モード
  type TableDisplayMode = 'percentage' | 'difference' | 'count';
  const [tableDisplayMode, setTableDisplayMode] = useState<TableDisplayMode>('percentage');


  const [displayRangeConfigs, setDisplayRangeConfigs] = useState<Record<string, { min: number; max: number }>>({});



  const [displayCategoryConfigs, setDisplayCategoryConfigs] = useState<Record<string, string[]>>({});



  const [displayAdoptedVariableIds, setDisplayAdoptedVariableIds] = useState<Set<string> | null>(null);
  const [displaySelectedSegments, setDisplaySelectedSegments] = useState<number[] | null>(null);

  const [pendingRangeConfigs, setPendingRangeConfigs] = useState<Record<string, { min: number; max: number }>>({});
  const [pendingCategoryConfigs, setPendingCategoryConfigs] = useState<Record<string, string[]>>({});
  const [pendingAdoptedVariableIds, setPendingAdoptedVariableIds] = useState<Set<string> | null>(null);
  const [pendingSelectedSegments, setPendingSelectedSegments] = useState<number[] | null>(null);

  // 変更が保留中かどうか（実行ボタンの活性化に使用）
  const [hasPendingChanges, setHasPendingChanges] = useState(false);


  // セグメント比較用データ

  const [comparisonData, setComparisonData] = useState<{ rows: ComparisonRow[], segmentSizes: number[] } | null>(null);
  const [segmentedRows, setSegmentedRows] = useState<any[]>([]);

  // ポジショニングマップ実行時のスナップショット
  const [executedPositioningAxes, setExecutedPositioningAxes] = useState<{ vertical: AxisSelection | null; horizontal: AxisSelection | null }>({ vertical: null, horizontal: null });
  const [executedOverlaySelection, setExecutedOverlaySelection] = useState<OverlaySelection | null>(null);


  // 年齢の区分けロジック

  const getAgeBin = (ageStr: string): string => {
    if (!ageStr || ageStr === 'NA' || ageStr === '') return 'NA';
    const age = parseInt(ageStr, 10);
    if (isNaN(age)) return 'NA';

    if (age <= 19) return '19歳以下';
    if (age >= 60) return '60歳以上';

    // 20〜59歳は5歳刻み
    const lower = Math.floor(age / 5) * 5;
    return `${lower}-${lower + 4}歳`;
  };

  // 年齢ビンのソート用ヘルパー

  const getAgeSortOrder = (bin: string): number => {
    if (bin === '19歳以下') return 0;
    if (bin === '60歳以上') return 100;
    if (bin === 'NA') return 999;
    const match = bin.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 50;
  };

  // 実際のCSVデータから分析データを生成する関数
  // 選択された変数と条件に基づいてデータを生成します。

  // customRanges と customCategories 引数を追加して、表示条件での変更を反映できるようにします。
  const generateRealDataFromCSV = (
    count: number,
    currentVariables: SelectedItemsMap,
    customRanges: Record<string, { min: number; max: number }>,
    customCategories: Record<string, string[]>
  ) => {
    // CSVパース
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rowsRaw = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, i) => { record[h] = vals[i]; });
      return record;
    });

    // フィルタリング (変換設定に基づく)

    const activeVariables = Object.values(currentVariables).filter(item => item.conversionDetails);

    const filteredRows = rowsRaw.filter(row => {
      for (const item of activeVariables) {
        const rawValue = row[item.id];
        let settings = item.conversionDetails;

        // 表示条件選択で範囲が変更されている場合は、その設定を優先します
        if (customRanges[item.id]) {
          settings = {
            ...settings!,
            type: 'numerical',
            range: {
              min: String(customRanges[item.id].min),
              max: String(customRanges[item.id].max)
            }
          };
        }

        // 表示条件選択でカテゴリが変更されている場合は、その設定を優先します
        if (customCategories[item.id]) {
          settings = {
            ...settings!,
            type: 'categorical',
            categories: customCategories[item.id]
          };
        }

        if (!settings) continue;

        if (settings.type === 'numerical' && settings.range) {
          const val = Number(rawValue);
          if (isNaN(val) || rawValue === 'NA' || rawValue === '') {
            return false;
          } else {
            const min = parseFloat(settings.range.min);
            const max = parseFloat(settings.range.max);
            if (val < min || val > max) return false;
          }
        } else if (settings.type === 'categorical' && settings.categories) {
          let val = rawValue;
          if (!val || val === '') val = 'NA';

          // AGEの場合は値をビンに変換してから判定する
          if (item.id === 'age') {
            val = getAgeBin(val);
          }

          if (!settings.categories.includes(val)) {
            return false;
          }
        }
      }
      return true;
    });

    // ランダムなセグメント割り当て (1 ~ count)

    const rowsWithSegment = filteredRows.map(row => ({
      ...row,
      segmentId: Math.floor(Math.random() * count) + 1
    }));

    // セグメントサイズ計算

    const segmentSizes = new Array(count).fill(0);
    rowsWithSegment.forEach(r => {
      segmentSizes[r.segmentId - 1]++;
    });

    const totalSamples = rowsWithSegment.length;
    const resultRows: ComparisonRow[] = [];

    // 分析対象の変数定義 (選択された変数のみを対象とする)

    const analyzeTargets = Object.values(currentVariables).map(v => ({
      id: v.id,
      name: v.name,
      // 年齢のみ特殊なビン分割ロジックを適用、それ以外はカテゴリとして扱う
      type: v.id === 'age' ? 'age' : 'categorical'
    }));

    analyzeTargets.forEach(target => {
      // 全カテゴリの収集

      const choiceSet = new Set<string>();
      rowsWithSegment.forEach(r => {
        let val = r[target.id];
        // データに存在しない変数の場合はスキップ（念のため）
        if (val === undefined) return;

        if (target.type === 'age') {
          val = getAgeBin(val);
        } else {
          if (!val || val === '') val = 'NA';
        }
        choiceSet.add(val);
      });

      // カテゴリのソート

      let choices = Array.from(choiceSet);
      if (target.type === 'age') {
        choices.sort((a, b) => getAgeSortOrder(a) - getAgeSortOrder(b));
      } else {
        choices.sort();
        // NAを最後に
        if (choices.includes('NA')) {
          choices = choices.filter(c => c !== 'NA').concat(['NA']);
        }
      }

      // 各カテゴリについて集計

      choices.forEach((choiceName, idx) => {
        // 全体での比率

        const totalCount = rowsWithSegment.filter(r => {
          let val = r[target.id];
          if (target.type === 'age') val = getAgeBin(val);
          else if (!val || val === '') val = 'NA';
          return val === choiceName;
        }).length;

        const totalRatio = totalSamples > 0 ? (totalCount / totalSamples) * 100 : 0;

        // セグメントごとのカウントと比率
        const segCounts = segmentSizes.map((size, segIndex) => {
          const segId = segIndex + 1;
          return rowsWithSegment.filter(r => {
            if (r.segmentId !== segId) return false;
            let val = r[target.id];
            if (target.type === 'age') val = getAgeBin(val);
            else if (!val || val === '') val = 'NA';
            return val === choiceName;
          }).length;
        });

        const segmentRatios = segCounts.map((count, i) => {
          const size = segmentSizes[i];
          return size > 0 ? (count / size) * 100 : 0;
        });

        resultRows.push({
          variableId: target.id.toUpperCase(), // AGE -> AGE
          variableName: target.name,
          choiceId: String(idx + 1),
          choiceName: choiceName,
          totalRatio: totalRatio,
          segmentRatios: segmentRatios,
          totalCount: totalCount,
          segmentCounts: segCounts
        });
      });
    });

    return { rows: resultRows, segmentSizes, rowsWithSegment };
  };


  // isSegmentationExecutedがtrueになったときにセグメント比較タブを自動的にアクティブにし、グラフを表示するeffect。

  useEffect(() => {
    if (isSegmentationExecuted) {
      setActiveTab('セグメント比較');
      setIsSegmentComparisonExecuted(true);
    }
  }, [isSegmentationExecuted, setIsSegmentComparisonExecuted]);

  // セグメントアイテム（グローバル設定）が変更されたら、ローカルの表示設定をリセットして同期する
  // セグメントアイテム（グローバル設定）が変更されたら、ローカルの表示設定をリセットして同期する
  useEffect(() => {
    // グローバル設定が変わったのでローカルの上書きをクリア
    setDisplayRangeConfigs({});
    setDisplayCategoryConfigs({});
    setDisplayAdoptedVariableIds(null);
    setDisplaySelectedSegments(null);

    setPendingRangeConfigs({});
    setPendingCategoryConfigs({});
    setPendingAdoptedVariableIds(null);
    setPendingSelectedSegments(null);

    setHasPendingChanges(false);

    // 条件テキストもリセット（初期状態は全選択なので）
    setSegmentComparisonConditions([]);
  }, [selectedVariables]);


  // セグメンテーションが再実行されたときに、表示条件のローカル設定をリセットするeffect。

  useEffect(() => {
    if (executionTrigger > 0) {
      // 集計表タブを選択
      setActiveTab('集計表');

      // 集計表の設定をリセット
      setDisplayRangeConfigs({});
      setDisplayCategoryConfigs({});
      setDisplayAdoptedVariableIds(null);
      setDisplaySelectedSegments(null);
      setPendingRangeConfigs({});
      setPendingCategoryConfigs({});
      setPendingAdoptedVariableIds(null);
      setPendingSelectedSegments(null);
      setSegmentComparisonConditions([]);
      setHasPendingChanges(false);
      setIsSegmentComparisonExecuted(true);

      // ポジショニングマップの設定をリセット
      setPositioningAxes({ vertical: null, horizontal: null });
      setOverlaySelections(null);
      setOverlayItemDisplay('');
      setIsPositioningExecuted(false);

      // ヒートマップの設定をリセット
      setHeatmapConditionsList([]);
      setIsHeatmapExecuted(false);
      setHeatmapPending(true);

      // SOMマップの選択状態をリセット
      setIsSomMapSelected(false);
    }
  }, [executionTrigger]);

  // セグメント比較が実行されたとき、またはセグメント数が変更されたときにデータを生成

  useEffect(() => {
    if (isSegmentComparisonExecuted) {
      // グラフ表示用にフィルタリングされた変数リストを作成

      let targetVariables: SelectedItemsMap = {};

      // 表示条件選択で変数が絞り込まれている（または追加されている）場合
      if (displayAdoptedVariableIds) {
        // グローバルの selectedVariables に依存せず、itemDetails から再構築する

        displayAdoptedVariableIds.forEach(id => {
          const detail = itemDetails.find(d => d.id === id);
          if (detail) {
            // selectedVariables にある場合はその設定を引き継ぎ、なければ itemDetails から作成

            const existing = selectedVariables[id];
            if (existing) {
              targetVariables[id] = existing;
            } else {
              // グローバル選択されていない変数をローカルで追加した場合

              targetVariables[id] = {
                id: detail.id,
                name: detail.name,
                type: detail.dataType,
                choices: choicesData[detail.id] || [],
                somDataType: detail.somDataType,
                conversionSetting: detail.conversionSetting,
                conversionDetails: detail.conversionDetails
              } as SelectedItem;
            }
          }
        });
      } else {
        // ローカル設定がない場合はグローバル設定を使用
        targetVariables = selectedVariables;
      }

      // 選択された変数と条件に基づいてデータを生成
      const result = generateRealDataFromCSV(segmentCount, targetVariables, displayRangeConfigs, displayCategoryConfigs);
      
      let filteredRows = result.rows;
      let filteredSegmentSizes = result.segmentSizes;

      if (displaySelectedSegments && displaySelectedSegments.length > 0) {
        // 各行의 데이터를 選択されたセグメント インデックスに従って フィルタリング
        filteredRows = result.rows.map(row => ({
          ...row,
          segmentRatios: displaySelectedSegments.map(segNum => row.segmentRatios[segNum - 1]),
          segmentCounts: row.segmentCounts ? displaySelectedSegments.map(segNum => row.segmentCounts![segNum - 1]) : undefined
        }));
        // セグメントサイズをフィルタリング
        filteredSegmentSizes = displaySelectedSegments.map(segNum => result.segmentSizes[segNum - 1]);
      }

      setComparisonData({ rows: filteredRows, segmentSizes: filteredSegmentSizes });
      setSegmentedRows(result.rowsWithSegment);
    }
  }, [isSegmentComparisonExecuted, segmentCount, selectedVariables, displayRangeConfigs, displayCategoryConfigs, displayAdoptedVariableIds, displaySelectedSegments, itemDetails, choicesData]);

  const handleTabClick = (buttonName: string) => {
    setActiveTab(buttonName);
  };

  // セグメント数の変更を監視して適用ボタンの状態を更新
  const handleSegmentCountChange = (value: number) => {
    setTempSegmentCount(value);
    setIsApplyButtonActive(value !== segmentCount);
  };

  // 「適用」ボタンがクリックされたときに、一時的なセグメント数を実際のセグメント数に適用します。
  // When the "Apply" button is clicked, apply the temporary segment count to the actual segment count.
  const handleApplySegmentCount = () => {
    setSegmentCount(tempSegmentCount);
    setIsApplyButtonActive(false); // 適用後にボタンを非活性化

    // セグメント実行ボタンと同じ初期化処理を実行
    // 集計表タブを選択
    setActiveTab('集計表');

    // 集計表の設定をリセット
    setDisplayRangeConfigs({});
    setDisplayCategoryConfigs({});
    setDisplayAdoptedVariableIds(null);
    setDisplaySelectedSegments(null);
    setPendingRangeConfigs({});
    setPendingCategoryConfigs({});
    setPendingAdoptedVariableIds(null);
    setPendingSelectedSegments(null);
    setSegmentComparisonConditions([]);
    setHasPendingChanges(false);
    setIsSegmentComparisonExecuted(true);

    // ポジショニングマップの設定をリセット
    setPositioningAxes({ vertical: null, horizontal: null });
    setOverlaySelections(null);
    setOverlayItemDisplay('');
    setIsPositioningExecuted(false);

    // ヒートマップの設定をリセット
    setHeatmapConditionsList([]);
    setIsHeatmapExecuted(false);
    setHeatmapPending(true);

    // SOMマップの選択状態をリセット
    setIsSomMapSelected(false);
  };

  // セグメント比較の実行ボタンハンドラ

  const handleExecuteSegmentComparison = () => {
    // 保留中の設定を適用設定に反映
    setDisplayRangeConfigs(pendingRangeConfigs);
    setDisplayCategoryConfigs(pendingCategoryConfigs);
    setDisplayAdoptedVariableIds(pendingAdoptedVariableIds);
    setDisplaySelectedSegments(pendingSelectedSegments);

    setIsSegmentComparisonExecuted(true);
    setHasPendingChanges(false);
  };

  const verticalAxisDisplay = positioningAxes.vertical
    ? `${positioningAxes.vertical.variableName} : ${positioningAxes.vertical.choiceName}`
    : '';
  const horizontalAxisDisplay = positioningAxes.horizontal
    ? `${positioningAxes.horizontal.variableName} : ${positioningAxes.horizontal.choiceName}`
    : '';

  const heatmapVariableTexts = heatmapConditionsList.map(conditions => {
    if (conditions.length === 0) return '';
    return conditions.map((c, idx) => {
      const condText = `${c.itemName}=${c.categoryName}`;
      if (idx < conditions.length - 1 && c.connector) {
        return `${condText} ${c.connector}`;
      }
      return condText;
    }).join(' ');
  });

  const segmentComparisonConditionsText = segmentComparisonConditions.length > 0
    ? segmentComparisonConditions.join('\n')
    : '選択した内容が表示されます';

  // 各タブの実行ボタンの無効化状態を計算します。

  const isPositioningExecuteDisabled = !positioningAxes.vertical || !positioningAxes.horizontal || overlayItemDisplay === '';
  // ヒートマップ実行ボタンは、条件が設定されており、変更事項があるときのみ有効
  const isHeatmapExecuteDisabled = heatmapConditionsList.length === 0 || !heatmapPending;


  return (
    <main
      className="flex-grow py-2 pr-2 pl-1 flex gap-2 bg-[#ECECEC]"
    >
      {/* 左パネル */}

      <div className="flex-1 flex flex-col">
        {isSegmentationExecuted ? (
          <>
            {/* 実行完了テキスト */}

            <div className="flex-shrink-0 h-[30px] flex items-center px-4">
              <span className="text-sm">実行完了</span>
            </div>

            <div className="flex-grow flex flex-col bg-white">
              {/* セグメント数設定 */}

              <div className="flex-shrink-0 p-4 border-b border-gray-300 flex items-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="segment-count" className="text-xs font-medium text-[#586365]">セグメント数</label>
                  <AppSelect
                    id="segment-count"
                    value={tempSegmentCount}
                    onChange={e => handleSegmentCountChange(Number(e.target.value))}
                    className="w-20"
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 3).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </AppSelect>
                  <AppButton 
                    className="px-6 whitespace-nowrap" 
                    onClick={handleApplySegmentCount}
                    disabled={!isApplyButtonActive}
                    isActive={isApplyButtonActive}
                  >
                    適用
                  </AppButton>
                </div>
              </div>

              {/* SOMMAP表示エリア */}

              <div
                id="sommap-area"
                className={`flex-grow flex items-center justify-center bg-white overflow-hidden cursor-pointer transition-all duration-200 ${
                  isSomMapSelected ? 'border-4 border-blue-500' : 'border-4 border-transparent'
                }`}
                onClick={() => setIsSomMapSelected(!isSomMapSelected)}
              >
                <img src={somMapImage} alt="SOM Map" className="max-w-full max-h-full object-contain" />
              </div>

              {/* 下部コントロールエリア */}

              <div className="flex-shrink-0 p-2 border-t border-gray-300">
                {/* ボタン */}
                {/* ボタン */}
                <div className="flex gap-2">
                  <AppButton
                    className="w-full"
                    onClick={onOpenPersonaPopup}
                    disabled={!isSomMapSelected}
                    isActive={isSomMapSelected}
                  >
                    ペルソナ確認
                  </AppButton>
                  <AppButton
                    className="w-full"
                    onClick={onExportCommonFilter}
                    disabled={!isSomMapSelected}
                    isActive={isSomMapSelected}
                  >
                    共通フィルターに出力
                  </AppButton>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-white text-center">
            {!selectedData ? (
              <span className="text-gray-500 text-sm">データを選択してください</span>
            ) : Object.keys(selectedVariables).length === 0 ? (
              <span className="text-gray-500 text-sm">セグメントアイテムを選択してください</span>
            ) : (
              <span className="text-gray-500 text-sm whitespace-pre-line">
                {'セグメント設定確認後\n「セグメンテーション実行」ボタンを押してください'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右パネル */}

      <div className="flex-1 flex flex-col">
        {isSegmentationExecuted ? (
          <div className="bg-white flex flex-col flex-grow overflow-hidden">
            <div className="relative flex flex-shrink-0">
              {rightPanelTabs.map((label) => (
                <button
                  key={label}
                  onClick={() => handleTabClick(label)}
                  className={`flex-1 relative z-10 py-2 px-0.5 text-xs font-medium text-center focus:outline-none transition-colors duration-150 ${activeTab === label
                    ? 'text-[#586365] border-b-2 border-[#586365]'
                    : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  {label}
                </button>
              ))}
              <div className="absolute bottom-0 left-[2px] right-[2px] h-px bg-gray-200 z-0"></div>
            </div>

            <div className="p-4 flex-grow flex flex-col overflow-y-auto">
              {activeTab ? (
                <div className="-m-4 flex-grow flex flex-col">
                  {/* 高さ設定：全タブ共通 h-[120px] に変更し、パディングを調整 */}
                  <div className="flex-shrink-0 py-2 px-4 border-b border-gray-300 flex items-start h-[120px]">
                    {activeTab === '集計表' && (
                      // gap-2 -> gap-1
                      <div className="flex flex-col gap-1 w-full h-full">
                        <div className="flex items-center gap-2">
                          <AppButton onClick={() => setIsDisplayConditionModalOpen(true)}>
                            集計表の表示条件設定
                          </AppButton>
                          <AppButton
                            className="px-6 whitespace-nowrap"
                            onClick={handleExecuteSegmentComparison}
                            disabled={segmentComparisonConditions.length === 0}
                            isActive={segmentComparisonConditions.length > 0}
                          >
                            実行
                          </AppButton>
                          <AppButton
                            className="px-6 whitespace-nowrap ml-auto"
                            onClick={() => {
                              // TODO: 横縦変換の機能をここに実装する
                            }}
                          >
                            横縦変換
                          </AppButton>
                          <AppButton
                            className="px-6 whitespace-nowrap"
                            onClick={() => {
                              setTableDisplayMode(prev => {
                                if (prev === 'percentage') return 'difference';
                                if (prev === 'difference') return 'count';
                                return 'percentage';
                              });
                            }}
                          >
                            {tableDisplayMode === 'percentage' ? '差分表示' : 
                             tableDisplayMode === 'difference' ? 'n数表示' : '%表示'}
                          </AppButton>
                        </div>
                        <div className="flex-grow min-h-0">
                          <div className="w-full border border-gray-400 bg-white rounded-md px-2 py-1 text-gray-500 text-xs overflow-y-auto break-words h-full whitespace-pre-wrap">
                            {segmentComparisonConditionsText}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'ポジショニングマップ' && (
                      <PositioningSettings
                        onExecute={() => {
                          setExecutedPositioningAxes(positioningAxes);
                          setExecutedOverlaySelection(overlaySelections);
                          setIsPositioningExecuted(true);
                        }}
                        onOpenAxisModal={() => setIsPositioningAxisModalOpen(true)}
                        onOpenOverlayModal={() => setIsOverlayItemModalOpen(true)}
                        verticalAxisDisplay={verticalAxisDisplay}
                        horizontalAxisDisplay={horizontalAxisDisplay}
                        overlayItemDisplay={overlayItemDisplay}
                        isExecuteDisabled={isPositioningExecuteDisabled}
                      />
                    )}
                    {activeTab === 'ヒートマップ' && (
                      <HeatmapSettings
                        onExecute={() => {
                          setExecutedHeatmapConditionsList(heatmapConditionsList);
                          setIsHeatmapExecuted(true);
                          setHeatmapPending(false); // 実行後ボタン非活性化
                        }}
                        onOpenConditionsModal={() => {
                          if (!selectedData) {
                            onShowWarningModal("選択されたデータがありません。\nデータを先に選択してください。");
                          } else {
                            setEditingConditionIndex(null);
                            setIsHeatmapConditionsModalOpen(true);
                          }
                        }}
                        onEditCondition={(index) => {
                          setEditingConditionIndex(index);
                          setIsHeatmapConditionsModalOpen(true);
                          setHeatmapPending(true); // 編集時にボタン活性化
                        }}
                        onDeleteCondition={(index) => {
                          const newConditionsList = [...heatmapConditionsList];
                          newConditionsList.splice(index, 1);
                          setHeatmapConditionsList(newConditionsList);
                          
                          // 実行された条件リストからも該当の条件を削除し、マップを除去
                          const newExecutedList = [...executedHeatmapConditionsList];
                          newExecutedList.splice(index, 1);
                          setExecutedHeatmapConditionsList(newExecutedList);
                          
                          // 条件がすべて削除されたら、ヒートマップ実行状態をfalseに変更
                          if (newConditionsList.length === 0) {
                            setIsHeatmapExecuted(false);
                          }
                        }}
                        variableDisplayTexts={heatmapVariableTexts}
                        isExecuteDisabled={isHeatmapExecuteDisabled}
                      />
                    )}
                  </div>
                  <div className="flex-grow relative overflow-hidden">
                    {activeTab === '集計表' && (
                      <div id="segment-comparison-graph-area" className="absolute inset-0 overflow-auto">
                        {isSegmentComparisonExecuted && comparisonData ? (
                          <ComparisonTable 
                            data={comparisonData.rows} 
                            segmentSizes={comparisonData.segmentSizes} 
                            segmentIds={displaySelectedSegments || undefined}
                            displayMode={tableDisplayMode} 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'ポジショニングマップ' && (
                      <div id="positioning-graph-area" className="absolute inset-0 flex items-center justify-center">
                        {isPositioningExecuted ? (
                          positioningAxes.vertical && positioningAxes.horizontal ? (
                            <PositioningMapGraph
                              segmentedRows={segmentedRows}
                              verticalAxis={executedPositioningAxes.vertical}
                              horizontalAxis={executedPositioningAxes.horizontal}
                              overlaySelection={executedOverlaySelection}
                              segmentCount={segmentCount}
                            />
                          ) : (
                            <span className="text-gray-500">軸を設定してください</span>
                          )
                        ) : (
                          <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                        )}
                      </div>
                    )}
                    {activeTab === 'ヒートマップ' && (
                      <div id="heatmap-graph-area" className="absolute inset-0 p-4">
                        {isHeatmapExecuted && executedHeatmapConditionsList.length > 0 ? (
                          <div className={`grid gap-4 h-full ${
                            executedHeatmapConditionsList.length === 1 ? 'grid-cols-1' :
                            executedHeatmapConditionsList.length === 2 ? 'grid-cols-2' :
                            'grid-cols-2 grid-rows-2'
                          }`}>
                            {executedHeatmapConditionsList.map((conditions, index) => (
                              <div key={index} className="flex flex-col">
                                <div className="text-center font-semibold text-sm mb-2">
                                  条件{index + 1}
                                </div>
                                <div className="flex-1 flex items-center justify-center border border-gray-300 rounded">
                                  <img src={heatmapImage} alt={`Heatmap ${index + 1}`} className="max-w-full max-h-full object-contain" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white flex items-center justify-center">
                  <span className="text-gray-500">上記の表示オプションを選択してください</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full w-full bg-white">
          </div>
        )}
      </div>
      {isDisplayConditionModalOpen && (
        <DisplayConditionSelectionModal
          onClose={() => setIsDisplayConditionModalOpen(false)}
          onConfirm={(adoptedVariableIds, adoptedVariableNames, newRangeConfigs, newCategoryConfigs, selectedSegments) => {
            const formattedConditions: string[] = [];
            
            // アイテム一覧の順序を維持するために itemDetails を基準にループします
            itemDetails.forEach(item => {
              if (adoptedVariableIds.has(item.id)) {
                if (newCategoryConfigs[item.id]) {
                  formattedConditions.push(`・${item.name} : ${newCategoryConfigs[item.id].join(', ')}`);
                } else if (newRangeConfigs[item.id]) {
                  formattedConditions.push(`・${item.name} : ${newRangeConfigs[item.id].min} ~ ${newRangeConfigs[item.id].max}`);
                } else {
                  // カテゴリも範囲設定もない場合は、全ての選択肢가 採用されているとみなす
                  formattedConditions.push(`・${item.name} : 全て`);
                }
              }
            });

            // 最後に選択されたセグメント番号を追加
            if (selectedSegments && selectedSegments.length > 0) {
              formattedConditions.push(`・選択されたセグメント : ${selectedSegments.join(', ')}`);
            }

            setSegmentComparisonConditions(formattedConditions);

            // モーダルで設定された範囲設定を保留状態として保存
            setPendingRangeConfigs(prev => ({
              ...prev,
              ...newRangeConfigs
            }));
            // モーダルで設定されたカテゴリ設定を保留状態として保存
            setPendingCategoryConfigs(prev => ({
              ...prev,
              ...newCategoryConfigs
            }));
            // モーダルで採用された変数を保留状態として保存
            setPendingAdoptedVariableIds(adoptedVariableIds);
            // モーダルで選択されたセ그メントを保留状態として保存
            setPendingSelectedSegments(selectedSegments);

            // 保留中の変更があるフラ그を立てる
            setHasPendingChanges(true);
            setIsDisplayConditionModalOpen(false);
          }}
          initialSelectedItems={selectedVariables}
          segmentCount={segmentCount}
          // 全アイテムとカテゴリデータを渡します。
          items={itemDetails}
          choicesData={choicesData}
          // rangeConfigsはグローバルな設定
          rangeConfigs={rangeConfigs}
          // 表示条件設定（一時的な上書き）を別途渡す。保留中の変更があればそれを優先。
          displayRangeConfigs={hasPendingChanges ? pendingRangeConfigs : displayRangeConfigs}
          displayCategoryConfigs={hasPendingChanges ? pendingCategoryConfigs : displayCategoryConfigs}
          displayAdoptedIds={hasPendingChanges ? pendingAdoptedVariableIds : displayAdoptedVariableIds}
          displaySelectedSegments={hasPendingChanges ? pendingSelectedSegments : displaySelectedSegments}
        />
      )}
      {isPositioningAxisModalOpen && (
        <PositioningAxisModal
          onClose={() => setIsPositioningAxisModalOpen(false)}
          onConfirm={(axes) => {
            setPositioningAxes(axes);
            setIsPositioningAxisModalOpen(false);
          }}
          onShowWarning={onShowWarningModal}
          initialAxes={positioningAxes}
        />
      )}
      {isOverlayItemModalOpen && (
        <OverlayItemSelectionModal
          onClose={() => setIsOverlayItemModalOpen(false)}
          onConfirm={(selection) => {
            setOverlaySelections(selection);

            if (selection && selection.choiceNames.length > 0) {
              setOverlayItemDisplay(`${selection.variableName} : ${selection.choiceNames.join(', ')}`);
            } else {
              setOverlayItemDisplay('');
            }
            setIsOverlayItemModalOpen(false);
          }}
          initialSelection={overlaySelections}
        />
      )}
      {isHeatmapConditionsModalOpen && (
        <HeatmapVariableModal
          onClose={() => {
            setIsHeatmapConditionsModalOpen(false);
            setEditingConditionIndex(null);
          }}
          onConfirm={(conditions) => {
            if (editingConditionIndex !== null) {
              // 既存の条件を編集
              const newList = [...heatmapConditionsList];
              newList[editingConditionIndex] = conditions;
              setHeatmapConditionsList(newList);
            } else {
              // 新しい条件を追加
              setHeatmapConditionsList([...heatmapConditionsList, conditions]);
            }
            // 条件の追加・編集時にボタンを活性化
            setHeatmapPending(true);
            setIsHeatmapConditionsModalOpen(false);
            setEditingConditionIndex(null);
          }}
          initialConditions={editingConditionIndex !== null ? heatmapConditionsList[editingConditionIndex] : []}
          onShowInfo={onShowWarningModal}
        />
      )}
    </main>
  );
};

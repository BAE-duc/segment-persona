
import React, { useState, useEffect, useMemo } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import type { DataItem } from './DataSelectionModal';
import type { SelectedItemsMap, SelectedItem } from './SegmentVariableSelectionModal';
import { DisplayConditionSelectionModal } from './DisplayConditionSelectionModal';
import { PositioningAxisModal, type AxisSelection } from './PositioningAxisModal';
import { OverlayItemSelectionModal, type OverlaySelection } from './OverlayItemSelectionModal';
import { FilterEditModal, type ConditionListItem } from './shared/FilterEditModal';
import type { ItemDetail } from './ItemSelectionModal';
import { CompositionRatioVariableModal, type CompositionRatioSelection } from './CompositionRatioVariableModal';
import { ComparisonTable, type ComparisonRow } from './ComparisonTable';
import { TEST_CSV_RAW } from '../data/testData';
import { CompositionRatioGraph } from './CompositionRatioGraph';
import somMapImage from '../data/sommap.png';
import positioningMapImage from '../data/positioningmap.png';
import heatmapImage from '../data/hitmap.png';


// 右パネルのタブボタンのラベルを定義します。

const rightPanelTabs = ['セグメント比較', 'ポジショニング', 'ヒートマップ', '構成比比較'];

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
  isCompositionRatioExecuted: boolean;
  setIsCompositionRatioExecuted: (isExecuted: boolean) => void;
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
        <AppButton className="w-52" onClick={onOpenAxisModal}>ポジショニング軸の設定</AppButton>
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
        <StyledTextInput id="overlay-item" value={overlayItemDisplay} />
      </div>

      {/* 実行ボタン */}

      <div className="pt-0"> {/* ボタンを他のボタンと揃える */}
        <AppButton className="px-6 whitespace-nowrap" onClick={onExecute} disabled={isExecuteDisabled} primary>実行</AppButton>
      </div>
    </div>
  );
};


// ヒートマップタブの設定コンポーネントのPropsインターフェース

interface HeatmapSettingsProps {
  onExecute: () => void;
  onOpenConditionsModal: () => void;
  conditionsText: string;
  isExecuteDisabled: boolean;
}

// ヒートマップタブの設定コンポーネント

const HeatmapSettings: React.FC<HeatmapSettingsProps> = ({ onExecute, onOpenConditionsModal, conditionsText, isExecuteDisabled }) => {
  return (

    <div className="w-full flex flex-col gap-1 h-full">
      {/* 1行目：設定ボタンと実行ボタン */}

      <div className="flex items-center gap-2">
        <AppButton onClick={onOpenConditionsModal}>ヒートマップ表示条件の設定</AppButton>
        <AppButton className="px-6 whitespace-nowrap" onClick={onExecute} disabled={isExecuteDisabled} primary={!isExecuteDisabled}>実行</AppButton>
      </div>
      {/* 2行目：条件表示フィールド */}

      <div className="flex gap-2 flex-grow min-h-0">
        <label className="text-xs font-medium text-[#586365] flex-shrink-0 pt-1">条件：</label>
        <div className="flex-grow border border-gray-400 bg-white rounded-md px-2 py-1 text-gray-500 text-xs overflow-y-auto break-words">
          {conditionsText}
        </div>
      </div>
    </div>
  );
};

// 構成比比較タブの設定コンポーネントのPropsインターフェース

interface CompositionRatioSettingsProps {
  onExecute: () => void;
  onOpenVariableSearchModal: () => void;
  variableDisplayText: string;
  isExecuteDisabled: boolean;
}

// 構成比比較タブの設定コンポーネント

const CompositionRatioSettings: React.FC<CompositionRatioSettingsProps> = ({ onExecute, onOpenVariableSearchModal, variableDisplayText, isExecuteDisabled }) => {
  return (

    <div className="flex flex-col gap-1 w-full h-full">
      {/* 1行目：設定ボタンと実行ボタン */}

      <div className="flex items-center gap-2">
        <AppButton onClick={onOpenVariableSearchModal}>
          構成比を比べたい変数検索
        </AppButton>
        <AppButton className="px-6 whitespace-nowrap" onClick={onExecute} disabled={isExecuteDisabled} primary={!isExecuteDisabled}>実行</AppButton>
      </div>
      {/* 2行目：条件表示フィールド */}

      <div className="flex gap-2 flex-grow min-h-0">
        <label className="text-xs font-medium text-[#586365] flex-shrink-0 pt-1">変数：</label>
        <div className="flex-grow border border-gray-400 bg-white rounded-md px-2 py-1 text-gray-500 text-xs overflow-y-auto break-words">
          {variableDisplayText}
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
  isCompositionRatioExecuted,
  setIsCompositionRatioExecuted,
  onExportCommonFilter,
  rangeConfigs,
  customFilterConditions,
  onOpenPersonaPopup
}) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isDisplayConditionModalOpen, setIsDisplayConditionModalOpen] = useState(false);

  // Manage the number of applied segments.
  const [segmentCount, setSegmentCount] = useState(8);

  // Manage the temporary segment count selected in the dropdown.
  const [tempSegmentCount, setTempSegmentCount] = useState(segmentCount);


  // Positioning axis settings modal state
  const [isPositioningAxisModalOpen, setIsPositioningAxisModalOpen] = useState(false);
  const [positioningAxes, setPositioningAxes] = useState<{ vertical: AxisSelection | null; horizontal: AxisSelection | null }>({ vertical: null, horizontal: null });


  // Overlay item settings modal state
  const [isOverlayItemModalOpen, setIsOverlayItemModalOpen] = useState(false);
  const [overlaySelections, setOverlaySelections] = useState<OverlaySelection>({ carIds: new Set() });
  const [overlayItemDisplay, setOverlayItemDisplay] = useState('');


  // Heatmap condition setting modal state
  const [isHeatmapConditionsModalOpen, setIsHeatmapConditionsModalOpen] = useState(false);
  const [heatmapConditions, setHeatmapConditions] = useState<ConditionListItem[]>(customFilterConditions);


  // Manage whether the heatmap execute button is enabled (pending changes). Initial value is true (enabled).
  const [heatmapPending, setHeatmapPending] = useState(true);


  const [isCompositionRatioModalOpen, setIsCompositionRatioModalOpen] = useState(false);

  const [pendingCompositionSelection, setPendingCompositionSelection] = useState<CompositionRatioSelection | null>(null);

  const [executedCompositionSelection, setExecutedCompositionSelection] = useState<CompositionRatioSelection | null>(null);


  const [compositionRatioPending, setCompositionRatioPending] = useState(false);

  const [segmentComparisonConditions, setSegmentComparisonConditions] = useState<string[]>([]);



  const [displayRangeConfigs, setDisplayRangeConfigs] = useState<Record<string, { min: number; max: number }>>({});



  const [displayCategoryConfigs, setDisplayCategoryConfigs] = useState<Record<string, string[]>>({});



  const [displayAdoptedVariableIds, setDisplayAdoptedVariableIds] = useState<Set<string> | null>(null);




  const [pendingRangeConfigs, setPendingRangeConfigs] = useState<Record<string, { min: number; max: number }>>({});
  const [pendingCategoryConfigs, setPendingCategoryConfigs] = useState<Record<string, string[]>>({});
  const [pendingAdoptedVariableIds, setPendingAdoptedVariableIds] = useState<Set<string> | null>(null);

  // 変更が保留中かどうか（実行ボタンの活性化に使用）

  const [hasPendingChanges, setHasPendingChanges] = useState(false);


  // セグメント比較用データ

  const [comparisonData, setComparisonData] = useState<{ rows: ComparisonRow[], segmentSizes: number[] } | null>(null);


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
      // 全選択肢の収集

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

      // 選択肢のソート

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

      // 各選択肢について集計

      choices.forEach((choiceName, idx) => {
        // 全体での比率

        const totalCount = rowsWithSegment.filter(r => {
          let val = r[target.id];
          if (target.type === 'age') val = getAgeBin(val);
          else if (!val || val === '') val = 'NA';
          return val === choiceName;
        }).length;

        const totalRatio = totalSamples > 0 ? (totalCount / totalSamples) * 100 : 0;

        // セグメントごとの比率

        const segmentRatios = segmentSizes.map((size, segIndex) => {
          if (size === 0) return 0;
          const segId = segIndex + 1;
          const segCount = rowsWithSegment.filter(r => {
            if (r.segmentId !== segId) return false;
            let val = r[target.id];
            if (target.type === 'age') val = getAgeBin(val);
            else if (!val || val === '') val = 'NA';
            return val === choiceName;
          }).length;
          return (segCount / size) * 100;
        });

        resultRows.push({
          variableId: target.id.toUpperCase(), // AGE -> AGE
          variableName: target.name,
          choiceId: String(idx + 1),
          choiceName: choiceName,
          totalRatio: totalRatio,
          segmentRatios: segmentRatios
        });
      });
    });

    return { rows: resultRows, segmentSizes };
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

    setPendingRangeConfigs({});
    setPendingCategoryConfigs({});
    setPendingAdoptedVariableIds(null);

    setHasPendingChanges(false);

    // 条件テキストもリセット（初期状態は全選択なので）
    setSegmentComparisonConditions([]);
  }, [selectedVariables]);


  // セグメンテーションが再実行されたときに、表示条件のローカル設定をリセットするeffect。
  // セグメンテーションが再実行されたときに、グローバルのフィルター条件をヒートマップ条件に同期します。

  useEffect(() => {
    if (executionTrigger > 0) {
      setDisplayRangeConfigs({});
      setDisplayCategoryConfigs({});
      setDisplayAdoptedVariableIds(null);
      setPendingRangeConfigs({});
      setPendingCategoryConfigs({});
      setPendingAdoptedVariableIds(null);
      setSegmentComparisonConditions([]);
      setHasPendingChanges(false);

      // グローバルフィルター条件をヒートマップ条件に同期し、実行ボタンを有効化

      setHeatmapConditions(customFilterConditions);
      setHeatmapPending(true);

      // 構成比比較のリセット
      setPendingCompositionSelection(null);
      setExecutedCompositionSelection(null);
      setCompositionRatioPending(false);
    }
  }, [executionTrigger, customFilterConditions]);

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
      setComparisonData(generateRealDataFromCSV(segmentCount, targetVariables, displayRangeConfigs, displayCategoryConfigs));
    }
  }, [isSegmentComparisonExecuted, segmentCount, selectedVariables, displayRangeConfigs, displayCategoryConfigs, displayAdoptedVariableIds, itemDetails, choicesData]);

  const handleTabClick = (buttonName: string) => {
    setActiveTab(buttonName);
  };

  // 「適用」ボタンがクリックされたときに、一時的なセグメント数を実際のセグメント数に適用します。
  // When the "Apply" button is clicked, apply the temporary segment count to the actual segment count.
  const handleApplySegmentCount = () => {
    setSegmentCount(tempSegmentCount);
    // データを再生成（この時点ではuseEffectがトリガーされるはずですが、明示的に呼ぶ必要があれば呼ぶ）
    // Reactの状態更新は非同期なのでuseEffectに任せるのがベター
  };

  // セグメント比較の実行ボタンハンドラ

  const handleExecuteSegmentComparison = () => {
    // 保留中の設定を適用設定に反映
    setDisplayRangeConfigs(pendingRangeConfigs);
    setDisplayCategoryConfigs(pendingCategoryConfigs);
    setDisplayAdoptedVariableIds(pendingAdoptedVariableIds);

    setIsSegmentComparisonExecuted(true);
    setHasPendingChanges(false);
  };

  const verticalAxisDisplay = positioningAxes.vertical
    ? `${positioningAxes.vertical.variableName} : ${positioningAxes.vertical.choiceName}`
    : '';
  const horizontalAxisDisplay = positioningAxes.horizontal
    ? `${positioningAxes.horizontal.variableName} : ${positioningAxes.horizontal.choiceName}`
    : '';

  const heatmapConditionsText = heatmapConditions.length > 0
    ? heatmapConditions.map(c => `${c.itemName} ${c.symbol} ${c.categoryName}${c.connector ? ` ${c.connector}` : ''}`).join(' ')
    : '選択した内容が表示されます';

  const compositionRatioVariableText = pendingCompositionSelection
    ? `${pendingCompositionSelection.variable.name} : ${pendingCompositionSelection.adoptedChoices.map(c => c.content).join(', ')}`
    : "選択した内容が表示されます";

  const segmentComparisonConditionsText = segmentComparisonConditions.length > 0
    ? segmentComparisonConditions.join(', ')
    : '選択した内容が表示されます';

  // 各タブの実行ボタンの無効化状態を計算します。

  const isPositioningExecuteDisabled = !positioningAxes.vertical || !positioningAxes.horizontal || overlayItemDisplay === '';
  // ヒートマップ実行ボタンは、変更が保留中であれば有効（条件が空でもOK）

  const isHeatmapExecuteDisabled = !heatmapPending;
  const isCompositionRatioExecuteDisabled = !pendingCompositionSelection || !compositionRatioPending;

  return (
    <main
      className="flex-grow p-2 flex gap-2"
    >
      {/* 左パネル */}

      <div className="flex-1 flex flex-col">
        {isSegmentationExecuted ? (
          <>
            {/* 実行完了テキスト */}

            <div className="flex-shrink-0 h-[30px] flex items-center">
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
                    onChange={e => setTempSegmentCount(Number(e.target.value))}
                    className="w-20"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </AppSelect>
                  <AppButton className="px-6 whitespace-nowrap" onClick={handleApplySegmentCount}>適用</AppButton>
                </div>
              </div>

              {/* SOMMAP表示エリア */}

              <div
                id="sommap-area"
                className="flex-grow flex items-center justify-center bg-white overflow-hidden"
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
                  >
                    ペルソナ確認
                  </AppButton>
                  <AppButton
                    className="w-full"
                    onClick={onExportCommonFilter}
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
                    {activeTab === 'セグメント比較' && (
                      // gap-2 -> gap-1
                      <div className="flex flex-col gap-1 w-full h-full">
                        <div className="flex items-center gap-2">
                          <AppButton onClick={() => setIsDisplayConditionModalOpen(true)}>
                            表示条件選択
                          </AppButton>
                          <AppButton
                            className="px-6 whitespace-nowrap"
                            onClick={handleExecuteSegmentComparison}
                            disabled={!hasPendingChanges}
                            primary={hasPendingChanges}
                          >
                            実行
                          </AppButton>
                        </div>
                        <div className="flex gap-2 flex-grow min-h-0">
                          <label className="text-xs font-medium text-[#586365] flex-shrink-0 pt-1">条件：</label>
                          <div className="flex-grow border border-gray-400 bg-white rounded-md px-2 py-1 text-gray-500 text-xs overflow-y-auto break-words">
                            {segmentComparisonConditionsText}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'ポジショニング' && (
                      <PositioningSettings
                        onExecute={() => setIsPositioningExecuted(true)}
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
                          setIsHeatmapExecuted(true);
                          setHeatmapPending(false); // 実行したらボタンを無効化
                        }}
                        onOpenConditionsModal={() => {
                          if (!selectedData) {
                            onShowWarningModal("選択されたデータがありません。\nデータを先に選択してください。");
                          } else {
                            setIsHeatmapConditionsModalOpen(true);
                          }
                        }}
                        conditionsText={heatmapConditionsText}
                        isExecuteDisabled={isHeatmapExecuteDisabled}
                      />
                    )}
                    {activeTab === '構成比比較' && (
                      <CompositionRatioSettings
                        onExecute={() => {
                          setExecutedCompositionSelection(pendingCompositionSelection);
                          setIsCompositionRatioExecuted(true);
                          setCompositionRatioPending(false);
                        }}
                        onOpenVariableSearchModal={() => {
                          if (!selectedData) {
                            onShowWarningModal("選択されたデータがありません。\nデータを先に選択してください。");
                          } else {
                            setIsCompositionRatioModalOpen(true);
                          }
                        }}
                        variableDisplayText={compositionRatioVariableText}
                        isExecuteDisabled={isCompositionRatioExecuteDisabled}
                      />
                    )}
                  </div>
                  <div className="flex-grow relative overflow-hidden">
                    <div id="segment-comparison-graph-area" className={`absolute inset-0 overflow-auto ${activeTab === 'セグメント比較' ? '' : 'hidden'}`}>
                      {isSegmentComparisonExecuted && comparisonData ? (
                        <ComparisonTable data={comparisonData.rows} segmentSizes={comparisonData.segmentSizes} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                        </div>
                      )}
                    </div>
                    <div id="positioning-graph-area" className={`absolute inset-0 flex items-center justify-center ${activeTab === 'ポジショニング' ? '' : 'hidden'}`}>
                      {isPositioningExecuted ? (
                        <img src={positioningMapImage} alt="Positioning Map" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                      )}
                    </div>
                    <div id="heatmap-graph-area" className={`absolute inset-0 flex items-center justify-center ${activeTab === 'ヒートマップ' ? '' : 'hidden'}`}>
                      {isHeatmapExecuted ? (
                        <img src={heatmapImage} alt="Heatmap" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                      )}
                    </div>
                    <div id="composition-ratio-comparison-graph-area" className={`absolute inset-0 flex items-center justify-center ${activeTab === '構成比比較' ? '' : 'hidden'}`}>
                      {isCompositionRatioExecuted && executedCompositionSelection ? (
                        <CompositionRatioGraph
                          variable={executedCompositionSelection.variable}
                          adoptedChoices={executedCompositionSelection.adoptedChoices}
                          segmentCount={segmentCount}
                          rangeConfigs={rangeConfigs}
                          displayCategoryConfigs={displayCategoryConfigs}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-500">表示設定が完了したら実行ボタンを押してください</span>
                        </div>
                      )}
                    </div>
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
          onConfirm={(adoptedVariableIds, adoptedVariableNames, newRangeConfigs, newCategoryConfigs) => {
            setSegmentComparisonConditions(adoptedVariableNames);

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

            // 保留中の変更があるフラグを立てる
            setHasPendingChanges(true);
            setIsDisplayConditionModalOpen(false);
          }}
          initialSelectedItems={selectedVariables}
          segmentCount={segmentCount}
          // 全アイテムと選択肢データを渡します。
          items={itemDetails}
          choicesData={choicesData}
          // rangeConfigsはグローバルな設定
          rangeConfigs={rangeConfigs}
          // 表示条件設定（一時的な上書き）を別途渡す。保留中の変更があればそれを優先。
          displayRangeConfigs={hasPendingChanges ? pendingRangeConfigs : displayRangeConfigs}
          displayCategoryConfigs={hasPendingChanges ? pendingCategoryConfigs : displayCategoryConfigs}
          displayAdoptedIds={hasPendingChanges ? pendingAdoptedVariableIds : displayAdoptedVariableIds}
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

            const selectedVariableNames: string[] = [];
            if (selection.carIds.size > 0) {
              // '保有車' 変数名を追加します。

              selectedVariableNames.push('保有車');
            }
            // 他の変数の選択もここに追加できます


            setOverlayItemDisplay(selectedVariableNames.join(', '));
            setIsOverlayItemModalOpen(false);
          }}
          initialSelection={overlaySelections}
        />
      )}
      {isHeatmapConditionsModalOpen && (
        <FilterEditModal
          title="ヒートマップ表示条件の設定"
          hideRowControls
          onClose={() => setIsHeatmapConditionsModalOpen(false)}
          onConfirm={(conditions) => {
            setHeatmapConditions(conditions);
            setHeatmapPending(true); // 条件変更時は実行ボタンを有効化
            setIsHeatmapConditionsModalOpen(false);
          }}
          initialConditions={heatmapConditions}
          onShowInfo={onShowWarningModal}
        />
      )}
      {isCompositionRatioModalOpen && (
        <CompositionRatioVariableModal
          onClose={() => setIsCompositionRatioModalOpen(false)}
          onConfirm={(selection) => {
            setPendingCompositionSelection(selection);
            setIsCompositionRatioModalOpen(false);
            setCompositionRatioPending(true);
          }}
          items={itemDetails}
          choicesData={choicesData}
          initialSelection={pendingCompositionSelection}
        />
      )}
    </main>
  );
};

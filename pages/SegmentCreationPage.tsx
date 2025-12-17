
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SegmentSidebar } from '../components/SegmentSidebar';
import { SegmentMainContent } from '../components/SegmentMainContent';
import { DataSelectionModal, type DataItem } from '../components/DataSelectionModal';
import { FilterEditModal, type ConditionListItem } from '../components/shared/FilterEditModal';
import type { SelectedItemsMap, ConversionSettings, CategoryItem, SelectedItem } from '../components/SegmentVariableSelectionModal';
import { ItemSelectionModal, type ItemDetail } from '../components/ItemSelectionModal';
import { SegmentSettingsEditModal, type SegmentSettings } from '../components/SegmentSettingsEditModal';
import { WarningModal } from '../components/shared/WarningModal';
import { InfoModal } from '../components/shared/InfoModal';
import { ConversionSettingsModal } from '../components/ConversionSettingsModal';
import { TEST_CSV_RAW } from '../data/testData';

// html2canvasライブラリをグローバル変数として宣言します。
declare const html2canvas: any;

// フィルターカテゴリーの構造を定義します。
export interface FilterCategory {
  [key: string]: string[];
}

// フィルターの初期データを定義します。
const initialFilterCategories: FilterCategory = {
  '期間': ['2023年', '2024年', '2025年'],
  '地域': [],
  '車': ['PHEV'],
  '人': ['性別(男性)', '年齢(20代)', '年齢(30代)', '年齢(40代)', '年齢(50代)', '性別(女性)'],
};

// セグメント設定の初期値を定義します。
const defaultSettings: SegmentSettings = {
  mapSize: 'auto',
  customWidth: '',
  customHeight: '',
  learningRate: '0.5',
  iterations: '1000',
  distanceMetric: 'Euclidean',
  neighborhoodRadius: '0.3',
  neighborhoodFunction: 'Gaussian',
  decayFunction: 'none',
};

// --- Test Data Parsing Logic ---

const parseTestData = (csv: string) => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
  return { headers, rows };
};

const { headers, rows } = parseTestData(TEST_CSV_RAW);

// Initialize data structures based on CSV
const generatedItemDetails: ItemDetail[] = [];
const generatedChoicesData: { [key: string]: { id: number; content: string }[] } = {};
const generatedItemCategoryData: Record<string, CategoryItem[]> = {};
const generatedItemRangeConfig: Record<string, { min: number; max: number }> = {};
// Store raw column data for histogram and stats
const generatedColumnData: Record<string, string[]> = {};

headers.forEach((header, colIndex) => {
  if (header === 'ID') return;

  const colValues = rows.map(row => row[colIndex]);
  generatedColumnData[header] = colValues;

  const validValues = colValues.filter(v => v !== 'NA' && v !== '');
  const totalCount = colValues.length;
  const validCount = validValues.length;
  const validResponseRate = totalCount > 0 ? parseFloat(((validCount / totalCount) * 100).toFixed(1)) : 0;

  // Type Inference
  // 数値型判定: 有効な値が存在し、全てが数値として解釈可能な場合
  const isNumeric = validValues.length > 0 && validValues.every(v => !isNaN(Number(v)));
  const dataType = isNumeric ? 'int' : 'string';
  const itemType = isNumeric ? 'S' : 'R';
  const somDataType = isNumeric ? '数値型' : 'カテゴリ型';

  // Choices / Categories
  const uniqueValues = Array.from(new Set(colValues)).filter(v => v !== 'NA' && v !== '').sort();
  // NAがあれば末尾に追加
  if (colValues.includes('NA')) uniqueValues.push('NA');

  // choicesData
  generatedChoicesData[header] = uniqueValues.map((val, idx) => ({
    id: idx + 1,
    content: val
  }));

  // itemCategoryData (カテゴリ型の変換設定デフォルト用)
  const categoryItems: CategoryItem[] = [];

  // ソート: NAは最後、数値なら数値順、文字列なら辞書順
  const sortedValues = [...uniqueValues].sort((a, b) => {
    if (a === 'NA') return 1;
    if (b === 'NA') return -1;
    if (isNumeric) return Number(a) - Number(b);
    return a.localeCompare(b);
  });

  sortedValues.forEach((val, idx) => {
    const count = colValues.filter(v => v === val).length;
    const ratio = (count / totalCount) * 100;
    categoryItems.push({
      no: idx + 1,
      name: val,
      samples: count,
      ratio: parseFloat(ratio.toFixed(1))
    });
  });
  generatedItemCategoryData[header] = categoryItems;

  // itemRangeConfig (数値型用)
  if (isNumeric) {
    const nums = validValues.map(Number);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    generatedItemRangeConfig[header] = { min, max };
  } else {
    generatedItemRangeConfig[header] = { min: 0, max: 0 };
  }

  // Variance (簡易計算)
  let variance = 0;
  if (isNumeric) {
    const nums = validValues.map(Number);
    if (nums.length > 0) {
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const stdDev = Math.sqrt(nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length);
      variance = parseFloat(stdDev.toFixed(2));
    }
  } else {
    variance = 0.5; // カテゴリ型のダミー分散
  }

  generatedItemDetails.push({
    id: header,
    name: header,
    dataType,
    itemType,
    conversionSetting: '未設定',
    somDataType,
    variance,
    validResponseRate
  });
});

// ItemSelectionModal で使用されるアイテムデータの初期値。
const initialItemDetailsData: ItemDetail[] = generatedItemDetails;

// 変数IDに基づいて中央のカテゴリテーブルに表示するデータ。
const choicesData: { [key: string]: { id: number; content: string }[] } = generatedChoicesData;

// 変換設定で使用するデータ定義
const itemCategoryData: Record<string, CategoryItem[]> = generatedItemCategoryData;

const itemRangeConfig: Record<string, { min: number; max: number }> = generatedItemRangeConfig;


interface SegmentCreationPageProps {
  onOpenPersonaPopup?: () => void;
}

export const SegmentCreationPage: React.FC<SegmentCreationPageProps> = ({ onOpenPersonaPopup }) => {
  const [isSegmentationExecuted, setIsSegmentationExecuted] = useState(false);
  // セグメンテーション実行トリガー（再実行を検知するためのカウンタ）
  const [executionTrigger, setExecutionTrigger] = useState(0);

  const [filterCategories, setFilterCategories] = useState<FilterCategory>(initialFilterCategories);

  // 右パネルのグラフ実行状態を管理します。
  const [isSegmentComparisonExecuted, setIsSegmentComparisonExecuted] = useState(false);
  const [isPositioningExecuted, setIsPositioningExecuted] = useState(false);
  const [isHeatmapExecuted, setIsHeatmapExecuted] = useState(false);
  const [isCompositionRatioExecuted, setIsCompositionRatioExecuted] = useState(false);

  // モーダルの状態管理
  const [isDataSelectionModalOpen, setIsDataSelectionModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isItemSelectionModalOpen, setIsItemSelectionModalOpen] = useState(false);
  const [isSettingsEditModalOpen, setIsSettingsEditModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isConversionSettingsModalOpen, setIsConversionSettingsModalOpen] = useState(false);
  // 編集中のアイテムIDとデータ型を保持するstate。
  const [editingConversionItem, setEditingConversionItem] = useState<{ id: string; somDataType: string } | null>(null);


  // 共有される状態
  const [selectedData, setSelectedData] = useState<DataItem | null>(null);
  const [customFilterConditions, setCustomFilterConditions] = useState<ConditionListItem[]>([]);
  const [segmentSettings, setSegmentSettings] = useState<SegmentSettings | null>(null);
  const [selectedVariables, setSelectedVariables] = useState<SelectedItemsMap>({});
  const [selectedItems, setSelectedItems] = useState<SelectedItemsMap>({});
  const [itemDetails, setItemDetails] = useState<ItemDetail[]>(initialItemDetailsData);

  // 実行時の設定を保存するスナップショット状態
  const [executedState, setExecutedState] = useState<{
    selectedData: DataItem | null;
    selectedVariables: SelectedItemsMap;
    itemDetails: ItemDetail[];
    filterCategories: FilterCategory;
    customFilterConditions: ConditionListItem[];
  } | null>(null);


  const handleSegmentationExecute = () => {
    setIsSegmentationExecuted(true);
    setExecutionTrigger(prev => prev + 1);

    // 実行時点の状態を保存します。メインコンテンツはこのスナップショットを使用します。
    setExecutedState({
      selectedData,
      selectedVariables,
      // itemDetailsはオブジェクトの配列なので、新しい配列としてコピーします。
      itemDetails: [...itemDetails],
      filterCategories: { ...filterCategories },
      customFilterConditions: [...customFilterConditions]
    });
  };

  const handleDeleteItem = useCallback((category: string, itemToDelete: string) => {
    setFilterCategories(prev => {
      const newCategoryItems = prev[category]?.filter(item => item !== itemToDelete) || [];
      return {
        ...prev,
        [category]: newCategoryItems,
      };
    });
  }, []);

  useEffect(() => {
    const handleExternalDrop = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      try {
        const data = customEvent.detail;
        if (data) {
          const { category, item } = JSON.parse(data);
          handleDeleteItem(category, item);
        }
      } catch (error) {
        console.error("Failed to handle external drop event:", error);
      }
    };

    window.addEventListener('item-delete-drop', handleExternalDrop);

    return () => {
      window.removeEventListener('item-delete-drop', handleExternalDrop);
    };
  }, [handleDeleteItem]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const { category, item } = JSON.parse(data);
        handleDeleteItem(category, item);
      }
    } catch (error) {
      console.error("ドロップの処理に失敗しました:", error);
    }
  };

  const handleShowInfoModal = (message: string) => {
    setModalMessage(message);
    setIsInfoModalOpen(true);
  };

  const handleShowWarningModal = (message: string) => {
    setModalMessage(message);
    setIsWarningModalOpen(true);
  };

  const handleConfirmItemSelection = (selection: SelectedItemsMap) => {
    const newSelection = { ...selection };
    let itemsUpdated = false;
    const newItemDetails = [...itemDetails];

    Object.keys(newSelection).forEach(key => {
      const item = newSelection[key];
      // 変換設定が未設定の場合、デフォルト値を適用します。
      // 変数設定状態は「未設定」のままにします（OKボタンが押されたときのみ「設定完了」になります）。
      // 変換設定が未設定の場合、デフォルト値を適用します。
      // 変数設定状態は「未設定」のままにします（OKボタンが押されたときのみ「設定完了」になります）。
      if (!item.conversionDetails || item.conversionSetting !== '設定完了') {
        const somType = item.somDataType || (item.type === 'int' ? '数値型' : 'カテゴリ型');

        if (somType === 'カテゴリ型') {
          // カテゴリ型：すべてのカテゴリを選択状態にする
          // カテゴリ型：すべてのカテゴリを選択状態にする
          const cats = itemCategoryData[item.id];
          if (cats) {
            const defaultDetails: ConversionSettings = {
              type: 'categorical',
              categories: cats.map(c => c.name)
            };

            // 選択アイテムを更新 (状態は未設定のまま)
            item.conversionDetails = defaultDetails;
            item.conversionSetting = '未設定';
            item.somDataType = 'カテゴリ型';

            // マスターリストも更新 (状態は未設定のまま)
            const masterIndex = newItemDetails.findIndex(i => i.id === key);
            if (masterIndex !== -1) {
              newItemDetails[masterIndex] = {
                ...newItemDetails[masterIndex],
                conversionDetails: defaultDetails,
                conversionSetting: '未設定',
                somDataType: 'カテゴリ型'
              };
              itemsUpdated = true;
            }
          }
        } else {
          // 数値型：最小値～最大値を設定
          // 数値型：最小値～最大値を設定
          const range = itemRangeConfig[item.id] || { min: 1, max: 100 };
          const defaultDetails: ConversionSettings = {
            type: 'numerical',
            range: { min: String(range.min), max: String(range.max) }
          };

          // 選択アイテムを更新 (状態は未設定のまま)
          item.conversionDetails = defaultDetails;
          item.conversionSetting = '未設定';
          item.somDataType = '数値型';

          // マスターリストも更新 (状態は未設定のまま)
          const masterIndex = newItemDetails.findIndex(i => i.id === key);
          if (masterIndex !== -1) {
            newItemDetails[masterIndex] = {
              ...newItemDetails[masterIndex],
              conversionDetails: defaultDetails,
              conversionSetting: '未設定',
              somDataType: '数値型'
            };
            itemsUpdated = true;
          }
        }
      }
    });

    if (itemsUpdated) {
      setItemDetails(newItemDetails);
    }
    setSelectedItems(newSelection);
    setIsItemSelectionModalOpen(false);
  };

  // `selectedItems` が変更されたときに `selectedVariables` を同期させるためのuseEffect。
  // `selectedItems` が変更されたときに `selectedVariables` を同期させるためのuseEffect。
  useEffect(() => {
    const newSelectedVariables: SelectedItemsMap = {};
    for (const key in selectedItems) {
      const item = selectedItems[key];
      const allChoices = (choicesData[item.id] || []).map(c => ({ id: c.id, content: c.content }));
      newSelectedVariables[key] = {
        ...item,
        choices: allChoices,
      };
    }
    setSelectedVariables(newSelectedVariables);
  }, [selectedItems]);

  // どの変換設定モーダルを開くか決定するハンドラ。
  // どの変換設定モーダルを開くか決定するハンドラ。
  const handleOpenConversionSettingsModal = (itemId: string, somDataType: string) => {
    setEditingConversionItem({ id: itemId, somDataType });
    setIsConversionSettingsModalOpen(true);
  };

  // 変換設定が完了したときに呼び出され、アイテムの変換設定ステータスを更新します。
  // 変換設定が完了したときに呼び出され、アイテムの変換設定ステータスを更新します。
  const handleConfirmConversionSettings = (settings: ConversionSettings) => {
    if (!editingConversionItem) return;

    const { id: itemId } = editingConversionItem;

    // マスターアイテムリストを更新します。設定完了ステータスにします。
    // Update the master item list. Set status to Configured.
    setItemDetails(prevDetails =>
      prevDetails.map(item =>
        item.id === itemId
          ? { ...item, conversionSetting: '設定完了', conversionDetails: settings }
          : item
      )
    );

    // 選択されたアイテムも更新します。
    // Also update the selected items.
    setSelectedItems(prevItems => {
      if (prevItems[itemId]) {
        return {
          ...prevItems,
          [itemId]: {
            ...prevItems[itemId],
            conversionSetting: '設定完了',
            conversionDetails: settings
          }
        };
      }
      return prevItems;
    });

    setIsConversionSettingsModalOpen(false);
    setEditingConversionItem(null);
  };


  const isExecuteDisabled = !selectedData || Object.keys(selectedVariables).length === 0;

  const editingItemDetails = editingConversionItem ? itemDetails.find(item => item.id === editingConversionItem.id) : null;

  // Get numeric data and NA count for the editing item
  const editingDataRaw = editingConversionItem ? generatedColumnData[editingConversionItem.id] : [];
  const numericData = editingDataRaw ? editingDataRaw.filter(v => v !== 'NA' && v !== '' && !isNaN(Number(v))).map(Number) : [];
  const naCount = editingDataRaw ? editingDataRaw.filter(v => v === 'NA' || v === '').length : 0;

  // ヘッダー名からインデックスへのマップを作成
  const headerIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    headers.forEach((h, i) => {
      map[h] = i;
    });
    return map;
  }, []);

  // 選択されたアイテムの変換設定に基づいて、対象データの総数を計算します。
  // 選択されたアイテムの変換設定に基づいて、対象データの総数を計算します。
  const selectedDataCount = useMemo(() => {
    const activeVariables = Object.values(selectedItems).filter((item: SelectedItem) => item.conversionDetails);

    // アイテムが選択されていない場合は全データ数を返します（初期状態と仮定）
    // アイテムが選択されていない場合は全データ数を返します（初期状態と仮定）
    if (activeVariables.length === 0) return rows.length;

    let count = 0;
    // `criteria` の代わりに `activeVariables` を直接使用するように変更
    for (const row of rows) {
      let match = true;
      for (const item of (activeVariables as SelectedItem[])) {
        const colIndex = headerIndexMap[item.id];
        const rawValue = row[colIndex];
        const settings = item.conversionDetails;

        if (settings!.type === 'numerical' && settings!.range) {
          const val = Number(rawValue);
          // 数値でない場合、またはNAの場合は除外
          if (isNaN(val) || rawValue === 'NA' || rawValue === '') {
            match = false;
          } else {
            const min = parseFloat(settings!.range.min);
            const max = parseFloat(settings!.range.max);
            if (val < min || val > max) match = false;
          }
        } else if (settings!.type === 'categorical' && settings!.categories) {
          let val = rawValue;
          if (val === '' || val === 'NA') val = 'NA';
          // 許可されたカテゴリに含まれていない場合は不一致
          if (!settings!.categories.includes(val)) {
            match = false;
          }
        }

        if (!match) break;
      }
      if (match) count++;
    }
    return count;
  }, [selectedItems]); // rows, headersは静的なので依存配列に含めなくても良い

  const handleDownload = async () => {
    if (!isSegmentationExecuted) {
      handleShowWarningModal("セグメンテーションが実行されていません。");
      return;
    }

    const sectionsToCapture: { id: string, title: string }[] = [];

    // SOMMAPはセグメンテーション実行時に常にキャプチャ対象とします
    // SOMMAPはセグメンテーション実行時に常にキャプチャ対象とします
    sectionsToCapture.push({ id: 'sommap-area', title: 'SOMMAP' });

    // 各グラフが実行された場合にのみダウンロード対象に追加します
    // 各グラフが実行された場合にのみダウンロード対象に追加します
    if (isSegmentComparisonExecuted) {
      sectionsToCapture.push({ id: 'segment-comparison-graph-area', title: 'セグメント比較' });
    }
    if (isPositioningExecuted) {
      sectionsToCapture.push({ id: 'positioning-graph-area', title: 'ポジショニング' });
    }
    if (isHeatmapExecuted) {
      sectionsToCapture.push({ id: 'heatmap-graph-area', title: 'ヒートマップ' });
    }
    if (isCompositionRatioExecuted) {
      sectionsToCapture.push({ id: 'composition-ratio-comparison-graph-area', title: '構成比比較' });
    }

    try {
      const canvasesWithTitles: { canvas: HTMLCanvasElement, title: string }[] = [];

      for (const section of sectionsToCapture) {
        const element = document.getElementById(section.id);
        if (element) {
          const clone = element.cloneNode(true) as HTMLElement;
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          clone.style.top = '0px';

          // クローンが表示されるように、'invisible'と'hidden'クラスを削除します
          // Remove the 'invisible' and 'hidden' classes so the clone is visible for capture
          clone.classList.remove('invisible', 'hidden');

          // 念のため、スタイルで表示を強制します
          // Force visibility via style just in case
          clone.style.visibility = 'visible';
          // displayプロパティをリセットしてクラスベースのスタイルを適用させます
          // Reset display property to allow class-based styling
          clone.style.display = '';

          // 元の要素の寸法ではなく、内容全体が表示されるようにスタイルをリセットします
          // Reset styles to ensure the full content is visible, not just the scrolled view
          clone.style.width = 'max-content';
          clone.style.height = 'auto';
          clone.style.overflow = 'visible';
          clone.style.maxHeight = 'none';
          clone.style.maxWidth = 'none';

          // 内部のスクロール可能な要素も全て展開します
          // Expand all internal scrollable elements
          const scrollables = clone.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-x-auto');
          scrollables.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.overflow = 'visible';
            htmlEl.style.maxHeight = 'none';
            htmlEl.style.maxWidth = 'none';
            htmlEl.style.height = 'auto';
            htmlEl.style.width = 'max-content';
          });

          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
          });
          document.body.removeChild(clone);
          canvasesWithTitles.push({ canvas, title: section.title });
        }
      }

      if (canvasesWithTitles.length === 0) {
        handleShowWarningModal("ダウンロードするグラフがありません。");
        return;
      }

      const padding = 40; // 20px padding * scale 2
      const titleHeight = 60; // 30px title height * scale 2
      let totalHeight = padding;
      canvasesWithTitles.forEach(item => {
        totalHeight += item.canvas.height + titleHeight + padding;
      });
      const maxWidth = Math.max(...canvasesWithTitles.map(item => item.canvas.width));
      const totalWidth = maxWidth + (padding * 2);

      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = totalWidth;
      combinedCanvas.height = totalHeight;
      const ctx = combinedCanvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      ctx.font = 'bold 32px sans-serif'; // 16px font * scale 2
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let currentY = padding;
      for (const { canvas, title } of canvasesWithTitles) {
        ctx.fillText(title, totalWidth / 2, currentY + titleHeight / 2);
        currentY += titleHeight;

        const x = (totalWidth - canvas.width) / 2;
        ctx.drawImage(canvas, x, currentY);
        currentY += canvas.height + padding;
      }

      const blob = await new Promise<Blob | null>(resolve => combinedCanvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error("キャンバスからBlobへの変換に失敗しました。");
      }

      const today = new Date();
      const timestamp = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}_${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}${today.getSeconds().toString().padStart(2, '0')}`;
      const suggestedName = `segment-analysis_${timestamp}.png`;

      const link = document.createElement('a');
      link.download = suggestedName;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("ダウンロード画像の生成に失敗しました:", error);
      handleShowWarningModal("ダウンロード画像の生成に失敗しました。");
    }
  };

  // 共通フィルター出力機能
  // 共通フィルター出力機能
  const handleExportCommonFilter = () => {
    if (!isSegmentationExecuted) {
      handleShowWarningModal("セグメンテーションが実行されていません。");
      return;
    }

    // 実行時点の条件を使用します。
    // 実行時点の条件を使用します。
    const targetCustomFilterConditions = executedState ? executedState.customFilterConditions : customFilterConditions;
    const targetFilterCategories = executedState ? executedState.filterCategories : filterCategories;

    // 1. フィルター編集で作成された条件 (カスタムフィルター)
    // 1. フィルター編集で作成された条件 (カスタムフィルター)
    let customFilterStr = '';
    if (targetCustomFilterConditions.length > 0) {
      customFilterStr = targetCustomFilterConditions.map((c, index) =>
        `${c.bracketOpen}${c.itemName} ${c.symbol} ${c.categoryName}${c.bracketClose}${index < targetCustomFilterConditions.length - 1 ? (c.connector ? ' ' + c.connector : '') : ''}`
      ).join(' ');
    }

    // 2. サイドバーのフィルターカテゴリー (期間, 地域, 車, 人)
    // 2. サイドバーのフィルターカテゴリー (期間, 地域, 車, 人)
    const categoryParts: string[] = [];
    const targetCategories = ['期間', '地域', '車', '人'];

    targetCategories.forEach(catKey => {
      const items = targetFilterCategories[catKey];
      if (items && items.length > 0) {
        // カテゴリ内のアイテムはOR条件で結合し、括弧で囲む
        // カテゴリ内のアイテムはOR条件で結合し、括弧で囲む
        const joined = items.map(item => `${catKey} = "${item}"`).join(' OR ');
        categoryParts.push(`(${joined})`);
      }
    });

    // 3. すべての条件をANDで結合
    // 3. すべての条件をANDで結合
    const allParts = [];
    if (customFilterStr) {
      allParts.push(`(${customFilterStr})`);
    }
    if (categoryParts.length > 0) {
      allParts.push(categoryParts.join(' AND '));
    }

    const finalFilterExpression = allParts.join(' AND ');

    // 4. JSONオブジェクトの作成
    // 4. JSONオブジェクトの作成
    const exportData = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      filterExpression: finalFilterExpression,
      raw: {
        customFilters: targetCustomFilterConditions,
        categoryFilters: targetFilterCategories
      }
    };

    // 5. ダウンロード処理
    // 5. ダウンロード処理
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const today = new Date();
      const timestamp = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}_${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}${today.getSeconds().toString().padStart(2, '0')}`;
      link.href = URL.createObjectURL(blob);
      link.download = `common_filter_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error(e);
      handleShowWarningModal("ファイル保存に失敗しました。");
    }
  };

  // メインコンテンツに渡すデータを決定します。
  // 実行済みの場合は実行時のスナップショットを使用し、未実行の場合は現在の編集状態を使用します。
  // メインコンテンツに渡すデータを決定します。
  // 実行済みの場合は実行時のスナップショットを使用し、未実行の場合は現在の編集状態を使用します。
  const displayData = (isSegmentationExecuted && executedState) ? executedState.selectedData : selectedData;
  const displayVariables = (isSegmentationExecuted && executedState) ? executedState.selectedVariables : selectedVariables;
  const displayItemDetails = (isSegmentationExecuted && executedState) ? executedState.itemDetails : itemDetails;
  // ユーザーリクエストにより、ヒートマップでもセグメンテーション実行時のフィルタ条件を使用するように戻します。
  // サイドバーで変更しても即時には反映されず、実行ボタンを押したときに反映されます。
  const displayCustomFilterConditions = (isSegmentationExecuted && executedState) ? executedState.customFilterConditions : customFilterConditions;

  return (
    // モーダル表示時にサイドバーも含めて全体が非アクティブになるように、コンテナにrelativeを追加します。
    <div
      className="flex h-full w-full bg-[#ECECEC] relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <SegmentSidebar
        onSegmentationExecute={handleSegmentationExecute}
        filterCategories={filterCategories}
        selectedData={selectedData}
        customFilterConditions={customFilterConditions}
        segmentSettings={segmentSettings}
        defaultSettings={defaultSettings}
        selectedVariables={selectedVariables}
        selectedItems={selectedItems}
        onOpenDataSelectionModal={() => setIsDataSelectionModalOpen(true)}
        onOpenFilterModal={() => {
          if (!selectedData) {
            setModalMessage("選択されたデータがありません。\nデータを先に選択してください。");
            setIsWarningModalOpen(true);
          } else {
            setIsFilterModalOpen(true);
          }
        }}
        onOpenItemSelectionModal={() => {
          if (!selectedData) {
            setModalMessage("選択されたデータがありません。\nデータを先に選択してください。");
            setIsWarningModalOpen(true);
          } else {
            setIsItemSelectionModalOpen(true);
          }
        }}
        onOpenSettingsEditModal={() => {
          if (!selectedData) {
            setModalMessage("選択されたデータがありません。\nデータを先に選択してください。");
            setIsWarningModalOpen(true);
          } else {
            setIsSettingsEditModalOpen(true);
          }
        }}
        onOpenConversionSettingsModal={handleOpenConversionSettingsModal}
        isExecuteDisabled={isExecuteDisabled}
        onDownload={handleDownload}
        // 計算したデータ数を渡す
        selectedDataCount={selectedDataCount}
      />
      <SegmentMainContent
        isSegmentationExecuted={isSegmentationExecuted}
        executionTrigger={executionTrigger}
        // スナップショットまたは現在の状態を渡します
        selectedData={displayData}
        selectedVariables={displayVariables}
        onShowWarningModal={handleShowWarningModal}
        itemDetails={displayItemDetails}
        choicesData={choicesData}
        isSegmentComparisonExecuted={isSegmentComparisonExecuted}
        setIsSegmentComparisonExecuted={setIsSegmentComparisonExecuted}
        isPositioningExecuted={isPositioningExecuted}
        setIsPositioningExecuted={setIsPositioningExecuted}
        isHeatmapExecuted={isHeatmapExecuted}
        setIsHeatmapExecuted={setIsHeatmapExecuted}
        isCompositionRatioExecuted={isCompositionRatioExecuted}
        setIsCompositionRatioExecuted={setIsCompositionRatioExecuted}
        onExportCommonFilter={handleExportCommonFilter}
        // rangeConfigsプロパティを渡す
        rangeConfigs={itemRangeConfig}
        customFilterConditions={displayCustomFilterConditions}
        onOpenPersonaPopup={onOpenPersonaPopup}
      />

      {/* モーダルレンダリングエリア */}
      {/* Modal rendering area */}
      {isDataSelectionModalOpen && (
        <DataSelectionModal
          onClose={() => setIsDataSelectionModalOpen(false)}
          onConfirm={(data) => {
            setSelectedData(data);
            setIsDataSelectionModalOpen(false);
          }}
        />
      )}
      {isFilterModalOpen && (
        <FilterEditModal
          onClose={() => setIsFilterModalOpen(false)}
          onConfirm={(conditions) => {
            setCustomFilterConditions(conditions);
            setIsFilterModalOpen(false);
          }}
          initialConditions={customFilterConditions}
          onShowInfo={handleShowInfoModal}
        />
      )}
      {isItemSelectionModalOpen && (
        <ItemSelectionModal
          onClose={() => setIsItemSelectionModalOpen(false)}
          onConfirm={handleConfirmItemSelection}
          initialSelectedItems={selectedItems}
          onShowWarningModal={handleShowWarningModal}
          onOpenConversionSettings={handleOpenConversionSettingsModal}
          items={itemDetails}
        />
      )}
      {isSettingsEditModalOpen && (
        <SegmentSettingsEditModal
          onClose={() => setIsSettingsEditModalOpen(false)}
          onConfirm={(settings) => {
            setSegmentSettings(settings);
            setIsSettingsEditModalOpen(false);
          }}
          initialSettings={segmentSettings || defaultSettings}
        />
      )}
      {isConversionSettingsModalOpen && editingConversionItem && (
        <ConversionSettingsModal
          itemId={editingConversionItem.id}
          initialSomDataType={editingConversionItem.somDataType}
          initialSettings={editingItemDetails?.conversionDetails}
          onClose={() => setIsConversionSettingsModalOpen(false)}
          onConfirm={handleConfirmConversionSettings}
          onShowWarningModal={handleShowWarningModal}
          // データをPropsとして渡す

          categoryData={itemCategoryData[editingConversionItem.id]}
          rangeConfig={itemRangeConfig[editingConversionItem.id]}
          numericData={numericData}
          naCount={naCount}
        />
      )}
      {isWarningModalOpen && (
        <WarningModal
          message={modalMessage}
          onClose={() => setIsWarningModalOpen(false)}
        />
      )}
      {isInfoModalOpen && (
        <InfoModal
          message={modalMessage}
          onClose={() => setIsInfoModalOpen(false)}
        />
      )}
    </div>
  );
};

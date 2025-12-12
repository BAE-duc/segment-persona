
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import type { ConversionSettings, CategoryItem } from './SegmentVariableSelectionModal';
import * as d3 from 'd3';

// モーダルのPropsを定義します。
// モーダルのPropsを定義します。
interface ConversionSettingsModalProps {
    onClose: () => void;
    onConfirm: (settings: ConversionSettings) => void;
    itemId: string;
    initialSomDataType: string;
    onShowWarningModal: (message: string) => void;
    initialSettings?: ConversionSettings;
    categoryData?: CategoryItem[];
    rangeConfig?: { min: number; max: number };
    numericData?: number[];
    naCount?: number;
}

// 数値型ビュー用のスタイル付き入力コンポーネント
// 数値型ビュー用のスタイル付き入力コンポーネント
const StyledNumInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        type="text"
        {...props}
        className={`h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 ${props.className}`}
    />
);

// 右パネルヘッダー（ツールチップ付き）
const RightPanelHeader: React.FC = () => {
    const [hoverLoc, setHoverLoc] = useState<{ top: number; left: number } | null>(null);

    return (
        <h3
            className="font-semibold text-xs mb-1 text-[#586365] cursor-help underline decoration-dotted underline-offset-2 decoration-gray-400"
            onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoverLoc({ top: rect.bottom + 5, left: rect.left });
            }}
            onMouseLeave={() => setHoverLoc(null)}
        >
            セグメントに使用するカテゴリ
            {hoverLoc && (
                <div
                    className="fixed z-[9999] bg-white border border-gray-300 shadow-xl rounded-md p-3 text-left w-72 pointer-events-none"
                    style={{ top: hoverLoc.top, left: hoverLoc.left }}
                >
                    <div className="font-bold text-gray-800 mb-1 text-xs">セグメントに使用するカテゴリ</div>
                    <div className="text-gray-600 text-[10px] leading-relaxed">セグメントに使用しないカテゴリがあれば左記へ移動してください</div>
                </div>
            )}
        </h3>
    );
};

export const ConversionSettingsModal: React.FC<ConversionSettingsModalProps> = ({
    onClose,
    onConfirm,
    itemId,
    initialSomDataType,
    onShowWarningModal,
    initialSettings,
    categoryData,
    rangeConfig,
    numericData,
    naCount
}) => {
    const [somDataType, setSomDataType] = useState(initialSomDataType);

    // カテゴリ型ビューの状態
    // カテゴリ型ビューの状態
    const [leftItems, setLeftItems] = useState<CategoryItem[]>([]);
    const [rightItems, setRightItems] = useState<CategoryItem[]>([]);
    const [selectedLeftNos, setSelectedLeftNos] = useState<Set<number>>(new Set());
    const [selectedRightNos, setSelectedRightNos] = useState<Set<number>>(new Set());

    // 数値型ビューの状態
    // 数値型ビューの状態
    const currentRange = rangeConfig || { min: 1, max: 100 };
    const [minRange, setMinRange] = useState(String(currentRange.min));
    const [maxRange, setMaxRange] = useState(String(currentRange.max));
    const [errors, setErrors] = useState<{ min: string | null; max: string | null }>({ min: null, max: null });

    const [tableData, setTableData] = useState({
        total: 1000,
        na: 100,
        inRangeRatio: 100.00,
        outOfRangeRatio: 0.00,
    });

    // D3ヒストグラム用のRef

    const histogramRef = useRef<SVGSVGElement>(null);
    // コンテナのサイズを管理するstate

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // ヒストグラム用データ生成

    const histData = useMemo(() => {
        // 実際の数値データが提供されている場合はそれを使用
        if (numericData && numericData.length > 0 && rangeConfig) {
            const { min, max } = rangeConfig;
            const span = max - min + 1;
            const bins = new Array(span).fill(0);

            numericData.forEach(val => {
                const index = Math.floor(val) - min;
                if (index >= 0 && index < span) {
                    bins[index]++;
                }
            });
            return bins;
        }

        // フォールバックロジック (データがない場合のみ実行、テストデータ導入後は基本的に使用されない)
        if (itemId !== 'age' && itemId !== 'year') return [];

        const totalSamples = 900; // 全数1000 - NA100
        let dataPoints: number[] = [];

        if (itemId === 'age') {
            const mean = 45;
            const stdDev = 15;
            const rawWeights = [];
            let weightSum = 0;

            // 0歳から100歳
            for (let i = 0; i <= 100; i++) {
                const weight = Math.exp(-Math.pow(i - mean, 2) / (2 * Math.pow(stdDev, 2)));
                rawWeights.push(weight);
                weightSum += weight;
            }

            let currentTotal = 0;
            dataPoints = rawWeights.map(w => {
                const val = Math.round((w / weightSum) * totalSamples);
                currentTotal += val;
                return val;
            });

            // 合計調整 (ピーク位置45歳付近=インデックス44)
            if (dataPoints.length > 44) {
                dataPoints[44] += (totalSamples - currentTotal);
            }

        } else if (itemId === 'year') {
            // year: 2020 - 2025
            const minYear = rangeConfig?.min || 2020;
            const maxYear = rangeConfig?.max || 2025;
            const count = maxYear - minYear + 1;

            // ランダム分布 (Random Distribution)
            // ランダム分布 (Random Distribution)
            const rawWeights = [];
            let weightSum = 0;

            for (let i = 0; i < count; i++) {
                // データ数にばらつきを持たせる（平均150程度、差が100以内になるように100~200の範囲でランダム生成）

                const weight = 100 + Math.floor(Math.random() * 100);
                rawWeights.push(weight);
                weightSum += weight;
            }

            let currentTotal = 0;
            dataPoints = rawWeights.map(w => {
                const val = Math.round((w / weightSum) * totalSamples);
                currentTotal += val;
                return val;
            });

            // 合計調整 (中央付近)
            const centerIndex = Math.floor(count / 2);
            if (dataPoints.length > centerIndex) {
                dataPoints[centerIndex] += (totalSamples - currentTotal);
            }
        }

        return dataPoints;
    }, [itemId, rangeConfig, numericData]);

    // 最小値と最大値の入力が変更されるたびに検証を実行します。
    // 最小値と最大値の入力が変更されるたびに検証を実行します。
    useEffect(() => {
        const minVal = parseInt(minRange, 10);
        const maxVal = parseInt(maxRange, 10);
        const { min, max } = rangeConfig || { min: 1, max: 100 };
        const newErrors = { min: null, max: null };

        // 最小値フィールドの検証
        // 最小値フィールドの検証
        if (minRange.trim() !== '' && !isNaN(minVal)) {
            if (minVal < min) {
                newErrors.min = `MIN値以上の値を入力してください`;
            } else if (minVal > max) {
                newErrors.min = `MAX値以下の値を入力してください`;
            } else if (maxRange.trim() !== '' && !isNaN(maxVal) && minVal > maxVal) {
                newErrors.min = `最小値が最大値を超えています`;
            }
        }

        // 最大値フィールドの検証
        // 最大値フィールドの検証
        if (maxRange.trim() !== '' && !isNaN(maxVal)) {
            if (maxVal > max) {
                newErrors.max = `MAX値以下の値を入力してください`;
            } else if (maxVal < min) {
                newErrors.max = `MIN値以上の値を入力してください`;
            } else if (minRange.trim() !== '' && !isNaN(minVal) && maxVal < minVal) {
                newErrors.max = `最大値が最小値を下回っています`;
            }
        }

        setErrors(newErrors);
    }, [minRange, maxRange, itemId, rangeConfig]);

    // 値が変更されるたびに統計情報を自動的に再計算します。

    useEffect(() => {
        const minVal = parseInt(minRange, 10);
        const maxVal = parseInt(maxRange, 10);

        // 数値でない場合は計算しない（または以前の値を維持する）
        if (isNaN(minVal) || isNaN(maxVal)) return;

        let totalPopulation = 1000;
        let na = 100;
        let inRangeCount = 0;

        if (numericData && numericData.length > 0) {
            // 実際のデータを使用
            na = naCount !== undefined ? naCount : 0;
            totalPopulation = numericData.length + na;
            inRangeCount = numericData.filter(v => v >= minVal && v <= maxVal).length;
        } else if ((itemId === 'age' || itemId === 'year') && histData.length > 0) {
            // フォールバックロジック（ヒストグラムデータを使用）
            const rangeMin = rangeConfig?.min || (itemId === 'age' ? 1 : 2020);
            // インデックスオフセットの計算
            const offset = rangeMin;

            // histDataのインデックス範囲
            const startIndex = Math.max(0, minVal - offset);
            // sliceは終了インデックスを含まないので +1
            const endIndex = Math.min(histData.length, maxVal - offset + 1);

            if (startIndex < endIndex) {
                const slicedData = histData.slice(startIndex, endIndex);
                inRangeCount = slicedData.reduce((a, b) => a + b, 0);
            } else {
                inRangeCount = 0;
            }
        } else {
            // その他の項目（ダミーロジック）
            const units = (minVal === 1) ? maxVal : (maxVal - minVal);
            inRangeCount = Math.max(0, units * 10);
        }

        const inRangeRatio = totalPopulation > 0 ? (inRangeCount / totalPopulation) * 100 : 0;
        const outOfRangeCount = (totalPopulation - na) - inRangeCount;
        const outOfRangeRatio = totalPopulation > 0 ? (outOfRangeCount / totalPopulation) * 100 : 0;

        setTableData({
            // ユーザーリクエストにより、全数は範囲内の数のみを表示

            total: inRangeCount,
            na: na,
            inRangeRatio: parseFloat(inRangeRatio.toFixed(2)),
            outOfRangeRatio: parseFloat(outOfRangeRatio.toFixed(2)),
        });
    }, [minRange, maxRange, itemId, histData, rangeConfig, numericData, naCount]);

    // ResizeObserverを使用してコンテナのサイズ変更を監視

    useEffect(() => {
        if (!histogramRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        // SVGの親要素（div）を監視する方が安定する場合があるため、親要素を監視

        if (histogramRef.current.parentElement) {
            resizeObserver.observe(histogramRef.current.parentElement);
        } else {
            resizeObserver.observe(histogramRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // ドラッグイベント内で最新のstateを参照するためのRef

    const minRangeRef = useRef(minRange);
    const maxRangeRef = useRef(maxRange);

    useEffect(() => {
        minRangeRef.current = minRange;
        maxRangeRef.current = maxRange;
    }, [minRange, maxRange]);


    // D3 ヒストグラム描画（構造とドラッグハンドラの設定）

    // minRange/maxRangeの変更では再描画しないように分離
    useEffect(() => {
        if (somDataType !== '数値型' || !histogramRef.current || dimensions.width === 0 || dimensions.height === 0) return;

        const svg = d3.select(histogramRef.current);
        svg.selectAll("*").remove(); // 以前の描画をクリア

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (chartWidth <= 0 || chartHeight <= 0) return;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .attr("class", "chart-group");

        // 1. データ範囲（X軸ドメイン）の設定 - 常に全体範囲を表示
        const defaultRange = rangeConfig || { min: 1, max: 100 };
        const globalMin = defaultRange.min;
        const globalMax = defaultRange.max;

        let displayData: number[] = [];
        if (histData.length > 0) {
            displayData = histData;
        } else {
            // ダミーデータ生成
            const dummyBins = 10;
            displayData = Array.from({ length: dummyBins }, () => 10 + Math.random() * 50);
        }

        const yDomainMax = Math.max(...displayData, 1) * 1.1;

        // スケール設定
        // ドメインを[Min, Max + 1]に拡張して、最後のビンまで表示できるようにする
        const x = d3.scaleLinear()
            .domain([globalMin, globalMax + 1])
            .range([0, chartWidth]);

        const y = d3.scaleLinear()
            .domain([0, yDomainMax])
            .range([chartHeight, 0]);

        // 軸の描画
        g.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).ticks(Math.min(10, displayData.length)).tickFormat(d3.format("d")));

        g.append("g")
            .call(d3.axisLeft(y).ticks(5));

        // 棒グラフの描画
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
            .attr("fill", "#e5e7eb") // 初期カラーはグレー、useEffectで更新
            .attr("stroke", "#d1d5db")
            .attr("stroke-width", 1);

        // ドラッグ機能の実装

        // Min Line (Blue)
        const minLineGroup = g.append("g")
            .attr("class", "drag-min")
            .attr("cursor", "ew-resize");
        // 初期位置は後続のuseEffectで設定されるため、ここでは未設定でも良いが、ちらつき防止のため初期化推奨

        minLineGroup.append("line")
            .attr("y1", 0)
            .attr("y2", chartHeight)
            .attr("stroke", "#2563eb") // blue-600
            .attr("stroke-width", 2);

        minLineGroup.append("rect")
            .attr("x", -10)
            .attr("width", 20)
            .attr("height", chartHeight)
            .attr("fill", "transparent");

        // Max Line (Red)
        const maxLineGroup = g.append("g")
            .attr("class", "drag-max")
            .attr("cursor", "ew-resize");

        maxLineGroup.append("line")
            .attr("y1", 0)
            .attr("y2", chartHeight)
            .attr("stroke", "#dc2626") // red-600
            .attr("stroke-width", 2);

        maxLineGroup.append("rect")
            .attr("x", -10)
            .attr("width", 20)
            .attr("height", chartHeight)
            .attr("fill", "transparent");

        // ドラッグイベント定義
        const dragMin = d3.drag<SVGGElement, unknown>()
            .on("drag", (event) => {
                // Refから現在の最大値を取得
                const currentMaxVal = parseInt(maxRangeRef.current, 10);
                let newVal = Math.round(x.invert(event.x));

                // 制約
                const maxLimit = isNaN(currentMaxVal) ? globalMax : currentMaxVal;
                newVal = Math.max(globalMin, Math.min(newVal, maxLimit)); // min == max を許容

                setMinRange(String(newVal));
            });

        const dragMax = d3.drag<SVGGElement, unknown>()
            .on("drag", (event) => {
                // Refから現在の最小値を取得
                const currentMinVal = parseInt(minRangeRef.current, 10);
                let rawVal = x.invert(event.x);
                let newVal = Math.round(rawVal) - 1; // 視覚的な位置から値を逆算（ドメインが+1されているため）

                // 制約
                const minLimit = isNaN(currentMinVal) ? globalMin : currentMinVal;
                newVal = Math.max(minLimit, Math.min(newVal, globalMax));

                setMaxRange(String(newVal));
            });

        minLineGroup.call(dragMin);
        maxLineGroup.call(dragMax);

    }, [itemId, somDataType, rangeConfig, histData, dimensions]); // minRange, maxRangeは依存配列に含めない


    // D3 ビジュアル更新（バーの色変更、ライン移動）

    useEffect(() => {
        if (somDataType !== '数値型' || !histogramRef.current || dimensions.width === 0) return;

        const svg = d3.select(histogramRef.current);
        const g = svg.select(".chart-group");
        if (g.empty()) return;

        const { width } = dimensions;
        const margin = { left: 40, right: 20 }; // マージンはグラフ描画と一致させる
        const chartWidth = width - margin.left - margin.right;

        const defaultRange = rangeConfig || { min: 1, max: 100 };
        const globalMin = defaultRange.min;
        const globalMax = defaultRange.max;

        // ドメインを[Min, Max + 1]に設定
        const x = d3.scaleLinear()
            .domain([globalMin, globalMax + 1])
            .range([0, chartWidth]);

        const currentMinVal = parseInt(minRange, 10);
        const currentMaxVal = parseInt(maxRange, 10);

        // ビンサイズ計算（等間隔と仮定）
        const binCount = histData.length;
        // X軸の1単位あたりの幅を計算する方が正確
        // 棒グラフのロジックと一致させる: x(globalMin + i)

        // バーの色更新
        g.selectAll(".bar-rect")
            .attr("fill", (d, i) => {
                const val = globalMin + i;
                return (val >= currentMinVal && val <= currentMaxVal) ? "#93c5fd" : "#e5e7eb";
            })
            .attr("stroke", (d, i) => {
                const val = globalMin + i;
                return (val >= currentMinVal && val <= currentMaxVal) ? "#60a5fa" : "#d1d5db";
            });

        // ライン位置更新
        const safeMin = isNaN(currentMinVal) ? globalMin : currentMinVal;
        const safeMax = isNaN(currentMaxVal) ? globalMax : currentMaxVal;

        g.select(".drag-min").attr("transform", `translate(${x(safeMin)}, 0)`);
        // Maxラインは選択範囲の「終わり」を示すため、safeMax + 1 の位置に表示
        g.select(".drag-max").attr("transform", `translate(${x(safeMax + 1)}, 0)`);

    }, [minRange, maxRange, somDataType, dimensions, rangeConfig, histData]);


    // 右側のテーブルの累積割合を再計算するヘルパー関数。
    // 右側のテーブルの累積割合を再計算するヘルパー関数。
    const recalculateCumulative = (items: CategoryItem[]): CategoryItem[] => {
        // 項目を 'no' プロパティでソートして、正しい計算順序を保証します。
        // 項目を 'no' プロパティでソートして、正しい計算順序を保証します。
        const sortedItems = [...items].sort((a, b) => a.no - b.no);

        let cumulativeTotal = 0;
        return sortedItems.map(item => {
            cumulativeTotal += item.ratio;
            // 小数点第1位に丸めます
            // 小数点第1位に丸めます
            const roundedCumulative = parseFloat(cumulativeTotal.toFixed(1));
            return { ...item, cumulative: roundedCumulative };
        });
    };

    // 以前に保存した設定でモーダルを初期化するか、デフォルト値を設定します。
    // 以前に保存した設定でモーダルを初期化するか、デフォルト値を設定します。
    useEffect(() => {
        if (somDataType === 'カテゴリ型') {
            const allItems = categoryData || [];
            if (initialSettings?.type === 'categorical' && initialSettings.categories) {
                const right = allItems.filter(item => initialSettings.categories!.includes(item.name));
                const left = allItems.filter(item => !initialSettings.categories!.includes(item.name));
                setRightItems(recalculateCumulative(right));
                setLeftItems(left.sort((a, b) => a.no - b.no));
            } else {
                // デフォルトでは全選択（すべて右側）
                // デフォルトでは全選択（すべて右側）
                setLeftItems([]);
                setRightItems(recalculateCumulative(allItems));
            }
        } else { // '数値型'
            const range = rangeConfig || { min: 1, max: 100 };
            setMinRange(String(initialSettings?.range?.min ?? range.min));
            setMaxRange(String(initialSettings?.range?.max ?? range.max));
        }
    }, [itemId, somDataType, initialSettings, categoryData, rangeConfig]);


    const handleToggleLeftSelection = (no: number) => {
        setSelectedLeftNos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(no)) newSet.delete(no);
            else newSet.add(no);
            return newSet;
        });
    };

    const handleToggleRightSelection = (no: number) => {
        setSelectedRightNos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(no)) newSet.delete(no);
            else newSet.add(no);
            return newSet;
        });
    };

    const moveToRight = () => {
        const itemsToMove = leftItems.filter(item => selectedLeftNos.has(item.no));
        setRightItems(prev => recalculateCumulative([...prev, ...itemsToMove]));
        setLeftItems(prev => prev.filter(item => !selectedLeftNos.has(item.no)));
        setSelectedLeftNos(new Set());
    };

    const moveToLeft = () => {
        const itemsToMove = rightItems.filter(item => selectedRightNos.has(item.no));
        setLeftItems(prev => [...prev, ...itemsToMove].sort((a, b) => a.no - b.no));
        setRightItems(prev => recalculateCumulative(prev.filter(item => !selectedRightNos.has(item.no))));
        setSelectedRightNos(new Set());
    };

    const moveAllToRight = () => {
        setRightItems(prev => recalculateCumulative([...prev, ...leftItems]));
        setLeftItems([]);
        setSelectedLeftNos(new Set());
    };

    const moveAllToLeft = () => {
        setLeftItems(prev => [...prev, ...rightItems].sort((a, b) => a.no - b.no));
        setRightItems([]);
        setSelectedRightNos(new Set());
    };

    const handleMinRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // 数字または空の文字列のみを許可します。
        // 数字または空の文字列のみを許可します。
        if (/^\d*$/.test(value)) {
            setMinRange(value);
        }
    };

    const handleMaxRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // 数字または空の文字列のみを許可します。
        // 数字または空の文字列のみを許可します。
        if (/^\d*$/.test(value)) {
            setMaxRange(value);
        }
    };

    const runValidation = () => {
        const minVal = parseInt(minRange, 10);
        const maxVal = parseInt(maxRange, 10);
        const { min, max } = rangeConfig || { min: 1, max: 100 };
        const errorMessages = new Set<string>();

        // 包括的な検証
        // 包括的な検証
        if (minRange.trim() === '' || isNaN(minVal)) {
            errorMessages.add("最小値に有効な数値を入力してください。");
        } else {
            if (minVal < min) errorMessages.add(`MIN値以上の値を入力してください`);
            else if (minVal > max) errorMessages.add(`MAX値以下の値を入力してください`);
        }

        if (maxRange.trim() === '' || isNaN(maxVal)) {
            errorMessages.add("最大値に有効な数値を入力してください。");
        } else {
            if (maxVal > max) errorMessages.add(`MAX値以下の値を入力してください`);
            else if (maxVal < min) errorMessages.add(`MIN値以上の値を入力してください`);
        }

        if (minRange.trim() !== '' && !isNaN(minVal) && maxRange.trim() !== '' && !isNaN(maxVal)) {
            if (minVal > maxVal) {
                errorMessages.add(`最小値が最大値を超えています`);
                errorMessages.add(`最大値が最小値を下回っています`);
            }
        }
        return Array.from(errorMessages);
    }


    const handleConfirm = () => {
        if (somDataType === '数値型') {
            const errors = runValidation();
            if (errors.length > 0) {
                onShowWarningModal(errors.join('\n'));
                return;
            }
            onConfirm({
                type: 'numerical',
                range: { min: minRange, max: maxRange }
            });
        } else { // 'カテゴリ型'
            onConfirm({
                type: 'categorical',
                categories: rightItems.map(item => item.name)
            });
        }
    };

    const renderCategoricalTable = (
        items: CategoryItem[],
        selectedNos: Set<number>,
        onRowClick: (no: number) => void
    ) => (
        <div className="flex-grow overflow-y-auto">
            <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                        <th className="p-1 font-semibold text-left border-b border-r border-gray-300 w-12 text-center">No.</th>
                        <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">名称</th>
                        <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">サンプル数</th>
                        <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">割合(%)</th>
                        <th className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2">累積(%)</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr
                            key={item.no}
                            className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedNos.has(item.no))}`}
                            onClick={() => onRowClick(item.no)}
                        >
                            <td className="p-1 border-b border-r border-gray-200 text-center">{item.no}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2">{item.name}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2">{item.samples.toLocaleString()}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2">{item.ratio}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2">{item.cumulative}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCategoricalView = () => (
        <>
            <div className="flex flex-col items-start gap-1">
                <span className="text-sm font-bold">{itemId}</span>
                <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium">データ型</label>
                    <AppSelect value={somDataType} onChange={e => setSomDataType(e.target.value)} className="w-32">
                        <option value="カテゴリ型">カテゴリ型</option>
                        <option value="数値型">数値型</option>
                    </AppSelect>
                </div>
            </div>
            <div className="flex-grow flex gap-2 overflow-hidden">
                <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-xs mb-1 text-[#586365]">セグメントに使用しないカテゴリ</h3>
                    <div className="flex items-center space-x-1 mb-2">
                        <input type="text" className="flex-grow h-[28px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400" />
                        <button
                            className="flex items-center justify-center flex-shrink-0 h-[28px] w-[28px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700 font-semibold rounded-md"
                            aria-label="検索オプション"
                        >
                            ↓
                        </button>
                    </div>
                    <div className="flex-grow border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col">
                        {renderCategoricalTable(leftItems, selectedLeftNos, handleToggleLeftSelection)}
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center space-y-2 px-2">
                    <AppButton onClick={moveToRight} disabled={selectedLeftNos.size === 0} className="px-3 py-1 text-xs">{'>'}</AppButton>
                    <AppButton onClick={moveToLeft} disabled={selectedRightNos.size === 0} className="px-3 py-1 text-xs">{'<'}</AppButton>
                    <AppButton onClick={moveAllToRight} disabled={leftItems.length === 0} className="px-3 py-1 text-xs">ALL{'>'}</AppButton>
                    <AppButton onClick={moveAllToLeft} disabled={rightItems.length === 0} className="px-3 py-1 text-xs">{'<'}ALL</AppButton>
                </div>

                <div className="flex-1 flex flex-col">
                    <RightPanelHeader />
                    <div className="flex items-center space-x-1 mb-2">
                        <input type="text" className="flex-grow h-[28px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400" />
                        <button
                            className="flex items-center justify-center flex-shrink-0 h-[28px] w-[28px] border border-gray-400 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700 font-semibold rounded-md"
                            aria-label="検索オプション"
                        >
                            ↓
                        </button>
                    </div>
                    <div className="flex-grow border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col">
                        {renderCategoricalTable(rightItems, selectedRightNos, handleToggleRightSelection)}
                    </div>
                </div>
            </div>
        </>
    );

    const renderNumericalView = () => {
        const range = rangeConfig || { min: 1, max: 100 };

        return (
            <div className="flex flex-col h-full gap-4">
                {/* 上部：設定 */}
                {/* 上部：設定 */}
                <div className="flex-shrink-0">
                    <p className="text-sm font-bold mb-4">{itemId}</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                        <div className="flex items-center gap-2">
                            <label className="w-24 text-right flex-shrink-0">データ型</label>
                            <AppSelect value={somDataType} onChange={e => setSomDataType(e.target.value)} className="w-full">
                                <option value="数値型">数値型</option>
                                <option value="カテゴリ型">カテゴリ型</option>
                            </AppSelect>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="w-24 text-right flex-shrink-0">欠損値処理</label>
                            <AppSelect defaultValue="中央値補完" className="w-full">
                                <option>平均値</option>
                                <option>中央値補完</option>
                                <option>最大値</option>
                                <option>最小値</option>
                                <option>削除</option>
                            </AppSelect>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="w-24 text-right flex-shrink-0">外れ値検知</label>
                            <AppSelect defaultValue="1.5×IQR" className="w-full">
                                <option>1.5×IQR</option>
                                <option>3×IQR</option>
                                <option>カスタム</option>
                            </AppSelect>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="w-24 text-right flex-shrink-0">外れ値処理</label>
                            <AppSelect defaultValue="閾値補完" className="w-full">
                                <option>閾値補完</option>
                                <option>平均値</option>
                                <option>中央値</option>
                                <option>削除</option>
                            </AppSelect>
                        </div>
                    </div>
                </div>

                {/* 下部：詳細 */}
                {/* 下部：詳細 */}
                <div className="flex-grow grid grid-cols-2 gap-8 pt-4 min-h-0">
                    {/* 左列 */}
                    {/* 左列 */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="font-semibold text-xs mb-2 text-[#586365]">
                                値範囲設定
                                <span className="font-normal text-gray-600 ml-2">(MIN:{range.min}, MAX:{range.max})</span>
                            </h3>
                            <div className="flex items-start gap-2">
                                <div className="flex flex-col flex-1">
                                    <StyledNumInput
                                        value={minRange}
                                        onChange={handleMinRangeChange}
                                        className={`${errors.min ? 'bg-red-100' : ''}`}
                                    />
                                    {errors.min && <span className="text-red-600 text-xs mt-1">{errors.min}</span>}
                                </div>
                                <span className="pt-2">〜</span>
                                <div className="flex flex-col flex-1">
                                    <StyledNumInput
                                        value={maxRange}
                                        onChange={handleMaxRangeChange}
                                        className={`${errors.max ? 'bg-red-100' : ''}`}
                                    />
                                    {errors.max && <span className="text-red-600 text-xs mt-1">{errors.max}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex-grow">
                            <table className="w-full text-xs border-collapse table-fixed">
                                <tbody>
                                    <tr className="border-y border-gray-300">
                                        <td className="w-2/3 font-semibold p-2 border-r border-gray-300 bg-gray-100">全数(件)</td>
                                        <td className="w-1/3 p-2 text-right">{tableData.total.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="font-semibold p-2 border-r border-gray-300 bg-gray-100">NA(件)</td>
                                        <td className="p-2 text-right">{tableData.na.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="font-semibold p-2 border-r border-gray-300 bg-gray-100">範囲内割合(%)</td>
                                        <td className="p-2 text-right">{tableData.inRangeRatio.toFixed(2)}</td>
                                    </tr>
                                    <tr className="border-b border-gray-300">
                                        <td className="font-semibold p-2 border-r border-gray-300 bg-gray-100">値範囲外割合(%)</td>
                                        <td className="p-2 text-right">{tableData.outOfRangeRatio.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 右列 */}
                    {/* 右列 */}
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-xs mb-2 text-[#586365]">ヒストグラム</h3>
                        <div className="flex-grow border border-gray-300 rounded-md flex items-center justify-center bg-white relative overflow-hidden">
                            {/* 常にSVGを表示し、useEffect内で描画制御する */}
                            <svg ref={histogramRef} width="100%" height="100%"></svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


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
                    <h2 className={modalStyles.header.title}>変換設定</h2>
                    <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
                </div>

                {/* Body */}
                <div className={`${modalStyles.body.container} flex flex-col gap-4`}>
                    {somDataType === 'カテゴリ型' ? renderCategoricalView() : renderNumericalView()}
                </div>

                {/* Footer */}
                <div className={`${modalStyles.footer.container} justify-end`}>
                    <div className={modalStyles.footer.buttonGroup}>
                        <AppButton onClick={handleConfirm} className="w-24 py-1">OK</AppButton>
                        <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

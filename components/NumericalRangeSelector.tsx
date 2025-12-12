
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppButton } from './shared/FormControls';
import * as d3 from 'd3';

// 数値範囲の型定義
export interface NumericalRange {
    id: string;
    min: number;
    max: number;
    label: string;
}

interface NumericalRangeSelectorProps {
    itemId: string;
    rangeConfig: { min: number; max: number };
    numericData?: number[];
    naCount?: number;
    initialRanges?: NumericalRange[];
    onRangesChange: (ranges: NumericalRange[]) => void;
    maxRanges?: number;
}

// スタイル付き入力コンポーネント
const StyledNumInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        type="text"
        {...props}
        className={`h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 ${props.className}`}
    />
);

export const NumericalRangeSelector: React.FC<NumericalRangeSelectorProps> = ({
    itemId,
    rangeConfig,
    numericData,
    naCount,
    initialRanges = [],
    onRangesChange,
    maxRanges = 4
}) => {
    const [minRange, setMinRange] = useState(String(rangeConfig.min));
    const [maxRange, setMaxRange] = useState(String(rangeConfig.max));
    const [ranges, setRanges] = useState<NumericalRange[]>(initialRanges);
    const [errors, setErrors] = useState<{ min: string | null; max: string | null }>({ min: null, max: null });

    const histogramRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const minRangeRef = useRef(minRange);
    const maxRangeRef = useRef(maxRange);

    useEffect(() => {
        minRangeRef.current = minRange;
        maxRangeRef.current = maxRange;
    }, [minRange, maxRange]);

    // rangeConfigが変更されたら入力値をリセット
    useEffect(() => {
        setMinRange(String(rangeConfig.min));
        setMaxRange(String(rangeConfig.max));
    }, [rangeConfig]);

    // ヒストグラム用データ生成
    const histData = useMemo(() => {
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
        return [];
    }, [itemId, rangeConfig, numericData]);

    // バリデーション
    useEffect(() => {
        const minVal = parseInt(minRange, 10);
        const maxVal = parseInt(maxRange, 10);
        const { min, max } = rangeConfig;
        const newErrors = { min: null, max: null };

        if (minRange.trim() !== '' && !isNaN(minVal)) {
            if (minVal < min) {
                newErrors.min = `MIN値以上の値を入力してください`;
            } else if (minVal > max) {
                newErrors.min = `MAX値以下の値を入力してください`;
            } else if (maxRange.trim() !== '' && !isNaN(maxVal) && minVal > maxVal) {
                newErrors.min = `最小値が最大値を超えています`;
            }
        }

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
    }, [minRange, maxRange, rangeConfig]);

    // ResizeObserver
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
        } else {
            resizeObserver.observe(histogramRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // D3 ヒストグラム描画
    useEffect(() => {
        if (!histogramRef.current || dimensions.width === 0 || dimensions.height === 0) return;

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

        const globalMin = rangeConfig.min;
        const globalMax = rangeConfig.max;

        let displayData: number[] = histData.length > 0 ? histData : Array.from({ length: 10 }, () => 10 + Math.random() * 50);
        const yDomainMax = Math.max(...displayData, 1) * 1.1;

        const x = d3.scaleLinear()
            .domain([globalMin, globalMax + 1])
            .range([0, chartWidth]);

        const y = d3.scaleLinear()
            .domain([0, yDomainMax])
            .range([chartHeight, 0]);

        // 軸
        g.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).ticks(Math.min(10, displayData.length)).tickFormat(d3.format("d")));

        g.append("g")
            .call(d3.axisLeft(y).ticks(5));

        // 棒グラフ
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
            .attr("stroke", "#d1d5db")
            .attr("stroke-width", 1);

        // ドラッグライン
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

        // ドラッグイベント
        const dragMin = d3.drag<SVGGElement, unknown>()
            .on("drag", (event) => {
                const currentMaxVal = parseInt(maxRangeRef.current, 10);
                let newVal = Math.round(x.invert(event.x));
                const maxLimit = isNaN(currentMaxVal) ? globalMax : currentMaxVal;
                newVal = Math.max(globalMin, Math.min(newVal, maxLimit));
                setMinRange(String(newVal));
            });

        const dragMax = d3.drag<SVGGElement, unknown>()
            .on("drag", (event) => {
                const currentMinVal = parseInt(minRangeRef.current, 10);
                let rawVal = x.invert(event.x);
                let newVal = Math.round(rawVal) - 1;
                const minLimit = isNaN(currentMinVal) ? globalMin : currentMinVal;
                newVal = Math.max(minLimit, Math.min(newVal, globalMax));
                setMaxRange(String(newVal));
            });

        minLineGroup.call(dragMin);
        maxLineGroup.call(dragMax);

    }, [rangeConfig, histData, dimensions]);

    // ビジュアル更新
    useEffect(() => {
        if (!histogramRef.current || dimensions.width === 0) return;

        const svg = d3.select(histogramRef.current);
        const g = svg.select(".chart-group");
        if (g.empty()) return;

        const { width } = dimensions;
        const margin = { left: 40, right: 20 };
        const chartWidth = width - margin.left - margin.right;

        const globalMin = rangeConfig.min;
        const globalMax = rangeConfig.max;

        const x = d3.scaleLinear()
            .domain([globalMin, globalMax + 1])
            .range([0, chartWidth]);

        const currentMinVal = parseInt(minRange, 10);
        const currentMaxVal = parseInt(maxRange, 10);

        g.selectAll(".bar-rect")
            .attr("fill", (d, i) => {
                const val = globalMin + i;
                return (val >= currentMinVal && val <= currentMaxVal) ? "#93c5fd" : "#e5e7eb";
            })
            .attr("stroke", (d, i) => {
                const val = globalMin + i;
                return (val >= currentMinVal && val <= currentMaxVal) ? "#60a5fa" : "#d1d5db";
            });

        const safeMin = isNaN(currentMinVal) ? globalMin : currentMinVal;
        const safeMax = isNaN(currentMaxVal) ? globalMax : currentMaxVal;

        g.select(".drag-min").attr("transform", `translate(${x(safeMin)}, 0)`);
        g.select(".drag-max").attr("transform", `translate(${x(safeMax + 1)}, 0)`);

    }, [minRange, maxRange, dimensions, rangeConfig, histData]);

    const handleMinRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMinRange(value);
        }
    };

    const handleMaxRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setMaxRange(value);
        }
    };

    const handleAddRange = () => {
        const minVal = parseInt(minRange, 10);
        const maxVal = parseInt(maxRange, 10);

        if (isNaN(minVal) || isNaN(maxVal) || errors.min || errors.max) {
            return;
        }

        const newRange: NumericalRange = {
            id: `range-${Date.now()}`,
            min: minVal,
            max: maxVal,
            label: `条件${ranges.length + 1}`
        };

        const newRanges = [...ranges, newRange];
        setRanges(newRanges);
        onRangesChange(newRanges);
    };

    const handleDeleteRange = (id: string) => {
        const newRanges = ranges.filter(r => r.id !== id).map((r, index) => ({
            ...r,
            label: `条件${index + 1}`
        }));
        setRanges(newRanges);
        onRangesChange(newRanges);
    };

    const canAddRange = ranges.length < maxRanges && !errors.min && !errors.max && minRange.trim() !== '' && maxRange.trim() !== '';

    return (
        <div className="flex flex-col h-full gap-2">
            {/* 値範囲直接設定 */}
            <div className="flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs font-medium text-[#586365] w-128">値範囲設定（MIN:{rangeConfig.min}, MAX:{rangeConfig.max}）</label>
                </div>
                <div className="flex items-center gap-2">
                    <StyledNumInput
                        value={minRange}
                        onChange={handleMinRangeChange}
                        placeholder="MIN"
                        className="w-24"
                    />
                    <span className="text-xs">−</span>
                    <StyledNumInput
                        value={maxRange}
                        onChange={handleMaxRangeChange}
                        placeholder="MAX"
                        className="w-24"
                    />
                </div>
                {(errors.min || errors.max) && (
                    <div className="text-xs text-red-600 mt-1">
                        {errors.min || errors.max}
                    </div>
                )}
            </div>

            {/* ヒストグラム */}
            <div className="flex-shrink-0">
                <label className="text-xs font-medium text-[#586365] mb-1 block">ヒストグラム</label>
                <div className="border border-gray-400 rounded-md bg-white" style={{ height: '200px' }}>
                    <svg ref={histogramRef} width="100%" height="100%" />
                </div>
            </div>

            {/* 追加ボタン */}
            <div className="flex-shrink-0 flex justify-end">
                <AppButton
                    onClick={handleAddRange}
                    disabled={!canAddRange}
                    className="px-4 py-1"
                >
                    追加
                </AppButton>
            </div>

            {/* 条件リスト */}
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow border border-gray-400 rounded-md bg-white overflow-y-auto">
                    {ranges.map((range) => (
                        <div
                            key={range.id}
                            className="flex items-center justify-between px-3 py-2 border-b border-gray-200 last:border-b-0"
                        >
                            <span className="text-xs font-medium">{range.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">{range.min} - {range.max}</span>
                                <AppButton
                                    onClick={() => handleDeleteRange(range.id)}
                                    className="px-3 py-1 text-xs"
                                >
                                    削除
                                </AppButton>
                            </div>
                        </div>
                    ))}
                    {ranges.length === 0 && (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500">
                            条件を追加してください
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

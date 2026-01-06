
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { TEST_CSV_RAW } from '../data/testData';
import type { ItemDetail } from './ItemSelectionModal';

interface CompositionRatioGraphProps {
    variable: ItemDetail;
    segmentCount: number;
    selectedSegments?: number[];
    rangeConfigs?: Record<string, { min: number; max: number }>;
    displayCategoryConfigs?: Record<string, string[]>;
    // 選択されたカテゴリを受け取るためのPropを追加
    adoptedChoices?: { id: number; content: string }[];
    isCountView?: boolean;
}

export const CompositionRatioGraph: React.FC<CompositionRatioGraphProps> = ({
    variable,
    segmentCount,
    selectedSegments,
    rangeConfigs,
    displayCategoryConfigs,
    adoptedChoices,
    isCountView = false
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltipData, setTooltipData] = useState<{
        x: number;
        y: number;
        title: string;
        items: { label: string; value: string; color: string; rawVal: number }[];
        activeSegment?: string;
    } | null>(null);

    // Data Processing
    const chartData = useMemo(() => {
        const lines = TEST_CSV_RAW.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const varIndex = headers.indexOf(variable.id);

        if (varIndex === -1) return [];

        const getAgeBin = (ageStr: string): string => {
            if (!ageStr || ageStr === 'NA' || ageStr === '') return 'NA';
            const age = parseInt(ageStr, 10);
            if (isNaN(age)) return 'NA';
            if (age <= 19) return '19歳以下';
            if (age >= 60) return '60歳以上';
            const lower = Math.floor(age / 5) * 5;
            return `${lower}-${lower + 4}歳`;
        };

        // Parse rows
        const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));

        // Assign Segments (Mock - using random but consistent seed based on row index would be better, but random is fine for demo)
        // Note: In a real app, segment IDs come from the segmentation result.
        const rowsWithSegment = rows.map((row, idx) => ({
            val: row[varIndex],
            // Use a pseudo-random generator seeded by index to keep segments consistent across re-renders
            segment: (Math.floor((Math.sin(idx) + 1) * 10000) % segmentCount) + 1
        }));

        // Group by Variable Choice
        const choiceCounts: Record<string, { total: number; segments: Record<number, number> }> = {};
        const uniqueChoices = new Set<string>();

        rowsWithSegment.forEach(r => {
            let val = r.val;
            if (variable.id === 'age') val = getAgeBin(val);
            else if (variable.id === 'year') {
                // keep as string but it is year
            }
            else if (!val || val === '') val = 'NA';

            // Apply Display Category Configs if present (Global Filter)
            // ユーザーが構成比比較用に明示的にカテゴリを選んでいる場合(adoptedChoicesがある場合)、
            // その変数のグローバルフィルター(displayCategoryConfigs)は無視して、ローカルな選択を優先します。
            const hasLocalOverride = adoptedChoices && adoptedChoices.length > 0;

            if (!hasLocalOverride && displayCategoryConfigs && displayCategoryConfigs[variable.id]) {
                if (!displayCategoryConfigs[variable.id].includes(val)) return;
            }

            // Apply Adopted Choices Filter (Selection from Modal)
            // モーダルで選択されたカテゴリのみを表示するようにフィルタリング
            if (hasLocalOverride) {
                const isSelected = adoptedChoices!.some(c => c.content === val);
                if (!isSelected) return;
            }

            uniqueChoices.add(val);

            if (!choiceCounts[val]) {
                choiceCounts[val] = { total: 0, segments: {} };
                for (let i = 1; i <= segmentCount; i++) choiceCounts[val].segments[i] = 0;
            }
            choiceCounts[val].total++;
            choiceCounts[val].segments[r.segment]++;
        });

        // Format for D3 Stack
        const data = Array.from(uniqueChoices).map(choice => {
            const entry: any = { choice };
            const counts = choiceCounts[choice];
            for (let i = 1; i <= segmentCount; i++) {
                const count = counts.segments[i];
                if (isCountView) {
                    entry[`segment${i}`] = count;
                } else {
                    const ratio = counts.total > 0 ? (count / counts.total) * 100 : 0;
                    entry[`segment${i}`] = ratio;
                }
            }
            return entry;
        });

        // Sort Choices
        if (variable.id === 'year' || (variable.dataType === 'int' && variable.id !== 'age')) {
            data.sort((a, b) => {
                const valA = parseInt(a.choice);
                const valB = parseInt(b.choice);
                if (isNaN(valA)) return 1;
                if (isNaN(valB)) return -1;
                return valA - valB;
            });
        } else if (variable.id === 'age') {
            const getAgeSortOrder = (bin: string): number => {
                if (bin === '19歳以下') return 0;
                if (bin === '60歳以上') return 100;
                if (bin === 'NA') return 999;
                const match = bin.match(/^(\d+)/);
                return match ? parseInt(match[1], 10) : 50;
            };
            data.sort((a, b) => getAgeSortOrder(a.choice) - getAgeSortOrder(b.choice));
        } else {
            data.sort((a, b) => a.choice.localeCompare(b.choice));
        }

        return data;

    }, [variable, segmentCount, displayCategoryConfigs, adoptedChoices, isCountView]);

    // D3 Rendering
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        if (chartData.length === 0) {
            svg.append("text")
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("text-anchor", "middle")
                .attr("fill", "#9ca3af")
                .text("表示するデータがありません");
            return;
        }

        const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
        if (containerWidth <= 0 || containerHeight <= 0) return;

        // Adjusted bottom margin since legend is now outside the SVG area
        const margin = { top: 40, right: 20, bottom: 50, left: 50 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .domain(chartData.map(d => d.choice))
            .range([0, width])
            .padding(0.2);

        // Find max value for Y domain
        // 選択されたセグメントのみを表示対象にする
        const displayedSegments = selectedSegments && selectedSegments.length > 0 
            ? selectedSegments 
            : Array.from({ length: segmentCount }, (_, i) => i + 1);
            
        const segmentKeys = displayedSegments.map(num => `segment${num}`);
        
        let maxY = 100;
        if (isCountView) {
            const maxVal = d3.max(chartData, d => d3.max(segmentKeys, k => d[k] as number)) || 0;
            maxY = Math.ceil(maxVal / 10) * 10;
            if (maxY === 0) maxY = 10;
        }

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .range([height, 0]);

        // Custom pastel-like colors similar to the image
        const colors = [
            '#AEC7E8', '#FFBB78', '#98DF8A', '#FF9896', '#C5B0D5', '#C49C94',
            '#F7B6D2', '#C7C7C7', '#DBDB8D', '#9EDAE5', '#1F77B4', '#FF7F0E',
            '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#E377C2', '#7F7F7F',
            '#BCBD22', '#17BECF'
        ];
        const color = d3.scaleOrdinal<string, string>().domain(segmentKeys).range(colors);

        // Axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", "1em");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => isCountView ? `${d}` : `${d}%`));

        // Line generator
        const line = d3.line<any>()
            .x(d => x(d.choice)! + x.bandwidth() / 2)
            .y(d => y(d.value));

        // Draw Lines and Points for each segment
        segmentKeys.forEach((key) => {
            const segmentData = chartData.map(d => ({
                choice: d.choice,
                value: d[key],
                segmentKey: key
            }));

            // Append Path
            g.append("path")
                .datum(segmentData)
                .attr("fill", "none")
                .attr("stroke", color(key))
                .attr("stroke-width", 3)
                .attr("d", line);

            // Append Circles for interactivity
            g.selectAll(`.dot-${key}`)
                .data(segmentData)
                .enter().append("circle")
                .attr("class", `dot-${key}`)
                .attr("cx", d => x(d.choice)! + x.bandwidth() / 2)
                .attr("cy", d => y(d.value))
                .attr("r", 5)
                .attr("fill", color(key))
                .attr("stroke", "white")
                .attr("stroke-width", 1.5)
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("r", 8).attr("stroke-width", 2);

                    // Show all segments for this category in tooltip
                    const choiceData = chartData.find(cd => cd.choice === d.choice);
                    const items = segmentKeys.slice().reverse().map(k => ({
                        label: k,
                        value: isCountView ? `${(choiceData[k] as number).toFixed(0)}件` : `${(choiceData[k] as number).toFixed(0)}%`,
                        color: color(k),
                        rawVal: choiceData[k] as number
                    })).filter(item => item.rawVal > 0);

                    setTooltipData({
                        x: event.clientX,
                        y: event.clientY,
                        title: d.choice,
                        items: items,
                        activeSegment: d.segmentKey
                    });
                })
                .on("mousemove", function (event) {
                    setTooltipData(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 5).attr("stroke-width", 1.5);
                    setTooltipData(null);
                });
        });

        // Title
        svg.append("text")
            .attr("x", width / 2 + margin.left)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`セグメント${isCountView ? 'n数' : '構成比 (%)'} (推移)`);

    }, [chartData, segmentCount, selectedSegments, isCountView]);

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Graph Area - flex-grow takes remaining space */}
            <div ref={containerRef} className="flex-grow min-h-0 relative w-full">
                <svg ref={svgRef} width="100%" height="100%"></svg>
            </div>

            {/* Legend Area - flex-shrink-0 sits at the bottom outside graph area */}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-gray-50 max-h-[150px] overflow-y-auto">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4">
                    {(selectedSegments && selectedSegments.length > 0 
                        ? selectedSegments 
                        : Array.from({ length: segmentCount }, (_, i) => i + 1)
                    ).map((num) => {
                        const i = num - 1;
                        const segmentName = `segment${num}`;
                        const colors = [
                            '#AEC7E8', '#FFBB78', '#98DF8A', '#FF9896', '#C5B0D5', '#C49C94',
                            '#F7B6D2', '#C7C7C7', '#DBDB8D', '#9EDAE5', '#1F77B4', '#FF7F0E',
                            '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#E377C2', '#7F7F7F',
                            '#BCBD22', '#17BECF'
                        ];
                        const color = colors[i % colors.length];
                        return (
                            <div key={i} className="flex items-center text-[10px] text-gray-600 bg-white bg-opacity-90 px-1 rounded border border-gray-200 shadow-sm mb-1">
                                <div className="w-2 h-2 mr-1" style={{ backgroundColor: color }}></div>
                                <span>{segmentName}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {tooltipData && (
                <div
                    className="fixed z-50 bg-black bg-opacity-80 text-white text-xs rounded p-2 pointer-events-none shadow-lg border border-gray-600"
                    style={{
                        left: tooltipData.x - 15,
                        top: tooltipData.y - 50,
                        minWidth: '140px',
                        transform: 'translateX(-100%)'
                    }}
                >
                    <div className="font-bold mb-1 border-b border-gray-500 pb-1 text-center">{tooltipData.title}</div>
                    <div className="flex flex-col gap-0.5">
                        {tooltipData.items.map((item, i) => {
                            const isActive = item.label === tooltipData.activeSegment;
                            return (
                                <div key={i} className={`flex items-center justify-between ${isActive ? 'my-1' : ''}`}>
                                    <div className="flex items-center">
                                        <div className={`mr-1 rounded-full ${isActive ? 'w-3 h-3' : 'w-2 h-2'}`} style={{ backgroundColor: item.color }}></div>
                                        <span className={`${isActive ? 'font-bold text-base text-white' : ''}`}>{item.label}</span>
                                    </div>
                                    <span className={`ml-2 font-mono ${isActive ? 'font-bold text-base text-white' : ''}`}>{item.value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

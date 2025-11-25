
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { TEST_CSV_RAW } from '../data/testData';
import type { ItemDetail } from './ItemSelectionModal';

interface CompositionRatioGraphProps {
    variable: ItemDetail;
    segmentCount: number;
    rangeConfigs?: Record<string, { min: number; max: number }>;
    displayCategoryConfigs?: Record<string, string[]>;
    // 選択された選択肢を受け取るためのPropを追加

    adoptedChoices?: { id: number; content: string }[];
}

export const CompositionRatioGraph: React.FC<CompositionRatioGraphProps> = ({
    variable,
    segmentCount,
    rangeConfigs,
    displayCategoryConfigs,
    adoptedChoices
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
            // ユーザーが構成比比較用に明示的に選択肢を選んでいる場合(adoptedChoicesがある場合)、
            // その変数のグローバルフィルター(displayCategoryConfigs)は無視して、ローカルな選択を優先します。
            const hasLocalOverride = adoptedChoices && adoptedChoices.length > 0;

            if (!hasLocalOverride && displayCategoryConfigs && displayCategoryConfigs[variable.id]) {
                if (!displayCategoryConfigs[variable.id].includes(val)) return;
            }

            // Apply Adopted Choices Filter (Selection from Modal)
            // モーダルで選択された選択肢のみを表示するようにフィルタリング
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
                const ratio = counts.total > 0 ? (count / counts.total) * 100 : 0;
                entry[`segment${i}`] = ratio;
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

    }, [variable, segmentCount, displayCategoryConfigs, adoptedChoices]);

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

        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        const segmentKeys = Array.from({ length: segmentCount }, (_, i) => `segment${i + 1}`);

        // Custom pastel-like colors similar to the image
        const colors = [
            '#AEC7E8', '#FFBB78', '#98DF8A', '#FF9896', '#C5B0D5', '#C49C94',
            '#F7B6D2', '#C7C7C7', '#DBDB8D', '#9EDAE5', '#1F77B4', '#FF7F0E',
            '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#E377C2', '#7F7F7F',
            '#BCBD22', '#17BECF'
        ];
        const color = d3.scaleOrdinal<string, string>().domain(segmentKeys).range(colors);

        const stack = d3.stack<any>().keys(segmentKeys)(chartData);

        // Axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", "1em");

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));

        // Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("セグメント構成比");

        // Stacked Bars
        const layer = g.selectAll(".layer")
            .data(stack)
            .enter().append("g")
            .attr("class", "layer")
            .attr("fill", (d) => color(d.key));

        layer.selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.choice)!)
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .attr("stroke", "white")
            .attr("stroke-width", "0.5px")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("opacity", "0.8");

                // Retrieve key (segment name) from parent node (series data)
                const parentNode = this.parentNode as Element;
                const seriesData = d3.select(parentNode).datum() as any;
                const activeSegment = seriesData.key;

                // Tooltip logic
                const choiceData = d.data;
                // Show all segments for this column
                const items = segmentKeys.slice().reverse().map(key => {
                    const val = choiceData[key] as number;
                    return {
                        label: key,
                        value: `${val.toFixed(0)}%`,
                        color: color(key),
                        rawVal: val
                    };
                }).filter(item => item.rawVal > 0); // only show present segments

                setTooltipData({
                    x: event.clientX,
                    y: event.clientY,
                    title: choiceData.choice,
                    items: items,
                    activeSegment: activeSegment // Pass active segment for highlighting
                });
            })
            .on("mousemove", function (event) {
                setTooltipData(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", "1");
                setTooltipData(null);
            });

    }, [chartData, segmentCount]);

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Graph Area - flex-grow takes remaining space */}
            <div ref={containerRef} className="flex-grow min-h-0 relative w-full">
                <svg ref={svgRef} width="100%" height="100%"></svg>
            </div>

            {/* Legend Area - flex-shrink-0 sits at the bottom outside graph area */}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-gray-50 max-h-[150px] overflow-y-auto">
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-4">
                    {Array.from({ length: segmentCount }, (_, i) => {
                        const segmentName = `segment${i + 1}`;
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

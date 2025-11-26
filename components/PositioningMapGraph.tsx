import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { AxisSelection } from './PositioningAxisModal';
import { OverlaySelection } from './OverlayItemSelectionModal';

interface PositioningMapGraphProps {
    segmentedRows: any[]; // Rows with 'segmentId'
    verticalAxis: AxisSelection;
    horizontalAxis: AxisSelection;
    overlaySelection: OverlaySelection | null;
    segmentCount: number;
}

export const PositioningMapGraph: React.FC<PositioningMapGraphProps> = ({
    segmentedRows,
    verticalAxis,
    horizontalAxis,
    overlaySelection,
    segmentCount,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !segmentedRows || segmentedRows.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const width = 800;
        const height = 600;
        const margin = { top: 40, right: 120, bottom: 80, left: 80 }; // Increased margins
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // --- Detect if axes are numeric ---
        const isNumericVariable = (variableId: string): boolean => {
            const values = segmentedRows.map(row => row[variableId]).filter(v => v != null && v !== '');
            return values.length > 0 && values.every(v => !isNaN(Number(v)));
        };

        const xIsNumeric = isNumericVariable(horizontalAxis.variableId);
        const yIsNumeric = isNumericVariable(verticalAxis.variableId);

        // --- Data Aggregation ---

        const checkMatch = (row: any, axis: AxisSelection) => {
            const val = row[axis.variableId];
            return val === axis.choiceName;
        };

        // Aggregate data by remapped segment ID
        interface SegmentAggregation {
            id: number;
            xSum: number;
            ySum: number;
            xNumericSum: number;
            yNumericSum: number;
            count: number;
        }

        const segmentMap = new Map<number, SegmentAggregation>();

        segmentedRows.forEach((row) => {
            if (!row.segmentId) return;
            // Remap segment ID: (original - 1) % count + 1
            const effectiveId = ((row.segmentId - 1) % segmentCount) + 1;

            if (!segmentMap.has(effectiveId)) {
                segmentMap.set(effectiveId, {
                    id: effectiveId,
                    xSum: 0,
                    ySum: 0,
                    xNumericSum: 0,
                    yNumericSum: 0,
                    count: 0
                });
            }
            const entry = segmentMap.get(effectiveId)!;
            entry.count++;

            // For categorical axes, count matches
            if (!xIsNumeric && checkMatch(row, horizontalAxis)) entry.xSum++;
            if (!yIsNumeric && checkMatch(row, verticalAxis)) entry.ySum++;

            // For numeric axes, sum values for average calculation
            if (xIsNumeric) {
                const xVal = Number(row[horizontalAxis.variableId]);
                if (!isNaN(xVal)) entry.xNumericSum += xVal;
            }
            if (yIsNumeric) {
                const yVal = Number(row[verticalAxis.variableId]);
                if (!isNaN(yVal)) entry.yNumericSum += yVal;
            }
        });

        const segmentData = Array.from(segmentMap.values()).map((entry) => ({
            id: entry.id,
            x: xIsNumeric ? (entry.xNumericSum / entry.count) : (entry.xSum / entry.count) * 100,
            y: yIsNumeric ? (entry.yNumericSum / entry.count) : (entry.ySum / entry.count) * 100,
            size: entry.count,
        }));

        // Calculate scores for overlay items
        const overlayData: { name: string; x: number; y: number }[] = [];
        if (overlaySelection) {
            overlaySelection.choiceNames.forEach((choiceName) => {
                const itemRows = segmentedRows.filter((r) => r[overlaySelection.variableId] === choiceName);
                const total = itemRows.length;
                if (total === 0) return;

                let xValue: number;
                let yValue: number;

                if (xIsNumeric) {
                    const xSum = itemRows.reduce((sum, r) => {
                        const val = Number(r[horizontalAxis.variableId]);
                        return sum + (isNaN(val) ? 0 : val);
                    }, 0);
                    xValue = xSum / total;
                } else {
                    const xCount = itemRows.filter((r) => checkMatch(r, horizontalAxis)).length;
                    xValue = (xCount / total) * 100;
                }

                if (yIsNumeric) {
                    const ySum = itemRows.reduce((sum, r) => {
                        const val = Number(r[verticalAxis.variableId]);
                        return sum + (isNaN(val) ? 0 : val);
                    }, 0);
                    yValue = ySum / total;
                } else {
                    const yCount = itemRows.filter((r) => checkMatch(r, verticalAxis)).length;
                    yValue = (yCount / total) * 100;
                }

                overlayData.push({
                    name: choiceName,
                    x: xValue,
                    y: yValue,
                });
            });
        }

        // --- Dynamic Scales ---
        const allX = [...segmentData.map((d) => d.x), ...overlayData.map((d) => d.x)];
        const allY = [...segmentData.map((d) => d.y), ...overlayData.map((d) => d.y)];

        const xMin = d3.min(allX) || 0;
        const xMax = d3.max(allX) || 100;
        const yMin = d3.min(allY) || 0;
        const yMax = d3.max(allY) || 100;

        // Add padding (e.g., 10% of range)
        const xPadding = (xMax - xMin) * 0.1 || 5;
        const yPadding = (yMax - yMin) * 0.1 || 5;

        const xScale = d3.scaleLinear()
            .domain([Math.max(0, xMin - xPadding), xIsNumeric ? xMax + xPadding : Math.min(100, xMax + xPadding)])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([Math.max(0, yMin - yPadding), yIsNumeric ? yMax + yPadding : Math.min(100, yMax + yPadding)])
            .range([innerHeight, 0]);

        // Bubble size scale - USE MIN TO MAX RANGE FOR BETTER DIFFERENTIATION
        const minDimension = Math.min(innerWidth, innerHeight);
        const maxBubbleRadius = minDimension * 0.25; // 直径が50%なので半径は25%
        const minBubbleRadius = minDimension * 0.025; // 直径が5%なので半径は2.5%

        const minSize = d3.min(segmentData, (d) => d.size) || 1;
        const maxSize = d3.max(segmentData, (d) => d.size) || 100;

        const sizeScale = d3
            .scaleSqrt()
            .domain([minSize, maxSize])  // Changed from [0, maxSize] to [minSize, maxSize]
            .range([minBubbleRadius, maxBubbleRadius]);

        // --- Axes ---
        const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => xIsNumeric ? `${d}` : `${d}%`);
        const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => yIsNumeric ? `${d}` : `${d}%`);

        // Draw Grid Lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickFormat(() => ''))
            .style('stroke-opacity', 0.1);

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
            .style('stroke-opacity', 0.1);

        // Draw Axes
        const xAxisLabel = xIsNumeric ? horizontalAxis.variableName : `${horizontalAxis.variableName}: ${horizontalAxis.choiceName}`;
        const yAxisLabel = yIsNumeric ? verticalAxis.variableName : `${verticalAxis.variableName}: ${verticalAxis.choiceName}`;

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .append('text')
            .attr('x', innerWidth / 2)
            .attr('y', 50) // Adjusted position
            .attr('fill', 'black')
            .style('font-size', '14px')
            .style('text-anchor', 'middle')
            .text(xAxisLabel);

        g.append('g')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60) // Adjusted position
            .attr('x', -innerHeight / 2)
            .attr('dy', '0.71em')
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text(yAxisLabel);

        // --- Draw Segments (Bubbles) ---
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        g.selectAll('.segment-bubble')
            .data(segmentData)
            .enter()
            .append('circle')
            .attr('class', 'segment-bubble')
            .attr('cx', (d) => xScale(d.x))
            .attr('cy', (d) => yScale(d.y))
            .attr('r', (d) => sizeScale(d.size))
            .attr('fill', (d) => colorScale(String(d.id)))
            .attr('opacity', 0.6)
            .attr('stroke', '#fff');

        // Add segment labels (ID) inside bubbles
        g.selectAll('.segment-label')
            .data(segmentData)
            .enter()
            .append('text')
            .attr('x', (d) => xScale(d.x))
            .attr('y', (d) => yScale(d.y))
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text((d) => d.id)
            .style('font-size', '12px')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none');

        // --- Draw Overlay Items (Triangles) ---
        const triangleSymbol = d3.symbol().type(d3.symbolTriangle).size(100);

        const overlayGroups = g.selectAll('.overlay-item')
            .data(overlayData)
            .enter()
            .append('g')
            .attr('class', 'overlay-item')
            .attr('transform', (d) => `translate(${xScale(d.x)},${yScale(d.y)})`);

        overlayGroups
            .append('path')
            .attr('d', triangleSymbol)
            .attr('fill', 'black');

        overlayGroups
            .append('text')
            .attr('x', 10)
            .attr('y', 5)
            .text((d) => d.name)
            .style('font-size', '12px')
            .style('font-weight', 'bold');

        // Legend
        g.append('text')
            .attr('x', 10)
            .attr('y', -10)
            .text('バブルサイズ・・・セグメントボリューム')
            .style('font-size', '12px')
            .style('fill', '#555');

    }, [segmentedRows, verticalAxis, horizontalAxis, overlaySelection, segmentCount]);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <svg ref={svgRef} style={{ width: '100%', height: '100%', maxHeight: '600px' }}></svg>
        </div>
    );
};

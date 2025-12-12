import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CategoryData } from './RadarChartUtils';

interface RadarChartProps {
    data: CategoryData[];
    width?: number;
    height?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
    data,
    width = 200,
    height = 200
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        // SVGをクリア
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        const levels = 4; // 4つの同心円
        const angleSlice = (Math.PI * 2) / data.length;

        // グループ作成
        const g = svg.append('g')
            .attr('transform', `translate(${centerX}, ${centerY})`);

        // 同心円グリッドを描画
        for (let i = 1; i <= levels; i++) {
            const levelRadius = (radius / levels) * i;
            g.append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', levelRadius)
                .attr('fill', 'none')
                .attr('stroke', '#E5E7EB')
                .attr('stroke-width', 1);
        }

        // 軸線を描画
        data.forEach((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            // 軸線
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', '#E5E7EB')
                .attr('stroke-width', 1);

            // ラベル
            const labelRadius = radius + 20;
            const labelX = labelRadius * Math.cos(angle);
            const labelY = labelRadius * Math.sin(angle);

            g.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('font-size', '9px')
                .attr('fill', '#6B7280')
                .text(d.category);
        });

        // データポリゴンの座標を計算
        const points: [number, number][] = data.map((d, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const r = radius * d.value;
            return [
                r * Math.cos(angle),
                r * Math.sin(angle)
            ];
        });

        // データポリゴンを描画
        const lineGenerator = d3.line<[number, number]>()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveLinearClosed);

        // 塗りつぶし
        g.append('path')
            .datum(points)
            .attr('d', lineGenerator)
            .attr('fill', '#93C5FD')
            .attr('fill-opacity', 0.5)
            .attr('stroke', 'none');

        // 外枠線
        g.append('path')
            .datum(points)
            .attr('d', lineGenerator)
            .attr('fill', 'none')
            .attr('stroke', '#2563EB')
            .attr('stroke-width', 2);

    }, [data, width, height]);

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            className="radar-chart"
        />
    );
};

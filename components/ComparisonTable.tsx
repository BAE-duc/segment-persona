import React, { useMemo } from 'react';
import * as d3 from 'd3';

// データ行インターフェース定義

export interface ComparisonRow {
  variableId: string;
  variableName: string;
  choiceId: string;
  choiceName: string;
  totalRatio: number;
  segmentRatios: number[];
}

interface ComparisonTableProps {
  data: ComparisonRow[];
  segmentSizes: number[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ data, segmentSizes }) => {
  // 変数IDでデータをグループ化します。

  const groupedData = useMemo(() => {
    const groups: { [key: string]: ComparisonRow[] } = {};
    const order: string[] = [];
    data.forEach(row => {
      if (!groups[row.variableId]) {
        groups[row.variableId] = [];
        order.push(row.variableId);
      }
      groups[row.variableId].push(row);
    });
    return { groups, order };
  }, [data]);

  // D3スケール設定 (0~100%)

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, 100]);

  const renderBar = (value: number, isTotal: boolean) => {
    const widthPct = xScale(value);
    // 80%以上の場合強調（参考画像の赤い背景と同様の効果）

    const isHighlight = !isTotal && value >= 80;

    return (
      <div className={`relative w-full h-6 flex items-center px-1 ${isHighlight ? 'bg-red-100' : ''}`}>
        {/* バー背景 */}
        <div className="absolute inset-y-1 left-0 bg-gray-100 w-full z-0 rounded-sm overflow-hidden">
          {/* 実際のバー */}
          <div
            style={{ width: `${widthPct}%` }}
            className={`h-full ${isTotal ? 'bg-gray-400' : 'bg-[#8ab0e6]'} transition-all duration-500`}
          ></div>
        </div>
        {/* 数値テキスト */}
        <span className={`relative z-10 ml-auto text-xs font-medium ${isHighlight ? 'text-red-600' : 'text-gray-700'}`}>
          {Math.round(value)}%
        </span>
      </div>
    );
  };

  const totalSample = segmentSizes.reduce((a, b) => a + b, 0);

  return (
    <div className="overflow-auto w-full h-full border border-gray-300 bg-white shadow-sm pl-2">
      <table className="w-full text-xs border-collapse min-w-[800px]">
        <thead className="sticky top-0 bg-white z-20 shadow-sm text-[#586365]">
          <tr>
            <th colSpan={2} className="border-b border-r border-gray-300 bg-gray-50 p-1 text-center font-bold min-w-[200px]">
              セグメントサイズ→
            </th>
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 text-center w-16">
              <div className="text-[10px] text-gray-500">全体</div>
              <div>{totalSample.toLocaleString()}</div>
            </th>
            {segmentSizes.map((size, i) => (
              <th key={i} className="border-b border-r border-gray-300 bg-gray-50 p-1 text-center w-16 min-w-[4rem]">
                <div className="text-[10px] text-gray-500">{i + 1}</div>
                <div>{size.toLocaleString()}</div>
              </th>
            ))}
          </tr>
          <tr className="text-gray-500">
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold w-24">変数名</th>
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold w-24">選択肢</th>
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold text-center">全体</th>
            {segmentSizes.map((_, i) => (
              <th key={i} className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold text-center">{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupedData.order.map((varId) => {
            const rows = groupedData.groups[varId];
            return rows.map((row, rowIndex) => (
              <tr key={`${varId}-${row.choiceId}`} className="hover:bg-gray-50">
                {rowIndex === 0 && (
                  <td rowSpan={rows.length} className="border-r border-b border-gray-300 p-2 align-middle bg-white font-bold text-gray-700">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400">{row.variableId}</span>
                      <span>{row.variableName}</span>
                    </div>
                  </td>
                )}
                <td className="border-r border-b border-gray-300 p-1 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 text-center text-gray-400 bg-gray-100 rounded text-[10px]">{row.choiceId}</span>
                    <span>{row.choiceName}</span>
                  </div>
                </td>
                <td className="border-r border-b border-gray-300 p-1">
                  {renderBar(row.totalRatio, true)}
                </td>
                {row.segmentRatios.map((ratio, i) => (
                  <td key={i} className="border-r border-b border-gray-300 p-1 border-l-2 border-l-blue-100">
                    {renderBar(ratio, false)}
                  </td>
                ))}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
};
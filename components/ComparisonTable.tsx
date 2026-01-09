import React, { useMemo } from 'react';
import * as d3 from 'd3';

// 데이터 행 인터페이스 정의

export interface ComparisonRow {
  variableId: string;
  variableName: string;
  choiceId: string;
  choiceName: string;
  totalRatio: number;
  segmentRatios: number[];
  // n수 표시를 위한 실제 건수 데이터 추가
  totalCount?: number;
  segmentCounts?: number[];
}

interface ComparisonTableProps {
  data: ComparisonRow[];
  segmentSizes: number[];
  segmentIds?: number[];
  displayMode?: 'percentage' | 'difference' | 'count'; // 새로운 prop 추가
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ 
  data, 
  segmentSizes, 
  segmentIds, 
  displayMode = 'percentage'
}) => {
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

  // 差分表示用のバーレンダリング関数
  // 差分表示用のバーレンダリング関数
  const renderDifferenceBar = (segmentRatio: number, totalRatio: number) => {
    const difference = segmentRatio - totalRatio;
    const absValue = Math.abs(difference);
    const widthPct = xScale(Math.min(absValue, 100));
    const isPositive = difference > 0;

    return (
      <div className="relative w-full h-6 flex items-center justify-center px-1">
        {/* バー背景 */}
        <div className="absolute inset-y-1 left-0 bg-gray-100 w-full z-0 rounded-sm overflow-hidden">
          {/* 差分バー */}
          {difference !== 0 && (
            <div
              style={{
                width: `${widthPct / 2}%`,
                [isPositive ? 'left' : 'right']: '0'
              }}
              className={`absolute inset-y-0 ${isPositive ? 'bg-blue-500' : 'bg-red-500'} transition-all duration-500`}
            ></div>
          )}
        </div>
        {/* 数値テキスト */}
        <span className={`relative z-10 text-xs font-medium ${isPositive ? 'text-blue-600' : difference < 0 ? 'text-red-600' : 'text-gray-700'
          }`}>
          {difference > 0 ? '+' : ''}{Math.round(difference)}%
        </span>
      </div>
    );
  };

  const renderBar = (value: number, isTotal: boolean, isMaxInRow: boolean = false) => {
    const widthPct = xScale(value);

    return (
      <div className="relative w-full h-6 flex items-center px-1">
        {/* バー背景 */}
        <div className="absolute inset-y-1 left-0 bg-gray-100 w-full z-0 rounded-sm overflow-hidden">
          {/* 実際のバー */}
          <div
            style={{ width: `${widthPct}%` }}
            className={`h-full ${isTotal ? 'bg-gray-400' : 'bg-[#8ab0e6]'} transition-all duration-500`}
          ></div>
        </div>
        {/* 数値テキスト */}
        <span className={`relative z-10 ml-auto text-xs font-medium text-gray-700`}>
          {Math.round(value)}%
        </span>
      </div>
    );
  };

  // n수 표시를 위한 렌더링 함수 (색상은 percentage 기준으로 유지)
  const renderCountBar = (count: number, percentage: number, isTotal: boolean) => {
    const widthPct = xScale(percentage); // 색상과 바 길이는 percentage 기준

    return (
      <div className="relative w-full h-6 flex items-center px-1">
        {/* バー背景 */}
        <div className="absolute inset-y-1 left-0 bg-gray-100 w-full z-0 rounded-sm overflow-hidden">
          {/* 실제 바 (percentage 기준 길이와 색상) */}
          <div
            style={{ width: `${widthPct}%` }}
            className={`h-full ${isTotal ? 'bg-gray-400' : 'bg-[#8ab0e6]'} transition-all duration-500`}
          ></div>
        </div>
        {/* 건수 텍스트 표시 */}
        <span className={`relative z-10 ml-auto text-xs font-medium text-gray-700`}>
          {count}
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
              <div>セグメントサイズ→</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {displayMode === 'difference' ? '(差分)' : displayMode === 'count' ? '(n数)' : '(絶対値)'}
              </div>
            </th>
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 text-center w-16">
              <div className="text-[10px] text-gray-500">全体</div>
              <div>{totalSample.toLocaleString()}</div>
            </th>
            {segmentSizes.map((size, i) => (
              <th key={i} className="border-b border-r border-gray-300 bg-gray-50 p-1 text-center w-16 min-w-[4rem]">
                <div className="text-[10px] text-gray-500">{segmentIds ? segmentIds[i] : i + 1}</div>
                <div>{size.toLocaleString()}</div>
              </th>
            ))}
          </tr>
          <tr className="text-gray-500">
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold w-24">変数名</th>
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold w-24">選択肢</th>
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold text-center">全体</th>
            {segmentSizes.map((_, i) => (
              <th key={i} className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold text-center">
                セグメント{segmentIds ? segmentIds[i] : i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupedData.order.map((varId) => {
            const rows = groupedData.groups[varId];
            return rows.map((row, rowIndex) => {
              // 各行（選択肢）で最大値のインデックスを見つける
              const maxRatio = Math.max(...row.segmentRatios);

              return (
                <tr key={`${varId}-${row.choiceId}`} className="hover:bg-gray-50">
                  {rowIndex === 0 && (
                    <td 
                      rowSpan={rows.length} 
                      className="border-r border-b border-gray-300 p-2 align-middle bg-white font-bold text-gray-700"
                    >
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
                    {displayMode === 'count' 
                      ? renderCountBar(row.totalCount || 0, row.totalRatio, true)
                      : renderBar(row.totalRatio, true, false)
                    }
                  </td>
                  {row.segmentRatios.map((ratio, i) => {
                    // このセルが最大値かどうかを確인 (동점의 경우는 모두 강조)
                    const isMaxInRow = ratio === maxRatio && maxRatio > 0;
                    
                    // 배경색 계산 (항상 percentage 기준)
                    let cellBgColor = '';
                    if (displayMode === 'difference') {
                      // 차분 모드에서의 배경색 계산
                      const differences = row.segmentRatios.map(r => r - row.totalRatio);
                      const maxDiff = Math.max(...differences);
                      const minDiff = Math.min(...differences);
                      const currentDiff = ratio - row.totalRatio;
                      
                      // 최대 플러스값은 파란 배경, 최대 마이너스값은 빨간 배경
                      if (currentDiff === maxDiff && maxDiff > 0) {
                        cellBgColor = 'bg-blue-100';
                      } else if (currentDiff === minDiff && minDiff < 0) {
                        cellBgColor = 'bg-red-100';
                      }
                    } else {
                      // 절대값 모드(percentage, count)에서의 배경색 계산: 전체값과의 차이가 5 이상인 경우
                      const difference = ratio - row.totalRatio;
                      if (difference >= 5) {
                        cellBgColor = 'bg-blue-100'; // 전체보다 5 이상 큰 경우는 파란 배경
                      } else if (difference <= -5) {
                        cellBgColor = 'bg-red-100'; // 전체보다 5 이상 작은 경우는 빨간 배경
                      }
                    }
                    
                    // 표시 모드에 따른 렌더링 분기
                    let cellContent;
                    if (displayMode === 'difference') {
                      cellContent = renderDifferenceBar(ratio, row.totalRatio);
                    } else if (displayMode === 'count') {
                      cellContent = renderCountBar(row.segmentCounts?.[i] || 0, ratio, false);
                    } else {
                      cellContent = renderBar(ratio, false, isMaxInRow);
                    }
                    
                    return (
                      <td key={i} className={`border-r border-b border-gray-300 p-1 border-l-2 border-l-blue-100 ${cellBgColor}`}>
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
};
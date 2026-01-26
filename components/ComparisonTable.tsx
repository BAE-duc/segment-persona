import React, { useMemo } from 'react';
import * as d3 from 'd3';

// データ行のインターフェース定義

export interface ComparisonRow {
  variableId: string;
  variableName: string;
  choiceId: string;
  choiceName: string;
  totalRatio: number;
  segmentRatios: number[];
  // n数表示用の実際の件数データを追加
  totalCount?: number;
  segmentCounts?: number[];
}

interface ComparisonTableProps {
  data: ComparisonRow[];
  segmentSizes: number[];
  segmentIds?: number[];
  displayMode?: 'percentage' | 'difference' | 'count';
  transpose?: boolean;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  data,
  segmentSizes,
  segmentIds,
  displayMode = 'percentage',
  transpose = false
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

  // n数表示用のレンダリング関数（色はpercentage基準で維持）
  const renderCountBar = (count: number, percentage: number, isTotal: boolean) => {
    const widthPct = xScale(percentage); // 色とバーの長さはpercentage基準

    return (
      <div className="relative w-full h-6 flex items-center px-1">
        {/* バー背景 */}
        <div className="absolute inset-y-1 left-0 bg-gray-100 w-full z-0 rounded-sm overflow-hidden">
          {/* 実際のバー（percentage基準の長さと色） */}
          <div
            style={{ width: `${widthPct}%` }}
            className={`h-full ${isTotal ? 'bg-gray-400' : 'bg-[#8ab0e6]'} transition-all duration-500`}
          ></div>
        </div>
        {/* 件数テキスト表示 */}
        <span className={`relative z-10 ml-auto text-xs font-medium text-gray-700`}>
          {count}
        </span>
      </div>
    );
  };

  const totalSample = segmentSizes.reduce((a, b) => a + b, 0);

  // Transpose mode: 選択肢基準で各セグメントの割合を計算
  const transposedData = useMemo(() => {
    if (!transpose) return null;
    
    return data.map(row => {
      // この選択肢の全体での合計数
      const totalChoiceCount = row.totalCount || 0;
      
      // 各セグメントでこの選択肢が全選択肢全体に占める割合を計算
      const segmentPercentages = row.segmentCounts?.map(count => {
        return totalChoiceCount > 0 ? (count / totalChoiceCount) * 100 : 0;
      }) || [];
      
      // セグメント割合の平均を計算
      const averagePercentage = segmentPercentages.length > 0
        ? segmentPercentages.reduce((sum, p) => sum + p, 0) / segmentPercentages.length
        : 0;
      
      return {
        ...row,
        transposedSegmentPercentages: segmentPercentages,
        averagePercentage
      };
    });
  }, [data, transpose]);

  return (
    <div className="overflow-auto w-full h-full border border-gray-300 bg-white shadow-sm pl-2">
      <table className="w-full text-xs border-collapse min-w-[800px]">
        <thead className="sticky top-0 bg-white z-20 shadow-sm text-[#586365]">
          <tr>
            <th colSpan={2} className="border-b border-r border-gray-300 bg-gray-50 p-1 text-center font-bold min-w-[200px]">
              <div>セグメントサイズ→</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {displayMode === 'difference' 
                  ? (transpose ? '(絶対値-横%)' : '(絶対値-縦%)') 
                  : displayMode === 'count' 
                    ? '(n数)' 
                    : (transpose ? '(絶対値-横%)' : '(絶対値-縦%)')}
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
            <th className="border-b border-r border-gray-300 bg-gray-50 p-1 font-semibold text-center">{transpose ? '平均' : '全体'}</th>
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
              // 数値型データの判別（choiceIdが空文字列）
              const isNumerical = row.choiceId === '';
              
              // transposeデータを取得
              const transRow = transpose && transposedData ? transposedData.find(tr => 
                tr.variableId === row.variableId && tr.choiceId === row.choiceId
              ) : null;
              
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
                    {isNumerical ? (
                      <span></span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-4 text-center text-gray-400 bg-gray-100 rounded text-[10px]">{row.choiceId}</span>
                        <span>{row.choiceName}</span>
                      </div>
                    )}
                  </td>
                  <td className="border-r border-b border-gray-300 p-1">
                    {transpose && transRow
                      ? renderBar(transRow.averagePercentage, true, false) // transpose: 常に平均%を表示
                      : displayMode === 'count' 
                        ? renderCountBar(row.totalCount || 0, row.totalRatio, true)
                        : isNumerical && !transpose
                          ? renderBar(100, true, false) // 数値型通常モード: 100%
                          : renderBar(row.totalRatio, true, false)
                    }
                  </td>
                  {(transpose && transRow ? transRow.transposedSegmentPercentages : 
                    isNumerical && !transpose ? row.segmentRatios.map(() => 100) : row.segmentRatios
                  ).map((ratio, i) => {
                    // このセルが最大値かどうかを確認（同点の場合は全て強調）
                    const isMaxInRow = ratio === maxRatio && maxRatio > 0;
                    
                    // 背景色の計算
                    let cellBgColor = '';
                    if (displayMode === 'difference' && !isNumerical) {
                      if (transpose && transRow) {
                        // transpose + difference: 平均基準の差
                        const differences = transRow.transposedSegmentPercentages.map(p => p - transRow.averagePercentage);
                        const maxDiff = Math.max(...differences);
                        const minDiff = Math.min(...differences);
                        const currentDiff = ratio - transRow.averagePercentage;
                        
                        if (currentDiff === maxDiff && maxDiff > 0) {
                          cellBgColor = 'bg-blue-100';
                        } else if (currentDiff === minDiff && minDiff < 0) {
                          cellBgColor = 'bg-red-100';
                        }
                      } else {
                        // 通常の差分モード
                        const differences = row.segmentRatios.map(r => r - row.totalRatio);
                        const maxDiff = Math.max(...differences);
                        const minDiff = Math.min(...differences);
                        const currentDiff = row.segmentRatios[i] - row.totalRatio;
                        
                        if (currentDiff === maxDiff && maxDiff > 0) {
                          cellBgColor = 'bg-blue-100';
                        } else if (currentDiff === minDiff && minDiff < 0) {
                          cellBgColor = 'bg-red-100';
                        }
                      }
                    } else if (!transpose && !isNumerical) {
                      // 絶対値モード（percentage, count）での背景色計算：全体値との差が5以上の場合
                      const difference = row.segmentRatios[i] - row.totalRatio;
                      if (difference >= 5) {
                        cellBgColor = 'bg-blue-100'; // 全体より5以上大きい場合は青背景
                      } else if (difference <= -5) {
                        cellBgColor = 'bg-red-100'; // 全体より5以上小さい場合は赤背景
                      }
                    }
                    
                    // 表示モードによるレンダリング分岐
                    let cellContent;
                    if (isNumerical && !transpose) {
                      // 数値型通常モード
                      if (displayMode === 'count') {
                        cellContent = renderCountBar(row.segmentCounts?.[i] || 0, 100, false);
                      } else if (displayMode === 'difference') {
                        cellContent = renderDifferenceBar(100, 100); // 100 - 100 = 0
                      } else {
                        cellContent = renderBar(100, false, false); // 100%
                      }
                    } else if (transpose && displayMode === 'difference' && transRow) {
                      // transpose + differenceモード: セグメント% - 平均%
                      cellContent = renderDifferenceBar(ratio, transRow.averagePercentage);
                    } else if (transpose) {
                      // transpose + percentageモード: 選択肢全体に対するセグメントの割合
                      cellContent = renderBar(ratio, false, false);
                    } else if (displayMode === 'difference') {
                      cellContent = renderDifferenceBar(row.segmentRatios[i], row.totalRatio);
                    } else if (displayMode === 'count') {
                      cellContent = renderCountBar(row.segmentCounts?.[i] || 0, row.segmentRatios[i], false);
                    } else {
                      cellContent = renderBar(row.segmentRatios[i], false, isMaxInRow);
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
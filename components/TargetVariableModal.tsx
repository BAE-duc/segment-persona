
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import type { ItemDetail } from './ItemSelectionModal';
import { TEST_CSV_RAW } from '../data/testData';
import * as d3 from 'd3';

export interface SelectedChoice {
  id: number;
  content: string;
}

export interface ConversionSettings {
  type: 'categorical' | 'numerical';
  categories?: string[];
  range?: { min: string; max: string };
}

export interface SelectedItem {
  id: string;
  name: string;
  type: string;
  choices: SelectedChoice[];
  somDataType?: string;
  conversionSetting?: string;
  conversionDetails?: ConversionSettings;
}

export type SelectedItemsMap = Record<string, SelectedItem>;

interface TargetVariableModalProps {
  onClose: () => void;
  onConfirm: (
    adoptedVariableIds: Set<string>,
    adoptedVariableNames: string[],
    newRangeConfigs: Record<string, { min: number; max: number }>,
    newCategoryConfigs: Record<string, string[]>,
    selectedSegments: number[]
  ) => void;
  initialSelectedItems: SelectedItemsMap;
  segmentCount: number;
  items: ItemDetail[];
  choicesData: { [key: string]: { id: number; content: string }[] };
  rangeConfigs?: Record<string, { min: number; max: number }>;
  displayRangeConfigs?: Record<string, { min: number; max: number }>;
  displayCategoryConfigs?: Record<string, string[]>;
  displayAdoptedIds?: Set<string> | null;
  displaySelectedSegments?: number[] | null;
}

const CustomCheckbox = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-center">
    <label className={`relative flex items-center justify-center w-4 h-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`w-4 h-4 border border-gray-400 rounded-sm flex items-center justify-center transition-colors 
                  peer-disabled:bg-gray-200 peer-disabled:cursor-not-allowed
                  bg-white`}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        )}
      </div>
    </label>
  </div>
);

const StyledNumInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    type="text"
    {...props}
    className={`h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 ${props.className}`}
  />
);

const mapAgeRangeToCategories = (min: number, max: number): string[] => {
  const categories: string[] = [];
  if (min <= 19) categories.push('19歳以下');
  for (let lower = 20; lower <= 55; lower += 5) {
    const upper = lower + 4;
    if (max >= lower && min <= upper) categories.push(`${lower}-${upper}歳`);
  }
  if (max >= 60) categories.push('60歳以上');
  return categories;
};

export const TargetVariableModal: React.FC<TargetVariableModalProps> = ({
  onClose,
  onConfirm,
  initialSelectedItems,
  segmentCount,
  items,
  choicesData,
  rangeConfigs,
  displayRangeConfigs,
  displayCategoryConfigs,
  displayAdoptedIds,
  displaySelectedSegments
}) => {
  const variables = useMemo(() =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.dataType,
    })),
    [items]
  );

  const ageChoices = useMemo(() => {
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const ageIndex = headers.indexOf('age');
    if (ageIndex === -1) return [];

    const getAgeBin = (val: number): string => {
      if (val <= 19) return '19歳 이하';
      if (val >= 60) return '60歳 以上';
      const lower = Math.floor(val / 5) * 5;
      return `${lower}-${lower + 4}歳`;
    };

    const bins = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(v => v.trim());
      const ageVal = parseInt(row[ageIndex], 10);
      if (!isNaN(ageVal)) bins.add(getAgeBin(ageVal));
    }

    const getAgeSortOrder = (bin: string): number => {
      if (bin === '19歳 이하') return 0;
      if (bin === '60歳 以上') return 100;
      if (bin === 'NA') return 999;
      const match = bin.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 50;
    };

    return Array.from(bins)
      .sort((a, b) => getAgeSortOrder(a) - getAgeSortOrder(b))
      .map((bin, index) => ({ id: index + 1000, content: bin }));
  }, []);

  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);

  const [adoptedVariables, setAdoptedVariables] = useState<Set<string>>(() => {
    if (displayAdoptedIds) return new Set(displayAdoptedIds);
    return new Set<string>();
  });

  const [selectedRanges, setSelectedRanges] = useState<Record<string, { min: string; max: string }>>(() => {
    const initial: Record<string, { min: string; max: string }> = {};
    items.forEach(item => {
      const itemId = item.id;
      let min = '';
      let max = '';
      if (displayRangeConfigs && displayRangeConfigs[itemId]) {
        min = String(displayRangeConfigs[itemId].min);
        max = String(displayRangeConfigs[itemId].max);
      } else if (item.conversionDetails?.type === 'numerical' && item.conversionDetails.range) {
        min = item.conversionDetails.range.min;
        max = item.conversionDetails.range.max;
      } else if (rangeConfigs && rangeConfigs[itemId]) {
        min = String(rangeConfigs[itemId].min);
        max = String(rangeConfigs[itemId].max);
      }
      if (min !== '' && max !== '') initial[itemId] = { min, max };
    });
    return initial;
  });

  const [selectedChoices, setSelectedChoices] = useState<Record<string, Set<number>>>(() => {
    const initial: Record<string, Set<number>> = {};
    items.forEach(item => {
      const varId = item.id;
      const choices = varId === 'age' ? ageChoices : choicesData[varId];
      if (!choices) return;
      if (varId === 'age' && !displayCategoryConfigs?.[varId] && item.conversionDetails?.type === 'numerical' && item.conversionDetails.range) {
        const min = parseInt(item.conversionDetails.range.min, 10);
        const max = parseInt(item.conversionDetails.range.max, 10);
        if (!isNaN(min) && !isNaN(max)) {
          const targetCategories = mapAgeRangeToCategories(min, max);
          const categorySet = new Set(targetCategories);
          const filteredIds = choices.filter(c => categorySet.has(c.content)).map(c => c.id);
          initial[varId] = new Set(filteredIds);
          return;
        }
      }
      if (displayCategoryConfigs && displayCategoryConfigs[varId]) {
        const categoryNames = new Set(displayCategoryConfigs[varId]);
        const filteredIds = choices.filter(c => categoryNames.has(c.content)).map(c => c.id);
        initial[varId] = new Set(filteredIds);
      }
    });
    return initial;
  });

  const segmentNumbers = Array.from({ length: segmentCount }, (_, i) => i + 1);
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(() => {
    if (displaySelectedSegments && displaySelectedSegments.length > 0) return new Set(displaySelectedSegments);
    return new Set(segmentNumbers);
  });

  const histogramRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const histData = useMemo(() => {
    const emptyData = { bins: [] as number[], min: 0, max: 0 };
    if (!selectedVariableId) return emptyData;
    const selectedItem = items.find(i => i.id === selectedVariableId);
    if (!selectedItem || selectedItem.conversionDetails?.type !== 'numerical' || selectedVariableId === 'age') return emptyData;
    const lines = TEST_CSV_RAW.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const colIndex = headers.indexOf(selectedVariableId);
    if (colIndex === -1) return emptyData;
    const values: number[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(v => v.trim());
      const valStr = row[colIndex];
      const val = Number(valStr);
      if (!isNaN(val) && valStr !== '' && valStr !== 'NA') values.push(val);
    }
    const globalRange = rangeConfigs && rangeConfigs[selectedVariableId];
    const min = globalRange ? globalRange.min : (values.length ? Math.min(...values) : 0);
    const max = globalRange ? globalRange.max : (values.length ? Math.max(...values) : 0);
    if (values.length === 0 && !globalRange) return emptyData;
    const span = Math.max(1, max - min + 1);
    const binCount = Math.min(span, 100);
    const bins = new Array(binCount).fill(0);
    const binSize = span / binCount;
    values.forEach(v => {
      const idx = Math.floor((v - min) / binSize);
      if (idx >= 0 && idx < binCount) bins[idx]++;
    });
    return { bins, min, max };
  }, [selectedVariableId, items, rangeConfigs]);

  const handleAdoptToggle = (variableId: string) => {
    // 1つだけ選択可能にするため、既存の選択をクリアして新しいIDのみをセット
    setAdoptedVariables(new Set([variableId]));
    setSelectedVariableId(variableId);
    
    const item = items.find(i => i.id === variableId);
    if (!item || item.conversionDetails?.type !== 'numerical' || variableId === 'age') {
      const choices = variableId === 'age' ? ageChoices : (choicesData[variableId] || []);
      const allChoiceIds = choices.map(c => c.id);
      setSelectedChoices({ [variableId]: new Set(allChoiceIds) });
    } else {
      if (!selectedRanges[variableId]) {
        const defMin = item.conversionDetails?.range?.min || '1';
        const defMax = item.conversionDetails?.range?.max || '100';
        setSelectedRanges({ [variableId]: { min: defMin, max: defMax } });
      }
    }
  };

  const handleVariableClick = (id: string) => setSelectedVariableId(id);

  const handleChoiceToggle = (variableId: string, choiceId: number) => {
    const isAdding = !(selectedChoices[variableId]?.has(choiceId));
    
    // 1つだけ選択可能にするため、変数が切り替わる場合は他をクリア
    if (!adoptedVariables.has(variableId)) {
      setAdoptedVariables(new Set([variableId]));
    }

    setSelectedChoices(prev => {
      const newChoices = { [variableId]: new Set(prev[variableId] || []) };
      if (isAdding) newChoices[variableId].add(choiceId); else newChoices[variableId].delete(choiceId);
      
      if (!isAdding && newChoices[variableId].size === 0) {
        setAdoptedVariables(new Set());
      }
      return newChoices;
    });
  };

  const handleRangeChange = (variableId: string, type: 'min' | 'max', value: string) => {
    if (!adoptedVariables.has(variableId)) {
      setAdoptedVariables(new Set([variableId]));
    }
    if (!/^\d*$/.test(value)) return;
    setSelectedRanges(prev => ({
      [variableId]: { ...prev[variableId] || { min: '', max: '' }, [type]: value }
    }));
  };

  const handleSelectAllToggle = () => {
    if (!selectedVariableId) return;
    const choices = selectedVariableId === 'age' ? ageChoices : (choicesData[selectedVariableId] || []);
    const allChoiceIds = choices.map(c => c.id);
    const selected = selectedChoices[selectedVariableId] || new Set();
    const allSelected = allChoiceIds.length > 0 && allChoiceIds.every(id => selected.has(id));
    if (allSelected) {
      setAdoptedVariables(prev => { const newSet = new Set(prev); newSet.delete(selectedVariableId); return newSet; });
      setSelectedChoices(prev => ({ ...prev, [selectedVariableId]: new Set() }));
    } else {
      setAdoptedVariables(prev => new Set(prev).add(selectedVariableId));
      setSelectedChoices(prev => ({ ...prev, [selectedVariableId]: new Set(allChoiceIds) }));
    }
  };

  const handleSelectAllVariablesToggle = () => {
    const allVariableIds = variables.map(v => v.id);
    const allCurrentlySelected = allVariableIds.length > 0 && allVariableIds.every(id => adoptedVariables.has(id));
    if (allCurrentlySelected) {
      setAdoptedVariables(new Set());
      setSelectedChoices({});
    } else {
      setAdoptedVariables(new Set(allVariableIds));
      const newAllSelectedChoices: Record<string, Set<number>> = {};
      allVariableIds.forEach(varId => {
        const choices = varId === 'age' ? ageChoices : (choicesData[varId] || []);
        const allChoiceIds = choices.map(c => c.id);
        if (allChoiceIds.length > 0) newAllSelectedChoices[varId] = new Set(allChoiceIds);
      });
      setSelectedChoices(newAllSelectedChoices);
    }
  };

  const handleSegmentToggle = (segmentNumber: number) => {
    setSelectedSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentNumber)) newSet.delete(segmentNumber); else newSet.add(segmentNumber);
      return newSet;
    });
  };

  const handleSelectAllSegmentsToggle = () => {
    const allSelected = segmentNumbers.length > 0 && segmentNumbers.every(num => selectedSegments.has(num));
    if (allSelected) setSelectedSegments(new Set()); else setSelectedSegments(new Set(segmentNumbers));
  };

  const handleConfirm = () => {
    const adoptedVariableNames = Array.from(adoptedVariables).map(varId => items.find(i => i.id === varId)?.name).filter((name): name is string => !!name);
    const rangesToReturn: Record<string, { min: number; max: number }> = {};
    for (const varId in selectedRanges) {
      const item = items.find(i => i.id === varId);
      if (item && item.dataType === 'int' && varId !== 'age') {
        const r = selectedRanges[varId];
        if (r.min !== '' && r.max !== '') rangesToReturn[varId] = { min: parseInt(r.min, 10), max: parseInt(r.max, 10) };
      }
    }
    const categoriesToReturn: Record<string, string[]> = {};
    for (const varId in selectedChoices) {
      const item = items.find(i => i.id === varId);
      if (item && !(item.conversionDetails?.type === 'numerical' && varId !== 'age')) {
        const choices = varId === 'age' ? ageChoices : choicesData[varId];
        const selectedIds = selectedChoices[varId];
        if (choices && selectedIds?.size > 0) categoriesToReturn[varId] = choices.filter(c => selectedIds.has(c.id)).map(c => c.content);
      }
    }
    onConfirm(adoptedVariables, adoptedVariableNames, rangesToReturn, categoriesToReturn, Array.from(selectedSegments).sort((a, b) => a - b));
  };

  const selectedVariableItem = selectedVariableId ? items.find(i => i.id === selectedVariableId) : null;
  const isNumerical = selectedVariableItem?.conversionDetails?.type === 'numerical' && selectedVariableId !== 'age';
  const currentChoices = selectedVariableId ? (selectedVariableId === 'age' ? ageChoices : (choicesData[selectedVariableId] || [])) : [];
  const rangeLabelMin = selectedVariableId && rangeConfigs?.[selectedVariableId] ? rangeConfigs[selectedVariableId].min : (selectedVariableItem?.conversionDetails?.range?.min || '未設定');
  const rangeLabelMax = selectedVariableId && rangeConfigs?.[selectedVariableId] ? rangeConfigs[selectedVariableId].max : (selectedVariableItem?.conversionDetails?.range?.max || '未設定');

  useEffect(() => {
    if (!histogramRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    if (histogramRef.current.parentElement) resizeObserver.observe(histogramRef.current.parentElement);
    return () => resizeObserver.disconnect();
  }, [isNumerical]);

  const selectedRangesRef = useRef(selectedRanges);
  useEffect(() => { selectedRangesRef.current = selectedRanges; }, [selectedRanges]);

  useEffect(() => {
    if (!isNumerical || !histogramRef.current || dimensions.width === 0 || dimensions.height === 0 || !selectedVariableId || histData.bins.length === 0) return;
    const svg = d3.select(histogramRef.current);
    svg.selectAll("*").remove();
    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    if (chartWidth <= 0 || chartHeight <= 0) return;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`).attr("class", "chart-group");
    const { bins: displayData, min: globalMin, max: globalMax } = histData;
    const yDomainMax = Math.max(...displayData, 1) * 1.1;
    const x = d3.scaleLinear().domain([globalMin, globalMax + 1]).range([0, chartWidth]);
    const y = d3.scaleLinear().domain([0, yDomainMax]).range([chartHeight, 0]);
    g.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(x).ticks(Math.min(10, displayData.length)).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y).ticks(5));
    const oneUnitWidth = Math.abs(x(globalMin + 1) - x(globalMin));
    const barWidth = Math.max(1, oneUnitWidth - 1);
    g.selectAll(".bar-rect").data(displayData).enter().append("rect").attr("class", "bar-rect").attr("x", (d, i) => x(globalMin + i)).attr("y", d => y(d)).attr("width", barWidth).attr("height", d => chartHeight - y(d)).attr("fill", "#e5e7eb").attr("stroke", "#d1d5db");
    const minLineGroup = g.append("g").attr("class", "drag-min").attr("cursor", "ew-resize");
    minLineGroup.append("line").attr("y1", 0).attr("y2", chartHeight).attr("stroke", "#2563eb").attr("stroke-width", 2);
    minLineGroup.append("rect").attr("x", -10).attr("width", 20).attr("height", chartHeight).attr("fill", "transparent");
    const maxLineGroup = g.append("g").attr("class", "drag-max").attr("cursor", "ew-resize");
    maxLineGroup.append("line").attr("y1", 0).attr("y2", chartHeight).attr("stroke", "#dc2626").attr("stroke-width", 2);
    maxLineGroup.append("rect").attr("x", -10).attr("width", 20).attr("height", chartHeight).attr("fill", "transparent");
    const dragMin = d3.drag<SVGGElement, unknown>().on("drag", (event) => {
      if (!selectedVariableId) return;
      const currentMaxVal = parseInt(selectedRangesRef.current[selectedVariableId]?.max || String(globalMax), 10);
      let newVal = Math.round(x.invert(event.x));
      newVal = Math.max(globalMin, Math.min(newVal, isNaN(currentMaxVal) ? globalMax : currentMaxVal));
      if (!adoptedVariables.has(selectedVariableId)) setAdoptedVariables(prev => new Set(prev).add(selectedVariableId));
      setSelectedRanges(prev => ({ ...prev, [selectedVariableId]: { ...prev[selectedVariableId], min: String(newVal) } }));
    });
    const dragMax = d3.drag<SVGGElement, unknown>().on("drag", (event) => {
      if (!selectedVariableId) return;
      const currentMinVal = parseInt(selectedRangesRef.current[selectedVariableId]?.min || String(globalMin), 10);
      let newVal = Math.round(x.invert(event.x)) - 1;
      newVal = Math.max(isNaN(currentMinVal) ? globalMin : currentMinVal, Math.min(newVal, globalMax));
      if (!adoptedVariables.has(selectedVariableId)) setAdoptedVariables(prev => new Set(prev).add(selectedVariableId));
      setSelectedRanges(prev => ({ ...prev, [selectedVariableId]: { ...prev[selectedVariableId], max: String(newVal) } }));
    });
    minLineGroup.call(dragMin); maxLineGroup.call(dragMax);
  }, [isNumerical, dimensions, histData, selectedVariableId]);

  useEffect(() => {
    if (!isNumerical || !histogramRef.current || !selectedVariableId || histData.bins.length === 0) return;
    const svg = d3.select(histogramRef.current);
    const g = svg.select(".chart-group");
    if (g.empty()) return;
    const { width } = dimensions;
    const margin = { left: 40, right: 20 };
    const chartWidth = width - margin.left - margin.right;
    const { min: globalMin, max: globalMax } = histData;
    const x = d3.scaleLinear().domain([globalMin, globalMax + 1]).range([0, chartWidth]);
    const currentRange = selectedRanges[selectedVariableId] || { min: String(globalMin), max: String(globalMax) };
    const minVal = parseInt(currentRange.min, 10);
    const maxVal = parseInt(currentRange.max, 10);
    const binCount = histData.bins.length;
    const binSize = (globalMax - globalMin + 1) / binCount;
    g.selectAll(".bar-rect").attr("fill", (d, i) => {
      const barCenter = globalMin + i * binSize + binSize / 2;
      return (barCenter >= minVal && barCenter <= maxVal + (binSize / 2)) ? "#93c5fd" : "#e5e7eb";
    }).attr("stroke", (d, i) => {
      const barCenter = globalMin + i * binSize + binSize / 2;
      return (barCenter >= minVal && barCenter <= maxVal + (binSize / 2)) ? "#60a5fa" : "#d1d5db";
    });
    g.select(".drag-min").attr("transform", `translate(${x(isNaN(minVal) ? globalMin : minVal)}, 0)`);
    g.select(".drag-max").attr("transform", `translate(${x((isNaN(maxVal) ? globalMax : maxVal) + 1)}, 0)`);
  }, [selectedRanges, selectedVariableId, histData, dimensions, isNumerical]);

  return (
    <div className={modalStyles.overlay} aria-modal="true" role="dialog">
      <div className={`${modalStyles.container} max-w-5xl w-full`} style={{ height: '40rem' }} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>対象変数設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>
        <div className={`${modalStyles.body.container} flex gap-4 overflow-hidden`}>
          <div className="w-[280px] flex flex-col pr-4 border-r border-gray-300">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">アイテム一覧</h3>
            <div className="flex-grow border border-gray-400 bg-white overflow-y-auto text-xs rounded-md">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="p-1 font-bold text-center border-b border-r border-gray-300 w-12">採用</th>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">変数名</th>
                    <th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">タイプ</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map(v => (
                    <tr key={v.id} className={`cursor-pointer font-medium ${modalStyles.interactive.tableRow(selectedVariableId === v.id)}`} onClick={() => handleVariableClick(v.id)}>
                      <td className="p-1 border-b border-r border-gray-200" onClick={(e) => e.stopPropagation()}><CustomCheckbox checked={adoptedVariables.has(v.id)} onChange={() => handleAdoptToggle(v.id)} /></td>
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{v.name}</td>
                      <td className="p-1 border-b border-r border-gray-200 pl-2 whitespace-nowrap">{v.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-2 flex justify-end">
              {/* 1つだけ選択するため、全選択/全解除ボタンは非表示または無効化 */}
            </div>
          </div>
          <div className="w-[320px] flex flex-col pr-4 border-r border-gray-300">
            <h3 className="font-semibold text-xs mb-2 text-[#586365]">{isNumerical ? '値範囲設定' : 'カテゴリ一覧'}</h3>
            {isNumerical ? (
              <div className="flex-grow border border-gray-400 bg-white overflow-hidden flex flex-col rounded-md p-4 gap-2">
                <div className="mb-1 text-xs text-gray-600">(MIN:{rangeLabelMin}, MAX:{rangeLabelMax})</div>
                <div className="flex items-center gap-2">
                  <StyledNumInput value={selectedVariableId ? (selectedRanges[selectedVariableId]?.min || '') : ''} onChange={(e) => selectedVariableId && handleRangeChange(selectedVariableId, 'min', e.target.value)} placeholder="Min" className="w-full" />
                  <span>~</span>
                  <StyledNumInput value={selectedVariableId ? (selectedRanges[selectedVariableId]?.max || '') : ''} onChange={(e) => selectedVariableId && handleRangeChange(selectedVariableId, 'max', e.target.value)} placeholder="Max" className="w-full" />
                </div>
                <div className="flex-grow border border-gray-300 rounded-md flex items-center justify-center bg-white relative overflow-hidden mt-2">
                  {selectedVariableId && histData.bins.length > 0 ? <svg ref={histogramRef} width="100%" height="100%"></svg> : <span className="text-gray-400 text-xs">データがありません</span>}
                </div>
              </div>
            ) : (
              <div className="flex-grow border border-gray-400 bg-white overflow-hidden flex flex-col rounded-md">
                <div className="flex-grow overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50"><tr><th className="p-1 font-bold text-center border-b border-r border-gray-300 w-12">採用</th><th className="p-1 font-bold text-left border-b border-r border-gray-300 pl-2">No.</th><th className="p-1 font-bold text-left border-b border-gray-300 pl-2">内容</th></tr></thead>
                    <tbody>
                      {currentChoices.map((c, i) => (
                        <tr key={c.id} className="font-medium hover:bg-gray-200">
                          <td className="p-1 border-b border-r border-gray-200 w-12 text-center"><CustomCheckbox checked={selectedVariableId ? selectedChoices[selectedVariableId]?.has(c.id) ?? false : false} onChange={() => selectedVariableId && handleChoiceToggle(selectedVariableId, c.id)} disabled={!selectedVariableId} /></td>
                          <td className="p-1 border-b border-r border-gray-200 pl-2">{i+1}</td>
                          <td className="p-1 border-b border-gray-200 pl-2 whitespace-nowrap">{c.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="pt-2 flex justify-end">{!isNumerical && <AppButton onClick={handleSelectAllToggle} disabled={!selectedVariableId} className="py-1">全選択/全解除</AppButton>}</div>
          </div>
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">セグメント選択</h3>
            <div className="flex-grow border border-gray-400 bg-white overflow-hidden flex flex-col rounded-md mt-1">
              <div className="flex-grow overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50"><tr><th className="p-1 font-bold text-center border-b border-r border-gray-300 w-12">採用</th><th className="p-1 font-bold text-left border-b border-gray-300 pl-2">セグメント番号</th></tr></thead>
                  <tbody>
                    {segmentNumbers.map((num) => (
                      <tr key={num} className="font-medium hover:bg-gray-200">
                        <td className="p-1 border-b border-r border-gray-200 w-12 text-center"><CustomCheckbox checked={selectedSegments.has(num)} onChange={() => handleSegmentToggle(num)} /></td>
                        <td className="p-1 border-b border-gray-200 pl-2 whitespace-nowrap">{num}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-2 flex justify-end"><AppButton onClick={handleSelectAllSegmentsToggle} className="py-1">全選択/全解除</AppButton></div>
          </div>
        </div>
        <div className={`${modalStyles.footer.container} justify-end`}><div className={modalStyles.footer.buttonGroup}><AppButton onClick={handleConfirm} className="w-24 py-1" isActive={adoptedVariables.size > 0 && selectedSegments.size > 0} disabled={!(adoptedVariables.size > 0 && selectedSegments.size > 0)}>OK</AppButton><AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton></div></div>
      </div>
    </div>
  );
};

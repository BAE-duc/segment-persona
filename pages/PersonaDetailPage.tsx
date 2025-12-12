import React, { useMemo, useState } from 'react';
import { PERSONA_TEST_DATA_CSV } from '../data/persona_test_data';
import { parsePurchaseData, normalizeData } from '../components/RadarChartUtils';
import { parsePurchaseItems, sortPurchaseItems, getUniqueCategories } from '../components/PurchaseTableUtils';

interface PersonaData {
    id: number;
    name: string;
    image: string;
    segmentName: string;
    innovatorScore: number;
    purchaseCategory: string;
    residence: string;
    occupation: string;
    lifeStage: string;
    annualIncome: string;
    carIntent: string;
    currentCar: string;
}

interface PersonaDetailPageProps {
    currentPersona: PersonaData;
    allPersonas: PersonaData[];
    readStatus: Set<number>;
    onSelectPersona: (id: number) => void;
    onBack: () => void;
}

// ダミーデータ
const dummyValuesAbove = [
    '色々な分野のことを知ることが好き',
    '何事もちょっとした工夫をするのが好き',
    '人の上に立つリーダーになりたい'
];

const dummyValuesBelow = [
    '人に助言するのは得意ではない',
    '周囲と比べて浮いていないか気になる',
    '思い通りできなくてもそれほど気にしない'
];



// レーダーチャートコンポーネント
const RadarChart = () => {
    const size = 340;
    const center = size / 2;
    const radius = 120;

    // 実データを処理
    const chartData = useMemo(() => {
        const parsed = parsePurchaseData(PERSONA_TEST_DATA_CSV);
        return normalizeData(parsed);
    }, []);

    const axes = chartData.map(d => d.category);
    const data = chartData.map(d => d.value);

    const angleSlice = (Math.PI * 2) / axes.length;

    const points = data.map((val, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const x = center + radius * val * Math.cos(angle);
        const y = center + radius * val * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* グリッド円 */}
            {[0.25, 0.5, 0.75, 1].map((r, i) => (
                <circle key={i} cx={center} cy={center} r={radius * r} fill="none" stroke="#E5E7EB" strokeWidth="1" />
            ))}

            {/* 軸 */}
            {axes.map((axis, i) => {
                const angle = i * angleSlice - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return (
                    <g key={i}>
                        <line x1={center} y1={center} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                        <text
                            x={center + (radius + 25) * Math.cos(angle)}
                            y={center + (radius + 25) * Math.sin(angle)}
                            fontSize="14"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill="#6B7280"
                        >
                            {axis.split(' ').map((line, j) => (
                                <tspan x={center + (radius + 30) * Math.cos(angle)} dy={j === 0 ? 0 : 16} key={j}>{line}</tspan>
                            ))}
                        </text>
                    </g>
                );
            })}

            {/* データポリゴン */}
            <polygon points={points} fill="rgba(147, 197, 253, 0.5)" stroke="#2563EB" strokeWidth="2" />
        </svg>
    );
};

export const PersonaDetailPage: React.FC<PersonaDetailPageProps> = ({ currentPersona, allPersonas, readStatus, onSelectPersona, onBack }) => {
    // 購入データを処理
    const allPurchaseItems = useMemo(() => {
        const items = parsePurchaseItems(PERSONA_TEST_DATA_CSV);
        return sortPurchaseItems(items);
    }, []);

    const categories = useMemo(() => getUniqueCategories(allPurchaseItems), [allPurchaseItems]);

    const [selectedCategory, setSelectedCategory] = useState<string>('全て');

    // フィルタリングされた購入データ
    const filteredItems = useMemo(() => {
        if (selectedCategory === '全て') {
            return allPurchaseItems;
        }
        return allPurchaseItems.filter(item => item.category === selectedCategory);
    }, [allPurchaseItems, selectedCategory]);

    return (
        <div className="flex h-full w-full bg-white overflow-hidden">
            {/* 左サイドバー */}
            <div className="w-1/4 flex flex-col p-4 border-r border-gray-200 bg-gray-50 h-full overflow-y-auto">
                <div className="h-[250px] bg-white p-2 border border-gray-200 mb-2 shadow-sm flex justify-center">
                    <img src={currentPersona.image} alt={currentPersona.name} className="h-full w-auto object-contain" />
                </div>

                <div className="text-xs space-y-2 text-gray-700">
                    <div className="font-bold text-sm mb-2">{currentPersona.name}</div>
                    <div><span className="font-bold">イノベーター度:</span> {currentPersona.innovatorScore} (後期追随層)</div>
                    <div><span className="font-bold">性年代:</span> {currentPersona.name.replace(/\(.*\)/, '')} {currentPersona.name.match(/\((.*)\)/)?.[1]}</div>
                    <div><span className="font-bold">居住地:</span> {currentPersona.residence}</div>
                    <div><span className="font-bold">職業:</span> {currentPersona.occupation}</div>
                    <div><span className="font-bold">ライフステージ:</span> {currentPersona.lifeStage}</div>
                    <div><span className="font-bold">世帯年収:</span> {currentPersona.annualIncome}</div>
                    <div><span className="font-bold">購入意向車:</span> {currentPersona.carIntent}</div>
                    <div><span className="font-bold">現保有車:</span> {currentPersona.currentCar}</div>
                    <div>
                        <span className="font-bold">趣味:</span>
                        <ul className="list-disc list-inside pl-2 mt-1 text-[10px]">
                            <li>車・バイク</li>
                            <li>ショッピング・リラクゼーション</li>
                            <li>動画視聴</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-auto space-y-2 pt-4">
                    <button
                        onClick={onBack}
                        className="w-full py-2 bg-gray-200 border border-gray-400 rounded shadow-sm hover:bg-gray-300 font-bold text-gray-700 text-sm"
                    >
                        ペルソナ一覧表示
                    </button>
                    <button className="w-full py-2 bg-gray-200 border border-gray-400 rounded shadow-sm hover:bg-gray-300 font-bold text-gray-700 text-sm">
                        ペルソナと会話
                    </button>
                </div>
            </div>

            {/* メインコンテンツ */}
            <div className="w-3/4 flex flex-col h-full">
                {/* 上部ナビゲーションタブ */}
                <div className="flex border-b border-gray-300 bg-white px-2 pt-2">
                    {allPersonas.map(persona => (
                        <button
                            key={persona.id}
                            onClick={() => onSelectPersona(persona.id)}
                            className={`relative px-4 py-2 text-sm font-bold rounded-t-md mr-1 transition-colors ${currentPersona.id === persona.id
                                ? 'bg-white border-t border-l border-r border-gray-300 text-gray-800 z-10 -mb-[1px]'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {persona.name}
                            {!readStatus.has(persona.id) && currentPersona.id !== persona.id && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* コンテンツエリア */}
                <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                    <div className="flex gap-4 h-full">
                        {/* 左カラム：価値観＆レーダーチャート */}
                        <div className="w-1/3 flex flex-col gap-2">
                            {/* 価値観 */}
                            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 flex-grow flex flex-col">
                                <h3 className="font-bold text-gray-700 mb-4 border-l-4 border-gray-500 pl-2">価値観</h3>

                                <div className="flex-grow flex flex-col gap-6 justify-center">
                                    {/* 平均以上グループ */}
                                    <div className="flex items-center gap-4">
                                        {/* インジケーター */}
                                        <div className="flex flex-col items-center w-16 flex-shrink-0">
                                            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-[#93C5FD] mb-1"></div>
                                            <span className="text-[10px] text-gray-500 font-bold">平均以上</span>
                                        </div>
                                        {/* リスト */}
                                        <ul className="text-xs space-y-1 text-gray-700">
                                            {dummyValuesAbove.map((val, i) => (
                                                <li key={i} className="flex items-start">
                                                    <span className="mr-1">・</span>
                                                    {val}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* 平均以下グループ */}
                                    <div className="flex items-center gap-4">
                                        {/* インジケーター */}
                                        <div className="flex flex-col items-center w-16 flex-shrink-0">
                                            <span className="text-[10px] text-gray-500 font-bold mb-1">平均以下</span>
                                            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-t-[#9CA3AF]"></div>
                                        </div>
                                        {/* リスト */}
                                        <ul className="text-xs space-y-1 text-gray-700">
                                            {dummyValuesBelow.map((val, i) => (
                                                <li key={i} className="flex items-start">
                                                    <span className="mr-1">・</span>
                                                    {val}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* レーダーチャート */}
                            <div className="bg-white p-2 rounded shadow-sm border border-gray-200 flex flex-col">
                                <h3 className="font-bold text-gray-700 mb-0 border-l-4 border-gray-500 pl-2">購入カテゴリ</h3>
                                <div className="flex-grow flex items-center justify-center">
                                    <RadarChart />
                                </div>
                            </div>
                        </div>

                        {/* 右カラム：購入履歴 */}
                        <div className="w-2/3 bg-white p-4 rounded shadow-sm border border-gray-200 flex flex-col h-full">
                            <h3 className="font-bold text-gray-700 mb-4 border-l-4 border-gray-500 pl-2">データ詳細参照</h3>

                            <div className="flex justify-end gap-4 mb-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <span>表示データ</span>
                                    <select className="border border-gray-300 rounded px-2 py-1" disabled>
                                        <option>購入データ</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>表示カテゴリ</span>
                                    <select
                                        className="border border-gray-300 rounded px-2 py-1"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option>全て</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-auto flex-grow">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                        <tr>
                                            <th className="p-2 border-b">カテゴリ</th>
                                            <th className="p-2 border-b">購入場所</th>
                                            <th className="p-2 border-b">アイテム</th>
                                            <th className="p-2 border-b text-right">購入額</th>
                                            <th className="p-2 border-b">用途</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((row, i) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-2 text-blue-600 font-bold">{row.category}</td>
                                                <td className="py-3 px-2 text-blue-600 font-bold">{row.place}</td>
                                                <td className="py-3 px-2">{row.item}</td>
                                                <td className="py-3 px-2 text-right">{row.price.toLocaleString()}</td>
                                                <td className="py-3 px-2 text-gray-500">{row.usage}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

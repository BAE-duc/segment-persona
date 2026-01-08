import React, { useState, useEffect } from 'react';
import { PersonaDetailPage } from './PersonaDetailPage';
import { DataSelectionModal, type DataItem } from '../components/DataSelectionModal';
import { FilterEditModal, type ConditionListItem } from '../components/shared/FilterEditModal';
import { AppSelect } from '../components/shared/FormControls';
import { CaretIcon } from '../components/shared/CaretIcon';
import somMapImage from '../data/sommap.png';
import personaMale60sHokkaido from '../data/persona_male_60s_hokkaido.png';
import personaMale60sIndifferent from '../data/persona_male_60s_indifferent.png';
import personaMale50sActive from '../data/persona_male_50s_active.png';
import personaFemale60sFamily from '../data/persona_female_60s_family.png';
import personaFemale40sFamily from '../data/persona_female_40s_family.png';
import personaFemale50sIndifferent from '../data/persona_female_50s_indifferent.png';

// ツールチップコンポーネント。ホバー時に情報を表示します。
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative flex items-center" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-white border border-gray-200 shadow-xl rounded-md z-[100] w-64 text-left pointer-events-none">
                    <div className="text-[11px] text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                        {content}
                    </div>
                    {/* ツールチップの矢印 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white drop-shadow-sm"></div>
                </div>
            )}
        </div>
    );
};

// セグメント情報アイコンコンポーネント。
const SegmentInfoIcon = ({ content }: { content: string }) => (
    <Tooltip content={content}>
        <div className="w-4 h-4 cursor-pointer flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#34A8EF]" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M12 16V12M12 8H12.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>
    </Tooltip>
);

// ペルソナデータの型定義。
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

// モックデータ。
const personaData: PersonaData[] = [
    {
        id: 1,
        name: '男性A(60代)',
        image: personaMale60sHokkaido,
        segmentName: '活動的な安定志向層',
        innovatorScore: 3,
        purchaseCategory: '保険',
        residence: '北海道／地方',
        occupation: 'パート・アルバイト',
        lifeStage: '独身世帯',
        annualIncome: '200万円未満',
        carIntent: 'ヤリス',
        currentCar: 'ルーミー_ガソリン'
    },
    {
        id: 2,
        name: '男性B(60代)',
        image: personaMale60sIndifferent,
        segmentName: '無関心層',
        innovatorScore: 4,
        purchaseCategory: '外食/デリバリー',
        residence: '近畿／都市部',
        occupation: '会社員(事務系)',
        lifeStage: '長子_社会人',
        annualIncome: '800～1000万円',
        carIntent: 'ヤリスクロス',
        currentCar: 'プリウス(~2022)_HEV'
    },
    {
        id: 3,
        name: '男性C(50代)',
        image: personaMale50sActive,
        segmentName: '活動的な安定志向層',
        innovatorScore: 1,
        purchaseCategory: '趣味/レジャー/教養',
        residence: '東海／都市部',
        occupation: '会社員(その他)',
        lifeStage: '長子_社会人',
        annualIncome: '600～800万円',
        carIntent: '-',
        currentCar: 'アクア_HEV'
    },
    {
        id: 4,
        name: '女性A(60代)',
        image: personaFemale60sFamily,
        segmentName: '家族と実用性重視層',
        innovatorScore: 5,
        purchaseCategory: '保険',
        residence: '近畿／都市部',
        occupation: '自営業',
        lifeStage: '長子_社会人',
        annualIncome: '600～800万円',
        carIntent: 'アクア',
        currentCar: 'カローラフィールダー_HEV'
    },
    {
        id: 5,
        name: '女性B(40代)',
        image: personaFemale40sFamily,
        segmentName: '家族と実用性重視層',
        innovatorScore: 3,
        purchaseCategory: '外食/デリバリー',
        residence: '北陸／都市部',
        occupation: '公務員',
        lifeStage: '独身世帯',
        annualIncome: '200～400万円',
        carIntent: 'スペーシア',
        currentCar: 'トヨタ その他_その他'
    },
    {
        id: 6,
        name: '女性C(50代)',
        image: personaFemale50sIndifferent,
        segmentName: '無関心層',
        innovatorScore: 2,
        purchaseCategory: 'ファッション',
        residence: '北海道／都市部',
        occupation: '会社員(事務系)',
        lifeStage: '長子_中・高生',
        annualIncome: '800～1000万円',
        carIntent: '-',
        currentCar: 'ルーミー_ガソリン'
    }
];

// フィルターカテゴリーの構造を定義します。
export interface FilterCategory {
    [key: string]: string[];
}

// フィルターの初期データを定義します。
const initialFilterCategories: FilterCategory = {
    '期間': ['2023年', '2024年', '2025年'],
    '地域': [],
    '車': ['PHEV'],
    '人': ['性別(男性)', '年齢(20代)', '年齢(30代)', '年齢(40代)', '年齢(50代)', '性別(女性)'],
};

/**
 * PersonaListPage2 コンポーネント。
 * プロダクト選択モーダルから直接遷移する、独立したペルソナ管理画面。
 */
export const PersonaListPage2: React.FC = () => {
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
    const [readPersonaIds, setReadPersonaIds] = useState<Set<number>>(new Set());

    // セグメント画面と同様の状態管理
    const [selectedData, setSelectedData] = useState<DataItem | null>(null);
    const [weightValue, setWeightValue] = useState('default');
    const [filterCategories, setFilterCategories] = useState<FilterCategory>(initialFilterCategories);
    const [customFilterConditions, setCustomFilterConditions] = useState<ConditionListItem[]>([]);
    const [isDataSelectionModalOpen, setIsDataSelectionModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // ツリービューの状態
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        for (const category in initialFilterCategories) {
            if (initialFilterCategories[category] && initialFilterCategories[category].length > 0) {
                initialState[category] = true;
            }
        }
        return initialState;
    });

    const toggleFilter = (filterName: string) => {
        setExpandedFilters(prev => ({
            ...prev,
            [filterName]: !prev[filterName]
        }));
    };

    const handleSelectPersona = (id: number) => {
        setSelectedPersonaId(id);
        setReadPersonaIds(prev => new Set(prev).add(id));
    };

    if (selectedPersonaId !== null) {
        const currentPersona = personaData.find(p => p.id === selectedPersonaId);
        if (currentPersona) {
            return (
                <PersonaDetailPage
                    currentPersona={currentPersona}
                    allPersonas={personaData}
                    readStatus={readPersonaIds}
                    onSelectPersona={handleSelectPersona}
                    onBack={() => setSelectedPersonaId(null)}
                />
            );
        }
    }

    return (
        <div className="flex h-full w-full bg-white overflow-hidden">
            {/* 左パネル: データ選択およびフィルター設定 */}
            <div className="w-[290px] flex flex-col flex-shrink-0 border-r border-gray-200 bg-[#ECECEC] p-2">
                {/* 上端アイコングループ（ダウンロード削除済み） */}
                <div className="flex justify-start gap-2 mb-1 -mt-1">
                    <button
                        className="h-[30px] w-[30px] flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors rounded-md"
                        aria-label="データベース"
                        onClick={() => setIsDataSelectionModalOpen(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M12,3C7.58,3,4,4.79,4,7s3.58,4,8,4,8-1.79,8-4S16.42,3,12,3z M4,9v3c0,2.21,3.58,4,8,4s8-1.79,8-4V9c0,2.21-3.58,4-8,4S4,11.21,4,9z M4,15v3c0,2.21,3.58,4,8,4s8-1.79,8-4v-3c0,2.21-3.58,4-8,4S4,17.21,4,15z" />
                        </svg>
                    </button>
                </div>

                {/* データ情報セクション（SegmentSidebarのデザインを完全適用） */}
                <div className="h-56 bg-white p-2 overflow-y-auto mb-1 flex-shrink-0 border border-gray-300 rounded-sm">
                    <strong className="font-bold text-xs">データ情報</strong>
                    {selectedData ? (
                        <div className="mt-1 pl-2 space-y-1">
                            <p className="text-xs text-gray-600">{selectedData.groupName}</p>
                            <p className="text-xs">{selectedData.name}</p>
                            <AppSelect
                                value={weightValue}
                                onChange={(e) => setWeightValue(e.target.value)}
                                className="mt-1 w-32"
                            >
                                <option value="default">ウェイト値</option>
                                <option value="ari">有</option>
                                <option value="nashi">無</option>
                            </AppSelect>
                        </div>
                    ) : (
                        <div className="mt-2 pl-2">
                            <button
                                className="text-xs text-blue-600 font-medium hover:underline"
                                onClick={() => setIsDataSelectionModalOpen(true)}
                            >
                                データを選択
                            </button>
                        </div>
                    )}
                </div>

                {/* フィルター編集セクション（タブなしでツリービューを表示） */}
                <div className="flex-grow flex flex-col min-h-0 bg-white border border-gray-300 rounded-sm p-2 overflow-hidden">
                    <div className="flex-grow overflow-y-auto min-h-0 space-y-4">
                        <div>
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        if (!selectedData) {
                                            alert("選択されたデータがありません。\nデータを先に選択してください。");
                                        } else {
                                            setIsFilterModalOpen(true);
                                        }
                                    }}
                                    className="font-bold text-xs text-blue-600 cursor-pointer hover:underline focus:outline-none"
                                >
                                    フィルター編集
                                </button>
                                {selectedData && (
                                    <span className="text-xs font-medium text-[#586365]">サンプルサイズ：1000</span>
                                )}
                            </div>
                            <div className="pl-4 my-1 text-xs text-gray-600">
                                {customFilterConditions.length > 0 ? (
                                    customFilterConditions.map((c, index) => (
                                        <div key={c.id}>{`${c.itemName} ${c.symbol} ${c.categoryName} ${index < customFilterConditions.length - 1 ? c.connector : ''}`.trim()}</div>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic">条件なし</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {Object.keys(filterCategories).map((name) => (
                                <div key={name}>
                                    <div
                                        className="flex items-center p-1 bg-gray-100 cursor-pointer hover:bg-gray-200 rounded-sm"
                                        onClick={() => toggleFilter(name)}
                                    >
                                        <CaretIcon expanded={!!expandedFilters[name]} />
                                        <span className="text-xs font-semibold select-none">{name}</span>
                                    </div>
                                    {expandedFilters[name] && filterCategories[name] && (
                                        <div className="pt-1 pl-5">
                                            {filterCategories[name].length > 0 ? (
                                                filterCategories[name].map(child => (
                                                    <div key={child} className="py-1 text-xs text-gray-600">
                                                        {child}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-1 text-xs text-gray-400">なし</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 下端ペルソナ抽出ボタン */}
                <div className="flex-shrink-0 pt-2 bg-transparent">
                    <button
                        className={`w-full py-2.5 rounded shadow-sm font-bold text-xs transition-all transform active:scale-95 border ${selectedData
                            ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white border-blue-700 hover:from-blue-500 hover:to-blue-700'
                            : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                            }`}
                        disabled={!selectedData}
                        onClick={() => {
                            if (selectedData) {
                                setIsDetailsVisible(true);
                            }
                        }}
                    >
                        ペルソナ抽出を実行
                    </button>
                </div>
            </div>

            {/* 右パネル: ペルソナ抽出結果 */}
            {/* 右パネル - ペルソナ一覧 (PersonaListPage.tsx のソースコードをベースに完全同期) */}
            <div className="flex-1 pl-4 overflow-auto">
                {isDetailsVisible ? (
                    <div className="min-w-[800px]">
                        {/* ヘッダー行 */}
                        <div className="grid grid-cols-[120px_1fr] border-b border-transparent">
                            <div className="p-2"></div>
                            <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold text-gray-600">
                                {personaData.map(p => (
                                    <div key={p.id} className="flex items-center justify-center gap-1 py-4">
                                        <span>{p.name}</span>
                                        {!readPersonaIds.has(p.id) && (
                                            <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 画像行 */}
                        <div className="grid grid-cols-[120px_1fr] mb-4">
                            <div className="p-2 text-[10px] text-gray-400 flex items-end pb-0">
                                ※Microsoft Copilotで生成した画像を表示しています
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {personaData.map(p => (
                                    <div
                                        key={p.id}
                                        className="aspect-square bg-[#FDF6D8] flex items-center justify-center border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all overflow-hidden"
                                        onClick={() => handleSelectPersona(p.id)}
                                    >
                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover shadow-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 属性テーブル */}
                        <div className="w-full text-xs text-gray-700">
                            {/* セグメント名 */}
                            <div className="grid grid-cols-[120px_1fr] border-b border-gray-200">
                                <div className="p-2 font-bold text-gray-600 flex items-center">セグメント</div>
                                <div className="grid grid-cols-6 gap-2">
                                    {personaData.map(p => (
                                        <div key={p.id} className="p-2 text-center flex items-center justify-center text-[10px] gap-1 relative group">
                                            <span>{p.segmentName}</span>
                                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 text-white text-[8px] cursor-help">
                                                i
                                            </span>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                <div>Information</div>
                                                <div>1. Content</div>
                                                <div>2. Content</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* イノベーター度 */}
                            <div className="grid grid-cols-[120px_1fr] border-b border-gray-200 py-2">
                                <div className="p-2 font-bold text-gray-600 flex flex-col justify-center">
                                    <span>イノベーター度</span>
                                    <span className="text-[9px] font-normal text-gray-400">※1~7点で表示</span>
                                    <span className="text-[9px] font-normal text-gray-400">数字が大きいほど</span>
                                    <span className="text-[9px] font-normal text-gray-400">イノベーター度が高い</span>
                                    <span className="text-[9px] font-normal text-gray-400 mt-1">全体平均 .......</span>
                                </div>
                                <div className="grid grid-cols-6 gap-2 items-end relative mr-2">
                                    {/* 平均線 (点線) */}
                                    <div className="absolute left-0 right-0 top-1/2 border-t border-dotted border-gray-400 z-0"></div>

                                    {personaData.map(p => (
                                        <div key={p.id} className="flex flex-col items-center justify-end h-24 z-10 relative group">
                                            <span className="mb-1 text-[10px] text-gray-500">{p.innovatorScore}</span>
                                            <div
                                                className="w-full bg-[#2CA0F0] cursor-help"
                                                style={{ height: `${(p.innovatorScore / 7) * 100}%` }}
                                            ></div>
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                <div>Information</div>
                                                <div>1. Content</div>
                                                <div>2. Content</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* その他属性 */}
                            {[
                                { label: '[特徴的な 購入カテゴリ]', key: 'purchaseCategory' },
                                { label: '居住地', key: 'residence' },
                                { label: '職業', key: 'occupation' },
                                { label: 'ライフステージ', key: 'lifeStage' },
                                { label: '世帯年収', key: 'annualIncome' },
                                { label: '購入意向車', key: 'carIntent' },
                                { label: '現保有車', key: 'currentCar' },
                            ].map((attr) => (
                                <div key={attr.key} className="grid grid-cols-[120px_1fr] border-b border-gray-200">
                                    <div className="p-2 font-bold text-gray-600 flex items-center">
                                        {attr.label.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {personaData.map((p: any) => (
                                            <div key={p.id} className="p-2 text-center flex items-center justify-center text-[10px] break-words">
                                                {p[attr.key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                        <p className="text-sm font-medium">
                            {selectedData
                                ? '「ペルソナ抽出を実行」ボタンをクリックして開始してください'
                                : 'データを選択してください'}
                        </p>
                    </div>
                )}
            </div>

            {/* データ選択モーダル */}
            {
                isDataSelectionModalOpen && (
                    <DataSelectionModal
                        onClose={() => setIsDataSelectionModalOpen(false)}
                        onConfirm={(data) => {
                            setSelectedData(data);
                            setIsDataSelectionModalOpen(false);
                        }}
                    />
                )
            }

            {/* フィルター編集モーダル */}
            {
                isFilterModalOpen && (
                    <FilterEditModal
                        onClose={() => setIsFilterModalOpen(false)}
                        onConfirm={(conditions) => {
                            setCustomFilterConditions(conditions);
                            setIsFilterModalOpen(false);
                        }}
                        initialConditions={customFilterConditions}
                        onShowInfo={(msg) => alert(msg)}
                    />
                )
            }
        </div>
    );
};

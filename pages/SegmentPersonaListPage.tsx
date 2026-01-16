import React, { useState } from 'react';
import { AppButton } from '../components/shared/FormControls';
import somMapImage from '../data/sommap.png';
import personaMale60sHokkaido from '../data/persona_male_60s_hokkaido.png';
import personaMale60sIndifferent from '../data/persona_male_60s_indifferent.png';
import personaMale50sActive from '../data/persona_male_50s_active.png';
import personaFemale60sFamily from '../data/persona_female_60s_family.png';
import personaFemale40sFamily from '../data/persona_female_40s_family.png';
import personaFemale50sIndifferent from '../data/persona_female_50s_indifferent.png';
import { PersonaDetailPage } from './PersonaDetailPage';

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

export const SegmentPersonaListPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'segment' | 'node'>('segment');
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
    const [readPersonaIds, setReadPersonaIds] = useState<Set<number>>(new Set());
    const [isSomMapSelected, setIsSomMapSelected] = useState(false);

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
        <div className="flex h-full w-full bg-white p-4 overflow-hidden">
            {/* 左パネル */}
            <div className="w-1/4 flex flex-col gap-4 pr-4 border-r border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-700">セグメント選択</h2>
                    <div className="text-xs text-gray-500 select-none">v1.0.0</div>
                </div>

                {/* SOMMAP エリア */}
                <div
                    className={`bg-[#EFE8C8] aspect-square flex items-center justify-center relative overflow-hidden border cursor-pointer transition-all ${isSomMapSelected ? 'border-blue-500 border-4 ring-4 ring-blue-200' : 'border-gray-300 hover:border-blue-300'}`}
                    onClick={() => setIsSomMapSelected(true)}
                >
                    <img src={somMapImage} alt="SOMMAP" className="w-full h-full object-contain" />
                    <div className="absolute top-2 left-0 right-0 text-center font-bold text-lg">SOMMAP</div>
                    {isSomMapSelected && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            ✓
                        </div>
                    )}
                </div>

                {/* トグルボタン */}
                <div className="flex w-full border border-gray-400 rounded overflow-hidden">
                    <button
                        className={`flex-1 py-2 font-bold ${viewMode === 'segment' ? 'bg-[#374151] text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setViewMode('segment')}
                    >
                        セグメント
                    </button>
                    <button
                        className={`flex-1 py-2 font-bold ${viewMode === 'node' ? 'bg-[#374151] text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setViewMode('node')}
                    >
                        ノード
                    </button>
                </div>

                {/* 출력 버튼 (왼쪽 하단) */}
                <div className="mt-auto">
                    <AppButton
                        className="w-full"
                        disabled={!isSomMapSelected}
                        isActive={isSomMapSelected}
                        onClick={() => {
                            if (isSomMapSelected) {
                                setIsDetailsVisible(true);
                            }
                        }}
                    >
                        ペルソナ抽出
                    </AppButton>
                </div>
            </div>

            {/* 右パネル - ペルソナ一覧 */}
            <div className="w-3/4 pl-4 pr-6 overflow-auto">
                {isDetailsVisible ? (
                    <div className="min-w-[800px]">
                        {/* ヘッダー行 */}
                        <div className="grid grid-cols-[110px_1fr] border-b border-transparent">
                            <div className="p-2"></div>
                            <div className="grid grid-cols-6 gap-1.5 text-center text-xs font-bold text-gray-600">
                                {personaData.map(p => (
                                    <div key={p.id} className="flex items-center justify-center gap-1">
                                        <span className="truncate">{p.name}</span>
                                        {!readPersonaIds.has(p.id) && (
                                            <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0"></span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 画像行 */}
                        <div className="grid grid-cols-[110px_1fr] mb-4">
                            <div className="p-2 text-[10px] text-gray-400 flex items-end pb-0 leading-tight">
                                ※Microsoft Copilotで生成した画像を表示しています
                            </div>
                            <div className="grid grid-cols-6 gap-1.5">
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
                            <div className="grid grid-cols-[110px_1fr] border-b border-gray-200">
                                <div className="p-2 font-bold text-gray-600 flex items-center">セグメント</div>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {personaData.map(p => (
                                        <div key={p.id} className="p-2 text-center flex items-center justify-center text-[10px] gap-1 relative group leading-tight">
                                            <span className="break-all">{p.segmentName}</span>
                                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 text-white text-[8px] cursor-help flex-shrink-0">
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
                            <div className="grid grid-cols-[110px_1fr] border-b border-gray-200 py-2">
                                <div className="p-2 font-bold text-gray-600 flex flex-col justify-center">
                                    <span>イノベーター度</span>
                                    <span className="text-[9px] font-normal text-gray-400">※1~7点で表示</span>
                                    <span className="text-[9px] font-normal text-gray-400">数字が大きいほど</span>
                                    <span className="text-[9px] font-normal text-gray-400">高い</span>
                                    <span className="text-[9px] font-normal text-gray-400 mt-1">全体平均 .......</span>
                                </div>
                                <div className="grid grid-cols-6 gap-1.5 items-end relative mr-2">
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
                                <div key={attr.key} className="grid grid-cols-[110px_1fr] border-b border-gray-200">
                                    <div className="p-2 font-bold text-gray-600 flex items-center leading-tight text-[11px]">
                                        {attr.label.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                        {personaData.map((p: any) => (
                                            <div key={p.id} className="p-2 text-center flex items-center justify-center text-[10px] break-words leading-tight">
                                                {p[attr.key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p className="text-sm font-medium">
                           {isSomMapSelected ? 'ペルソナ抽出ボタンを押してください' : '左側のSOMMAP内で、抽出対象とするセグメントまたはノードを選択してください。'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};


import React, { useState } from 'react';
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

export const PersonaListPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'segment' | 'node'>('segment');
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
    const [readPersonaIds, setReadPersonaIds] = useState<Set<number>>(new Set());

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
                <h2 className="text-xl font-bold text-gray-700">セグメント選択</h2>

                {/* SOMMAP エリア */}
                <div
                    className="bg-[#EFE8C8] aspect-square flex items-center justify-center relative overflow-hidden border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsDetailsVisible(true)}
                >
                    <img src={somMapImage} alt="SOMMAP" className="w-full h-full object-contain" />
                    <div className="absolute top-2 left-0 right-0 text-center font-bold text-lg">SOMMAP</div>
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

                {/* ナビゲーションボタン */}
                <button
                    className="w-full py-2 bg-gray-200 border border-gray-400 rounded shadow-sm hover:bg-gray-300 font-bold text-gray-700"
                >
                    セグメント選択画面表示
                </button>

                {/* 出力ボタン (左下) */}
                <div className="mt-auto">
                    <button className="w-full py-2 bg-gray-200 border border-gray-400 rounded shadow-sm hover:bg-gray-300 font-bold text-gray-700">
                        共通フィルターに出力
                    </button>
                </div>
            </div>

            {/* 右パネル - ペルソナ一覧 */}
            <div className="w-3/4 pl-4 overflow-auto">
                {isDetailsVisible ? (
                    <div className="min-w-[800px]">
                        {/* ヘッダー行 */}
                        <div className="grid grid-cols-[120px_1fr] border-b border-transparent">
                            <div className="p-2"></div>
                            <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold text-gray-600">
                                {personaData.map(p => (
                                    <div key={p.id} className="flex items-center justify-center gap-1">
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
                                        className="aspect-square bg-[#FDF6D8] p-2 flex items-center justify-center border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                                        onClick={() => handleSelectPersona(p.id)}
                                    >
                                        <img src={p.image} alt={p.name} className="max-w-full max-h-full object-cover shadow-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 属性テーブル */}
                        <div className="w-full text-xs">
                            {/* セグメント名 */}
                            <div className="grid grid-cols-[120px_1fr] border-b border-gray-200">
                                <div className="p-2 font-bold text-gray-600 flex items-center">セグメント</div>
                                <div className="grid grid-cols-6 gap-2">
                                    {personaData.map(p => (
                                        <div key={p.id} className="p-2 text-center flex items-center justify-center text-[10px]">{p.segmentName}</div>
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
                                <div className="grid grid-cols-6 gap-2 items-end relative">
                                    {/* 平均線 (点線) */}
                                    <div className="absolute left-0 right-0 top-1/2 border-t border-dotted border-gray-400 z-0"></div>

                                    {personaData.map(p => (
                                        <div key={p.id} className="flex flex-col items-center justify-end h-24 z-10">
                                            <span className="mb-1 text-[10px]">{p.innovatorScore}</span>
                                            <div
                                                className="w-full bg-[#2CA0F0]"
                                                style={{ height: `${(p.innovatorScore / 7) * 100}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* その他属性 */}
                            {[
                                { label: '特徴的な\n購入カテゴリ', key: 'purchaseCategory' },
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
                    <div className="flex items-center justify-center h-full text-gray-400">
                        左側のSOMMAPをクリックすると詳細情報が表示されます
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState } from 'react';

// モーダルのProps。

interface ProductSelectionModalProps {
    onClose: () => void;
    onSelectSegment: () => void;
    onSelectPersona: () => void;
}

// カテゴリボタン

const categories = ['すべて', 'データ分析', '市場分析', '顧客分析', '製品分析', '調査・評価'];

const ProductCard = ({ title, englishTitle, onClick }: { title: string; englishTitle: string; onClick: () => void }) => (
    <div
        className="w-48 h-40 border border-gray-300 rounded-md shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white flex flex-col"
        onClick={onClick}
    >
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
            <h3 className="font-bold text-[#586365] text-xs">{title}</h3>
        </div>
        <div className="flex-grow flex items-center justify-center p-2">
            <span className="text-sm font-bold text-gray-400">{englishTitle}</span>
        </div>
    </div>
);

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ onClose, onSelectSegment, onSelectPersona }) => {
    const [activeCategory, setActiveCategory] = useState('すべて');

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-gray-100 shadow-2xl rounded-lg w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden border border-gray-400"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー */}

                <header className="flex items-center justify-between p-3 border-b border-gray-300 bg-white flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-sm font-bold text-[#586365]">プロダクトを選びましょう</h2>
                        <div className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-help">?</div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-sm font-bold" aria-label="閉じる">
                        &times;
                    </button>
                </header>

                {/* ボディ */}

                <div className="p-4 flex-grow flex flex-col overflow-hidden">
                    {/* カテゴリフィルター */}

                    <div className="flex items-center space-x-2 mb-4 flex-shrink-0">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors ${activeCategory === category
                                    ? 'bg-gray-600 text-white border-gray-600'
                                    : 'bg-white text-[#586365] border-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* プロダクトグリッド */}

                    <div className="flex-grow overflow-y-auto pr-2">
                        <div className="flex flex-wrap gap-4">
                            {(activeCategory === 'すべて' || activeCategory === 'データ分析') && (
                                <>
                                    <ProductCard
                                        title="セグメント"
                                        englishTitle="Segment"
                                        onClick={onSelectSegment}
                                    />
                                    <ProductCard
                                        title="ペルソナ"
                                        englishTitle="Persona"
                                        onClick={onSelectPersona}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
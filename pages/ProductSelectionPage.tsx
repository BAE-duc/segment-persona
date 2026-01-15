import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = ['すべて', 'データ分析', '市場分析', '顧客分析', '製品分析', '調査・評価'];

const ProductCard: React.FC<{ title: string; englishTitle: string; onClick: () => void }> = ({ title, englishTitle, onClick }) => (
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

const ProductSelectionPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('すべて');
  const navigate = useNavigate();

  const handleSelectSegment = () => {
    navigate('/segment');
  };

  const handleSelectPersona = () => {
    navigate('/ProductPersona');
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex items-start justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="flex items-center space-x-2 mb-4">
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

        <div className="grid grid-cols-2 gap-4">
          {(activeCategory === 'すべて' || activeCategory === 'データ分析') && (
            <>
              <ProductCard title="セグメント" englishTitle="Segment" onClick={handleSelectSegment} />
              <ProductCard title="ペルソナ" englishTitle="Persona" onClick={handleSelectPersona} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSelectionPage;



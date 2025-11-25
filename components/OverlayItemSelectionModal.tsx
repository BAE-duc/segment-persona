import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';

// 選択されたアイテムの構造を定義します

export interface OverlaySelection {
  carIds: Set<string>;
}

// Propsのインターフェース

interface OverlayItemSelectionModalProps {
  onClose: () => void;
  onConfirm: (selection: OverlaySelection) => void;
  initialSelection?: OverlaySelection;
}

// 自動車データのインターフェース

interface CarData {
  id: string;
  maker: 'トヨタ' | '日産' | 'ホンダ';
  category: 'セダン' | 'SUV' | 'ミニバン';
  name: string;
}

// フィルターアイコン

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block align-middle text-gray-500" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V16a1 1 0 01-1.447.894l-3-2A1 1 0 018 14v-3.586L3.293 6.707A1 1 0 013 6V3z" />
  </svg>
);

// チェックボックスのスタイルを更新しました。チェック時に黒い背景になる代わりに、白い背景に黒いチェックマークが表示されるようにしました。

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

// フィルタリングポップアップのProps

interface FilterPopupProps {
  options: string[];
  selectedOptions: Set<string>;
  onApply: (newSelection: Set<string>) => void;
  onClose: () => void;
  position: { top: number; left: number };
  width: number;
}

// フィルタリングポップアップコンポーネント

const FilterPopup: React.FC<FilterPopupProps> = ({ options, selectedOptions, onApply, onClose, position, width }) => {
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set(selectedOptions));
  const popupRef = useRef<HTMLDivElement>(null);

  const handleToggle = (option: string) => {
    setTempSelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(option)) {
        newSet.delete(option);
      } else {
        newSet.add(option);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute z-20 bg-white border border-gray-400 rounded-md shadow-lg p-2"
      style={{ top: position.top, left: position.left, width: `${width}px` }}
    >
      <div className="flex flex-col space-y-1 max-h-48 overflow-y-auto pr-2">
        {options.map(option => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded-sm">
            <CustomCheckbox
              checked={tempSelection.has(option)}
              onChange={() => handleToggle(option)}
            />
            <span className="text-xs">{option}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200 text-right">
        <AppButton onClick={() => onApply(tempSelection)} className="py-1 px-3 text-xs">適用</AppButton>
      </div>
    </div>
  );
};

// 左パネルの変数一覧データ

const variables = [
  { id: 'hoyusha', name: '保有車' },
  ...Array.from({ length: 20 }, (_, i) => ({ id: `var${i + 1}`, name: `変数${i + 1}` })),
];

// 右パネルの自動車データ

const carData: CarData[] = [
  // Toyota
  { id: 't-s-1', maker: 'トヨタ', category: 'セダン', name: 'クラウン' },
  { id: 't-s-2', maker: 'トヨタ', category: 'セダン', name: 'カムリ' },
  { id: 't-s-3', maker: 'トヨタ', category: 'セダン', name: 'カローラ' },
  { id: 't-suv-1', maker: 'トヨタ', category: 'SUV', name: 'RAV4' },
  { id: 't-suv-2', maker: 'トヨタ', category: 'SUV', name: 'ハリアー' },
  { id: 't-suv-3', maker: 'トヨタ', category: 'SUV', name: 'ランドクルーザー' },
  { id: 't-m-1', maker: 'トヨタ', category: 'ミニバン', name: 'アルファード' },
  { id: 't-m-2', maker: 'トヨタ', category: 'ミニバン', name: 'ヴォクシー' },
  { id: 't-m-3', maker: 'トヨタ', category: 'ミニバン', name: 'シエンタ' },
  // Nissan
  { id: 'n-s-1', maker: '日産', category: 'セダン', name: 'スカイライン' },
  { id: 'n-s-2', maker: '日産', category: 'セダン', name: 'フーガ' },
  { id: 'n-s-3', maker: '日産', category: 'セダン', name: 'シルフィ' },
  { id: 'n-suv-1', maker: '日産', category: 'SUV', name: 'エクストレイル' },
  { id: 'n-suv-2', maker: '日産', category: 'SUV', name: 'キックス' },
  { id: 'n-suv-3', maker: '日産', category: 'SUV', name: 'アリア' },
  { id: 'n-m-1', maker: '日産', category: 'ミニバン', name: 'セレナ' },
  { id: 'n-m-2', maker: '日産', category: 'ミニバン', name: 'エルグランド' },
  { id: 'n-m-3', maker: '日産', category: 'ミニバン', name: 'ノート' },
  // Honda
  { id: 'h-s-1', maker: 'ホンダ', category: 'セダン', name: 'アコード' },
  { id: 'h-s-2', maker: 'ホンダ', category: 'セダン', name: 'シビック' },
  { id: 'h-s-3', maker: 'ホンダ', category: 'セダン', name: 'インサイト' },
  { id: 'h-suv-1', maker: 'ホンダ', category: 'SUV', name: 'ヴェゼル' },
  { id: 'h-suv-2', maker: 'ホンダ', category: 'SUV', name: 'CR-V' },
  { id: 'h-suv-3', maker: 'ホンダ', category: 'SUV', name: 'ZR-V' },
  { id: 'h-m-1', maker: 'ホンダ', category: 'ミニバン', name: 'ステップワゴン' },
  { id: 'h-m-2', maker: 'ホンダ', category: 'ミニバン', name: 'フリード' },
  { id: 'h-m-3', maker: 'ホンダ', category: 'ミニバン', name: 'オデッセイ' },
];

const makerOptions = ['トヨタ', '日産', 'ホンダ'];
const categoryOptions = ['セダン', 'SUV', 'ミニバン'];

export const OverlayItemSelectionModal: React.FC<OverlayItemSelectionModalProps> = ({ onClose, onConfirm, initialSelection }) => {
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>('hoyusha');
  const [selectedCarIds, setSelectedCarIds] = useState<Set<string>>(initialSelection?.carIds || new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // フィルターの状態管理

  const [makerFilter, setMakerFilter] = useState<Set<string>>(new Set(makerOptions));
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set(categoryOptions));
  const [filterPopup, setFilterPopup] = useState<{ type: 'maker' | 'category' | null; position: { top: number, left: number }, width: number }>({ type: null, position: { top: 0, left: 0 }, width: 0 });

  const makerHeaderRef = useRef<HTMLTableCellElement>(null);
  const categoryHeaderRef = useRef<HTMLTableCellElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);


  // 変数リストをフィルタリング

  const filteredVariables = useMemo(() =>
    variables.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  // 自動車データをフィルタリング

  const filteredCarData = useMemo(() =>
    carData.filter(car => makerFilter.has(car.maker) && categoryFilter.has(car.category)),
    [makerFilter, categoryFilter]
  );

  // チェックボックスの状態を切り替えるハンドラ

  const handleCarSelectionToggle = (carId: string) => {
    setSelectedCarIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(carId)) {
        newSet.delete(carId);
      } else {
        newSet.add(carId);
      }
      return newSet;
    });
  };

  // ポップアップの位置をオーバーレイコンテナからの相対位置として計算するようにロジックを更新しました。

  const openFilterPopup = (type: 'maker' | 'category', ref: React.RefObject<HTMLTableCellElement>) => {
    if (ref.current && overlayRef.current) {
      const headerRect = ref.current.getBoundingClientRect();
      const overlayRect = overlayRef.current.getBoundingClientRect();
      setFilterPopup({
        type,
        position: {
          top: headerRect.bottom - overlayRect.top,
          // FIX: 水平位置の計算で誤って`overlayRect.top`を使用していました。`overlayRect.left`に修正しました。

          left: headerRect.left - overlayRect.left
        },
        width: headerRect.width
      });
    }
  };

  return (
    <div ref={overlayRef} className={modalStyles.overlay} aria-modal="true" role="dialog">
      <div className={`${modalStyles.container} max-w-5xl w-full`} style={{ height: '40rem' }}>
        {/* ヘッダー */}

        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>重ね合わせ項目設定</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} flex gap-4 overflow-hidden`}>
          {/* 左パネル: 変数一覧 */}

          <div className="w-1/3 flex flex-col">
            <h3 className="font-semibold text-xs mb-1 text-[#586365]">変数一覧</h3>
            <div className="flex items-center space-x-1 mb-2">
              <input
                type="text"
                className="flex-grow h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="flex items-center justify-center flex-shrink-0 h-[30px] w-[30px] border border-gray-400 bg-gray-200 hover:bg-gray-300 rounded-md" aria-label="検索">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <div className="flex-grow border border-gray-400 bg-white rounded-md overflow-y-auto text-xs p-1 select-none">
              {filteredVariables.map(v => (
                <div
                  key={v.id}
                  className={`p-1 cursor-pointer rounded-sm whitespace-nowrap overflow-hidden text-ellipsis ${modalStyles.interactive.listItem(selectedVariableId === v.id)}`}
                  onClick={() => setSelectedVariableId(v.id)}
                  title={v.name}
                >
                  {v.name}
                </div>
              ))}
            </div>
          </div>

          {/* 右パネル: 選択肢テーブル */}

          <div className="w-2/3 flex flex-col">
            <div className="flex-grow border border-gray-400 bg-white rounded-md overflow-hidden flex flex-col">
              {selectedVariableId === 'hoyusha' ? (
                <>
                  <div className="flex-shrink-0 overflow-x-auto">
                    <table className="w-full text-xs table-fixed">
                      <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                          <th className="p-1 font-semibold text-center border-b border-r border-gray-300 w-10"></th>
                          <th ref={makerHeaderRef} className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2 w-32 select-none">
                            メーカー
                            <span onClick={(e) => { e.stopPropagation(); openFilterPopup('maker', makerHeaderRef); }} className="ml-1 align-middle cursor-pointer">
                              <FilterIcon />
                            </span>
                          </th>
                          <th ref={categoryHeaderRef} className="p-1 font-semibold text-left border-b border-r border-gray-300 pl-2 w-32 select-none">
                            カテゴリ
                            <span onClick={(e) => { e.stopPropagation(); openFilterPopup('category', categoryHeaderRef); }} className="ml-1 align-middle cursor-pointer">
                              <FilterIcon />
                            </span>
                          </th>
                          <th className="p-1 font-semibold text-left border-b border-gray-300 pl-2">車名</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="flex-grow overflow-auto">
                    <table className="w-full text-xs table-fixed">
                      <tbody>
                        {filteredCarData.map((car) => (
                          <tr key={car.id} className="hover:bg-gray-100">
                            <td className="p-1 border-b border-r border-gray-200 w-10 text-center">
                              <CustomCheckbox
                                checked={selectedCarIds.has(car.id)}
                                onChange={() => handleCarSelectionToggle(car.id)}
                              />
                            </td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 w-32">{car.maker}</td>
                            <td className="p-1 border-b border-r border-gray-200 pl-2 w-32">{car.category}</td>
                            <td className="p-1 border-b border-gray-200 pl-2">{car.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                  この変数には選択肢がありません。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton onClick={() => onConfirm({ carIds: selectedCarIds })} className="w-24 py-1">OK</AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>

      {/* フィルタポップアップのレンダリング */}

      {filterPopup.type === 'maker' && (
        <FilterPopup
          position={filterPopup.position}
          width={filterPopup.width}
          options={makerOptions}
          selectedOptions={makerFilter}
          onApply={(selection) => {
            setMakerFilter(selection);
            setFilterPopup({ type: null, position: { top: 0, left: 0 }, width: 0 });
          }}
          onClose={() => setFilterPopup({ type: null, position: { top: 0, left: 0 }, width: 0 })}
        />
      )}
      {filterPopup.type === 'category' && (
        <FilterPopup
          position={filterPopup.position}
          width={filterPopup.width}
          options={categoryOptions}
          selectedOptions={categoryFilter}
          onApply={(selection) => {
            setCategoryFilter(selection);
            setFilterPopup({ type: null, position: { top: 0, left: 0 }, width: 0 });
          }}
          onClose={() => setFilterPopup({ type: null, position: { top: 0, left: 0 }, width: 0 })}
        />
      )}

    </div>
  );
};
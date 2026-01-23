import React, { useState } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';

// データアイテムの構造を定義します。

export interface DataItem {
  id: string;
  name: string;
  createdAt: string;
  groupName: string;
}

// データグループの構造を定義します。

interface DataGroup {
  id: string;
  name: string;
  items: Omit<DataItem, 'groupName'>[];
}

// モーダルに 표시할 고정 데이터 (사용자 요청에 따라 변경)

const modalData: DataGroup[] = [
  {
    id: 'group1',
    name: '調査データ',
    items: [
      { id: 'item1-1', name: 'NCBS Japan結合データ (2010-2021、2023年)', createdAt: '2024-01-01T00:00:00' },
      { id: 'item1-2', name: 'NCBS Japan 結合データ (2010-2021、2023-2024年)', createdAt: '2025-10-02T00:00:00' },
      { id: 'item1-3', name: '日本新動態 結合データ', createdAt: '2025-02-10T00:00:00' },
      { id: 'item1-4', name: '2021-2024年META特性調査', createdAt: '2024-12-16T00:00:00' },
    ],
  }
];


interface DataSelectionModalProps {
  onClose: () => void;
  onConfirm: (selectedItem: DataItem) => void;
}

export const DataSelectionModal: React.FC<DataSelectionModalProps> = ({ onClose, onConfirm }) => {
  // 初期状態では何も選択されていない状態に設定します。
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;
    let selectedItemWithGroup: DataItem | null = null;
    for (const group of modalData) {
      const item = group.items.find(i => i.id === selectedId);
      if (item) {
        selectedItemWithGroup = {
          ...item,
          groupName: group.name,
        };
        break;
      }
    }

    if (selectedItemWithGroup) {
      onConfirm(selectedItemWithGroup);
    }
  };

  // すべてのアイテムをフラットなリストに変換
  const allItems = modalData.flatMap(group => 
    group.items.map(item => ({
      ...item,
      groupName: group.name,
    }))
  );

  return (
    <div
      className={modalStyles.overlay}
    >
      <div
        className={`${modalStyles.container} w-[800px] h-[500px]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}

        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>対象データ選択</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} overflow-hidden flex flex-col bg-white`}>
          {/* 테이블 형태: 고정 헤더 + 스크롤 바디 */}
          <div className="flex flex-col flex-grow overflow-hidden">
            <style>{`
              .data-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 0.875rem; }
              .data-table thead { display: table; width: 100%; table-layout: fixed; }
              .data-table tbody { display: block; max-height: 300px; overflow-y: auto; width: 100%; }
              .data-table th, .data-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
              .data-table th { background: #f3f4f6; color: #374151; font-weight: 600; text-align: left; }
              .data-table tr { display: table; width: 100%; table-layout: fixed; }
              .data-table tbody tr:hover { background: #f8fafc; }
              .data-table .col-group { width: 25%; }
              .data-table .col-name { width: 50%; }
              .data-table .col-date { width: 25%; }
              .data-table .radio-wrap { display: flex; align-items: center; gap: 0.5rem; }
              .data-table .selected-row { background: #eff6ff; }
            `}</style>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-group">データ種別</th>
                  <th className="col-name">データ</th>
                  <th className="col-date">作成日時
                    <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, index) => {
                  const previousGroupName = index > 0 ? allItems[index - 1].groupName : null;
                  const displayGroupName = previousGroupName === item.groupName ? '' : item.groupName;
                  const isSelected = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={`${isSelected ? 'selected-row' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td className="col-group">{displayGroupName}</td>
                      <td className="col-name">
                        <div className="radio-wrap">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-700 flex items-center justify-center flex-shrink-0 bg-white">
                            {isSelected && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                          </div>
                          <span className="text-sm text-gray-700 truncate">{item.name}</span>
                        </div>
                      </td>
                      <td className="col-date text-sm text-gray-600">{item.createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton onClick={handleConfirm} className="w-24" disabled={!selectedId} isActive={!!selectedId}>OK</AppButton>
            <button 
              onClick={onClose} 
              className="h-[30px] px-4 flex items-center justify-center transition-colors duration-200 text-xs font-medium rounded-md border border-gray-400 bg-white text-gray-700 hover:bg-gray-50 w-24"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

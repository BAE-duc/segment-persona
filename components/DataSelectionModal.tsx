import React, { useState } from 'react';
import { AppButton } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import { CaretIcon } from './shared/CaretIcon';

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

// モーダル에 표시할 고정 데이터 (사용자 요청에 따라 변경)

const modalData: DataGroup[] = [
  {
    id: 'group1',
    name: '調査データ',
    items: [
      { id: 'item1-1', name: 'NCBS Japan 結合データ (2010-2021, 2023年)', createdAt: '2024-01-01 T00:00:00' },
      { id: 'item1-2', name: 'NCBS Japan 結合データ (2010-2021, 2023-2024年)', createdAt: '2025-10-02 T00:00:00' },
      { id: 'item1-3', name: '新動態結合データ[乗用:01/04-20/12]', createdAt: '2025-02-10 T00:00:00' },
      { id: 'item1-4', name: 'デザイン感性研究調査 2024年 日本', createdAt: '2024-12-16 T00:00:00' },
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
  // ツリーの展開状態を管理します（デフォルトは展開）
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'group1': true });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

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

        <div className={`${modalStyles.body.container} overflow-hidden flex flex-col`}>
          {/* カラムヘッダー */}
          <div className="grid grid-cols-12 pb-2 border-b border-gray-300 text-gray-700 font-medium flex-shrink-0 text-sm">
            <div className="col-span-3">データ種別</div>
            <div className="col-span-6">データ名</div>
            <div className="col-span-3">作成日時</div>
          </div>

          <div className="flex-grow overflow-y-auto mt-2">
            {modalData.map(group => (
              <div key={group.id} className="mb-1">
                {/* 최상위 트리: 데이터 종별 */}
                <div 
                  className="grid grid-cols-12 items-center py-1 bg-gray-100 hover:bg-gray-200 cursor-pointer border-y border-gray-200"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="col-span-3 flex items-center">
                    <CaretIcon expanded={!!expandedGroups[group.id]} />
                    <span className="text-sm font-bold">{group.name}</span>
                  </div>
                  <div className="col-span-9"></div>
                </div>

                {/* 하위 항목: 데이터명 및 작성일시 */}
                {expandedGroups[group.id] && group.items.map(item => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 items-center cursor-pointer py-1 ${selectedId === item.id ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="col-span-3"></div>
                    <div className="col-span-6 flex items-center pl-4">
                      {/* 커스텀 라디오 버튼 */}
                      <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center mr-3 flex-shrink-0 bg-white">
                        {selectedId === item.id && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                      </div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="col-span-3 text-sm text-gray-600">{item.createdAt}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton onClick={handleConfirm} className="w-24" disabled={!selectedId} isActive={!!selectedId}>OK</AppButton>
            <AppButton onClick={onClose} className="w-24">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

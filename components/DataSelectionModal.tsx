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

// モーダルに表示するダミーデータ。

const modalData: DataGroup[] = [
  {
    id: 'group1',
    name: '調査データ(調査部)',
    items: [
      { id: 'item1-1', name: 'NCBS Japan 結合データ (2010-2021, 2023年)', createdAt: '2024-01-01 T00:00:00' },
      { id: 'item1-2', name: 'NCBS Japan 結合データ (2010-2021, 2023-2024年)', createdAt: '2025-10-02 T00:00:00' },
      { id: 'item1-3', name: '新動態結合データ[乗用:01/04-20/12]', createdAt: '2025-02-10 T00:00:00' },
    ],
  },
  {
    id: 'group2',
    name: '調査データ(デザイン部)',
    items: [
      { id: 'item2-1', name: 'デザイン感性研究調査 2024年 日本', createdAt: '2024-12-16 T00:00:00' },
    ],
  },
  {
    id: 'group3',
    name: '追加データ(テスト)',
    items: [
      { id: 'item3-1', name: 'テストデータセット A', createdAt: '2023-05-20 T10:30:00' },
      { id: 'item3-2', name: 'テストデータセット B', createdAt: '2023-06-15 T11:00:00' },
      { id: 'item3-3', name: 'テストデータセット C', createdAt: '2023-07-01 T14:00:00' },
      { id: 'item3-4', name: 'テストデータセット D', createdAt: '2023-08-10 T09:45:00' },
      { id: 'item3-5', name: 'テストデータセット E', createdAt: '2023-09-05 T16:20:00' },
      { id: 'item3-6', name: 'テストデータセット F', createdAt: '2023-09-06 T16:20:00' },
      { id: 'item3-7', name: 'テストデータセット G', createdAt: '2023-09-07 T16:20:00' },
      { id: 'item3-8', name: 'テストデータセット H', createdAt: '2023-09-08 T16:20:00' },
      { id: 'item3-9', name: 'テストデータセット I', createdAt: '2023-09-09 T16:20:00' },
      { id: 'item3-10', name: 'テストデータセット J', createdAt: '2023-09-10 T16:20:00' },
      { id: 'item3-11', name: 'テストデータセット K', createdAt: '2023-09-11 T16:20:00' },
      { id: 'item3-12', name: 'テストデータセット L', createdAt: '2023-09-12 T16:20:00' },
    ],
  },
  {
    id: 'group-test',
    name: 'テストデータ',
    items: [
      { id: 'test-csv-data', name: 'Test CSV Data (ID, sex, child, age, year)', createdAt: '2025-01-01 T00:00:00' }
    ]
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

  return (
    <div
      className={modalStyles.overlay}
    >
      <div
        className={`${modalStyles.container} w-[700px] h-[500px]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}

        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>対象データ選択</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} overflow-hidden flex flex-col`}>
          <div className="grid grid-cols-12 pb-2 border-b border-gray-300 text-gray-500 flex-shrink-0">
            <div className="col-span-8 pl-8">データ名</div>
            <div className="col-span-4">作成日時</div>
          </div>
          <div className="flex-grow overflow-y-auto mt-2">
            {modalData.map(group => 
              group.items.map(item => (
                <div
                  key={item.id}
                  className={`grid grid-cols-12 items-center cursor-pointer ${modalStyles.interactive.listItem(selectedId === item.id)}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="col-span-8 flex items-center py-1">
                    {/* カスタムラジオボタン */}

                    <div className="w-4 h-4 rounded-full border-2 border-gray-700 flex items-center justify-center mx-2 flex-shrink-0">
                      {selectedId === item.id && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <div className="col-span-4 text-gray-600">{item.createdAt}</div>
                </div>
              ))
            )}
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
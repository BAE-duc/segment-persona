import React, { useState } from 'react';
import { AppButton } from './FormControls';
import { modalStyles } from './modalStyles';

interface FilterNameInputModalProps {
  onClose: () => void;
  onConfirm: (filterName: string) => void;
}

export const FilterNameInputModal: React.FC<FilterNameInputModalProps> = ({ onClose, onConfirm }) => {
  const [filterName, setFilterName] = useState('');

  const handleConfirm = () => {
    if (filterName.trim()) {
      onConfirm(filterName.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filterName.trim()) {
      handleConfirm();
    }
  };

  return (
    <div
      className={modalStyles.overlay}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${modalStyles.container} w-[29rem]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>フィルタ名入力</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>
            {modalStyles.header.closeButtonIcon}
          </button>
        </div>

        {/* ボディ */}
        <div className={`${modalStyles.body.container} flex items-center justify-center`}>
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="フィルタ名を入力してください"
            className="w-full px-3 py-2 text-sm border border-gray-400 rounded-md outline-none focus:ring-1 focus:ring-gray-400"
            autoFocus
          />
        </div>

        {/* フッター */}
        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirm}
              className="w-24 py-1"
              disabled={!filterName.trim()}
              isActive={!!filterName.trim()}
            >
              OK
            </AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">
              Cancel
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AppButton } from './FormControls';
import { modalStyles } from './modalStyles';

interface InfoModalProps {
  message: string;
  onClose: () => void;
}

// 情報アイコンコンポーネント。青い円の中に「i」の文字を表示します。

const InfoIcon = () => (
  <div className="w-14 h-14 flex-shrink-0">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#3B82F6" /> {/* Blue-500 */}
      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.9" strokeWidth="1" /> {/* Inner border */}
      {/* 'i' icon parts */}
      <circle cx="12" cy="7" r="1.5" fill="white" /> {/* The dot */}
      <rect x="11" y="10" width="2" height="8" rx="1" fill="white" /> {/* The stem */}
    </svg>
  </div>
);

export const InfoModal: React.FC<InfoModalProps> = ({ message, onClose }) => {
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
          <h2 className={modalStyles.header.title}>Information</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} flex items-center space-x-4 min-h-[8rem]`}>
          <InfoIcon />
          <p className="text-sm">{message}</p>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <AppButton onClick={onClose} className="w-24 py-1">OK</AppButton>
        </div>
      </div>
    </div>
  );
};
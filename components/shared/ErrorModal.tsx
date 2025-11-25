import React, { useState } from 'react';
import { AppButton } from './FormControls';
import { modalStyles } from './modalStyles';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

// エラーアイコンコンポーネント。赤い円の中に「X」の文字を表示します。

const ErrorIcon = () => (
  <div className="w-14 h-14 flex-shrink-0">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#DC2626" />
      <path d="M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 9L9 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);


export const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
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
          <h2 className={modalStyles.header.title}>Error</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} flex items-center space-x-4 min-h-[8rem]`}>
          <ErrorIcon />
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
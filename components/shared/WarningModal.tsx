import React, { useState } from 'react';
import { AppButton } from './FormControls';
import { modalStyles } from './modalStyles';

interface WarningModalProps {
  message: string;
  onClose: () => void;
}

// 警告アイコンコンポーネント。黄色い三角形の中に感嘆符を表示します。

const WarningIcon = () => (
  <div className="w-14 h-14 flex-shrink-0">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 21H23L12 2Z" fill="#FBBF24" stroke="#A9A9A9" strokeWidth="0.5" strokeLinejoin="round" />
      <path d="M12 4.07L2.75 20H21.25L12 4.07Z" fill="#FBBF24" stroke="white" strokeWidth="1" strokeLinejoin="round" />
      <rect x="11" y="9" width="2" height="7" rx="1" fill="black" />
      <circle cx="12" cy="18" r="1" fill="black" />
    </svg>
  </div>
);


export const WarningModal: React.FC<WarningModalProps> = ({ message, onClose }) => {
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
          <h2 className={modalStyles.header.title}>Warning</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} flex items-center space-x-4 min-h-[8rem]`}>
          <WarningIcon />
          {/* 改行を反映させるために pre-wrap を使用します。 */}

          <p className="whitespace-pre-wrap text-sm">{message}</p>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <AppButton onClick={onClose} className="w-24 py-1">OK</AppButton>
        </div>
      </div>
    </div>
  );
};
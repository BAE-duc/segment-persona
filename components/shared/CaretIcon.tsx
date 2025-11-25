import React from 'react';

// ツリービュー用のアイコンコンポーネント。
// ツリービューの展開・折りたたみ状態を示すアイコンを表示します。
export const CaretIcon = ({ expanded }: { expanded: boolean }) => (
  <div className="w-4 h-4 text-[#586365] flex items-center justify-center">
    <svg
      className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M8 6l6 4-6 4V6z" />
    </svg>
  </div>
);

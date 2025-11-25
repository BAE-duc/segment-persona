import React from 'react';

// AppButtonのスタイルを更新し、h-9とflexを使って高さを固定し、他のフォームコントロールとの一貫性を確保します。

// disabled:opacity-50を削除し、各テーマで個別に制御します。
const buttonStructureClasses = "h-[30px] px-4 flex items-center justify-center transition-colors duration-200 text-xs font-medium disabled:cursor-not-allowed rounded-md";

const inactiveThemeClasses = "border border-gray-400 bg-gray-200 hover:bg-gray-300 disabled:opacity-50";
const activeThemeClasses = "text-white border border-blue-600 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 disabled:opacity-50";

// 「いますぐ分析する」ボタンと同じスタイルのプライマリテーマ。

// 有効時は #00BFFF、無効時はグレーになります。
const primaryThemeClasses = "text-white bg-[#00BFFF] hover:opacity-90 border border-transparent disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300";

// AppButtonコンポーネントのPropsインターフェース。

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
  primary?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({ children, onClick, className = '', isActive, primary, ...props }) => {
  let themeClasses = inactiveThemeClasses;

  if (primary) {
    themeClasses = primaryThemeClasses;
  } else if (isActive) {
    themeClasses = activeThemeClasses;
  }

  return (
    <button onClick={onClick} className={`${buttonStructureClasses} ${themeClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

// AppSelectコンポーネントのPropsインターフェース。

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children?: React.ReactNode;
}

export const AppSelect: React.FC<AppSelectProps> = ({ children, value, onChange, className = '', ...props }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      // 他のUI要素との一貫性を保つためのスタイル設定。

      className={`bg-white border border-gray-400 h-[30px] px-2 text-xs focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none rounded-md ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
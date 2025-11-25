import React from 'react';

// onClose, onMinimize, onHeaderMouseDown propを定義するインターフェース。
interface TabSystemProps {
    onClose?: () => void;
    onMinimize?: () => void;
    onHeaderMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
    title?: string;
    children?: React.ReactNode;
}

export const TabSystem = ({ onClose, onMinimize, onHeaderMouseDown, title = 'セグメント', children }: TabSystemProps) => {
    return (
        <div className="h-full flex flex-col bg-gray-100">
            {/* ヘッダー */}
            <header
                onMouseDown={onHeaderMouseDown}
                style={{
                    backgroundColor: '#586365',
                    cursor: onHeaderMouseDown ? 'move' : 'default'
                }}
                className="flex items-center justify-between px-4 h-[30px] text-white flex-shrink-0"
            >
                <div className="flex items-baseline">
                    <h1 className="text-sm font-bold">
                        {title}
                    </h1>
                    <span className="ml-2 text-xs font-normal opacity-80">Ver: 0.1.0</span>
                </div>
                {/* ウィンドウコントロール */}
                {(onMinimize || onClose) && (
                    <div className="flex items-center space-x-2">
                        {onMinimize && (
                            <button
                                onClick={onMinimize}
                                className="p-1 hover:bg-gray-600 rounded"
                                aria-label="最小化"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-red-500 rounded"
                                aria-label="閉じる"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* コンテンツエリア */}
            <div className="flex-grow overflow-hidden">
                {children}
            </div>
        </div>
    );
};
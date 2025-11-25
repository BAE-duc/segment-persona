import React from 'react';
import { FilterSection } from './shared/FilterSection';
import { TreeItem } from './shared/TreeItem';

// サイドバーコンポーネントのPropsインターフェース。
// サイドバーの表示制御とフィルターデータの受け渡しを行います。
interface SidebarProps {
    onSomExecute: () => void;
    filterCategories: { [key: string]: string[] };
    isCollapsed: boolean;
    onToggle: () => void;
}

// メインサイドバーコンポーネント。
// アプリケーションの左側に配置され、フィルター条件の設定や分析実行ボタンを提供します。
export const Sidebar: React.FC<SidebarProps> = ({ onSomExecute, filterCategories, isCollapsed, onToggle }) => {
    return (
        <aside className={`bg-[#f8f9fa] flex flex-col flex-shrink-0 border-r border-gray-300 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-14' : 'w-[180px]'}`}>
            {/* ロゴセクション */}
            <div className="p-4 flex-shrink-0">
                {!isCollapsed && (
                    <div className="bg-black text-white py-4 px-3 text-center rounded-md">
                        <h2 className="text-sm font-bold tracking-wider">i-MAP NEXT</h2>
                        <p className="text-xs mt-1">GUSHIN FOR YOU</p>
                    </div>
                )}
                <div className={`flex items-center mt-2 ${isCollapsed ? 'justify-center' : ''}`}>
                    {!isCollapsed && (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#586365]" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8c1.99 0 3.6-1.61 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3Z" /></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#586365]" viewBox="0 0 24 24"><path fill="currentColor" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5z" opacity=".3" /><path d="M12 17c2.76 0 5-2.24 5-5s-2.24-5-5-5s-5 2.24-5 5s2.24 5 5 5zm0-8c1.65 0 3 1.35 3 3s-1.35 3-3 3s-3-1.35-3-3s1.35-3 3-3z" /> </svg>
                            <div className="flex-grow"></div>
                        </>
                    )}
                    <button onClick={onToggle} className="text-gray-600 font-bold text-sm p-1 hover:bg-gray-200 rounded">
                        {isCollapsed ? '»' : '«'}
                    </button>
                </div>
            </div>

            {/* フィルターセクション */}
            {/* フィルターコンテナを flex-col に変更し、overflow-y-auto を削除して、子セクションが個別にスクロールできるようにします。 */}
            <div className={`flex-grow overflow-hidden px-2 flex flex-col ${isCollapsed ? 'hidden' : ''}`}>
                <FilterSection title="期間" grow={2}>
                    <TreeItem label="全社公開">
                        <TreeItem label="2023年" />
                        <TreeItem label="2024年" />
                        <TreeItem label="2025年" />
                    </TreeItem>
                    <TreeItem label="個人">
                        <TreeItem label="2023年" />
                        <TreeItem label="2024年" />
                        <TreeItem label="2025年" />
                    </TreeItem>
                </FilterSection>

                <FilterSection title="地域" grow={2}>
                    <TreeItem label="日本" />
                    <TreeItem label="米国" />
                    <TreeItem label="タイ" />
                </FilterSection>

                <FilterSection title="車" grow={3}>
                    <TreeItem label="全社公開">
                        <TreeItem label="PHEV" />
                    </TreeItem>
                    <TreeItem label="個人">
                        <TreeItem label="PHEV" />
                    </TreeItem>
                </FilterSection>

                <FilterSection title="人" grow={3}>
                    <TreeItem label="全社公開">
                        <TreeItem label="性別(男性)" />
                        <TreeItem label="年齢(20代)" />
                        <TreeItem label="年齢(30代)" />
                        <TreeItem label="年齢(40代)" />
                        <TreeItem label="年齢(50代)" />
                        <TreeItem label="性別(女性)" />
                    </TreeItem>
                </FilterSection>
            </div>

            {/* 下部ボタン */}
            <div className={`p-4 flex-shrink-0 bg-[#f8f9fa] ${isCollapsed ? 'hidden' : ''}`}>
                <button
                    onClick={onSomExecute}
                    className="w-full py-3 text-white font-bold rounded-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#00BFFF' }}
                >
                    いますぐ分析する
                </button>
            </div>
        </aside>
    );
};
import React, { useState, PropsWithChildren } from 'react';
import { CaretIcon } from './CaretIcon';

// サイドバーの各フィルターセクションのコンポーネント。
// フィルターのカテゴリごとに展開・折りたたみ可能なセクションを提供します。
export const FilterSection: React.FC<PropsWithChildren<{ title: string; defaultExpanded?: boolean; grow: number }>> = ({ title, children, defaultExpanded = true, grow }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    // 展開されている場合は、指定された比率で高さを伸ばします。折りたたまれている場合は、ヘッダーの高さのみを占有します。
    const growClass = isExpanded ? `grow-[${grow}] basis-0` : 'flex-shrink-0';

    return (
        // flex と min-h-0 を追加して、子要素のスクロールが正しく機能するようにします。
        <div className={`border-b border-gray-300 py-2 flex flex-col min-h-0 ${growClass}`}>
            {/* ヘッダー部分 - 縮小不可 */}
            <div className="px-2 flex-shrink-0">
                <div className="flex items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="mr-1">
                        <CaretIcon expanded={isExpanded} />
                    </div>
                    <h3 className="font-bold text-[#586365]">{title}</h3>
                </div>
                <div className="ml-5 pt-1">
                    <a href="#" className="text-xs text-blue-600 hover:underline">[Add Filter]</a>
                </div>
            </div>
            {/* コンテンツ部分 - コンテンツが割り当てられた高さを超えるとスクロールします */}
            {isExpanded && (
                <div className="mt-2 pl-2 text-xs space-y-1 overflow-y-auto">
                    {children}
                </div>
            )}
        </div>
    );
};

import React, { useState, PropsWithChildren } from 'react';
import { CaretIcon } from './CaretIcon';

// ツリービューアイテムのコンポーネント。
// サイドバーなどで階層構造を表示するために使用されます。
export const TreeItem: React.FC<PropsWithChildren<{ label: string; defaultExpanded?: boolean }>> = ({ label, children, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasChildren = React.Children.count(children) > 0;

    return (
        <div>
            <div className={`flex items-center py-0.5 ${hasChildren ? 'cursor-pointer' : ''}`} onClick={() => hasChildren && setIsExpanded(!isExpanded)}>
                {hasChildren ? (
                    <div className="mr-1">
                        <CaretIcon expanded={isExpanded} />
                    </div>
                ) : (
                    <span className="inline-block w-4 mr-1"></span>
                )}
                <span>{label}</span>
            </div>
            {isExpanded && hasChildren && <div className="ml-5 border-l border-gray-200 pl-2">{children}</div>}
        </div>
    );
};

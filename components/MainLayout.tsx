import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { ProductSelectionModal } from './ProductSelectionModal';
import { TabSystem } from './TabSystem';
import { SegmentCreationPage } from '../pages/SegmentCreationPage';
import { PersonaListPage } from '../pages/PersonaListPage';

// ヘッダーコンポーネント。

const Header = () => (
    <header className="h-10 bg-white flex-shrink-0 flex justify-end items-center px-4 border-b border-gray-300">
        <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold text-gray-600">Ver: 0.3.0</span>
            <select className="text-xs bg-white border border-gray-300 rounded-sm px-2 py-0.5 focus:outline-none">
                <option>日本語</option>
                <option>English</option>
            </select>
        </div>
    </header>
);

// ペルソナポップアップ型

interface PersonaPopup {
    id: string;
    position: { x: number, y: number } | null;
    isMinimized: boolean;
    minimizedPosition: { x: number, y: number } | null;
}

// メインレイアウトコンポーネント。

export const MainLayout = () => {
    // プロダクト選択モーダルの表示状態を管理するstate。

    const [isProductModalOpen, setProductModalOpen] = useState(false);

    // セグメント作成ポップアップを管理するstate。

    const [isSegmentPopupOpen, setSegmentPopupOpen] = useState(false);
    const [isSegmentPopupMinimized, setSegmentPopupMinimized] = useState(false);

    // サイドバーの折りたたみ/展開を管理するstate。

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    // ドラッグ可能なポップアップのためのstateとref。

    const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null);
    const [minimizedPosition, setMinimizedPosition] = useState<{ x: number, y: number } | null>(null);

    // ポップアップスタック（Z-index管理用、先頭が最上位）

    const [popupStack, setPopupStack] = useState<string[]>(['segment']);

    // ペルソナ一覧ポップアップを管理するstate（複数インスタンス対応）

    const [personaPopups, setPersonaPopups] = useState<PersonaPopup[]>([]);
    const personaPopupCounterRef = useRef(0);

    const dragTargetRef = useRef<{ type: 'segment' | 'segmentMin' | 'persona', id?: string } | null>(null);
    const dragStartInfoRef = useRef({ mouseX: 0, mouseY: 0, elementX: 0, elementY: 0 });
    const wasDraggedRef = useRef(false);

    const minimizedBarRef = useRef<HTMLDivElement>(null);
    const mainAreaRef = useRef<HTMLDivElement>(null);


    // サイドバーのボタンクリックハンドラ。

    const handleAnalyzeClick = () => {
        setProductModalOpen(true);
    };

    // プロダクトモーダルからセグメントポップアップを開くハンドラ。

    const handleSelectSegment = () => {
        setProductModalOpen(false);
        setPopupPosition(null);
        setSegmentPopupOpen(true);
        setSegmentPopupMinimized(false);
        bringPopupToFront('segment');
    };

    // ポップアップをスタックの先頭に移動

    const bringPopupToFront = (popupId: string) => {
        setPopupStack(prev => {
            const filtered = prev.filter(id => id !== popupId);
            return [popupId, ...filtered];
        });
    };

    const handleOpenPersonaPopup = () => {
        const newId = `persona-${personaPopupCounterRef.current++}`;
        setPersonaPopups(prev => [...prev, {
            id: newId,
            position: null,
            isMinimized: false,
            minimizedPosition: null
        }]);
        // スタックの先頭に追加

        setTimeout(() => bringPopupToFront(newId), 0);
    };

    // ペルソナポップアップを閉じる

    const handleClosePersonaPopup = (id: string) => {
        setPersonaPopups(prev => prev.filter(p => p.id !== id));
        setPopupStack(prev => prev.filter(popupId => popupId !== id));
    };

    // ペルソナポップアップを最小化

    const handleMinimizePersonaPopup = (id: string) => {
        setPersonaPopups(prev => prev.map(p =>
            p.id === id ? { ...p, isMinimized: true } : p
        ));
    };

    // ペルソナポップアップを復元

    const handleRestorePersonaPopup = (id: string) => {
        setPersonaPopups(prev => prev.map(p =>
            p.id === id ? { ...p, isMinimized: false } : p
        ));
        bringPopupToFront(id);
    };

    // ペルソナポップアップの位置を更新

    const updatePersonaPopupPosition = (id: string, position: { x: number, y: number }) => {
        setPersonaPopups(prev => prev.map(p =>
            p.id === id ? { ...p, position } : p
        ));
    };

    // ペルソナポップアップの最小化位置を更新

    const updatePersonaMinimizedPosition = (id: string, position: { x: number, y: number }) => {
        setPersonaPopups(prev => prev.map(p =>
            p.id === id ? { ...p, minimizedPosition: position } : p
        ));
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLElement>, type: 'segment' | 'segmentMin' | 'persona' | 'personaMin', id?: string) => {
        if (type === 'segment') {
            bringPopupToFront('segment');
        } else if (type === 'persona' && id) {
            bringPopupToFront(id);
        }

        dragTargetRef.current = type === 'segment' || type === 'segmentMin' ? { type } : { type, id };
        wasDraggedRef.current = false;
        document.body.style.userSelect = 'none';

        if (type === 'segment' && popupPosition) {
            dragStartInfoRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                elementX: popupPosition.x,
                elementY: popupPosition.y,
            };
        } else if (type === 'segmentMin' && minimizedPosition) {
            dragStartInfoRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                elementX: minimizedPosition.x,
                elementY: minimizedPosition.y,
            };
        } else if (type === 'persona' && id) {
            const popup = personaPopups.find(p => p.id === id);
            if (popup?.position) {
                dragStartInfoRef.current = {
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                    elementX: popup.position.x,
                    elementY: popup.position.y,
                };
            }
        } else if (type === 'personaMin' && id) {
            const popup = personaPopups.find(p => p.id === id);
            if (popup?.minimizedPosition) {
                dragStartInfoRef.current = {
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                    elementX: popup.minimizedPosition.x,
                    elementY: popup.minimizedPosition.y,
                };
            }
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragTargetRef.current) return;
            wasDraggedRef.current = true;

            const dx = e.clientX - dragStartInfoRef.current.mouseX;
            const dy = e.clientY - dragStartInfoRef.current.mouseY;

            const newX = dragStartInfoRef.current.elementX + dx;
            const newY = dragStartInfoRef.current.elementY + dy;

            if (dragTargetRef.current.type === 'segment') {
                setPopupPosition({ x: newX, y: newY });
            } else if (dragTargetRef.current.type === 'segmentMin') {
                setMinimizedPosition({ x: newX, y: newY });
            } else if (dragTargetRef.current.type === 'persona' && dragTargetRef.current.id) {
                updatePersonaPopupPosition(dragTargetRef.current.id, { x: newX, y: newY });
            } else if (dragTargetRef.current.type === 'personaMin' && dragTargetRef.current.id) {
                updatePersonaMinimizedPosition(dragTargetRef.current.id, { x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            dragTargetRef.current = null;
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [personaPopups]);

    useEffect(() => {
        // ポップアップの初期中央位置を計算するeffect。

        if (isSegmentPopupOpen && !isSegmentPopupMinimized && popupPosition === null && mainAreaRef.current) {
            const popupWidth = 1450;
            const popupHeight = 730;

            const { offsetWidth: mainWidth, offsetHeight: mainHeight } = mainAreaRef.current;

            const x = (mainWidth - popupWidth) / 2;
            const y = (mainHeight - popupHeight) / 2;

            setPopupPosition({ x: Math.max(0, x), y: Math.max(0, y) });
        }
    }, [isSegmentPopupOpen, isSegmentPopupMinimized, popupPosition]);

    useEffect(() => {
        if (isSegmentPopupOpen && isSegmentPopupMinimized && minimizedPosition === null && minimizedBarRef.current) {
            const { offsetWidth, offsetHeight } = minimizedBarRef.current;
            const x = (window.innerWidth - offsetWidth) / 2;
            const y = window.innerHeight - offsetHeight - 20;
            setMinimizedPosition({ x, y });
        }
    }, [isSegmentPopupOpen, isSegmentPopupMinimized, minimizedPosition]);

    useEffect(() => {
        // ペルソナポップアップの初期位置

        personaPopups.forEach((popup, index) => {
            if (!popup.isMinimized && popup.position === null && mainAreaRef.current) {
                const popupWidth = 1450;
                const popupHeight = 730;
                const { offsetWidth: mainWidth, offsetHeight: mainHeight } = mainAreaRef.current;
                const offset = (index + 1) * 50;
                const x = (mainWidth - popupWidth) / 2 + offset;
                const y = (mainHeight - popupHeight) / 2 + offset;
                updatePersonaPopupPosition(popup.id, { x: Math.max(0, x), y: Math.max(0, y) });
            }
        });
    }, [personaPopups.map(p => p.id).join(',')]);

    useEffect(() => {
        // ペルソナ最小化バーの初期位置

        personaPopups.forEach((popup, index) => {
            if (popup.isMinimized && popup.minimizedPosition === null) {
                const offsetWidth = 320;
                const offsetHeight = 40;
                const baseX = (window.innerWidth - offsetWidth) / 2;
                const x = baseX + (index + 1) * 350;
                const y = window.innerHeight - offsetHeight - 20;
                updatePersonaMinimizedPosition(popup.id, { x, y });
            }
        });
    }, [personaPopups.map(p => `${p.id}-${p.isMinimized}`).join(',')]);

    // ポップアップ外部のドロップハンドラ

    const handleBackdropDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        try {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
                window.dispatchEvent(new CustomEvent('item-delete-drop', { detail: data }));
            }
        } catch (error) {
            console.error("Backdrop drop failed:", error);
        }
    };

    // ドロップを許可するためのドラッグオーバーハンドラ

    const handleBackdropDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="h-screen flex flex-col bg-[#f0f0f0]">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    onSomExecute={handleAnalyzeClick}
                    filterCategories={{}}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
                />

                {/* このコンテナはrelativeなので、その中のabsoluteポップアップは正しく配置されます。 */}

                <div ref={mainAreaRef} className="flex-1 relative">
                    <MainContent />

                    {/* セグメント作成ポップアップ - 相対コンテナ内で絶対配置されます */}

                    {isSegmentPopupOpen && (
                        <>
                            {/* 背景 */}

                            <div
                                className={`absolute inset-0 bg-black bg-opacity-40 z-30 ${isSegmentPopupMinimized ? 'hidden' : ''}`}
                                onDrop={handleBackdropDrop}
                                onDragOver={handleBackdropDragOver}
                                onClick={() => bringPopupToFront('segment')}
                            ></div>
                            {/* ポップアップコンテンツ */}

                            <div
                                className={`absolute w-[1450px] h-[730px] shadow-2xl border border-gray-400 flex flex-col ${isSegmentPopupMinimized ? 'hidden' : ''}`}
                                style={{
                                    ...(popupPosition ? { top: `${popupPosition.y}px`, left: `${popupPosition.x}px` } : { visibility: 'hidden' as const }),
                                    zIndex: 50 - popupStack.indexOf('segment')
                                }}
                                onClick={() => bringPopupToFront('segment')}
                            >
                                <TabSystem
                                    title="セグメント"
                                    onHeaderMouseDown={(e) => handleMouseDown(e, 'segment')}
                                    onClose={() => setSegmentPopupOpen(false)}
                                    onMinimize={() => setSegmentPopupMinimized(true)}
                                >
                                    <SegmentCreationPage onOpenPersonaPopup={handleOpenPersonaPopup} />
                                </TabSystem>
                            </div>
                        </>
                    )}

                    {/* ペルソナ一覧ポップアップ（複数対応） */}

                    {personaPopups.map((popup) => (
                        <div
                            key={popup.id}
                            className={`absolute w-[1450px] h-[730px] shadow-2xl border border-gray-400 flex flex-col ${popup.isMinimized ? 'hidden' : ''}`}
                            style={{
                                ...(popup.position ? { top: `${popup.position.y}px`, left: `${popup.position.x}px` } : { visibility: 'hidden' as const }),
                                zIndex: 50 - popupStack.indexOf(popup.id)
                            }}
                            onClick={() => bringPopupToFront(popup.id)}
                        >
                            <TabSystem
                                title="ペルソナ"
                                onHeaderMouseDown={(e) => handleMouseDown(e, 'persona', popup.id)}
                                onClose={() => handleClosePersonaPopup(popup.id)}
                                onMinimize={() => handleMinimizePersonaPopup(popup.id)}
                            >
                                <PersonaListPage />
                            </TabSystem>
                        </div>
                    ))}
                </div>
            </div>

            {/* プロダクト選択モーダル（フルスクリーンオーバーレイなので固定） */}

            {isProductModalOpen && (
                <ProductSelectionModal
                    onClose={() => setProductModalOpen(false)}
                    onSelectSegment={handleSelectSegment}
                />
            )}

            {/* 最小化されたセグメントポップアップバー（ビューポートに対して固定） */}

            {isSegmentPopupOpen && isSegmentPopupMinimized && (
                <div
                    ref={minimizedBarRef}
                    className="fixed w-80 h-10 bg-gray-700 text-white flex items-center justify-between px-4 cursor-move z-50 rounded-t-md"
                    style={minimizedPosition ? { top: `${minimizedPosition.y}px`, left: `${minimizedPosition.x}px` } : { visibility: 'hidden' }}
                    onMouseDown={(e) => handleMouseDown(e, 'segmentMin')}
                >
                    <span
                        className="font-bold flex-grow h-full flex items-center"
                        onClick={() => !wasDraggedRef.current && setSegmentPopupMinimized(false)}
                    >
                        セグメント
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            className="p-1"
                            aria-label="復元"
                            onClick={() => { setSegmentPopupMinimized(false); bringPopupToFront('segment'); }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSegmentPopupOpen(false); }}
                            className="p-1 hover:bg-red-500 rounded"
                            aria-label="閉じる"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* 最小化されたペルソナポップアップバー（複数対応） */}

            {personaPopups.filter(p => p.isMinimized).map((popup, index) => (
                <div
                    key={popup.id}
                    className="fixed w-80 h-10 bg-gray-700 text-white flex items-center justify-between px-4 cursor-move z-50 rounded-t-md"
                    style={popup.minimizedPosition ? { top: `${popup.minimizedPosition.y}px`, left: `${popup.minimizedPosition.x}px` } : { visibility: 'hidden' }}
                    onMouseDown={(e) => handleMouseDown(e, 'personaMin', popup.id)}
                >
                    <span
                        className="font-bold flex-grow h-full flex items-center"
                        onClick={() => !wasDraggedRef.current && handleRestorePersonaPopup(popup.id)}
                    >
                        ペルソナ #{index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button
                            className="p-1"
                            aria-label="復元"
                            onClick={() => handleRestorePersonaPopup(popup.id)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClosePersonaPopup(popup.id); }}
                            className="p-1 hover:bg-red-500 rounded"
                            aria-label="閉じる"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
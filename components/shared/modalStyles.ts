// modalStyles.ts
// このファイルは、アプリケーション全体のモーダルのデザインを統一するための設定を定義します。


export const modalStyles = {
  // モーダル表示時に画面を覆う背景オーバーレイのスタイル。元の黒50%から40%に透明度を調整し、ヘッダーとの区別をつけやすくしました。

  overlay: 'absolute inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center',

  // すべてのモーダルに適用される基本コンテナのスタイル。

  container: 'bg-gray-50 shadow-xl flex flex-col overflow-hidden',

  // ヘッダーセクションのスタイル。

  header: {
    container: 'flex justify-between items-center px-4 h-[30px] bg-[#777777] text-white flex-shrink-0',
    title: 'font-bold text-sm',
    closeButton: 'text-sm p-1 rounded hover:bg-red-500',
    closeButtonIcon: '×',
  },

  // ボディセクションのスタイル。柔軟なレイアウトを可能にするため、基本的なパディングとコンテナプロパティのみを定義します。

  body: {
    container: 'flex-grow p-4',
  },

  // フッターセクションのスタイル。

  footer: {
    container: 'flex items-center p-2 flex-shrink-0 bg-gray-50 border-t border-gray-300',
    buttonGroup: 'flex gap-2',
  },

  // アプリケーション全体のモーダル内のインタラクティブ要素（リスト、テーブル行など）のスタイル。

  interactive: {
    // divで実装されたリスト項目用。isSelectedブール値に基づいてスタイルを返します。

    listItem: (isSelected: boolean) =>
      isSelected ? 'bg-blue-200' : 'bg-white hover:bg-gray-200',

    // テーブル行(tr)用。isSelectedブール値に基づいてスタイルを返します。

    tableRow: (isSelected: boolean) =>
      isSelected ? 'bg-blue-200' : 'even:bg-gray-50 hover:bg-gray-200',
  },
};
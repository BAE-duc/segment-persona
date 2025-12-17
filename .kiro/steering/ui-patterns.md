---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# UI パターンガイド

## ポップアップ管理
- **Z-index管理**: popupStack配列で管理
- **ドラッグ位置**: useRefでパフォーマンス最適化
- **最小化**: minimizedPosition stateで位置管理

## モーダルパターン
```tsx
interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  // 実装パターン
};
```

## ボタンスタイル
- **Primary**: `bg-[#00BFFF]` (水色)
- **Active**: `bg-gradient-to-b from-blue-400 to-blue-600`
- **Inactive**: `bg-gray-200 border-gray-400`

## 共通コンポーネント使用
- AppButton, AppSelect を `/components/shared/FormControls.tsx` から使用
- 一貫したスタイリングを維持
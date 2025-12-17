import React from 'react';
import { AppButton } from './FormControls';
import { modalStyles } from './modalStyles';

interface WarningItem {
  parameter: string;
  value: string;
  reason: string;
}

interface ParameterWarningModalProps {
  onClose: () => void;
  onConfirm: () => void;
  warningItems: WarningItem[];
}

export const ParameterWarningModal: React.FC<ParameterWarningModalProps> = ({
  onClose,
  onConfirm,
  warningItems
}) => {
  return (
    <div
      className={modalStyles.overlay}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${modalStyles.container} w-[500px]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>Warning</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>
            {modalStyles.header.closeButtonIcon}
          </button>
        </div>

        {/* ボディ */}
        <div className={`${modalStyles.body.container} space-y-4`}>
          <div className="text-sm text-gray-700">
            以下のパラメータに推奨範囲外の値が設定されています：
          </div>

          <div className="space-y-3">
            {warningItems.map((item, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-sm text-gray-800">{item.parameter}</span>
                  <span className="text-sm font-medium text-red-600">
                    {item.value}
                  </span>
                </div>
                {item.reason && <div className="text-xs text-gray-600 whitespace-pre-line">{item.reason}</div>}
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-700 pt-2">
            上記の設定内容を適用しますか？
          </div>
        </div>

        {/* フッター */}
        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton onClick={onConfirm} className="w-24 py-1">
              OK
            </AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">
              Cancel
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};
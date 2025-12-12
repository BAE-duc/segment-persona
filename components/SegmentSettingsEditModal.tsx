
import React, { useState, useMemo } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';

export interface SegmentSettings {
  mapSize: 'auto' | 'custom';
  customWidth: string;
  customHeight: string;
  learningRate: string;
  iterations: string;
  distanceMetric: string;
  neighborhoodRadius: string;
  neighborhoodFunction: string;
  decayFunction: string;
}

interface SegmentSettingsEditModalProps {
  onClose: () => void;
  onConfirm: (settings: SegmentSettings) => void;
  initialSettings: SegmentSettings;
}

// ツールチップの内容を定義

const settingDescriptions: Record<string, { title: string; desc: string; options?: Record<string, string> }> = {
  mapSize: {
    title: 'マップサイズ',
    desc: 'SOMの出力マップのグリッドサイズ（幅×高さ）です。グリッド数が多いほどデータを細かく分類できますが、計算コストが増加します。'
  },
  learningRate: {
    title: '学習率',
    desc: '重みベクトルを更新する際の強さを決定するパラメータです。値が大きいと学習初期の変動が大きくなり、小さいと収束しやすくなります。'
  },
  iterations: {
    title: 'イテレーション数',
    desc: '学習プロセスを繰り返す回数です。回数が多いほどモデルはデータの特徴をよく学習しますが、計算時間が増加します。'
  },
  distanceMetric: {
    title: '距離尺度',
    desc: 'ベクトル間の類似度を計算する方法です。',
    options: {
      'Euclidean': '最も一般的な直線距離（ユークリッド距離）です。',
      'Manhattan': '各座標の差の絶対値の和（マンハッタン距離）です。',
      'Chebyshev': '各座標の差の最大値（チェビシェフ距離）です。',
      'Cosine': 'ベクトルの方向の一致度を測るコサイン類似度に基づきます。'
    }
  },
  neighborhoodRadius: {
    title: '近傍半径',
    desc: '勝者ノード（BMU）の周辺のどの範囲のノードまで重みを更新するかを指定します。学習が進むにつれて小さくなるのが一般的です。'
  },
  neighborhoodFunction: {
    title: '近傍関数',
    desc: '近傍半径内のノードに対する学習の影響度合いを決定する関数です。',
    options: {
      'Gaussian': '中心から離れるにつれて滑らかに影響力が減少するガウス関数です。',
      'Bubble': '半径内は均一に更新し、半径外は更新しないステップ関数です。',
      'Mexican Hat': '中心部は正の更新、周辺部は負の更新を行う関数です。'
    }
  },
  decayFunction: {
    title: '減衰関数',
    desc: '学習率や近傍半径を時間とともにどのように減少させるかを決定する関数です。',
    options: {
      'なし': '減衰させません。',
      '線形': '学習回数に応じて直線的に値を減少させます。',
      '指数': '指数関数的に値を減少させます。',
      '1/t': '時間の逆数に比例して減少させます。'
    }
  }
};

// フォームの各行のスタイルを統一するためのコンポーネント。
// ツールチップ機能を追加。


const FormRow: React.FC<{ label: string; children: React.ReactNode; tooltipKey?: string }> = ({ label, children, tooltipKey }) => {
  const [hoverLoc, setHoverLoc] = useState<{ top: number; left: number } | null>(null);
  const description = tooltipKey ? settingDescriptions[tooltipKey] : null;

  return (
    <div className="grid grid-cols-[120px_1fr] items-center">
      <div
        className={`text-xs font-medium text-[#586365] text-right pr-4 ${tooltipKey ? 'cursor-help underline decoration-dotted underline-offset-2 decoration-gray-400' : ''}`}
        onMouseEnter={(e) => {
          if (description) {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverLoc({ top: rect.bottom + 5, left: rect.left + 20 });
          }
        }}
        onMouseLeave={() => setHoverLoc(null)}
      >
        {label}
        {/* Fixed position tooltip to avoid clipping by overflow:hidden containers */}
        {hoverLoc && description && (
          <div
            className="fixed z-[9999] bg-white border border-gray-300 shadow-xl rounded-md p-3 text-left w-72 pointer-events-none"
            style={{ top: hoverLoc.top, left: hoverLoc.left }}
          >
            <div className="font-bold text-gray-800 mb-1 text-xs">{description.title}</div>
            <div className="text-gray-600 text-[10px] leading-relaxed mb-2">{description.desc}</div>
            {description.options && (
              <div className="space-y-1 border-t border-gray-100 pt-2 mt-2 bg-gray-50 -mx-3 -mb-3 p-3 rounded-b-md">
                {Object.entries(description.options).map(([key, val]) => (
                  <div key={key} className="text-[10px] grid grid-cols-[70px_1fr] gap-1">
                    <span className="font-semibold text-gray-700">{key}</span>
                    <span className="text-gray-500">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

// テキストと数値入力用のスタイル付きコンポーネント。

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-24 h-[30px] px-2 text-xs border border-gray-400 bg-white rounded-md outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-200 ${props.className}`}
  />
);

export const SegmentSettingsEditModal: React.FC<SegmentSettingsEditModalProps> = ({ onClose, onConfirm, initialSettings }) => {
  // フォームの各入力の状態を管理します。

  const [mapSize, setMapSize] = useState(initialSettings.mapSize);
  const [customWidth, setCustomWidth] = useState(initialSettings.customWidth);
  const [customHeight, setCustomHeight] = useState(initialSettings.customHeight);
  const [learningRate, setLearningRate] = useState(initialSettings.learningRate);
  const [iterations, setIterations] = useState(initialSettings.iterations);
  const [distanceMetric, setDistanceMetric] = useState(initialSettings.distanceMetric);
  const [neighborhoodRadius, setNeighborhoodRadius] = useState(initialSettings.neighborhoodRadius);
  const [neighborhoodFunction, setNeighborhoodFunction] = useState(initialSettings.neighborhoodFunction);
  const [decayFunction, setDecayFunction] = useState(initialSettings.decayFunction);

  const isFormValid = useMemo(() => {
    const isMapSizeValid = mapSize === 'auto' || (customWidth.trim() !== '' && customHeight.trim() !== '');
    const isOtherSettingsValid =
      learningRate.trim() !== '' &&
      iterations.trim() !== '' &&
      distanceMetric.trim() !== '' &&
      neighborhoodRadius.trim() !== '' &&
      neighborhoodFunction.trim() !== '' &&
      decayFunction.trim() !== '';

    return isMapSizeValid && isOtherSettingsValid;
  }, [mapSize, customWidth, customHeight, learningRate, iterations, distanceMetric, neighborhoodRadius, neighborhoodFunction, decayFunction]);

  const handleConfirm = () => {
    onConfirm({
      mapSize,
      customWidth,
      customHeight,
      learningRate,
      iterations,
      distanceMetric,
      neighborhoodRadius,
      neighborhoodFunction,
      decayFunction,
    });
  };

  return (
    <div
      className={modalStyles.overlay}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${modalStyles.container}`}
        style={{ width: '39rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}

        <div className={modalStyles.header.container}>
          <h2 className={modalStyles.header.title}>パラメータ選択</h2>
          <button onClick={onClose} className={modalStyles.header.closeButton}>{modalStyles.header.closeButtonIcon}</button>
        </div>

        {/* ボディ */}

        <div className={`${modalStyles.body.container} space-y-3 overflow-y-auto`}>
          <FormRow label="マップサイズ" tooltipKey="mapSize">
            <div className="flex items-center space-x-2">
              <label htmlFor="auto" className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  id="auto"
                  name="mapSize"
                  value="auto"
                  checked={mapSize === 'auto'}
                  onChange={(e) => setMapSize(e.target.value as 'auto' | 'custom')}
                  className="hidden"
                />
                <span className="text-lg mr-1.5">{mapSize === 'auto' ? '●' : '〇'}</span>
                自動
              </label>

              <div className="w-2" />

              <label htmlFor="custom" className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  id="custom"
                  name="mapSize"
                  value="custom"
                  checked={mapSize === 'custom'}
                  onChange={(e) => setMapSize(e.target.value as 'auto' | 'custom')}
                  className="hidden"
                />
                <span className="text-lg mr-1.5">{mapSize === 'custom' ? '●' : '〇'}</span>
                カスタム
              </label>

              <StyledInput type="text" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} disabled={mapSize !== 'custom'} />
              <span>&times;</span>
              <StyledInput type="text" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} disabled={mapSize !== 'custom'} />
            </div>
          </FormRow>

          <FormRow label="学習率" tooltipKey="learningRate">
            <StyledInput type="number" value={learningRate} onChange={(e) => setLearningRate(e.target.value)} />
          </FormRow>

          <FormRow label="イテレーション数" tooltipKey="iterations">
            <StyledInput type="number" value={iterations} onChange={(e) => setIterations(e.target.value)} />
          </FormRow>

          <FormRow label="距離尺度" tooltipKey="distanceMetric">
            <AppSelect value={distanceMetric} onChange={(e) => setDistanceMetric(e.target.value)} className="w-40">
              <option>Euclidean</option>
              <option>Manhattan</option>
              <option>Chebyshev</option>
              <option>Cosine</option>
            </AppSelect>
          </FormRow>

          <FormRow label="近傍半径" tooltipKey="neighborhoodRadius">
            <StyledInput type="number" value={neighborhoodRadius} onChange={(e) => setNeighborhoodRadius(e.target.value)} />
          </FormRow>

          <FormRow label="近傍関数" tooltipKey="neighborhoodFunction">
            <AppSelect value={neighborhoodFunction} onChange={(e) => setNeighborhoodFunction(e.target.value)} className="w-40">
              <option>Gaussian</option>
              <option>Bubble</option>
              <option>Mexican Hat</option>
            </AppSelect>
          </FormRow>

          <FormRow label="減衰関数" tooltipKey="decayFunction">
            <AppSelect value={decayFunction} onChange={(e) => setDecayFunction(e.target.value)} className="w-40">
              <option value="none">なし</option>
              <option value="linear">線形</option>
              <option value="exponential">指数</option>
              <option value="inverse_t">1/t</option>
            </AppSelect>
          </FormRow>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirm}
              className="w-24 py-1"
              primary
              disabled={!isFormValid}
            >
              OK
            </AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

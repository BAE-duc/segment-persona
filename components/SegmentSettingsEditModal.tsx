
import React, { useEffect, useMemo, useState } from 'react';
import { AppButton, AppSelect } from './shared/FormControls';
import { modalStyles } from './shared/modalStyles';
import { ParameterWarningModal } from './shared/ParameterWarningModal';

export interface SegmentSettings {
  mapSize: 'auto' | 'custom';
  customWidth: string;
  customHeight: string;
  learningRate: string;
  iterations: string;
  distanceMetric: string;
  neighborhoodRadius: string;
  neighborhoodFunction: string;
  hierarchicalDistanceFunction: string;
  hierarchicalLinkageMethod: string;
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
    desc: 'SOMにおける重みベクトルを更新する際の強さを決定するパラメータです。値が大きいと学習初期の変動が大きくなり、小さいと収束しやすくなります。'
  },
  iterations: {
    title: 'イテレーション数',
    desc: 'SOMの学習プロセスを繰り返す回数です。回数が多いほどモデルはデータの特徴をよく学習しますが、計算時間が増加します。'
  },
  distanceMetric: {
    title: 'SOMの距離関数',
    desc: 'SOMにおけるベクトル間の類似度を計算する方法です。',
    options: {
      'Euclidean': '最も一般的な直線距離（ユークリッド距離）です。',
      'Manhattan': '各座標の差の絶対値の和（マンハッタン距離）です。',
      'Cosine': 'ベクトルの方向の一致度を測るコサイン類似度に基づきます。'
    }
  },
  neighborhoodRadius: {
    title: '近傍半径',
    desc: 'SOMにおける勝者ノード（BMU）の周辺のどの範囲のノードまで重みを更新するかを指定します。学習が進むにつれて小さくなるのが一般的です。'
  },
  neighborhoodFunction: {
    title: '近傍関数',
    desc: 'SOMにおける近傍半径内のノードに対する学習の影響度合いを決定する関数です。',
    options: {
      'Gaussian': '中心から離れるにつれて滑らかに影響力が減少するガウス関数です。',
      'Bubble': '半径内は均一に更新し、半径外は更新しないステップ関数です。',
      'Mexican Hat': '中心部は正の更新、周辺部は負の更新を行う関数です。'
    }
  },
  hierarchicalDistanceFunction: {
    title: '階層クラスタリングの距離関数',
    desc: '階層クラスタリングにおけるデータポイント間の距離を計算する方法です。',
    options: {
      'Euclidean': '最も一般的な直線距離（ユークリッド距離）です。',
      'Manhattan': '各座標の差の絶対値の和（マンハッタン距離）です。',
      'Cosine': 'ベクトルの方向の一致度を測るコサイン類似度に基づきます。'
    }
  },
  hierarchicalLinkageMethod: {
    title: '連結基準',
    desc: '階層クラスタリングにおけるクラスタ間の距離を計算し、結合する方法です。',
    options: {
      '最短距離法': 'クラスタ間の最も近い点同士の距離を使用します。',
      '最長距離法': 'クラスタ間の最も遠い点同士の距離を使用します。',
      '群平均法': 'クラスタ内の全ての点間の平均距離を使用します。',
      'ウォード法': 'クラスタ内の分散を最小化する方法で、コンパクトなクラスタを形成します。'
    }
  }
};

// フォームの各行のスタイルを統一するためのコンポーネント。
// ツールチップ機能を追加。


const FormRow: React.FC<{ label: string; children: React.ReactNode; tooltipKey?: string }> = ({ label, children, tooltipKey }) => {
  const [hoverLoc, setHoverLoc] = useState<{ top: number; left: number } | null>(null);
  const description = tooltipKey ? settingDescriptions[tooltipKey] : null;

  return (
    <div className="grid grid-cols-[180px_1fr] items-center">
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
  const [distanceMetric, setDistanceMetric] = useState(initialSettings.distanceMetric || 'ユークリッド距離');
  const [neighborhoodRadius, setNeighborhoodRadius] = useState(initialSettings.neighborhoodRadius);
  const [neighborhoodFunction, setNeighborhoodFunction] = useState(initialSettings.neighborhoodFunction || 'ガウス関数');
  const [hierarchicalDistanceFunction, setHierarchicalDistanceFunction] = useState(initialSettings.hierarchicalDistanceFunction || 'ユークリッド距離');
  const [hierarchicalLinkageMethod, setHierarchicalLinkageMethod] = useState(initialSettings.hierarchicalLinkageMethod || 'ウォード法');

  // 警告ポップアップの状態管理
  const [showWarning, setShowWarning] = useState(false);
  const [warningItems, setWarningItems] = useState<Array<{parameter: string; value: string; reason: string}>>([]);
  const [customSizeErrors, setCustomSizeErrors] = useState<{ width?: string; height?: string }>({});

  const isFormValid = useMemo(() => {
    const isMapSizeValid = mapSize === 'auto' || (customWidth.trim() !== '' && customHeight.trim() !== '');
    const hasCustomSizeError = mapSize === 'custom' && (!!customSizeErrors.width || !!customSizeErrors.height);
    const isOtherSettingsValid =
      learningRate.trim() !== '' &&
      iterations.trim() !== '' &&
      distanceMetric.trim() !== '' &&
      neighborhoodRadius.trim() !== '' &&
      neighborhoodFunction.trim() !== '' &&
      hierarchicalDistanceFunction.trim() !== '' &&
      hierarchicalLinkageMethod.trim() !== '';

    return isMapSizeValid && isOtherSettingsValid && !hasCustomSizeError;
  }, [mapSize, customWidth, customHeight, learningRate, iterations, distanceMetric, neighborhoodRadius, neighborhoodFunction, hierarchicalDistanceFunction, hierarchicalLinkageMethod, customSizeErrors]);

  useEffect(() => {
    if (mapSize !== 'custom') {
      setCustomSizeErrors({});
      return;
    }

    const errors: { width?: string; height?: string } = {};
    const widthValue = customWidth.trim();
    const heightValue = customHeight.trim();

    if (widthValue !== '') {
      const widthNum = parseInt(widthValue, 10);
      if (isNaN(widthNum) || widthNum > 20) {
        errors.width = '20以下の数字を入力してください';
      }
    }

    if (heightValue !== '') {
      const heightNum = parseInt(heightValue, 10);
      if (isNaN(heightNum) || heightNum > 20) {
        errors.height = '20以下の数字を入力してください';
      }
    }

    setCustomSizeErrors(errors);
  }, [mapSize, customWidth, customHeight]);

  useEffect(() => {
    if (mapSize === 'auto') {
      setCustomWidth('');
      setCustomHeight('');
    }
  }, [mapSize]);

  // パラメータ検証関数
  const validateParameters = () => {
    const warnings: Array<{parameter: string; value: string; reason: string}> = [];

    // 1. カスタムマップサイズの検証 (UI順序: 1番目)
    if (mapSize === 'custom') {
      const widthNum = parseInt(customWidth, 10);
      const heightNum = parseInt(customHeight, 10);
      
      if (!isNaN(widthNum)) {
        if (widthNum <= 0) {
          warnings.push({
            parameter: 'カスタム幅',
            value: customWidth,
            reason: 'マップ幅は正の整数である必要があります。\n推奨範囲: 5-20'
          });
        } else if (widthNum > 20) {
          warnings.push({
            parameter: 'カスタム幅',
            value: customWidth,
            reason: '20を超える値は計算負荷が高くなります。\n推奨範囲: 5-20'
          });
        } else if (widthNum < 2) {
          warnings.push({
            parameter: 'カスタム幅',
            value: customWidth,
            reason: '2未満の値では適切な分類ができません。\n推奨範囲: 5-20'
          });
        }
      }

      if (!isNaN(heightNum)) {
        if (heightNum <= 0) {
          warnings.push({
            parameter: 'カスタム高さ',
            value: customHeight,
            reason: 'マップ高さは正の整数である必要があります。\n推奨範囲: 5-20'
          });
        } else if (heightNum > 20) {
          warnings.push({
            parameter: 'カスタム高さ',
            value: customHeight,
            reason: '20を超える値は計算負荷が高くなります。\n推奨範囲: 5-20'
          });
        } else if (heightNum < 2) {
          warnings.push({
            parameter: 'カスタム高さ',
            value: customHeight,
            reason: '2未満の値では適切な分類ができません。\n推奨範囲: 5-20'
          });
        }
      }
    }

    // 2. 学習率の検証 (UI順序: 2番目)
    const learningRateNum = parseFloat(learningRate);
    if (!isNaN(learningRateNum)) {
      if (learningRateNum <= 0) {
        warnings.push({
          parameter: '学習率',
          value: learningRate,
          reason: '学習率は正の値である必要があります。\n推奨範囲: 0.01-1.0'
        });
      } else if (learningRateNum > 1.0) {
        warnings.push({
          parameter: '学習率',
          value: learningRate,
          reason: '1.0を超える値は学習プロセスが不安定になり、適切な収束が困難になります。\n推奨範囲: 0.01-1.0'
        });
      } else if (learningRateNum < 0.001) {
        warnings.push({
          parameter: '学習率',
          value: learningRate,
          reason: '0.001未満の値は学習速度が極めて遅く、実用的な時間内での収束が期待できません。\n推奨範囲: 0.01-1.0'
        });
      } else if (learningRateNum > 0.5) {
        warnings.push({
          parameter: '学習率',
          value: learningRate,
          reason: '0.5を超える値は学習初期の振動が大きくなる可能性があります。\n推奨範囲: 0.01-0.5'
        });
      } else if (learningRateNum < 0.01) {
        warnings.push({
          parameter: '学習率',
          value: learningRate,
          reason: '0.01未満の値は学習が遅くなり、十分な特徴抽出に時間がかかります。\n推奨範囲: 0.01-0.5'
        });
      }
    }

    // 3. イテレーション数の検証 (UI順序: 3番目)
    const iterationsNum = parseInt(iterations, 10);
    if (!isNaN(iterationsNum)) {
      if (iterationsNum <= 0) {
        warnings.push({
          parameter: 'イテレーション数',
          value: iterations,
          reason: 'イテレーション数は正の整数である必要があります。\n推奨範囲: 100-49,999'
        });
      } else if (iterationsNum >= 50000) {
        warnings.push({
          parameter: 'イテレーション数',
          value: iterations,
          reason: '50,000以上の値は計算時間が非常に長くなります。\n推奨範囲: 100-49,999'
        });
      } else if (iterationsNum < 50) {
        warnings.push({
          parameter: 'イテレーション数',
          value: iterations,
          reason: '50未満の値は学習が不十分になる可能性があります。\n推奨範囲: 100-10,000'
        });
      }
    }

    // 4. 近傍半径の検証 (UI順序: 5番目)
    const radiusNum = parseFloat(neighborhoodRadius);
    if (!isNaN(radiusNum)) {
      if (radiusNum <= 0) {
        warnings.push({
          parameter: '近傍半径',
          value: neighborhoodRadius,
          reason: '近傍半径は正の値である必要があります。\n推奨範囲: 0.1-0.9'
        });
      } else if (radiusNum >= 1.0) {
        warnings.push({
          parameter: '近傍半径',
          value: neighborhoodRadius,
          reason: '1.0以上の値は過度な平滑化を引き起こし、適切なクラスタリングができません。\n推奨範囲: 0.1-0.9'
        });
      } else if (radiusNum < 0.05) {
        warnings.push({
          parameter: '近傍半径',
          value: neighborhoodRadius,
          reason: '0.05未満の値は近傍効果が不十分になります。\n推奨範囲: 0.1-0.9'
        });
      }
    }

    return warnings;
  };

  const handleConfirm = () => {
    const warnings = validateParameters();
    
    if (warnings.length > 0) {
      setWarningItems(warnings);
      setShowWarning(true);
    } else {
      confirmSettings();
    }
  };

  const confirmSettings = () => {
    onConfirm({
      mapSize,
      customWidth,
      customHeight,
      learningRate,
      iterations,
      distanceMetric,
      neighborhoodRadius,
      neighborhoodFunction,
      hierarchicalDistanceFunction,
      hierarchicalLinkageMethod,
    });
  };

  const handleWarningConfirm = () => {
    setShowWarning(false);
    confirmSettings();
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
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
            <div className="flex items-center space-x-3">
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
                <div className="w-4 h-4 rounded-full border-2 border-gray-700 flex items-center justify-center mr-2 flex-shrink-0">
                  {mapSize === 'auto' && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                </div>
                自動
              </label>

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
                <div className="w-4 h-4 rounded-full border-2 border-gray-700 flex items-center justify-center mr-2 flex-shrink-0">
                  {mapSize === 'custom' && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                </div>
                カスタム
              </label>

              <span className="text-xs text-gray-600">X:</span>
              <input
                type="text"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                disabled={mapSize !== 'custom'}
                className={`w-20 h-[30px] px-2 text-xs border bg-white rounded-lg outline-none focus:ring-1 disabled:bg-gray-200 ${
                  mapSize === 'custom' && customSizeErrors.width
                    ? 'border-red-500 bg-red-50 focus:ring-red-400'
                    : 'border-gray-400 focus:ring-gray-400'
                }`}
              />
              <span className="text-xs text-gray-600">Y:</span>
              <input
                type="text"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                disabled={mapSize !== 'custom'}
                className={`w-20 h-[30px] px-2 text-xs border bg-white rounded-lg outline-none focus:ring-1 disabled:bg-gray-200 ${
                  mapSize === 'custom' && customSizeErrors.height
                    ? 'border-red-500 bg-red-50 focus:ring-red-400'
                    : 'border-gray-400 focus:ring-gray-400'
                }`}
              />
            </div>
            {mapSize === 'custom' && (customSizeErrors.width || customSizeErrors.height) && (
              <div className="mt-1 text-xs text-red-500">
                20以下の数字を入力してください
              </div>
            )}
          </FormRow>

          <FormRow label="学習率" tooltipKey="learningRate">
            <StyledInput type="number" value={learningRate} onChange={(e) => setLearningRate(e.target.value)} />
          </FormRow>

          <FormRow label="イテレーション数" tooltipKey="iterations">
            <StyledInput type="number" value={iterations} onChange={(e) => setIterations(e.target.value)} />
          </FormRow>

          <FormRow label="SOMの距離関数" tooltipKey="distanceMetric">
            <AppSelect value={distanceMetric} onChange={(e) => setDistanceMetric(e.target.value)} className="w-40">
              <option>ユークリッド距離</option>
              <option>マンハッタン距離</option>
              <option>コサイン距離</option>
            </AppSelect>
          </FormRow>

          <FormRow label="近傍半径" tooltipKey="neighborhoodRadius">
            <StyledInput type="number" value={neighborhoodRadius} onChange={(e) => setNeighborhoodRadius(e.target.value)} />
          </FormRow>

          <FormRow label="近傍関数" tooltipKey="neighborhoodFunction">
            <AppSelect value={neighborhoodFunction} onChange={(e) => setNeighborhoodFunction(e.target.value)} className="w-40">
              <option>ガウス関数</option>
              <option>バブル関数</option>
              <option>メキシカンハット関数</option>
            </AppSelect>
          </FormRow>

          <FormRow label="階層クラスタリングの距離関数" tooltipKey="hierarchicalDistanceFunction">
            <AppSelect value={hierarchicalDistanceFunction} onChange={(e) => setHierarchicalDistanceFunction(e.target.value)} className="w-40">
              <option>ユークリッド距離</option>
              <option>マンハッタン距離</option>
              <option>コサイン距離</option>
            </AppSelect>
          </FormRow>

          <FormRow label="連結基準" tooltipKey="hierarchicalLinkageMethod">
            <AppSelect value={hierarchicalLinkageMethod} onChange={(e) => setHierarchicalLinkageMethod(e.target.value)} className="w-40">
              <option>最短距離法</option>
              <option>最長距離法</option>
              <option>群平均法</option>
              <option>ウォード法</option>
            </AppSelect>
          </FormRow>
        </div>

        {/* フッター */}

        <div className={`${modalStyles.footer.container} justify-end`}>
          <div className={modalStyles.footer.buttonGroup}>
            <AppButton
              onClick={handleConfirm}
              className="w-24 py-1"
              isActive={isFormValid}
              disabled={!isFormValid}
            >
              OK
            </AppButton>
            <AppButton onClick={onClose} className="w-24 py-1">Cancel</AppButton>
          </div>
        </div>
      </div>


      {/* 警告ポップアップ */}
      {showWarning && (
        <ParameterWarningModal
          onClose={handleWarningCancel}
          onConfirm={handleWarningConfirm}
          warningItems={warningItems}
        />
      )}
    </div>
  );
};

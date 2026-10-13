import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Html, useGLTF, useProgress } from '@react-three/drei';
import CameraController from './CameraController';
import { HumanBodyModel } from './ModelScene';
import SceneErrorBoundary from '../SceneErrorBoundary';
import { Spinner } from '../ui';

/**
 * 3D 舞台：Canvas + 灯光 + 环境光照 + 模型 + 相机控制。
 *
 * 稳定性要点（沿用改造前的修复结论，避免重新引入白屏问题）：
 *  - Draco 解码器与 HDR 全部走仓库自托管相对路径，不依赖任何第三方 CDN
 *  - <Environment> 单独包一层 Suspense + ErrorBoundary：HDR 慢或失败时页面照常可用
 *  - 模型加载失败由外层 ErrorBoundary 兜底，显示可读错误面板而不是白屏
 */

// 与正式产物一致，使用仓库自带 Draco 解码器（不要回退到 gstatic）
useGLTF.setDecoderPath('./draco/');
useGLTF.preload('./models/human_body.glb');

/** 模型加载进度（Canvas 内浮层） */
function ProgressFallback() {
  const { progress, active } = useProgress();
  return (
    <Html center>
      <div className="stage-loading" role="status" aria-live="polite">
        <Spinner onStage />
        <div className="stage-loading-title">
          {active ? '正在加载 3D 模型' : '正在初始化场景'}
        </div>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <div className="stage-loading-pct">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

export default function Viewer({
  acupoints,
  activePoint,
  onSelect,
  onDeselect,
  modelInfo,
  modelReady,
  onModelReady,
  dietaryMode,
  dietaryTarget,
  onDietarySelect,
  controlsRef,
  onAnimatingChange,
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 22], fov: 50 }}
      onPointerMissed={onDeselect}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 20]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, 5, 10]} intensity={0.6} color="#cbd5e1" />

      {/* 环境光照隔离：HDR 失败也不影响主场景 */}
      <SceneErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Environment files="./hdri/studio_small_03_1k.hdr" />
        </Suspense>
      </SceneErrorBoundary>

      <Suspense fallback={<ProgressFallback />}>
        <HumanBodyModel
          acupoints={acupoints}
          activePoint={activePoint}
          onSelect={onSelect}
          modelInfo={modelInfo}
          onReady={onModelReady}
          dietaryMode={dietaryMode}
          dietaryTarget={dietaryTarget}
          onDietarySelect={onDietarySelect}
        />
      </Suspense>

      <CameraController
        controlsRef={controlsRef}
        activePoint={activePoint}
        modelInfo={modelInfo}
        modelReady={modelReady}
        onAnimatingChange={onAnimatingChange}
      />
    </Canvas>
  );
}

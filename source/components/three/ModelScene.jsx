import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import AcupointNode from './AcupointNode';
import DietaryLayer from '../dietary/DietaryLayer';

/**
 * 模型 + 穴位标记 + 食养锚点。
 *
 * ⚠️ 保护清单：本组件内的模型处理与坐标变换公式与改造前逐字一致 ——
 *  - 材质规范化（transparent / depthWrite / alphaTest / metalness / roughness）
 *  - 隐藏 tracer / text / jingluo / curve / bezier 辅助物
 *  - 包围盒 → 缩放 targetH=16、中心归零
 *  - 变换组 position = -center * scale，scale = scale
 * 穴位标记与食养锚点挂在同一个变换组下，保证与模型对齐。
 */

const MODEL_PATH = './models/human_body.glb';

/** 目标显示高度（世界单位），据此计算缩放 —— 与改造前一致 */
const TARGET_HEIGHT = 16;

function prepareScene(scene) {
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const name = (child.name || '').toLowerCase();

      // 隐藏引线(tracer)、文字(Text)、经络(jingluo)、曲线(curve)
      if (
        name.includes('tracer') ||
        name.includes('text') ||
        name.includes('jingluo') ||
        name.includes('curve') ||
        name.includes('bezier')
      ) {
        child.visible = false;
        return;
      }

      child.material.transparent = false;
      child.material.depthWrite = true;
      child.material.depthTest = true;
      child.material.opacity = 1;
      child.material.alphaTest = 0.5;
      child.material.metalness = 0.1;
      child.material.roughness = 0.8;
      child.material.side = THREE.FrontSide;
      child.material.needsUpdate = true;
    }
  });
}

export default function ModelScene({
  scene,
  acupoints,
  activePoint,
  onSelect,
  modelInfo,
  onReady,
  dietaryMode,
  dietaryTarget,
  onDietarySelect,
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;

    prepareScene(scene);

    // 计算模型包围盒，自动居中 + 缩放，让全身都进入视野
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const scale = TARGET_HEIGHT / Math.max(size.y, 0.01);

    // 把模型中心移到原点：position = -center * scale
    // 子节点世界坐标 = (localPos - center) * scale
    modelInfo.scale = scale;
    modelInfo.center.copy(center);
    modelInfo.size.copy(size);
    modelInfo.ready = true;

    setReady(true);
    if (onReady) onReady({ scale, center, size });
  }, [scene, modelInfo, onReady]);

  if (!ready) return null;

  const { scale, center } = modelInfo;

  return (
    <group position={[-center.x * scale, -center.y * scale, -center.z * scale]} scale={scale}>
      <primitive object={scene} />

      {acupoints.map((pt) => (
        <AcupointNode
          key={pt.id || pt.name}
          pt={pt}
          isActive={!dietaryMode && activePoint?.name === pt.name}
          hasActivePoint={dietaryMode || !!activePoint}
          interactive={!dietaryMode}
          onSelect={onSelect}
        />
      ))}

      {dietaryMode && (
        <DietaryLayer points={acupoints} selected={dietaryTarget} onSelect={onDietarySelect} />
      )}
    </group>
  );
}

/** 带加载进度的模型加载器（Suspense fallback 用）。 */
export function useHumanBody() {
  return useGLTF(MODEL_PATH);
}

export function HumanBodyModel(props) {
  const { scene } = useGLTF(MODEL_PATH);
  useEffect(() => {
    // 模型就绪后移除 index.html 里的启动兜底层
    const el = document.getElementById('boot-loading');
    if (!el) return undefined;
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = '0';
    const timer = setTimeout(() => el.remove(), 500);
    return () => clearTimeout(timer);
  }, [scene]);
  return <ModelScene scene={scene} {...props} />;
}

export { MODEL_PATH };

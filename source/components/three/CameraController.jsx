import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * 相机控制器。
 *
 * ⚠️ 保护清单：定位公式与改造前逐字一致 ——
 *   world = (relativePos - center) * scale
 *   相机外推：z 方向按穴位在身体前/后取符号；|x| > 1.5 时才做水平偏移；
 *   目标点为 (pointPos.x, pointPos.y, pointPos.z) + (xSide*6, +3, zSide*10)。
 *
 * 本轮唯一的交互改动：鼠标映射改为通用习惯
 *   左键拖拽 = 旋转，右键拖拽 = 平移，滚轮 = 缩放
 *   （改造前是 SolidWorks 风格：左键平移、中键旋转）
 * 触控保持 R3F 默认：单指旋转、双指缩放+平移。
 */

/** 把相机复位到能看到全身的距离。公式同改造前。 */
export function resetCameraView(controlsRef, modelInfo) {
  if (!controlsRef.current || !modelInfo || !modelInfo.ready) return false;
  const halfH = (modelInfo.size.y * modelInfo.scale) / 2;
  const camera = controlsRef.current.object;
  const dist = halfH / Math.tan(((camera.fov * Math.PI) / 180) / 2) + 2;

  gsap.to(camera.position, { x: 0, y: 0, z: dist, duration: 1, ease: 'power2.inOut' });
  gsap.to(controlsRef.current.target, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => controlsRef.current.update(),
  });
  return true;
}

export default function CameraController({
  controlsRef,
  activePoint,
  modelInfo,
  modelReady,
  onAnimatingChange,
}) {
  const { camera } = useThree();
  const [animating, setAnimating] = useState(false);

  // 模型加载完成后，自动把相机框到全身
  useEffect(() => {
    if (modelReady && controlsRef.current) {
      const halfH = (modelInfo.size.y * modelInfo.scale) / 2;
      const dist = halfH / Math.tan(((camera.fov * Math.PI) / 180) / 2) + 2;
      controlsRef.current.target.set(0, 0, 0);
      camera.position.set(0, 0, dist);
      controlsRef.current.update();
    }
  }, [modelReady, camera, controlsRef, modelInfo]);

  // 选中穴位后把镜头推到该穴位外侧
  useEffect(() => {
    if (!activePoint || !controlsRef.current || !modelReady) return;

    setAnimating(true);

    const lx = activePoint.relativePos ? activePoint.relativePos.x : activePoint.x;
    const ly = activePoint.relativePos ? activePoint.relativePos.y : activePoint.y;
    const lz = activePoint.relativePos ? activePoint.relativePos.z : activePoint.z;

    const { scale, center } = modelInfo;
    const pointPos = new THREE.Vector3(
      (lx - center.x) * scale,
      (ly - center.y) * scale,
      (lz - center.z) * scale
    );

    // 相机放在穴位"外侧"：背部穴位(z<0)从背后看，正面穴位(z>0)从前面看
    const zSide = pointPos.z >= 0 ? 1 : -1;
    const xSide = Math.abs(pointPos.x) > 1.5 ? (pointPos.x >= 0 ? 1 : -1) : 0;
    const cameraOffset = new THREE.Vector3(
      xSide * 6, // 偏向穴位所在水平侧（避开身体中线遮挡）
      pointPos.y + 3, // 略高于穴位，俯视
      zSide * 10 // 从穴位所在的前/后侧看
    );

    gsap.to(camera.position, {
      x: pointPos.x + cameraOffset.x,
      y: cameraOffset.y,
      z: pointPos.z + cameraOffset.z,
      duration: 1.5,
      ease: 'power3.inOut',
    });

    gsap.to(controlsRef.current.target, {
      x: pointPos.x,
      y: pointPos.y,
      z: pointPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
      onUpdate: () => controlsRef.current.update(),
      onComplete: () => setAnimating(false),
    });
  }, [activePoint, camera, controlsRef, modelInfo, modelReady]);

  useEffect(() => {
    if (onAnimatingChange) onAnimatingChange(animating);
  }, [animating, onAnimatingChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!animating}
      enablePan
      enableZoom
      enableRotate
      // 通用鼠标习惯：左键旋转 / 右键平移 / 中键缩放
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      // 触控：单指旋转、双指缩放平移
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      maxDistance={120}
      minDistance={3}
      maxPolarAngle={Math.PI * 0.92}
      minPolarAngle={Math.PI * 0.08}
    />
  );
}

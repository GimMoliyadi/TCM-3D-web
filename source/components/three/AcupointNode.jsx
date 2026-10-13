import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 单个穴位标记。
 *
 * 坐标来源：pt.relativePos（缺失时回退 pt.x/y/z），与改造前完全一致，
 * 不做任何换算或偏移。
 *
 * 本轮只改「视觉反馈」与「性能」：
 *  - 空闲态球体由 0.35 缩到 0.26，降低 290 个点的视觉噪声（坐标不参与计算）
 *  - 几何体与材质提升为模块级共享实例，材质数由 290 降到 4
 *  - 新增 hover 名称标签，只在悬停的单个节点内渲染（不会引起父级重渲染）
 */

const NODE_GEOMETRY = new THREE.SphereGeometry(0.26, 12, 10);
const HALO_GEOMETRY = new THREE.SphereGeometry(0.42, 12, 10);

// 颜色与改造前保持一致：空闲 #cc0000 / 选中 #ff0000 / 光晕 #ff3b30
const MATERIAL_IDLE = new THREE.MeshStandardMaterial({
  color: '#cc0000',
  emissive: '#ff0000',
  emissiveIntensity: 0.8,
});
const MATERIAL_DIM = new THREE.MeshStandardMaterial({
  color: '#cc0000',
  emissive: '#ff0000',
  emissiveIntensity: 0.1,
  transparent: true,
  opacity: 0.25,
});
const MATERIAL_ACTIVE = new THREE.MeshStandardMaterial({
  color: '#ff0000',
  emissive: '#ff0000',
  emissiveIntensity: 2.5,
});
const MATERIAL_HALO = new THREE.MeshBasicMaterial({
  color: '#ff3b30',
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

export default function AcupointNode({
  pt,
  isActive,
  hasActivePoint,
  onSelect,
  interactive = true,
}) {
  const meshRef = useRef();
  const haloRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (isActive && haloRef.current) {
      const t = (state.clock.elapsedTime * 1.5) % 1.0;
      haloRef.current.scale.setScalar((1.0 + t) * 2.5);
      haloRef.current.material.opacity = 1.0 - t;
    }
    if (!meshRef.current) return;
    if (isActive) {
      meshRef.current.scale.setScalar(1.6 + Math.sin(state.clock.elapsedTime * 6) * 0.15);
    } else if (meshRef.current.scale.x !== 1) {
      meshRef.current.scale.setScalar(1.0);
    }
  });

  // 坐标取用规则保持不变
  const posX = pt.relativePos ? pt.relativePos.x : pt.x;
  const posY = pt.relativePos ? pt.relativePos.y : pt.y;
  const posZ = pt.relativePos ? pt.relativePos.z : pt.z;

  const material = isActive ? MATERIAL_ACTIVE : hasActivePoint ? MATERIAL_DIM : MATERIAL_IDLE;

  const handleEnter = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handleLeave = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[posX, posY, posZ]}>
      <mesh
        ref={meshRef}
        geometry={NODE_GEOMETRY}
        material={material}
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                onSelect(pt);
              }
            : undefined
        }
        onPointerOver={handleEnter}
        onPointerOut={handleLeave}
      />
      {isActive && <mesh ref={haloRef} geometry={HALO_GEOMETRY} material={MATERIAL_HALO} />}
      {hovered && !isActive && (
        <Html center zIndexRange={[30, 20]}>
          <div className="point-label">{pt.name}</div>
        </Html>
      )}
    </group>
  );
}

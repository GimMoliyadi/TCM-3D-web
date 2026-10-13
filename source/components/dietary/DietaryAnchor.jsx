import React from 'react';
import { Html } from '@react-three/drei';

/**
 * 3D 场景中的食养空间锚点。
 * 坐标取自 anchorAcupointId 对应的穴位（relativePos 缺失时回退 x/y/z），
 * 与穴位标记共享同一套坐标口径，不做任何额外换算。
 */
export default function DietaryAnchor({ point, target, selected, onSelect }) {
  const position = point.relativePos || point;

  return (
    <group position={[position.x, position.y, position.z]}>
      <Html center zIndexRange={[30, 20]}>
        <button
          type="button"
          className={`dietary-anchor ${selected ? 'selected' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(target);
          }}
          aria-label={`${target} · 食养`}
        >
          <span>
            <span aria-hidden="true">◉</span> {target} · 食养
          </span>
          <small>空间锚点 · {point.name}</small>
        </button>
      </Html>
    </group>
  );
}

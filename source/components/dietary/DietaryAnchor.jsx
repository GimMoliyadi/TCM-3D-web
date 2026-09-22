import React from 'react';
import { Html } from '@react-three/drei';
export default function DietaryAnchor({ point, target, selected, onSelect }) {
 const p = point.relativePos || point;
 return <group position={[p.x,p.y,p.z]}><Html center zIndexRange={[30,20]}>
 <button className={`dietary-anchor ${selected ? 'selected' : ''}`} onClick={e => {e.stopPropagation();onSelect(target);}} aria-label={`${target} · 食养`}>
 <span aria-hidden="true">◉</span> {target} · 食养<small>空间锚点 · {point.name}</small></button>
 </Html></group>;
}

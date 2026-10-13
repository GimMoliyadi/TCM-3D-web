import React from 'react';
import DietaryAnchor from './DietaryAnchor';
import { relations, anchorFor } from '../../utils/dietaryRelations';

/**
 * 食养图层：把知识关系里的每个藏象节点解析成一个 3D 空间锚点。
 * target 列表与锚点解析规则（relations + anchorFor）与改造前一致。
 */
export default function DietaryLayer({ points, selected, onSelect }) {
  const targets = [...new Set(relations.map((relation) => relation.target))];

  return targets.map((target) => {
    const point = anchorFor(relations.find((relation) => relation.target === target), points);
    if (!point) return null;
    return (
      <DietaryAnchor
        key={target}
        point={point}
        target={target}
        selected={selected === target}
        onSelect={onSelect}
      />
    );
  });
}

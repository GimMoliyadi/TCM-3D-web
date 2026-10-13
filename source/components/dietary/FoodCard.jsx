import React from 'react';
import { sourcesFor } from '../../utils/dietaryRelations';

/**
 * 单条食物卡片：食物名 → 关联语境 → 说明 → 古籍来源。
 * 业务上只是「把一条 relations 记录渲染成可点条目」，点击后交出 foodId。
 */
export default function FoodCard({ food, relation, onSelect }) {
  return (
    <button type="button" className="dietary-card" onClick={() => onSelect(food.id)}>
      <strong>{food.name}</strong>
      <small>{relation.context} · 传统食养关联</small>
      <p>{relation.description}</p>
      <small>来源：{sourcesFor(relation).map((source) => `《${source.book}》`).join('、')}</small>
      <span>查看食物与出处 →</span>
    </button>
  );
}

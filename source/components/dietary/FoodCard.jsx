import React from 'react';
import { sourcesFor } from '../../utils/dietaryRelations';
export default function FoodCard({food, relation, onSelect}) {
 return <button className="dietary-card" onClick={() => onSelect(food.id)}><strong>{food.name}</strong>
 <small>{relation.context} · 传统食养关联</small><p>{relation.description}</p>
 <small>来源：{sourcesFor(relation).map(s => `《${s.book}》`).join('、')}</small><span>查看食物与出处 →</span></button>;
}

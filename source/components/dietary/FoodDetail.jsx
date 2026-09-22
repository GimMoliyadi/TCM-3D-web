import React from 'react';
import { relationsForFood, sourcesFor } from '../../utils/dietaryRelations';
export default function FoodDetail({food,onTarget,onBack}) {
 return <><button onClick={onBack}>← 返回肝 · 传统食养</button><h2>{food.name}</h2><p>{food.summary}</p>
 {relationsForFood(food.id).map(r => <section key={r.id}><h3>传统食养关系</h3><p>{r.description}</p>
 <button className="dietary-target" onClick={() => onTarget(r.target)}>关联：{r.target} · 定位空间锚点</button>
 {sourcesFor(r).map(s => <details key={s.id}><summary>查看古籍原文 ·《{s.book}》</summary><p>{s.chapter} · {s.entry}</p>
 <blockquote>{s.quote}</blockquote><p>白话说明：{r.description}</p><small>{s.verification}</small>
 <a href={s.url} target="_blank" rel="noreferrer">查看来源电子文本 ↗</a></details>)}</section>)}
 <h3>注意事项</h3><p>{food.notes}</p><h3>相关食养方</h3><p>本阶段未录入食养方。</p></>;
}

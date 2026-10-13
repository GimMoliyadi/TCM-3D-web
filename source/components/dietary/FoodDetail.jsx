import React from 'react';
import { relationsForFood, sourcesFor } from '../../utils/dietaryRelations';

/**
 * 食物详情：返回 → 食物名 → 传统食养关系（含古籍原文折叠）→ 注意事项 → 相关食养方。
 * 知识关系完全来自 utils/dietaryRelations，本轮只调整排版。
 */
export default function FoodDetail({ food, target, onTarget, onBack }) {
  return (
    <>
      <button type="button" className="dietary-back" onClick={onBack}>
        {`← 返回${target} · 传统食养`}
      </button>

      <h2>{food.name}</h2>
      <p>{food.summary}</p>

      {relationsForFood(food.id).map((relation) => (
        <section key={relation.id}>
          <h3>传统食养关系</h3>
          <p>{relation.description}</p>

          <button
            type="button"
            className="dietary-target"
            onClick={() => onTarget(relation.target)}
          >
            {`关联：${relation.target} · 定位空间锚点`}
          </button>

          {sourcesFor(relation).map((source) => (
            <details key={source.id}>
              <summary>{`查看古籍原文 ·《${source.book}》`}</summary>
              <p>
                {source.chapter} · {source.entry}
              </p>
              <blockquote>{source.quote}</blockquote>
              <p>白话说明：{relation.description}</p>
              <small>{source.verification}</small>
              <a href={source.url} target="_blank" rel="noreferrer">
                查看来源电子文本 ↗
              </a>
            </details>
          ))}
        </section>
      ))}

      <h3>注意事项</h3>
      <p>{food.notes}</p>

      <h3>相关食养方</h3>
      <p className="dietary-placeholder">本阶段未录入食养方。</p>
    </>
  );
}

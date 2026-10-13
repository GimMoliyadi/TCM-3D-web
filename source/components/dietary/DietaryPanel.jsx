import React, { useState } from 'react';
import FoodCard from './FoodCard';
import FoodDetail from './FoodDetail';
import {
  relationsForTarget,
  foodById,
  searchFoods,
  anchorNotice,
} from '../../utils/dietaryRelations';

/**
 * 食养知识面板。
 *
 * ⚠️ 保护清单：数据来源（foods / zangfu_relations / dietary_sources）与知识关系
 * 完全复用 utils/dietaryRelations，本轮只重制排版与样式，不改任何筛选/检索语义，
 * 也不改无障碍名称（既有端到端用例依赖这些名称）。
 */
export default function DietaryPanel({ target, foodId, onFood, onTarget, onClose }) {
  const [query, setQuery] = useState('');
  const matches = searchFoods(query);

  return (
    <aside className="dietary-panel" aria-label="传统食养知识">
      <header>
        <span>食养知识 · 古籍阅读</span>
        <button type="button" aria-label="关闭食养面板" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="dietary-scroll custom-scrollbar">
        <p className="dietary-notice">
          「{target}」为中医藏象知识节点，不等同于现代解剖器官。
          {anchorNotice}
        </p>

        {foodId ? (
          <FoodDetail
            food={foodById(foodId)}
            target={target}
            onTarget={onTarget}
            onBack={() => onFood(null)}
          />
        ) : (
          <>
            <h2>{`${target} · 传统食养`}</h2>

            <label>
              搜索食物
              <input
                type="search"
                placeholder="搜索食物名称"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <p className="dietary-muted">3 条原文已核对 · 不代表现代疗效验证</p>

            {relationsForTarget(target)
              .filter((relation) => matches.some((food) => food.id === relation.foodId))
              .map((relation) => (
                <FoodCard
                  key={relation.id}
                  food={foodById(relation.foodId)}
                  relation={relation}
                  onSelect={onFood}
                />
              ))}

            {!matches.length && (
              <p className="dietary-empty" role="status">
                没有已核实的匹配条目。
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

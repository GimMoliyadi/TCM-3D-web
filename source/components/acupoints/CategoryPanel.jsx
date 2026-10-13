import React, { useState } from 'react';
import { ChevronRight, MapPin, Stethoscope, Lightbulb } from 'lucide-react';
import { SegmentedControl, Badge } from '../ui';
import { CATEGORY_KINDS, categoriesFor, findPointByName } from '../../data/repository';

/**
 * 分类导航：按部位 / 按症状。
 *
 * 业务语义保持不变：分类定义来自 data/acupoint_categories.js，
 * 「展开分类 → 点击穴位名 → 抛出穴位对象」的链路与改造前一致。
 * 卡片改为整块可点、带计数徽标与描述，层级更清楚。
 */

const TABS = [
  {
    value: CATEGORY_KINDS.BODY,
    label: '按部位',
    testId: 'tab-body',
    icon: <MapPin size={14} aria-hidden="true" />,
  },
  {
    value: CATEGORY_KINDS.SYMPTOM,
    label: '按症状',
    testId: 'tab-symptom',
    icon: <Stethoscope size={14} aria-hidden="true" />,
  },
];

export default function CategoryPanel({ acupoints, activePoint, onSelectPoint, onAfterSelect }) {
  const [kind, setKind] = useState(CATEGORY_KINDS.BODY);
  const [expanded, setExpanded] = useState(null);

  const categories = categoriesFor(kind);

  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id));

  const handlePointClick = (name) => {
    const point = findPointByName(acupoints, name);
    if (!point) return;
    onSelectPoint(point);
    if (onAfterSelect) onAfterSelect();
  };

  return (
    <div className="category-panel">
      <SegmentedControl
        block
        className="category-tabs"
        ariaLabel="分类方式"
        value={kind}
        onChange={(next) => {
          setKind(next);
          setExpanded(null);
        }}
        options={TABS}
      />

      <div role="list" aria-label={kind === CATEGORY_KINDS.BODY ? '按身体部位分类' : '按症状分类'}>
        {categories.map((category) => {
          const isOpen = expanded === category.id;
          const listId = `cat-${category.id}`;
          return (
            <div
              key={category.id}
              role="listitem"
              className={`category-group ${isOpen ? 'is-open' : ''}`}
            >
              <button
                type="button"
                className="category-toggle"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => toggle(category.id)}
              >
                <span className="category-toggle-main">
                  <span aria-hidden="true">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  {kind === CATEGORY_KINDS.SYMPTOM && category.description && (
                    <span className="category-desc">{category.description}</span>
                  )}
                </span>
                <span className="category-toggle-side">
                  <Badge tone={isOpen ? 'bamboo' : 'neutral'}>{category.points.length}</Badge>
                  <ChevronRight className="category-chevron" size={16} aria-hidden="true" />
                </span>
              </button>

              {isOpen && (
                <div className="category-points" id={listId}>
                  {category.points.map((name) => {
                    const point = findPointByName(acupoints, name);
                    if (!point) return null;
                    const isActive = activePoint?.name === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        className={`point-row ${isActive ? 'is-active' : ''}`}
                        onClick={() => handlePointClick(name)}
                        data-testid="category-point"
                      >
                        <span className="point-row-name">{name}</span>
                        {point.efficacy && (
                          <span className="point-row-hint">{point.efficacy.split('，')[0]}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="category-foot">
        <Lightbulb size={14} aria-hidden="true" />
        <span>点击穴位名称可自动定位并查看详情</span>
      </div>
    </div>
  );
}

import React from 'react';
import { Activity, BookOpen, Menu, X } from 'lucide-react';
import { SegmentedControl, IconButton } from '../ui';
import SearchPanel from '../acupoints/SearchPanel';

/**
 * 页头：品牌 · 模式切换 · 全局搜索 · 分类入口 · 使用说明。
 * 搜索常驻页头（各断点都可见），分类导航改为可收起的独立面板，
 * 这样 3D 舞台默认拿到最大宽度，模型成为页面主视觉。
 */

const MODES = [
  { value: 'acupoints', label: '穴位' },
  { value: 'dietary', label: '食养' },
];

export default function AppHeader({
  mode,
  onModeChange,
  term,
  onTermChange,
  results,
  onSelectResult,
  categoryOpen,
  onToggleCategory,
  guideOpen,
  onToggleGuide,
  compact,
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <Activity size={18} />
        </span>
        <span className="brand-text">
          <span className="brand-title">中医穴位图谱</span>
          <span className="brand-sub">3D Acupoint Atlas</span>
        </span>
      </div>

      <SegmentedControl
        ariaLabel="知识模式"
        value={mode}
        onChange={onModeChange}
        options={MODES}
      />

      {/* 搜索框只在穴位模式渲染；外层容器始终保留，
          这样桌面端「搜索 + 操作」始终作为一组贴在页头右侧。 */}
      <div className="header-search">
        {mode === 'acupoints' && (
          <SearchPanel
            term={term}
            onTermChange={onTermChange}
            results={results}
            onSelect={onSelectResult}
            variant="header"
          />
        )}
      </div>

      <div className="header-actions">
        {!compact && (
          <IconButton
            label="使用说明"
            title="使用说明"
            active={guideOpen}
            aria-expanded={guideOpen}
            onClick={onToggleGuide}
          >
            <BookOpen size={18} />
          </IconButton>
        )}

        {mode === 'acupoints' && (
          <button
            type="button"
            className={`btn btn-secondary btn-sm ${categoryOpen ? 'is-active' : ''}`}
            onClick={onToggleCategory}
            aria-expanded={categoryOpen}
            aria-controls="category-rail"
            title={categoryOpen ? '收起分类菜单' : '展开分类菜单'}
            data-testid="category-toggle"
          >
            {categoryOpen ? <X size={15} /> : <Menu size={15} />}
            <span>{categoryOpen ? '收起分类' : '穴位分类'}</span>
          </button>
        )}

        {compact && (
          <IconButton
            label="使用说明"
            title="使用说明"
            active={guideOpen}
            aria-expanded={guideOpen}
            onClick={onToggleGuide}
          >
            <BookOpen size={18} />
          </IconButton>
        )}
      </div>
    </header>
  );
}

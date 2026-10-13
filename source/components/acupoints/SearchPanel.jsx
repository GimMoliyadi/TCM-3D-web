import React, { useEffect, useMemo, useRef } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { EmptyState } from '../ui';

/**
 * 搜索面板：输入框 + 结果列表。
 *
 * 业务语义保持不变：匹配字段由 repository.searchAcupoints 决定，
 * 本组件只负责「把结果画出来」和键盘可达性（↑ ↓ 选择、Enter 确认、Esc 清空）。
 */

/** 把命中的关键词包成 <mark>，让用户看清匹配位置（纯展示，不参与匹配） */
function Highlight({ text = '', term = '' }) {
  if (!term || !text.includes(term)) return <>{text}</>;
  const idx = text.indexOf(term);
  return (
    <>
      {text.slice(0, idx)}
      <mark>{term}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export function SearchField({
  value,
  onTermChange,
  onClear,
  placeholder = '搜索穴位名称...',
  autoFocus = false,
  inputRef,
  size = 'md',
  onKeyDown,
}) {
  return (
    <div className={`field ${size === 'sm' ? 'search-compact' : ''}`}>
      <span className="field-icon" aria-hidden="true">
        <Search size={18} />
      </span>
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label="搜索穴位"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onTermChange(e.target.value)}
        onKeyDown={onKeyDown}
        enterKeyHint="search"
      />
      {value ? (
        <button type="button" className="field-clear" aria-label="清空搜索" onClick={onClear}>
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}

export default function SearchPanel({
  term,
  onTermChange,
  results,
  onSelect,
  variant = 'rail',
  emptyDescription,
}) {
  const listRef = useRef(null);
  const [cursor, setCursor] = React.useState(-1);

  // 结果变化时重置键盘游标
  useEffect(() => {
    setCursor(-1);
  }, [term, results]);

  const hasTerm = term.trim() !== '';
  const showResults = hasTerm && results.length > 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onTermChange('');
      return;
    }
    if (!showResults) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      onSelect(results[cursor]);
    }
  };

  // 键盘游标滚动到可视区
  useEffect(() => {
    if (cursor < 0 || !listRef.current) return;
    const el = listRef.current.children[cursor];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const body = useMemo(() => {
    if (!hasTerm) return null;
    if (results.length === 0) {
      return (
        <EmptyState
          compact
          icon={<Search size={20} />}
          title="没有找到匹配的穴位"
          description={emptyDescription || '试试输入穴位名称的一部分，或按功效关键词搜索，例如「头痛」「失眠」。'}
        />
      );
    }
    return (
      <div className="search-results-list custom-scrollbar" ref={listRef} role="listbox" aria-label="搜索结果">
        {results.map((pt, i) => (
          <button
            key={pt.id || pt.name}
            type="button"
            role="option"
            aria-selected={cursor === i}
            className={`search-result cursor-pointer ${cursor === i ? 'is-active' : ''}`}
            onClick={() => onSelect(pt)}
            onMouseEnter={() => setCursor(i)}
            data-testid="search-result"
          >
            <span className="search-result-mark" aria-hidden="true" />
            <span className="search-result-body">
              <span className="search-result-name">
                <Highlight text={pt.name} term={term} />
              </span>
              <span className="search-result-desc">
                {pt.efficacy || pt.location || '暂无描述信息'}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  }, [hasTerm, results, cursor, term, onSelect, emptyDescription]);

  if (variant === 'overlay') {
    return (
      <div className="search-overlay" role="dialog" aria-label="搜索穴位">
        <SearchField
          value={term}
          onTermChange={onTermChange}
          onClear={() => onTermChange('')}
          onKeyDown={handleKeyDown}
          size="sm"
          autoFocus
        />
        {body && (
          <div className="search-results">
            <div className="search-results-head">
              <span>找到 {results.length} 个穴位</span>
              <span>
                <CornerDownLeft size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> 回车定位
              </span>
            </div>
            {body}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="search-wrap">
      <SearchField
        value={term}
        onTermChange={onTermChange}
        onClear={() => onTermChange('')}
        onKeyDown={handleKeyDown}
      />
      {body && (
        <div className="search-results">
          <div className="search-results-head">
            <span>找到 {results.length} 个穴位</span>
            <span>按功效或部位关键词也可搜索</span>
          </div>
          {body}
        </div>
      )}
    </div>
  );
}

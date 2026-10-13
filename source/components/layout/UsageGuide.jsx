import React from 'react';
import {
  BookOpen,
  FolderOpen,
  Search,
  MousePointerClick,
  Mouse,
  Keyboard,
  X,
  List,
  Hash,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/**
 * 使用说明。
 * 文案与当前实际交互保持一致（鼠标映射已改为通用习惯），
 * 并补上键盘操作说明 —— 改造前完全没有键盘支持。
 */
export default function UsageGuide({ compact, onClose }) {
  return (
    <div className="guide-panel custom-scrollbar" role="dialog" aria-label="使用说明">
      <div className="section-head">
        <h3 className="guide-title">
          <BookOpen size={17} aria-hidden="true" />
          使用说明
        </h3>
        <button type="button" className="icon-btn" aria-label="关闭使用说明" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="guide-group">
        <h4>
          <FolderOpen size={14} aria-hidden="true" />
          穴位分类
        </h4>
        <ul>
          <li>
            <List size={14} aria-hidden="true" />
            <span>点击页头「穴位分类」打开分类面板</span>
          </li>
          <li>
            <Hash size={14} aria-hidden="true" />
            <span>可切换「按部位」或「按症状」两种查找方式</span>
          </li>
          <li>
            <ArrowRight size={14} aria-hidden="true" />
            <span>展开分类后点击穴位名称，自动定位并显示详情</span>
          </li>
        </ul>
      </div>

      <div className="guide-group">
        <h4>
          <Search size={14} aria-hidden="true" />
          搜索
        </h4>
        <ul>
          <li>
            <Search size={14} aria-hidden="true" />
            <span>在页头搜索框输入穴位名称，或输入功效关键词（如「头痛」）</span>
          </li>
          <li>
            <ArrowRight size={14} aria-hidden="true" />
            <span>用 ↑ ↓ 在结果间移动，回车定位，Esc 清空</span>
          </li>
        </ul>
      </div>

      <div className="guide-group">
        <h4>
          <MousePointerClick size={14} aria-hidden="true" />
          在模型上直接点击
        </h4>
        <ul>
          <li>
            <Sparkles size={14} aria-hidden="true" />
            <span>点击模型上的红色穴位点即可查看详情，悬停会显示穴位名</span>
          </li>
        </ul>
      </div>

      <div className="guide-group">
        <h4>
          <Mouse size={14} aria-hidden="true" />
          {compact ? '触控操作' : '鼠标操作'}
        </h4>
        <ul>
          {compact ? (
            <>
              <li>
                <Mouse size={14} aria-hidden="true" />
                <span>
                  <strong>单指拖动</strong>：旋转视角
                </span>
              </li>
              <li>
                <Mouse size={14} aria-hidden="true" />
                <span>
                  <strong>双指捏合 / 拖动</strong>：缩放与平移
                </span>
              </li>
            </>
          ) : (
            <>
              <li>
                <Mouse size={14} aria-hidden="true" />
                <span>
                  <strong>左键拖动</strong>：旋转视角
                </span>
              </li>
              <li>
                <Mouse size={14} aria-hidden="true" />
                <span>
                  <strong>右键拖动</strong>：平移画面
                </span>
              </li>
              <li>
                <Mouse size={14} aria-hidden="true" />
                <span>
                  <strong>滚轮</strong>：缩放
                </span>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="guide-group">
        <h4>
          <Keyboard size={14} aria-hidden="true" />
          键盘
        </h4>
        <ul>
          <li>
            <Keyboard size={14} aria-hidden="true" />
            <span>
              <span className="kbd">Esc</span> 关闭面板并重置视角
            </span>
          </li>
          <li>
            <Keyboard size={14} aria-hidden="true" />
            <span>
              <span className="kbd">Tab</span> 在控件间移动，
              <span className="kbd">Enter</span> / <span className="kbd">Space</span> 激活
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

import React from 'react';
import { Crosshair, Info, Eye } from 'lucide-react';
import { Button } from '../ui';

/**
 * 舞台浮层：视角操作 + 图例 + 定位反馈。
 * 放在舞台左下/左上，不遮挡人体模型主体（模型默认居中，浮层贴边）。
 */
export default function StageToolbar({
  onResetView,
  activeName,
  legendVisible,
  onToggleLegend,
  compact,
}) {
  return (
    <>
      {legendVisible && (
        <div className="stage-ui stage-ui-top-left">
          <div className="legend" role="note">
            <div className="legend-row">
              <span className="legend-dot" aria-hidden="true" />
              <span>穴位标记（点击查看详情）</span>
            </div>
            <div className="legend-row">
              <span className="legend-dot is-active" aria-hidden="true" />
              <span>当前选中穴位</span>
            </div>
            <div className="legend-row">
              <Eye size={12} aria-hidden="true" />
              <span>{compact ? '单指旋转 · 双指缩放' : '左键旋转 · 右键平移 · 滚轮缩放'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="stage-ui stage-ui-bottom-left">
        <div className="stage-actions">
          <Button variant="secondary" size="sm" onStage onClick={onResetView} title="重置视角 (ESC)">
            <Crosshair size={14} aria-hidden="true" />
            <span>重置视角</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onStage
            aria-pressed={legendVisible}
            onClick={onToggleLegend}
            title="显示或隐藏图例"
          >
            <Info size={14} aria-hidden="true" />
            <span>{legendVisible ? '隐藏图例' : '显示图例'}</span>
          </Button>
        </div>
      </div>

      {activeName && (
        <div className="stage-ui stage-ui-top-right">
          <div className="stage-toast" role="status" aria-live="polite">
            已定位到 <strong>{activeName}</strong>
          </div>
        </div>
      )}
    </>
  );
}

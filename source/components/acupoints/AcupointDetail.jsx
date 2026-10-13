import React from 'react';
import {
  MapPin,
  Sparkles,
  HandHeart,
  TriangleAlert,
  X,
  Info,
  Crosshair,
  BookOpen,
} from 'lucide-react';
import { IconButton, Badge, DetailCard, Button } from '../ui';
import { bodyPartsOf, symptomsOf } from '../../data/repository';

/**
 * 穴位详情卡：名称 → 定位 → 功效 → 手法 → 禁忌 → 相关分类 → 来源说明。
 * 信息层级按「先看是什么、再看怎么用、最后看风险与出处」排列。
 */

const FALLBACK = {
  location: '暂无定位信息',
  efficacy: '暂无功效信息',
  massage: '暂无手法信息',
  contraindications: '暂无禁忌信息',
};

export default function AcupointDetail({ point, onClose, onResetView, showHint = true, onDismissHint }) {
  if (!point) return null;

  const bodyParts = bodyPartsOf(point.name);
  const symptoms = symptomsOf(point.name);

  return (
    <div className="detail animate-fade-in">
      <header className="detail-head">
        <IconButton label="关闭详情面板" className="detail-close" onClick={onClose}>
          <X size={18} />
        </IconButton>
        <div className="detail-eyebrow">
          <MapPin size={13} aria-hidden="true" />
          <span>{bodyParts.length ? bodyParts.join(' · ') : '穴位详情'}</span>
        </div>
        <h2 className="detail-name">{point.name}</h2>
        <div className="detail-rule" />
      </header>

      <div className="detail-body custom-scrollbar">
        <div className="detail-stack">
          {point.text && (
            <p className="detail-lead">{point.text}</p>
          )}

          <DetailCard title="穴位精准定位" tone="location" icon={<MapPin size={14} />}>
            {point.location || FALLBACK.location}
          </DetailCard>

          <DetailCard title="日常功效" tone="efficacy" icon={<Sparkles size={14} />}>
            {point.efficacy || FALLBACK.efficacy}
          </DetailCard>

          <DetailCard title="按摩或艾灸手法" tone="massage" icon={<HandHeart size={14} />}>
            {point.massage || FALLBACK.massage}
          </DetailCard>

          <DetailCard
            title="禁忌症与注意事项"
            tone="warning"
            icon={<TriangleAlert size={14} />}
          >
            {point.contraindications || FALLBACK.contraindications}
          </DetailCard>

          {(bodyParts.length > 0 || symptoms.length > 0) && (
            <section className="card card-tight">
              <div className="section-head">
                <h3 className="section-title">
                  <BookOpen size={14} />
                  <span>相关分类</span>
                </h3>
              </div>
              <div className="detail-chips">
                {bodyParts.map((name) => (
                  <Badge key={`b-${name}`} tone="bamboo">
                    {name}
                  </Badge>
                ))}
                {symptoms.map((name) => (
                  <Badge key={`s-${name}`} tone="ochre">
                    {name}
                  </Badge>
                ))}
              </div>
              <p className="source-note" style={{ marginTop: 'var(--sp-3)' }}>
                分类用于快速检索，不代表诊断结论。
              </p>
            </section>
          )}

          <section className="card card-tight">
            <div className="section-head">
              <h3 className="section-title">
                <Info size={14} />
                <span>知识来源与说明</span>
              </h3>
            </div>
            <p className="source-note">
              穴位名称、相对坐标与定位描述来自本项目内置的穴位数据集（共 290 条），
              坐标用于在 3D 人体模型上还原传统体表定位，不做医学测量用途。
              <br />
              <strong>按摩手法与禁忌为通用的传统养生描述，非个体化医嘱。</strong>
              本页内容仅供日常小症状的穴位参考与学习了解，不能代替医院诊断、治疗或医生建议。
            </p>
          </section>
        </div>
      </div>

      <footer className="detail-foot">
        <div className="detail-foot-row">
          <Button
            variant="secondary"
            size="sm"
            onClick={onResetView}
            data-testid="detail-reset-view"
          >
            <Crosshair size={14} />
            重置视角
          </Button>
          {showHint && (
            <button type="button" className="detail-hint" onClick={onDismissHint}>
              <X size={13} />
              <span>点击背景、按 Esc 或右上角可关闭面板</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

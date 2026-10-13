import React from 'react';

/**
 * UI 基础组件（无业务语义）。
 * 所有视觉规则来自 styles/components.css 的 token 化类名，
 * 组件本身不做布局决策，只保证「状态齐全、键盘可达、无障碍属性正确」。
 */

const cx = (...parts) => parts.filter(Boolean).join(' ');

/* ---------- 按钮 ---------- */
export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  onStage = false,
  className = '',
  type = 'button',
  children,
  ...rest
}) {
  const cls = cx(
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    block && 'btn-block',
    onStage && 'btn-on-stage',
    className
  );
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ---------- 图标按钮（必须带 label 才有可访问名称） ---------- */
export function IconButton({ label, onStage = false, active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={rest.title || label}
      className={cx('icon-btn', onStage && 'icon-btn-on-stage', active && 'is-active', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- 徽标 ---------- */
export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={cx('badge', `badge-${tone}`, className)}>{children}</span>;
}

/* ---------- 分段控件（单选，键盘左右可切换） ---------- */
export function SegmentedControl({ value, onChange, options, block = false, ariaLabel, className = '' }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx('segmented', block && 'segmented-block', className)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          {...(opt.testId ? { 'data-testid': opt.testId } : {})}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- 转圈 ---------- */
export function Spinner({ onStage = false, className = '' }) {
  return <div className={cx('spinner', onStage && 'spinner-on-stage', className)} role="presentation" />;
}

/* ---------- 状态块：加载 / 空 / 错误 ---------- */
export function StateBlock({ icon, title, description, action, tone = 'neutral', compact = false, role }) {
  return (
    <div className={cx('state-block', compact && 'compact')} role={role}>
      {icon && <div className={cx('state-icon', tone === 'warn' && 'warn')}>{icon}</div>}
      {title && <div className="state-title">{title}</div>}
      {description && <p className="state-desc">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ title = '正在加载…', description, compact = false, action }) {
  return (
    <StateBlock
      role="status"
      icon={<Spinner />}
      title={title}
      description={description}
      action={action}
      compact={compact}
    />
  );
}

export function EmptyState({ icon, title = '没有内容', description, action, compact = false }) {
  return (
    <StateBlock
      role="status"
      icon={icon}
      title={title}
      description={description}
      action={action}
      compact={compact}
    />
  );
}

export function ErrorState({
  title = '出错了',
  description = '请稍后重试，或刷新页面。',
  action,
  compact = false,
  icon = '!',
}) {
  return (
    <StateBlock
      role="alert"
      tone="warn"
      icon={<span aria-hidden="true">{icon}</span>}
      title={title}
      description={description}
      action={action}
      compact={compact}
    />
  );
}

/* ---------- 分区卡片 ---------- */
export function SectionCard({ title, icon, aside, children, className = '', ...rest }) {
  return (
    <section className={cx('card', className)} {...rest}>
      {title && (
        <div className="section-head">
          <h3 className="section-title">
            {icon}
            <span>{title}</span>
          </h3>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- 带语义色条的详情卡 ---------- */
export function DetailCard({ title, icon, tone = 'default', children }) {
  return (
    <div className={cx('detail-card', tone !== 'default' && `tone-${tone}`)}>
      {title && (
        <h4>
          {icon}
          <span>{title}</span>
        </h4>
      )}
      <p>{children}</p>
    </div>
  );
}

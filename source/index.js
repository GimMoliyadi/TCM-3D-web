import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import SceneErrorBoundary from './components/SceneErrorBoundary';
import './index.css';

/**
 * 应用入口。
 * SceneErrorBoundary 兜住 3D 场景的运行时异常；这里的 fallback 用内联样式，
 * 保证即使样式表本身加载失败也依然是一块可读、可操作的错误面板（不留白屏）。
 */
const container = document.getElementById('root');
const root = createRoot(container);

const crashFallback = (
  <div
    role="alert"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      minHeight: '60vh',
      padding: 24,
      margin: 0,
      background: '#181b1e',
      color: '#e8eaec',
      font: '14px/1.7 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 17, fontWeight: 700 }}>3D 场景加载失败</div>
    <div style={{ color: '#9aa3aa', maxWidth: 420 }}>
      可能是模型资源未加载完成或浏览器不支持 WebGL。可以刷新重试，或改用最新版 Chrome / Edge 打开。
    </div>
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        marginTop: 6,
        padding: '9px 20px',
        border: 'none',
        borderRadius: 10,
        background: '#3e6b5a',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      重新加载
    </button>
  </div>
);

root.render(
  <React.StrictMode>
    <SceneErrorBoundary fallback={crashFallback}>
      <App />
    </SceneErrorBoundary>
  </React.StrictMode>
);

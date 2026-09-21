import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import SceneErrorBoundary from './components/SceneErrorBoundary';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <SceneErrorBoundary fallback={<div role="alert" style={{padding:24,color:"white",background:"#0f172a"}}>3D 场景加载失败，请刷新重试。<button onClick={() => window.location.reload()}>重新加载</button></div>}>
      <App />
    </SceneErrorBoundary>
  </React.StrictMode>
);
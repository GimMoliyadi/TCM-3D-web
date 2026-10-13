import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import AppHeader from './components/layout/AppHeader';
import StageToolbar from './components/layout/StageToolbar';
import UsageGuide from './components/layout/UsageGuide';
import CategoryPanel from './components/acupoints/CategoryPanel';
import AcupointDetail from './components/acupoints/AcupointDetail';
import Viewer from './components/three/Viewer';
import { resetCameraView } from './components/three/CameraController';
import DietaryPanel from './components/dietary/DietaryPanel';
import { LoadingState, ErrorState, Button } from './components/ui';
import { useAcupoints } from './hooks/useAcupoints';
import { useMediaQuery, BREAKPOINTS } from './hooks/useMediaQuery';
import { searchAcupoints } from './data/repository';
import { relationsForTarget, anchorFor } from './utils/dietaryRelations';

import './components/dietary/dietary.css';

/**
 * 应用编排层。
 *
 * 这里只负责「状态 + 布局装配」，具体职责已下沉到独立组件：
 *   AppHeader     品牌 / 模式切换 / 全局搜索 / 分类入口 / 使用说明
 *   CategoryPanel 分类导航（按部位 / 按症状）
 *   Viewer        3D 舞台（模型 + 穴位标记 + 食养锚点 + 相机）
 *   AcupointDetail穴位详情卡
 *   DietaryPanel  食养知识面板（既有业务逻辑原样复用）
 *   StageToolbar  舞台浮层（图例 / 重置视角 / 定位反馈）
 *
 * 数据经 hooks/useAcupoints + data/repository 获取，组件不直接 import JSON，
 * 未来把 fetchAcupoints 换成 FastAPI 请求即可，本文件无需改动。
 */

const MODE = Object.freeze({ ACUPOINTS: 'acupoints', DIETARY: 'dietary' });

/** 食养模式的默认藏象节点（与改造前一致：进入食养先定位到「肝」锚点）。 */
const DEFAULT_DIETARY_TARGET = '肝';

export default function App() {
  const compact = useMediaQuery(BREAKPOINTS.compact);
  const tablet = useMediaQuery(BREAKPOINTS.tablet);

  const { data: acupoints, status, error, reload } = useAcupoints();

  const [mode, setMode] = useState(MODE.ACUPOINTS);
  const [activePoint, setActivePoint] = useState(null);
  const [term, setTerm] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [legendVisible, setLegendVisible] = useState(true);
  const [dismissedHint, setDismissedHint] = useState(false);

  const [dietaryTarget, setDietaryTarget] = useState(null);
  const [dietaryPoint, setDietaryPoint] = useState(null);
  const [foodId, setFoodId] = useState(null);

  const [modelReady, setModelReady] = useState(false);
  const controlsRef = useRef();

  // 模型变换信息（缩放 + 中心 + 尺寸），由 ModelScene 加载后填充
  const modelInfoRef = useRef({
    scale: 1,
    center: new THREE.Vector3(),
    size: new THREE.Vector3(),
    ready: false,
  });

  /* ---------------- 派生数据 ---------------- */

  const results = useMemo(() => searchAcupoints(acupoints, term), [acupoints, term]);

  const dietaryAnchorPoint = useCallback(
    (target) => {
      const relation = relationsForTarget(target)[0];
      const point = relation ? anchorFor(relation, acupoints) : null;
      return point ? { ...point } : null;
    },
    [acupoints]
  );

  /* ---------------- 相机 / 视图 ---------------- */

  const handleModelReady = useCallback(() => setModelReady(true), []);

  const resetView = useCallback(() => {
    resetCameraView(controlsRef, modelInfoRef.current);
  }, []);

  /** 关闭所有面板并复位视角（Esc / 点击背景 / 重置按钮）。 */
  const dismissAll = useCallback(() => {
    setActivePoint(null);
    setDietaryTarget(null);
    setDietaryPoint(null);
    resetView();
  }, [resetView]);

  /* ---------------- 交互回调 ---------------- */

  const handleSelectPoint = useCallback(
    (point) => {
      setActivePoint(point);
      setDismissedHint(false);
    },
    []
  );

  const handleSelectResult = useCallback((point) => {
    setActivePoint(point);
    setTerm('');
    setDismissedHint(false);
  }, []);

  const handleCategorySelect = useCallback(
    (point) => {
      setActivePoint(point);
      setMode(MODE.ACUPOINTS);
      if (tablet) setCategoryOpen(false);
    },
    [tablet]
  );

  const handleModeChange = useCallback(
    (next) => {
      setMode(next);
      setCategoryOpen(false);
      setGuideOpen(false);
      setTerm('');
      setActivePoint(null);
      if (next === MODE.DIETARY) {
        // 进入食养：先把镜头带到默认锚点，但不自动展开面板
        setDietaryTarget(null);
        setDietaryPoint(dietaryAnchorPoint(DEFAULT_DIETARY_TARGET));
      } else {
        setDietaryTarget(null);
        setDietaryPoint(null);
      }
    },
    [dietaryAnchorPoint]
  );

  const handleOpenDietaryTarget = useCallback(
    (target) => {
      setDietaryTarget(target);
      setFoodId(null);
      setDietaryPoint(dietaryAnchorPoint(target));
    },
    [dietaryAnchorPoint]
  );

  const handleCloseDietary = useCallback(() => {
    setDietaryTarget(null);
  }, []);

  /* ---------------- 键盘 ---------------- */

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (guideOpen) {
        setGuideOpen(false);
        return;
      }
      if (categoryOpen) {
        setCategoryOpen(false);
        return;
      }
      dismissAll();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guideOpen, categoryOpen, dismissAll]);

  /* ---------------- 渲染 ---------------- */

  const isDietary = mode === MODE.DIETARY;
  const rightRailOpen = isDietary ? !!dietaryTarget : !!activePoint;
  const cameraTarget = isDietary ? dietaryPoint : activePoint;
  const showScrim = categoryOpen && tablet;

  const bodyClass = [
    'app-body',
    categoryOpen && 'left-open',
    rightRailOpen && 'has-right-rail',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app-shell">
      <a className="skip-link" href="#stage-viewport">
        跳到 3D 舞台
      </a>

      <AppHeader
        mode={mode}
        onModeChange={handleModeChange}
        term={term}
        onTermChange={setTerm}
        results={results}
        onSelectResult={handleSelectResult}
        categoryOpen={categoryOpen}
        onToggleCategory={() => setCategoryOpen((open) => !open)}
        guideOpen={guideOpen}
        onToggleGuide={() => setGuideOpen((open) => !open)}
        compact={compact}
      />

      <div className={bodyClass}>
        {showScrim && (
          <button
            type="button"
            className="scrim"
            aria-label="关闭分类面板"
            onClick={() => setCategoryOpen(false)}
          />
        )}

        <aside
          className={`rail rail-left ${categoryOpen ? 'is-open' : ''}`}
          id="category-rail"
          aria-hidden={!categoryOpen}
        >
          <div className="rail-head">
            <span className="rail-title">穴位分类</span>
          </div>
          <div className="rail-scroll custom-scrollbar">
            {status === 'ready' ? (
              <CategoryPanel
                acupoints={acupoints}
                activePoint={activePoint}
                onSelectPoint={handleCategorySelect}
                onAfterSelect={() => tablet && setCategoryOpen(false)}
              />
            ) : (
              <LoadingState compact title="正在准备分类数据…" />
            )}
          </div>
        </aside>

        <main className="stage stage-scope" id="stage-viewport" tabIndex={-1}>
          <Viewer
            acupoints={acupoints}
            /* 穴位模式下是选中的穴位；食养模式下是藏象锚点。
               标记高亮由 ModelScene 用 dietaryMode 再兜一层，互不干扰。 */
            activePoint={cameraTarget}
            onSelect={handleSelectPoint}
            onDeselect={() => !isDietary && setActivePoint(null)}
            modelInfo={modelInfoRef.current}
            modelReady={modelReady}
            onModelReady={handleModelReady}
            dietaryMode={isDietary}
            dietaryTarget={dietaryTarget}
            onDietarySelect={handleOpenDietaryTarget}
            controlsRef={controlsRef}
          />

          {!isDietary && status === 'ready' && (
            <StageToolbar
              onResetView={dismissAll}
              activeName={activePoint?.name}
              legendVisible={legendVisible}
              onToggleLegend={() => setLegendVisible((visible) => !visible)}
              compact={compact}
            />
          )}

          {isDietary && (
            <div className="stage-ui stage-ui-bottom-left">
              <div className="stage-actions">
                <Button variant="secondary" size="sm" onStage onClick={dismissAll} title="重置视角 (ESC)">
                  重置视角
                </Button>
              </div>
            </div>
          )}

          {guideOpen && (
            <div className="stage-guide">
              <UsageGuide compact={compact} onClose={() => setGuideOpen(false)} />
            </div>
          )}

          {status === 'loading' && (
            <div className="stage-state">
              <div className="card card-elevated">
                <LoadingState title="正在准备穴位数据…" />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="stage-state">
              <div className="card card-elevated">
                <ErrorState
                  title="穴位数据加载失败"
                  description={error?.message || '请刷新页面重试。'}
                  action={
                    <Button variant="primary" size="sm" onClick={reload}>
                      重新加载
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </main>

        {rightRailOpen && (
          <aside className="rail rail-right" aria-label={isDietary ? '食养知识' : '穴位详情'}>
            {isDietary ? (
              <DietaryPanel
                target={dietaryTarget}
                foodId={foodId}
                onFood={setFoodId}
                onTarget={handleOpenDietaryTarget}
                onClose={handleCloseDietary}
              />
            ) : (
              <AcupointDetail
                point={activePoint}
                onClose={() => setActivePoint(null)}
                onResetView={resetView}
                showHint={!dismissedHint}
                onDismissHint={() => setDismissedHint(true)}
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

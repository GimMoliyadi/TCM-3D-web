import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BookOpen, ClipboardList, FolderOpen, Menu, Search, MousePointerClick, Mouse, ChevronLeft, MapPin, Stethoscope, ChevronRight, Lightbulb, X, Sparkles, HandHeart, TriangleAlert, Pin, Crosshair, List, Hash, ArrowRight } from 'lucide-react';
import acupointsData from './data/acupoints_data.json';
import { bodyPartCategories, symptomCategories } from './data/acupoint_categories';

// 配置 Draco 解码器走 CDN，加速首次加载
useGLTF.preload('./models/human_body.glb');

function CameraController({ controlsRef, activePoint, modelInfo, modelReady }) {
  const { camera } = useThree();
  const [animating, setAnimating] = useState(false);

  // 模型加载完成后，自动把相机框到全身
  useEffect(() => {
    if (modelReady && controlsRef.current) {
      const halfH = (modelInfo.size.y * modelInfo.scale) / 2;
      // 距离 = 半高 / tan(fov/2)，加点余量
      const dist = halfH / Math.tan((camera.fov * Math.PI / 180) / 2) + 2;
      controlsRef.current.target.set(0, 0, 0);
      camera.position.set(0, 0, dist);
      controlsRef.current.update();
    }
  }, [modelReady, camera, controlsRef, modelInfo]);

  useEffect(() => {
    if (activePoint && controlsRef.current && modelReady) {
      setAnimating(true);

      // 穴位原始局部坐标
      const lx = activePoint.relativePos ? activePoint.relativePos.x : activePoint.x;
      const ly = activePoint.relativePos ? activePoint.relativePos.y : activePoint.y;
      const lz = activePoint.relativePos ? activePoint.relativePos.z : activePoint.z;

      // 世界坐标 = (原始坐标 - 中心) * 缩放
      const { scale, center } = modelInfo;
      const pointPos = new THREE.Vector3(
        (lx - center.x) * scale,
        (ly - center.y) * scale,
        (lz - center.z) * scale
      );

      // 相机放在穴位"外侧"：背部穴位(z<0)从背后看，正面穴位(z>0)从前面看
      // 否则背部穴位会被身体挡住。z、x 都按符号往身体外推。
      const zSide = pointPos.z >= 0 ? 1 : -1;
      const xSide = Math.abs(pointPos.x) > 1.5 ? (pointPos.x >= 0 ? 1 : -1) : 0;
      const cameraOffset = new THREE.Vector3(
        xSide * 6,            // 偏向穴位所在水平侧（避开身体中线遮挡）
        pointPos.y + 3,       // 略高于穴位，俯视
        zSide * 10            // 从穴位所在的前/后侧看
      );

      gsap.to(camera.position, {
        x: pointPos.x + cameraOffset.x,
        y: cameraOffset.y,
        z: pointPos.z + cameraOffset.z,
        duration: 1.5, ease: "power3.inOut"
      });

      gsap.to(controlsRef.current.target, {
        x: pointPos.x, y: pointPos.y, z: pointPos.z,
        duration: 1.5, ease: "power3.inOut",
        onUpdate: () => controlsRef.current.update(),
        onComplete: () => setAnimating(false)
      });
    }
  }, [activePoint, camera, controlsRef, modelInfo, modelReady]);

  // SolidWorks风格鼠标交互：
  // - 左键拖拽：平移画面
  // - 中键/滚轮拖拽：旋转
  // - 滚轮滚动：缩放
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!animating}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,      // 左键平移
        MIDDLE: THREE.MOUSE.ROTATE,  // 中键旋转
        RIGHT: THREE.MOUSE.ROTATE    // 右键也设为旋转（备用）
      }}
      maxDistance={120}
      minDistance={3}
      maxPolarAngle={Math.PI * 0.92}
      minPolarAngle={Math.PI * 0.08}
    />
  );
}

function AcupointNode({ pt, isActive, hasActivePoint, onSelect }) {
  const meshRef = useRef();
  const haloRef = useRef();

  useFrame((state) => {
    if (isActive && haloRef.current) {
       const time = state.clock.elapsedTime;
       const speed = 1.5;
       const scale = 1.0 + (time * speed) % 1.0;
       const opacity = 1.0 - ((time * speed) % 1.0);
       haloRef.current.scale.setScalar(scale * 2.5);
       haloRef.current.material.opacity = opacity;
    }
    if (isActive && meshRef.current) {
       meshRef.current.scale.setScalar(1.6 + Math.sin(state.clock.elapsedTime * 6) * 0.15);
    } else if (meshRef.current) {
       meshRef.current.scale.setScalar(1.0);
    }
  });

  const posX = pt.relativePos ? pt.relativePos.x : pt.x; const posY = pt.relativePos ? pt.relativePos.y : pt.y; const posZ = pt.relativePos ? pt.relativePos.z : pt.z;
  return (
    <group position={[posX, posY, posZ]}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(pt); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[0.35, 16, 16]} /> 
        <meshStandardMaterial
          color={isActive ? "#ff0000" : "#cc0000"} 
          emissive={"#ff0000"}
          emissiveIntensity={isActive ? 2.5 : (hasActivePoint ? 0.1 : 0.8)}
          transparent={true}
          opacity={isActive ? 1 : (hasActivePoint ? 0.25 : 1)}
        />
      </mesh>
      {isActive && (
        <mesh ref={haloRef}>
           <sphereGeometry args={[0.4, 16, 16]} />
           <meshBasicMaterial color="#ff3b30" transparent={true} opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function TCMModelWithPoints({ scene, activePoint, onSelect, modelInfo, onReady }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const name = (child.name || '').toLowerCase();

        // 隐藏引线(tracer)、文字(Text)、经络(jingluo)、曲线(curve)
        if (name.includes('tracer') || name.includes('text') || name.includes('jingluo') || name.includes('curve') || name.includes('bezier')) {
          child.visible = false;
          return;
        }

        child.material.transparent = false;
        child.material.depthWrite = true;
        child.material.depthTest = true;
        child.material.opacity = 1;
        child.material.alphaTest = 0.5;
        child.material.metalness = 0.1;
        child.material.roughness = 0.8;
        child.material.side = THREE.FrontSide;
        child.material.needsUpdate = true;
      }
    });

    // 计算模型包围盒，自动居中+缩放，让全身都进入视野
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // 目标显示高度（世界单位），据此算缩放
    const targetH = 16;
    const scale = targetH / Math.max(size.y, 0.01);

    // 把模型中心移到原点：position = -center * scale
    // 子节点世界坐标 = (localPos - center) * scale
    modelInfo.scale = scale;
    modelInfo.center.copy(center);
    modelInfo.size.copy(size);
    modelInfo.ready = true;
    setReady(true);
    if (onReady) onReady({ scale, center, size });
  }, [scene, modelInfo, onReady]);

  if (!ready) return null;
  const { scale, center } = modelInfo;

  return (
    <group position={[-center.x * scale, -center.y * scale, -center.z * scale]} scale={scale}>
      <primitive object={scene} />
      {acupointsData.map((pt, i) => (
        <AcupointNode key={i} pt={pt} isActive={activePoint?.name === pt.name} hasActivePoint={!!activePoint} onSelect={onSelect} />
      ))}
    </group>
  );
}

function SceneLoader({ modelInfo, onReady, ...props }) {
  const { scene } = useGLTF('./models/human_body.glb');
  useEffect(() => {
    const el = document.getElementById('boot-loading');
    if (el) {
      el.style.transition = 'opacity 0.5s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }
  }, [scene]);
  return <TCMModelWithPoints scene={scene} modelInfo={modelInfo} onReady={onReady} {...props} />;
}

function LoaderFallback() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="text-cyan-400 font-bold text-xl drop-shadow-md">模型加载中...</div>
        <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 transition-all duration-300 rounded-full" style={{ width: progress + '%' }} />
        </div>
        <div className="text-slate-400 text-sm">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// 使用说明组件
function UsageGuide({ isOpen, onToggle }) {
  return (
    <div className={`absolute bottom-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'w-80' : 'w-auto'}`}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white transition-all shadow-lg mb-2"
      >
        <BookOpen className="w-4 h-4" />
        <span className="text-sm">{isOpen ? '收起说明' : '使用说明'}</span>
      </button>

      {isOpen && (
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700 p-4 shadow-2xl max-h-96 overflow-y-auto custom-scrollbar">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" /> 使用说明
          </h3>

          <div className="space-y-4 text-sm">
            {/* 菜单功能 */}
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-1.5"><FolderOpen className="w-4 h-4" /> 穴位分类菜单</h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <List className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>点击左上角 <span className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">☰ 穴位分类</span> 按钮</span>
                </li>
                <li className="flex items-start gap-2">
                  <Hash className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>可选择 <span className="text-cyan-400">按部位</span> 或 <span className="text-cyan-400">按症状</span> 查找穴位</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>点击分类名称展开穴位列表</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>点击穴位名称自动定位并查看详情</span>
                </li>
              </ul>
            </div>

            {/* 搜索功能 */}
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-1.5"><Search className="w-4 h-4" /> 搜索功能</h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>在顶部搜索框输入穴位名称</span>
                </li>
                <li className="flex items-start gap-2">
                  <Hash className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>支持模糊搜索，输入关键词即可</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>从下拉列表选择穴位查看详情</span>
                </li>
              </ul>
            </div>

            {/* 直接点击 */}
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2 flex items-center gap-1.5"><MousePointerClick className="w-4 h-4" /> 直接点击交互</h4>
              <ul className="text-slate-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">●</span>
                  <span>直接点击3D模型上的<span className="text-red-400">红色穴位点</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                  <span>点击后自动定位并显示详情</span>
                </li>
              </ul>
            </div>

            {/* 鼠标操作 */}
            <div>
              <h4 className="text-white font-semibold mb-2 flex items-center gap-1.5"><Mouse className="w-4 h-4" /> 鼠标操作（SolidWorks风格）</h4>
              <ul className="text-white space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5 shrink-0">▨</span>
                  <span><strong>左键拖拽</strong>：平移画面</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5 shrink-0">⟳</span>
                  <span><strong>中键/滚轮拖拽</strong>：旋转视角</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5 shrink-0">⊕</span>
                  <span><strong>滚动滚轮</strong>：缩放视图</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 分类菜单组件
function CategoryMenu({ onSelectPoint, activePoint, isOpen, onToggle }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('body'); // 'body' or 'symptom'

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handlePointClick = (pointName) => {
    const point = acupointsData.find(p => p.name === pointName);
    if (point) {
      onSelectPoint(point);
    }
  };

  const categories = activeTab === 'body' ? bodyPartCategories : symptomCategories;

  return (
    <>
      {/* 菜单切换按钮 - 更明显的提示 */}
      <button
        onClick={onToggle}
        className="absolute top-6 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white transition-all shadow-lg hover:shadow-cyan-500/30 group"
        title={isOpen ? '收起分类菜单' : '展开分类菜单'}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        <span className="text-sm font-medium hidden sm:inline">
          {isOpen ? '收起' : '穴位分类'}
        </span>
        <span className="text-xs text-cyan-400 hidden md:inline">
          {isOpen ? '' : '点击展开'}
        </span>
      </button>

      {/* 菜单面板 */}
      <div className={`absolute top-0 left-0 h-full w-72 max-sm:w-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-20 px-4 h-full flex flex-col">
          {/* 标签切换 */}
          <div className="flex mb-4 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('body')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'body' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> 按部位
            </button>
            <button
              onClick={() => setActiveTab('symptom')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === 'symptom' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Stethoscope className="w-3.5 h-3.5 inline mr-1" /> 按症状
            </button>
          </div>

          {/* 分类列表 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {categories.map(category => (
              <div key={category.id} className="mb-2">
                {/* 分类标题 */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-white font-medium">{category.name}</span>
                    {activeTab === 'symptom' && category.description && (
                      <span className="text-xs text-slate-400 ml-1">({category.description})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                      {category.points.length}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* 穴位列表 */}
                {expandedCategory === category.id && (
                  <div className="mt-1 ml-4 space-y-1">
                    {category.points.map(pointName => {
                      const point = acupointsData.find(p => p.name === pointName);
                      if (!point) return null;
                      const isActive = activePoint?.name === pointName;

                      return (
                        <button
                          key={pointName}
                          onClick={() => handlePointClick(pointName)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${isActive
                            ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/50'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{pointName}</span>
                            {point.efficacy && (
                              <span className="text-xs text-slate-500 truncate ml-2 max-w-[120px]">
                                {point.efficacy.split('，')[0]}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <div className="py-3 px-3 bg-slate-800/50 rounded-lg mb-4">
            <p className="text-xs text-slate-400 text-center">
              <Lightbulb className="w-4 h-4 inline mr-1" /> 点击穴位名称可快速定位并查看详情
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [activePoint, setActivePoint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [dismissedHint, setDismissedHint] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const controlsRef = useRef();

  // 模型变换信息（缩放+中心+尺寸），在模型加载后由 TCMModelWithPoints 填充
  const modelInfoRef = useRef({
    scale: 1,
    center: new THREE.Vector3(),
    size: new THREE.Vector3(),
    ready: false,
  });

  const handleModelReady = useCallback(() => setModelReady(true), []);

  const resetCamera = useCallback(() => {
    setActivePoint(null);
    if (controlsRef.current && modelInfoRef.current.ready) {
      const m = modelInfoRef.current;
      const halfH = (m.size.y * m.scale) / 2;
      const camera = controlsRef.current.object;
      // 复位到能看到全身的距离
      const dist = halfH / Math.tan((camera.fov * Math.PI / 180) / 2) + 2;
      gsap.to(camera.position, {
        x: 0, y: 0, z: dist,
        duration: 1, ease: "power2.inOut"
      });
      gsap.to(controlsRef.current.target, {
        x: 0, y: 0, z: 0,
        duration: 1, ease: "power2.inOut",
        onUpdate: () => controlsRef.current.update()
      });
    }
  }, []);

  // 按 ESC 复位视角
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') resetCamera(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetCamera]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
       setSearchResults([]); return;
    }
    const results = acupointsData.filter(pt =>
       (pt.name && pt.name.includes(searchTerm)) ||
       (pt.text && pt.text.includes(searchTerm)) ||
       (pt.location && pt.location.includes(searchTerm)) ||
       (pt.efficacy && pt.efficacy.includes(searchTerm))
    );
    setSearchResults(results);
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 flex bg-[#0f172a] overflow-hidden font-sans">
      {/* 分类菜单 */}
      <CategoryMenu
        onSelectPoint={(pt) => setActivePoint(pt)}
        activePoint={activePoint}
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      <div className={`absolute top-6 z-50 w-11/12 max-w-md transition-all duration-300 ${isMenuOpen ? 'left-72 ml-4 max-sm:left-4 max-sm:ml-0 max-sm:w-[calc(100vw-2rem)]' : 'left-1/2 -translate-x-1/2'}`}>
         <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-2xl flex items-center px-5 py-3 transition-all focus-within:bg-[#1e293b] focus-within:border-cyan-500">
            <span className="text-cyan-400 mr-3 text-lg">🔍</span>
            <input type="text" placeholder="搜索穴位名称..." className="bg-transparent border-none outline-none text-white w-full placeholder-slate-400 text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (<button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>)}
         </div>
         {searchResults.length > 0 && (
            <div className="mt-3 bg-[#1e293b]/95 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar">
               {searchResults.map((pt, i) => (
                  <div key={i} className="px-5 py-4 hover:bg-cyan-900/40 cursor-pointer text-slate-200 transition-colors border-b border-slate-700/50 last:border-b-0 flex flex-col gap-1" onClick={() => { setActivePoint(pt); setSearchTerm(''); setSearchResults([]); }}>
                     <div className="font-bold text-white text-lg">{pt.name}</div>
                     <div className="text-sm text-slate-400 truncate w-full">{pt.text || '暂无描述信息'}</div>
                  </div>
               ))}
            </div>
         )}
      </div>

      <div className="flex-1 relative min-h-0" style={{ position: 'absolute', inset: 0 }} onPointerMissed={() => setActivePoint(null)}>
        <Canvas style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} camera={{ position: [0, 0, 22], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 20]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-10, 5, 10]} intensity={0.6} color="#cbd5e1" />
          <Environment preset="studio" />
          <Suspense fallback={<LoaderFallback />}>
             <SceneLoader modelInfo={modelInfoRef.current} onReady={handleModelReady} activePoint={activePoint} onSelect={(pt) => setActivePoint(pt)} />
          </Suspense>
          <CameraController controlsRef={controlsRef} activePoint={activePoint} modelInfo={modelInfoRef.current} modelReady={modelReady} />
        </Canvas>
      </div>

      <div className={`absolute top-0 right-0 h-full w-80 md:w-96 max-sm:w-full transition-transform duration-500 ease-out z-40 shadow-2xl pointer-events-auto ${activePoint ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="w-full h-full bg-[#1e293b] border-l border-slate-700 flex flex-col pt-24 px-6 relative">
          <button onClick={() => setActivePoint(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-red-500 text-white transition-colors z-50 cursor-pointer shadow-lg"><X className="w-5 h-5" /></button>
          {activePoint && (
            <div className="animate-fade-in-up mt-4 flex-1 flex flex-col">
              <h2 className="text-4xl font-extrabold text-white drop-shadow-md tracking-wider">{activePoint.name}</h2>
              <div className="h-1 w-20 bg-red-500 my-6 rounded-full"></div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {activePoint.text && (
                  <p className="text-slate-200 text-lg leading-loose break-words whitespace-pre-line mb-4">{activePoint.text}</p>
                )}
                <div className="flex flex-col gap-4 text-sm text-slate-300">
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-cyan-400 font-bold mb-2">📍 穴位精准定位</h3>
                    <p>{activePoint.location || '暂无定位信息'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-yellow-400 font-bold mb-2"><Sparkles className="w-4 h-4 inline mr-1" />日常功效</h3>
                    <p>{activePoint.efficacy || '暂无功效信息'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-green-400 font-bold mb-2"><HandHeart className="w-4 h-4 inline mr-1" />按摩或艾灸手法</h3>
                    <p>{activePoint.massage || '暂无手法信息'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-red-900/50">
                    <h3 className="text-red-400 font-bold mb-2"><TriangleAlert className="w-4 h-4 inline mr-1" />禁忌症与注意事项</h3>
                    <p>{activePoint.contraindications || '暂无禁忌信息'}</p>
                  </div>
                </div>
              </div>
              <div className="pb-8 pt-4">
                {!dismissedHint && (
                  <div className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-sm font-medium flex items-center gap-3" onClick={() => setDismissedHint(true)}>
                    <Pin className="w-5 h-5 text-red-500" />
                    <span>点击背景或右上角关闭面板</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <UsageGuide
        isOpen={isGuideOpen}
        onToggle={() => setIsGuideOpen(!isGuideOpen)}
      />

      {/* 重置视角按钮 */}
      <button
        onClick={resetCamera}
        className="absolute bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white transition-all shadow-lg"
        title="重置视角 (ESC)"
      >
        <Crosshair className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">重置视角</span>
      </button>
    </div>
  );
}
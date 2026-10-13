const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

/**
 * 本轮 UI/UX 与工程结构改造的回归护栏。
 *
 * 这些断言不启动浏览器（浏览器端到端见 tests/browser-smoke.cjs），
 * 专注守护三件最容易在重构中被悄悄改坏的事：
 *   1) 受保护的定位/相机公式与模型处理规则逐字不变；
 *   2) 搜索与数据访问语义不变，且组件不再直接依赖本地 JSON；
 *   3) 设计 token 与无障碍名称保持统一。
 */

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const exists = (p) => fs.existsSync(path.join(__dirname, '..', p));

/**
 * 剥离 JS/JSX 源码中的注释，只保留可执行代码。
 * 用于「禁止 CDN 回落」这类检查：注释里出现 gstatic 等词（例如
 * "不要回退到 gstatic" 的说明）不应被误判为真实依赖。
 */
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // 块注释
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // 行注释（避免误伤 http:// 协议）

/* ---------- 1. 受保护的公式与模型处理 ---------- */

test('相机公式与模型变换规则逐字保留（不改穴位坐标与定位逻辑）', () => {
  const camera = read('source/components/three/CameraController.jsx');

  // 世界坐标 = (relativePos - center) * scale
  assert.match(camera, /\(lx - center\.x\) \* scale/);
  assert.match(camera, /\(ly - center\.y\) \* scale/);
  assert.match(camera, /\(lz - center\.z\) \* scale/);

  // 相机外推：z 取符号、|x| > 1.5 才水平偏移
  assert.match(camera, /pointPos\.z >= 0 \? 1 : -1/);
  assert.match(camera, /Math\.abs\(pointPos\.x\) > 1\.5/);

  // 目标点偏移：xSide*6 / pointPos.y + 3 / zSide*10
  assert.match(camera, /xSide \* 6/);
  assert.match(camera, /pointPos\.y \+ 3/);
  assert.match(camera, /zSide \* 10/);

  // 复位公式：半高 / tan(fov/2) + 2
  assert.match(camera, /halfH \/ Math\.tan\(/);
});

test('模型处理规则保留：目标高度 16、中心归零、隐藏辅助几何体', () => {
  const scene = read('source/components/three/ModelScene.jsx');

  assert.match(scene, /const TARGET_HEIGHT = 16;/);
  assert.match(scene, /scale = TARGET_HEIGHT \/ Math\.max\(size\.y, 0\.01\)/);
  assert.match(
    scene,
    /position=\{\[-center\.x \* scale, -center\.y \* scale, -center\.z \* scale\]\}/
  );

  for (const name of ['tracer', 'text', 'jingluo', 'curve', 'bezier']) {
    assert.ok(scene.includes(`'${name}'`), `应继续隐藏 ${name} 辅助物`);
  }

  // 模型路径与 Draco 解码器均走仓库自托管相对路径（不得回退到 CDN）
  assert.match(scene, /'\.\/models\/human_body\.glb'/);
  const viewer = read('source/components/three/Viewer.jsx');
  assert.match(viewer, /useGLTF\.setDecoderPath\('\.\/draco\/'\)/);
  // 只在代码中检查 CDN 域名（注释里的「不要回退到 gstatic」等说明不算依赖）
  assert.doesNotMatch(
    stripComments(viewer),
    /gstatic\.com|unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/
  );
});

test('投球标记的坐标取用规则保留（relativePos 优先，缺失回退 x/y/z）', () => {
  const node = read('source/components/three/AcupointNode.jsx');
  assert.match(node, /pt\.relativePos \? pt\.relativePos\.x : pt\.x/);
  assert.match(node, /pt\.relativePos \? pt\.relativePos\.y : pt\.y/);
  assert.match(node, /pt\.relativePos \? pt\.relativePos\.z : pt\.z/);
});

/* ---------- 2. 交互映射与数据访问语义 ---------- */

test('鼠标/触控映射为通用习惯，并已同步到使用说明文案', () => {
  const camera = read('source/components/three/CameraController.jsx');
  assert.match(camera, /LEFT:\s*THREE\.MOUSE\.ROTATE/);
  assert.match(camera, /MIDDLE:\s*THREE\.MOUSE\.DOLLY/);
  assert.match(camera, /RIGHT:\s*THREE\.MOUSE\.PAN/);
  assert.match(camera, /ONE:\s*THREE\.TOUCH\.ROTATE/);
  assert.match(camera, /TWO:\s*THREE\.TOUCH\.DOLLY_PAN/);
  // 不再保留 SolidWorks 风格的「左键平移」
  assert.doesNotMatch(camera, /LEFT:\s*THREE\.MOUSE\.PAN/);

  const guide = read('source/components/layout/UsageGuide.jsx');
  assert.match(guide, /左键拖动/);
  assert.match(guide, /右键拖动/);
  assert.match(guide, /单指拖动/);
});

test('搜索谓词与改造前逐字一致（name/text/location/efficacy 的 includes）', () => {
  const repo = read('source/data/repository.js');
  assert.match(repo, /pt\.name\.includes\(term\)/);
  assert.match(repo, /pt\.text\.includes\(term\)/);
  assert.match(repo, /pt\.location\.includes\(term\)/);
  assert.match(repo, /pt\.efficacy\.includes\(term\)/);
  assert.match(repo, /if \(!term \|\| term\.trim\(\) === ''\) return \[\];/);
});

test('UI 组件不再直接依赖本地 JSON，取数统一走 repository', () => {
  const app = read('source/App.js');
  assert.doesNotMatch(app, /acupoints_data\.json/);
  assert.match(app, /from '\.\/data\/repository'/);

  for (const file of [
    'source/components/acupoints/CategoryPanel.jsx',
    'source/components/acupoints/AcupointDetail.jsx',
  ]) {
    assert.match(read(file), /from '\.\.\/\.\.\/data\/repository'/);
  }

  // repository 暴露稳定的数据接口，便于替换为 FastAPI 请求
  const repo = read('source/data/repository.js');
  for (const api of [
    'export async function fetchAcupoints',
    'export function searchAcupoints',
    'export function categoriesFor',
    'export function findPointByName',
    'export function findPointById',
  ]) {
    assert.ok(repo.includes(api), `repository 应导出 ${api}`);
  }
});

/* ---------- 3. 工程结构：巨石文件已拆分 ---------- */

test('App.js 已拆分为编排层，不再内联子组件', () => {
  const app = read('source/App.js');
  assert.ok(app.split('\n').length < 380, 'App.js 应显著变短');

  for (const legacy of [
    'function CameraController',
    'function AcupointNode',
    'function CategoryMenu',
    'function UsageGuide',
    'function TCMModelWithPoints',
  ]) {
    assert.ok(!app.includes(legacy), `App.js 不应再定义 ${legacy}`);
  }

  for (const mod of [
    './components/layout/AppHeader',
    './components/layout/StageToolbar',
    './components/layout/UsageGuide',
    './components/acupoints/CategoryPanel',
    './components/acupoints/AcupointDetail',
    './components/three/Viewer',
    './components/dietary/DietaryPanel',
    './data/repository',
  ]) {
    assert.ok(app.includes(mod), `App.js 应装配 ${mod}`);
  }
});

test('新模块边界齐备', () => {
  for (const file of [
    'source/styles/tokens.css',
    'source/styles/base.css',
    'source/styles/layout.css',
    'source/styles/components.css',
    'source/styles/panels.css',
    'source/data/repository.js',
    'source/hooks/useAcupoints.js',
    'source/hooks/useMediaQuery.js',
    'source/components/ui/index.jsx',
    'source/components/layout/AppHeader.jsx',
    'source/components/layout/StageToolbar.jsx',
    'source/components/layout/UsageGuide.jsx',
    'source/components/acupoints/SearchPanel.jsx',
    'source/components/acupoints/CategoryPanel.jsx',
    'source/components/acupoints/AcupointDetail.jsx',
    'source/components/three/Viewer.jsx',
    'source/components/three/ModelScene.jsx',
    'source/components/three/CameraController.jsx',
    'source/components/three/AcupointNode.jsx',
  ]) {
    assert.ok(exists(file), `缺少模块 ${file}`);
  }
});

/* ---------- 4. 设计系统与无障碍 ---------- */

test('样式入口按层聚合，且不再使用旧深蓝/青霓虹配色', () => {
  const css = read('source/index.css');
  for (const layer of ['tokens', 'base', 'layout', 'components', 'panels']) {
    assert.ok(css.includes(`./styles/${layer}.css`), `index.css 应导入 ${layer}.css`);
  }
  assert.doesNotMatch(css, /@tailwind/);

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(css|jsx|js)$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.join(__dirname, '..', 'source', 'styles'));
  walk(path.join(__dirname, '..', 'source', 'components'));

  const legacy = /#0f172a|#22d3ee|#1e293b|bg-slate-|text-cyan-|rounded-2xl/;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(content, legacy, `${path.relative(process.cwd(), file)} 仍含旧配色/工具类`);
  }
});

test('设计 token 定义了现代东方中医调色板', () => {
  const tokens = read('source/styles/tokens.css');
  for (const token of [
    '--rice-200',
    '--bamboo-600',
    '--ink-900',
    '--cinnabar-600',
    '--stage-950',
    '--header-h',
    '--rail-right-w',
    '--r-md',
  ]) {
    assert.ok(tokens.includes(`${token}:`), `tokens.css 应定义 ${token}`);
  }
});

test('无障碍名称保持稳定（端到端用例依赖）', () => {
  const panel = read('source/components/dietary/DietaryPanel.jsx');
  assert.match(panel, /aria-label="关闭食养面板"/);
  assert.match(panel, /placeholder="搜索食物名称"/);
  assert.match(panel, /role="status"/);

  const anchor = read('source/components/dietary/DietaryAnchor.jsx');
  assert.match(anchor, /aria-label=\{`\$\{target\} · 食养`\}/);

  const detail = read('source/components/dietary/FoodDetail.jsx');
  assert.match(detail, /`← 返回\$\{target\} · 传统食养`/);
  assert.match(detail, /`关联：\$\{relation\.target\} · 定位空间锚点`/);

  const acupoint = read('source/components/acupoints/AcupointDetail.jsx');
  assert.match(acupoint, /label="关闭详情面板"/);

  const search = read('source/components/acupoints/SearchPanel.jsx');
  assert.match(search, /aria-label="搜索穴位"/);
  assert.match(search, /placeholder = '搜索穴位名称\.\.\.'|placeholder = "搜索穴位名称\.\.\."/);

  // 基础组件一律带可访问名称/状态
  const ui = read('source/components/ui/index.jsx');
  assert.match(ui, /aria-label=\{label\}/);
  assert.match(ui, /aria-pressed=\{value === opt\.value\}/);
});

test('食养面板仍按目标过滤关系（3 条原文、古籍折叠、空状态）', () => {
  const panel = read('source/components/dietary/DietaryPanel.jsx');
  assert.match(panel, /relationsForTarget\(target\)/);
  assert.match(panel, /matches\.some\(\(food\) => food\.id === relation\.foodId\)/);
  assert.match(panel, /anchorNotice/);

  const detail = read('source/components/dietary/FoodDetail.jsx');
  assert.match(detail, /<details/);
  assert.match(detail, /<blockquote>\{source\.quote\}<\/blockquote>/);
  assert.match(detail, /<a href=\{source\.url\}/);
});

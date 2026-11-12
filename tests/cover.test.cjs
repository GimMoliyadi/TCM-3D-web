const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

/**
 * 首屏封面的回归护栏。
 *
 * 封面必须在主样式表之前可用，所以只能内联进 HTML —— 这带来两个容易坏的点：
 *   1) 仓库有两个入口（dev.html / index.html），手工维护必然漂移；
 *   2) 层级必须压过 @react-three/drei <Html> 的默认 zIndexRange[0]（16777271），
 *      否则「正在加载 3D 模型 xx%」浮层会盖住封面标题。
 * 这两件事都在这里钉死。
 */

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** drei <Html> 默认 zIndexRange = [16777271, 0]，封面必须严格大于它 */
const DREI_HTML_MAX_Z = 16777271;

const BLOCKS = [
  { name: 'COVER-CSS', open: '/* ==== COVER-CSS:START ==== */', close: '/* ==== COVER-CSS:END ==== */' },
  { name: 'COVER-DOM', open: '<!-- ==== COVER:START ==== -->', close: '<!-- ==== COVER:END ==== -->' },
  { name: 'COVER-JS', open: '/* ==== COVER-JS:START ==== */', close: '/* ==== COVER-JS:END ==== */' },
];

function extract(text, block) {
  const i = text.indexOf(block.open);
  if (i < 0) return null;
  const j = text.indexOf(block.close, i + block.open.length);
  if (j < 0) return null;
  return text.slice(i, j + block.close.length);
}

test('dev.html 与 index.html 的封面三块逐字一致（不允许只改一边）', () => {
  const dev = read('dev.html');
  const idx = read('index.html');
  for (const block of BLOCKS) {
    const a = extract(dev, block);
    const b = extract(idx, block);
    assert.ok(a, `dev.html 缺少 ${block.name} 标记`);
    assert.ok(b, `index.html 缺少 ${block.name} 标记`);
    assert.equal(b, a, `${block.name} 两份不一致 —— 跑 node scripts/sync-cover.cjs 同步`);
  }
});

test('封面 z-index 压过 drei <Html>，且不被免责声明条遮挡', () => {
  // 先剥掉 CSS 注释：注释里为了说明来龙去脉也写了 z-index:10000 / 16777271，
  // 不剥的话正则会先命中注释里的数字，测出来的不是真实生效值。
  const css = extract(read('dev.html'), BLOCKS[0]).replace(/\/\*[\s\S]*?\*\//g, '');
  const m = css.match(/\.cover\{[\s\S]*?z-index:(\d+)/);
  assert.ok(m, '.cover 上找不到 z-index');
  const z = Number(m[1]);
  assert.ok(z > DREI_HTML_MAX_Z, `.cover z-index=${z} 必须 > ${DREI_HTML_MAX_Z}（drei Html 默认上限）`);

  // 封面从免责声明条下方开始铺，而不是 inset:0 压住它
  assert.match(css, /top:var\(--cover-top,/, '.cover 应从 --cover-top 开始（免责声明条下方）');
  assert.doesNotMatch(css, /\.cover\{[\s\S]{0,200}?inset:0/, '.cover 不应再写 inset:0');
});

test('封面高度跟随免责声明条（窄屏会折行，不能写死）', () => {
  const js = extract(read('dev.html'), BLOCKS[2]);
  assert.match(js, /--cover-top/, '启动脚本里应同步 --cover-top');
  assert.match(js, /querySelector\(['"]\.medical-disclaimer['"]\)/, '应量取 .medical-disclaimer 的实际高度');
  assert.match(js, /addEventListener\(['"]resize['"]/, '应监听 resize 重新量取');
});

test('封面兼任加载指示：React 挂载后才允许进入，失败时给出可读提示', () => {
  const dom = extract(read('dev.html'), BLOCKS[1]);
  const js = extract(read('dev.html'), BLOCKS[2]);
  // 初始 disabled，避免模型没准备好就进空舞台
  assert.match(dom, /id="cover-enter"[^>]*disabled/, '进入按钮初始应为 disabled');
  assert.match(js, /btn\.disabled = false/, '挂载完成后应解禁按钮');
  assert.match(js, /childElementCount > 0/, '应以 #root 是否有子节点判断 React 是否挂载');
  assert.match(js, /cover-error/, '超时/报错时应渲染可读提示而不是白屏');
  // 进入后要把封面从 DOM 摘掉，否则它会一直挡住 3D 舞台的交互
  assert.match(js, /removeChild\(cover\)/, '进入后应移除封面节点');
});

test('两个入口都不再残留旧的 .boot-loading 加载层', () => {
  for (const p of ['dev.html', 'index.html']) {
    const html = read(p);
    assert.doesNotMatch(html, /class="boot-loading"/, `${p} 仍残留 boot-loading 容器`);
    assert.doesNotMatch(html, /@keyframes spin/, `${p} 仍残留 boot-loading 的 spinner 样式`);
  }
});

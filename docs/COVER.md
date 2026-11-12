# 首屏封面（TCM ACUPOINT ATLAS）

> 生成时间：2026-10-14　实现：WorkBuddy AI（当前会话）
> 需求原话：「但我要的是为它专门制造一种封面，https://motionforge-studio.app.workbuddy.host/，像这种你看看怎么模仿」
> 经确认：**网站首屏封面**（打开先见一整屏封面，点「进入」才进 3D 穴位图），主标题 **`TCM ACUPOINT ATLAS`**

---

## 1. 它是什么

打开站点 → 先看到一整屏深色封面 → 按钮从「模型加载中」变为「进入图谱」→ 点击 → 封面淡出缩放 → 进入 3D 穴位图谱。

封面**兼任加载指示器**：React 挂载出内容前按钮是 `disabled` 的，所以不会出现「点进去是个空舞台」。
脚本报错 / 资源 404 / 超时，封面直接换成可读的错误面板 —— **不留白屏**。

参考站（motionforge-studio）的取用方式：只借鉴**调性与手法**（深色舞台底、暖色强调、细分网格、呼吸光晕、等宽字体元信息、`cubic-bezier(.22,.61,.36,1)` 缓动），配色改为本项目自己的中医色板。

---

## 2. 设计要点

| 元素 | 处理 |
| --- | --- |
| 主标题 | `TCM ACUPOINT ATLAS`，三词共用**一条**从左到右的连续色带（米白 `#fbf8f4` → 藕荷 `#f1cbba` → 朱砂橙 `#e07a58` → 深朱 `#c44f30`） |
| 字号 | `min(100px, 6.2vw, calc((100vw - 56px) / 10.6))` —— 用数学约束保证 16 个字符在任何宽度都放得下 |
| 背景 | 58px 网格 + `radial-gradient` 遮罩淡出 + 三层光晕（朱砂主光 / 竹青副光），7s 呼吸 |
| 色板 | 全部取自 `source/styles/tokens.css`：朱砂 `#c9543f`、竹青 `#6fa08d`、舞台 `#131518`/`#e8eaec`/`#9aa3aa` |
| 动效 | `ck-rise`（上浮+去模糊）逐词错开 0.11s；`ck-fade`、`ck-rule` 展开、`ck-blink` 呼吸 |
| 无障碍 | `role="dialog"` + `aria-label`；`Enter`/`Space` 也能进入；`:focus-visible` 焦点环；`prefers-reduced-motion` 全关动效 |
| 元信息 | 左上 `TCM 3D` 品牌、左下「3D 实时渲染 · 非录制视频」、右下「290 个穴位 / 3D 人体模型 / 药食同源」 |

---

## 3. 两个必须知道的技术坑（都是实测出来的，不是推断）

### 3.1 层级：drei `<Html>` 的 z-index 是 1677 万，不是几十

`Viewer.jsx` 里的「正在加载 3D 模型 xx%」浮层走的是 `@react-three/drei` 的 `<Html center>`。
drei 默认 `zIndexRange: [16777271, 0]`，会给外层 div 打上**内联 z-index**。

实测值：`16409812`（随相机距离变化）。

**所以封面的 z-index 给 9999 会被它压住。** 现在封面上的是 `16777272`（= drei 上限 + 1）。

> 验证方式：CDP 探针在加载卡片自己的矩形内取三个点做 `elementFromPoint`，
> 命中的必须全是封面内的元素（实测 `div.cover-main` / `span.w`）。

### 3.2 免责声明条：`z-index:10000` 且会折行

`source/styles/layout.css` 里 `.medical-disclaimer { z-index: 10000 }` 会盖住 `inset:0` 的封面。

处理方式不是把它藏起来（那是法定声明），而是**让封面从它下方开始铺**：

```css
.cover { position:fixed; left:0; right:0; bottom:0; top:var(--cover-top,34px); z-index:16777272; }
```

`--cover-top` 由启动脚本按 `.medical-disclaimer` 的**实际高度**同步（窄屏会折成 2~3 行，写死必错）：

```js
function syncCoverTop() {
  var d = document.querySelector(".medical-disclaimer");
  if (d) cover.style.setProperty("--cover-top", d.offsetHeight + "px");
}
syncCoverTop();
window.addEventListener("resize", syncCoverTop);
window.addEventListener("load", syncCoverTop);
```

实测：1440×900 → 35px；768×900 → 55px；390×844 → 74px。

---

## 4. 两个 HTML 入口怎么保持一致

封面必须在主样式表之前可用，所以只能**内联进 HTML**。而仓库有两个入口：
`dev.html`（开发/预览）与 `index.html`（GitHub Pages）。手工维护两份必然漂移。

因此以 **`dev.html` 为唯一来源**，用标记块 + 同步脚本做单向同步：

```
/* ==== COVER-CSS:START ==== */ … /* ==== COVER-CSS:END ==== */
<!-- ==== COVER:START ==== -->   … <!-- ==== COVER:END ==== -->
/* ==== COVER-JS:START ==== */  … /* ==== COVER-JS:END ==== */
```

```bash
npm run sync:cover                 # 同步（已挂进 build:pages）
node scripts/sync-cover.cjs --check # 只检查，不一致退出码 1
```

`tests/cover.test.cjs` 会断言两份逐字一致 —— 只改一边会被测试拦下。

**改封面时的正确姿势**：改 `dev.html` → 跑 `npm run sync:cover` → 跑 `npm test`。

---

## 5. 动了哪些文件

| 文件 | 改动 |
| --- | --- |
| `dev.html` | 旧的 `.boot-loading` spinner → 完整封面（CSS + DOM + 启动脚本） |
| `index.html` | 同上（由 `sync-cover` 同步），并指向新构建产物 |
| `scripts/sync-cover.cjs` | **新增**：封面单向同步 |
| `scripts/prepare-pages.cjs` | 修幂等 bug：`#root` 那条 replace 不带守卫，跑第二次会产出 `...};position:relative}` 坏 CSS |
| `package.json` | 新增 `sync:cover`，并把 `sync:cover` 串进 `build:pages` |
| `tests/cover.test.cjs` | **新增**：5 条护栏（两份一致 / z-index 压过 drei / 顶边跟随 / 加载语义 / 无残留旧加载层） |
| `tests/browser-smoke.cjs` | 首屏封面会挡住应用，加「先点进入图谱」（用 `waitFor` 等按钮解禁，不写死 sleep） |

**业务代码零改动。** 证据：构建产物的 JS/CSS hash 全程未变 ——
`dev-BJG19a8g.js` / `dev-BX6rb9Sz.css`，与改封面之前完全一致。

---

## 6. 验证记录

| 项 | 结果 |
| --- | --- |
| `npm test` | **20/20**（原 15 项 + 新增 5 项封面护栏） |
| 封面 vs 加载浮层 | 卡片 `rect=[506,330,250,138]` 存在，其内三点命中**全是封面** |
| 全页最大 z-index | `16777272`，属 `.cover`（改之前是 drei 的 16409812） |
| 免责声明条 | `z-index:10000`，`rect=[0,0,W,35]`，与封面**无重叠** |
| 三档视口 | 1440×900 / 768×900 / 390×844 全部通过，无溢出、无裁切 |
| 点「进入」 | 按钮解禁 → 点击 → `#cover` 从 DOM 移除 → `canvas` 成为最上层元素 |
| 脚本 404 兜底 | 0.5s 内显示「资源加载失败：definitely-404.js」，无白屏 |
| Pages 入口 | `index.html` 同样通过全部断言 |

复现探针：`probe-z.mjs`（工作区 `C:\Users\30858\WorkBuddy AI\2026-10-13-13-39-04\`）。

```bash
node probe-z.mjs <URL> [截图路径] [宽] [高] [enter] [fast]
```

> 探针本身踩过的坑，写下来免得重踩：
> 1. 本机 Clash Verge 是 TUN/全局模式，会劫持 127.0.0.1 —— Chrome 必须加 `--no-proxy-server`，否则导航到 localhost 得到 `ERR_CONNECTION_REFUSED`。
> 2. 固定调试端口会撞 TIME_WAIT，Chrome 会 bind 失败并退化成只监听 `[::1]` —— 改用 `--remote-debugging-port=0` 再读 `DevToolsActivePort`。
> 3. `--window-size` 有约 512px 最小宽度，测 390 必须走 `Emulation.setDeviceMetricsOverride`。
> 4. 「检测浮层出现」和「导出数据」必须是**同一次求值**，分开做会有竞态（上一版就是这么误判的）。

---

## 7. 待办

- [ ] **封面目前只是本地/构建产物就绪，尚未重新发布线上站点**（见 `TODO.md`）。
- [ ] 若想改成「真·整屏、连免责声明条一起盖住」：把 `.cover` 的 `top` 改回 `0` 即可（z-index 已够高）。当前选择保留声明条可见，是为了合规。

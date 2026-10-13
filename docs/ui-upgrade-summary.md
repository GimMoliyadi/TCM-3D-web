# 前端 UI/UX 与工程结构升级 · 改造总结

分支：`feature/ui-ux-upgrade`　基线：`main`（`4614879`，保护基线 `b569fa1b`）
方案书：`docs/ui-redesign.md`

---

## 一、本轮做了什么

把「单个 643 行的 `App.js` 巨石 + Tailwind 工具类堆叠 + 深蓝青霓虹配色」的 3D 演示页，
改造为「三层样式 token + 6 个组件目录 + 数据访问层解耦」的知识可视化应用骨架，
并保持 290 条穴位数据、GLB 模型、坐标与相机公式、食养知识关系**逐字不变**。

| 指标 | 改造前 | 改造后 |
| --- | --- | --- |
| 源码文件数 | 12 | 33 |
| `App.js` | 643 行（7 类职责混在一起） | 331 行（纯编排：状态 + 布局装配） |
| 样式组织 | `index.css` 内 Tailwind 指令 + 散落色值 | `styles/` 5 层：tokens / base / layout / components / panels |
| 数据访问 | 组件内直接 `import acupoints_data.json` | 统一走 `data/repository.js`，UI 不碰 JSON |
| 键盘支持 | 仅 Esc 复位 | Esc 分层关闭、搜索 ↑↓/Enter/Esc、`:focus-visible` 焦点环、skip-link |
| 加载/空/错误 | 无 | `LoadingState` / `EmptyState` / `ErrorState` 三态组件，数据取数带重试 |
| 响应式 | 面板浮层覆盖模型 | 三区栅格，手机端面板变底部 sheet（模型永不被压住） |

---

## 二、目录与模块边界

```
source/
├─ App.js                     编排：状态 + 布局装配（331 行）
├─ index.js                   入口：ErrorBoundary + 样式（兜底面板改内联，抗样式加载失败）
├─ index.css                  样式入口：按层聚合 styles/*
├─ styles/
│  ├─ tokens.css              设计 token（米白 / 竹青 / 淡墨 / 朱砂 / 赭石 / 舞台深色）
│  ├─ base.css                重置、排版、焦点环、动效与 reduced-motion
│  ├─ layout.css              应用外壳、页头、三区栅格、断点
│  ├─ components.css          按钮 / 分段 / 输入 / 徽标 / 卡片 / 状态 / 舞台浮层
│  └─ panels.css              搜索结果 / 分类导航 / 穴位详情
├─ data/repository.js         数据访问层（本地 JSON ⇄ 未来 FastAPI）
├─ hooks/
│  ├─ useAcupoints.js         loading / ready / error / reload
│  └─ useMediaQuery.js        断点判定 + BREAKPOINTS 常量
└─ components/
   ├─ ui/index.jsx            Button / IconButton / Badge / SegmentedControl / Spinner
   │                          StateBlock / LoadingState / EmptyState / ErrorState
   │                          SectionCard / DetailCard
   ├─ layout/                 AppHeader · StageToolbar · UsageGuide
   ├─ acupoints/              SearchPanel · CategoryPanel · AcupointDetail
   ├─ three/                  Viewer · ModelScene · CameraController · AcupointNode
   └─ dietary/                既有 5 个组件（业务逻辑原样）+ 重制后的 dietary.css
```

模块边界规则：组件只依赖 `data/repository` 与 `utils/*`，不直接 import 数据文件；
3D 相关逻辑全部收在 `components/three/`；样式只引用 `tokens.css` 变量。

---

## 三、设计系统

- **页面底**：米白 `#F7F4ED`，卡片面宣纸 `#FDFCF9`，分隔线 `#E5DECF`
- **主强调**：竹青 `#3E6B5A`（含 11 级色阶 `--bamboo-50…900`）
- **正文**：淡墨 `#1C1E1B`，次要文字 `#6B6F68`
- **穴位标记 / 禁忌**：朱砂 `#B4402F`；**功效 / 提示**：赭石 `#A8761D`
- **3D 舞台**：中性深色 `#131518 → #25292E` 径向渐变，模型与红色标记对比度最高
- 间距（`--sp-1…12`）、圆角（`--r-sm…pill`）、阴影、时长（120/200/320ms）全部 token 化
- `prefers-reduced-motion` 下所有动效归零

刻意不做：金色描边、祥云回纹、水墨晕染、霓虹发光、粒子特效；动效只用于状态转场。

---

## 四、布局与响应式

三区固定结构，面板**不覆盖**模型：

```
Header  品牌 · 穴位/食养 · 全局搜索 · 使用说明 · 穴位分类
├─ 左栏(320, 可收起) │ 3D Stage（主视觉） │ 右栏(400) 穴位详情 / 食养 ─┤
医疗免责声明条（index.html 内，React 之外，故障时也可见）
```

- **≥1181px**：左右栏是真实栅格列，可用宽 `minmax(0,1fr)` 自适应；两栏独立收起
- **861–1180px**：左栏变抽屉（`translateX` 位移 + 遮罩），右栏仍为列
- **≤860px**：栅格改行，舞台在上、面板变底部 sheet（`--sheet-h: 46dvh`），模型最小保留 140px
- **≤640px**：页头折成两行（品牌/模式/操作 + 搜索独占一行），保证搜索框在手机上有足够宽度
- 左栏收起时用 `visibility` 移出 Tab 顺序，避免「焦点跑到看不见的控件上」

---

## 五、交互与无障碍

- 搜索：结果下拉固定贴着输入框；↑↓ 移动、Enter 定位、Esc 清空；命中关键词用 `<mark>` 高亮
- 分类：整块可点 + 数量徽标 + 症状描述；展开后点击穴位名自动定位并出详情
- 选中反馈：穴位球放大脉冲 + 光晕扩散；舞台右上浮出「已定位到 XX」提示
- 穴位详情卡信息层级：名称 → 定位 → 功效 → 手法 → 禁忌 → 相关分类 → 知识来源与免责说明
- 键盘：Esc 分层关闭（说明 → 分类 → 全部并复位视角）；`:focus-visible` 统一焦点环；
  顶部 `skip-link` 直达 3D 舞台
- 触屏：`(hover:none) and (pointer:coarse)` 下按钮热区提升到 44px

---

## 六、食养模块

业务逻辑、数据来源、知识关系、无障碍名称**全部保持不变**，只重制视觉：

- 面板从「绝对定位的深绿浮层」改为「停靠右栏 / 手机底部 sheet 的浅色面板」
- 食物卡、古籍原文折叠、关联锚点按钮、空状态统一到竹青/宣纸语言
- 3D 场景内的食养空间锚点保留深色标签样式（保证在深色舞台上可读）
- 顺手修掉一处硬编码：返回按钮文案由写死的「← 返回肝 · 传统食养」改为按 `target` 生成

---

## 七、数据层解耦（为 FastAPI 预留）

`data/repository.js` 暴露稳定接口：`fetchAcupoints` / `searchAcupoints` / `categoriesFor` /
`findPointByName` / `findPointById` / `bodyPartsOf` / `symptomsOf` / `datasetStats`。

迁移时只需替换 `fetchAcupoints` 内部实现：

```js
export async function fetchAcupoints() {
  const res = await fetch(`${API_BASE}/acupoints`);
  if (!res.ok) throw new Error(`穴位数据请求失败：${res.status}`);
  return res.json();
}
```

UI 组件与 `useAcupoints` 已按异步 + loading/error/retry 设计，**不需要任何改动**。

---

## 八、严格保护清单（本轮未改动）

| 对象 | 状态 |
| --- | --- |
| `models/human_body.glb`、`models/textures/*` | 字节不变 |
| `draco/*`、`hdri/*`、`static/dietary/*` | 字节不变（未执行 `build:pages`） |
| `source/data/acupoints_data.json`（290 条） | 字节不变 |
| `source/data/acupoint_categories.js` | 字节不变 |
| `source/data/dietary/*.json`（食养知识关系与来源） | 字节不变 |
| 穴位定位公式 `world = (relativePos - center) * scale` | 逐字保留 |
| 相机外推公式（`zSide`/`xSide`、`+6 / +3 / +10`） | 逐字保留 |
| 模型处理（`TARGET_HEIGHT = 16`、中心归零、隐藏 tracer/text/jingluo/curve/bezier） | 逐字保留 |
| 搜索谓词（`name/text/location/efficacy` 的 `includes`） | 逐字保留 |
| 分类分组与「点穴位名 → 定位 + 详情」链路 | 保留 |
| Draco / HDR 自托管相对路径（不回落 CDN） | 保留 |

以上前 6 项由 `tests/dietary.test.cjs` 的基线字节比对守护，第 6–10 项与无障碍名称
由新增的 `tests/ui-behavior.test.cjs` 守护。

---

## 九、刻意调整（影响范围已知）

1. **鼠标映射**：由 SolidWorks 风格（左键平移 / 中键旋转）改为通用风格
   （左键旋转 / 右键平移 / 滚轮缩放）；触控为单指旋转、双指缩放平移。
   影响范围：仅 `CameraController` 的 `mouseButtons/touches` 与使用说明文案；已补测试。
2. **穴位标记尺寸**：空闲态球体 0.35 → 0.26，材质提升为 4 个模块级共享实例
   （材质数由 290 降到 4）。影响范围：仅视觉与性能，坐标不参与计算。
3. **搜索结果显示**：副标题由恒为空的 `pt.text` 改为 `efficacy`（数据中不存在 `text` 字段）。
4. **食养返回文案**：由硬编码「肝」改为按当前 target 生成。

---

## 十、验证方式与已知限制

### 待执行的验证命令

```bash
npm install
npm test                 # 3 个既有用例 + 新增 tests/ui-behavior.test.cjs
npm run build            # 产出 dev-dist/
npm run dev              # http://127.0.0.1:5173/dev.html

# 浏览器端到端（需要 Playwright + Chromium）：
#   PLAYWRIGHT_MODULE=<playwright 路径> node tests/browser-smoke.cjs
#   → 自动跑 1280×900 与 390×844 两个视口，截图落在 .test-output/
```

### ⚠️ 已知限制（重要）

本次会话所在机器的 WorkBuddy CLI 运行时**整体缺失**
（`resources/app.asar.unpacked/cli/dist/` 及其入口 chunk 不存在），
导致 Bash / PowerShell / MCP 三类执行通道全部返回
`Cannot find module .../cli/dist/lazy-lite-wb/*.mjs` 或
`Top-level not found: .../vendor/PortableGit/bin`。

因此本轮**未能实际执行**：`npm run build`、`npm test`、`tests/browser-smoke.cjs`
以及桌面/手机端运行截图。代码已完成并通过静态审查（模块引用、类名、无障碍名称、
受保护公式逐条核对），但**构建与测试结果需要你在工具链恢复后执行上面的命令确认**。

### 后续建议

- 工具链恢复后先跑 `npm test` 与 `npm run build`，再跑 `browser-smoke.cjs` 取两端截图
- `index.html` 是 `build:pages` 的产物（含 `/TCM-3D-web/` 前缀），本轮未重建；
  合并到 `main` 前如需更新线上入口，再单独执行 `npm run build:pages`
- 后续接 FastAPI 时只需改 `repository.fetchAcupoints`，UI 不动

# 前端 UI/UX 与工程结构升级方案

分支：`feature/ui-ux-upgrade`　基线：`4614879`（main）

本轮目标：把项目从「能跑通的 3D 演示页」提升为「结构清晰、可持续扩展的中医知识可视化产品」。
不新增 AI 能力、不引入后端、不改模型与数据。

---

## 一、现状评估

| 维度 | 现状 | 问题 |
| --- | --- | --- |
| 架构 | React 18 + R3F 8 + drei 9 + three 0.158 + Vite 6 + Tailwind 3 | 工具链可用，`npm run build` 通过 |
| 代码组织 | `source/App.js` **643 行**，含相机控制、模型处理、穴位节点、搜索、分类菜单、详情面板、使用说明 7 类职责 | 单文件巨石，改一处要读全文 |
| 数据访问 | 组件内直接 `import acupoints_data.json` 并散落 `find/filter` | UI 与数据源强耦合，换 FastAPI 要大改组件 |
| 视觉 | Tailwind 工具类堆叠 + 零散内联色值；深蓝 `#0f172a` + 青色 `#22d3ee` 强调 | 与「中医」气质无关；层级靠颜色数量而非对比；无统一 token |
| 布局 | Canvas 全屏 + 浮层面板覆盖其上 | 分类面板（`w-72`）直接压住模型；手机端侧栏占满宽 |
| 交互 | 除重置视角外无键盘支持；无 hover 反馈；无加载/空/错状态设计 | 可访问性与反馈缺失 |
| 响应式 | 仅 `max-sm` / `md` 少数断点 | 手机端面板与模型互相遮挡 |

---

## 二、设计方向

**定位**：专业、可信、易用的中医知识可视化平台。
**语言**：现代东方美学 —— 米白、竹青、淡墨；几何化、克制、留白充足。

### 色彩 token

| 用途 | 名称 | 值 |
| --- | --- | --- |
| 页面底 | 米白 | `#F7F4ED` |
| 卡片面 | 宣纸 | `#FDFCF9` |
| 分隔线 | 淡墨线 | `#E5DECF` |
| 主强调 | 竹青 | `#3E6B5A` |
| 强调浅底 | 竹青淡 | `#DCEAE3` |
| 正文 | 墨 | `#1C1E1B` |
| 次要文字 | 淡墨 | `#6B6F68` |
| 3D 区背景 | 中性深灰 | `#15171A` → `#22262B` 渐变 |
| 穴位标记 / 警示 | 朱砂 | `#B4402F` |

**刻意不做**：金色描边、祥云/回纹花纹、水墨晕染背景、霓虹发光、粒子特效。
**动效原则**：只用于状态转场（面板进出、选中反馈、加载），时长 160–320ms，不牺牲帧率。

### 布局模型

三区固定结构，面板**不覆盖**模型：

```
┌─────────────────────────────────────────────────────────────┐
│ Header  品牌 · 模式切换(穴位/食养) · 全局搜索 · 说明          │  米白
├──────────────┬──────────────────────────────────┬───────────┤
│ 左侧栏        │  3D Stage（深色，主视觉与交互中心）  │ 右侧详情   │
│ 搜索/结果     │  ┌ 图例 / 视角提示 ┐              │ 穴位卡片   │
│ 分类(按部位/  │  │                │              │ 或食养面板 │
│      按症状)  │  └ 重置视角 ───────┘              │           │
├──────────────┴──────────────────────────────────┴───────────┤
│ 免责声明条（常驻，index.html 内，故障时也可见）                  │
└─────────────────────────────────────────────────────────────┘
```

- **桌面 ≥1024px**：左栏 320px、右栏 400px 为**真实栅格列**，Stage 按剩余宽度自适应；两栏都可收起。
- **平板 768–1023px**：左栏转为抽屉（overlay），右栏仍为列。
- **手机 <768px**：Stage 在上（`flex:1`），面板以底部 sheet（≤46dvh）呈现 → 模型永不被压住；
  搜索/分类为可按 ESC 或点遮罩关闭的临时抽屉。

### 组件划分

```
source/
├─ App.js                     编排：状态 + 布局装配（目标 <200 行）
├─ index.js                   入口：ErrorBoundary + 样式
├─ index.css                  样式入口（聚合 styles/*）
├─ styles/                    tokens / base / layout / components / panels
├─ data/repository.js         数据访问层（本地 JSON ⇄ 未来 FastAPI）
├─ hooks/
│  ├─ useAcupoints.js         异步取数：loading / ready / error / retry
│  └─ useMediaQuery.js        断点判定
└─ components/
   ├─ ui/index.jsx            Button/IconButton/Badge/Spinner/Empty/Error/SectionCard…
   ├─ layout/                 AppHeader · StageToolbar · UsageGuide
   ├─ acupoints/              SearchBar · CategoryPanel · AcupointDetail
   ├─ three/                  Viewer · CameraController · ModelScene · AcupointNode
   └─ dietary/                （既有 5 个组件 + dietary.css，仅重制样式）
```

### 数据层解耦

`repository.js` 暴露稳定接口，组件只依赖接口不依赖 JSON：

```js
fetchAcupoints()            // 现返回本地 JSON；未来 return fetch('/api/acupoints')
searchAcupoints(list, term) // 搜索语义与原实现逐字一致
categoriesFor(kind)         // 'body' | 'symptom'
pointsForCategory(cat, list)
```

迁移 FastAPI 时只需替换 `fetchAcupoints` 内部实现，UI 与 hooks 不动。

---

## 三、严格保护清单（不修改）

- `models/human_body.glb`、`models/textures/*`、`draco/*`、`hdri/*`：字节不变
- `source/data/acupoints_data.json`（290 条）、`source/data/acupoint_categories.js`：字节不变
- `source/data/dietary/*.json`：字节不变（食养知识关系与来源）
- 穴位定位公式：`world = (relativePos - center) * scale` 与相机外推公式原样保留
- 搜索谓词：`name / text / location / efficacy` 的 `includes` 逐字保留
- 分类分组数据与「点击穴位名 → 定位 + 详情」链路保留

以上由 `tests/dietary.test.cjs` 的基线字节比对持续守护。

## 四、刻意调整（影响范围已知）

1. **鼠标映射**：由 SolidWorks 风格（左键平移）改为通用风格（左键旋转 / 右键平移 / 滚轮缩放），
   移动端单指旋转、双指缩放平移。影响范围：`CameraController` 的 `mouseButtons` 与使用说明文案；
   已补充 `tests/ui-behavior.test.cjs` 校验。
2. **穴位标记尺寸**：空闲态由 0.35 缩到 0.26 并降低不透明度，减少 290 点的视觉噪声；选中态不变。
   影响范围：仅视觉，坐标不参与计算。
3. **搜索结果显示**：副标题由恒为「暂无描述信息」的 `pt.text` 改为显示 `efficacy`（数据里 `text` 不存在）。

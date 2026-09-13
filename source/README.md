# source/ —— 还原出来的项目源码

这个目录**不参与线上部署**（GitHub Pages 只认仓库根目录的 `index.html` / `static/` / `models/` 等），
它的作用是让这个项目**以后还能被修改和重新构建**。

## 为什么会有这个目录

这个仓库此前**只有构建产物**，没有 `src/`、没有 `package.json`。
后果是：一旦线上出问题（比如 2026-09-13 那次整页白屏），除了硬啃压缩后的
`static/js/main.*.js`，没有任何正常途径可以修改代码。

本目录的文件是从 `static/js/main.ae2dba28.js.map` 的 `sourcesContent` 字段
**逐字还原**出来的原始源码（source map 里内嵌了完整的源码文本），
`data/acupoints_data.json` 则是从 bundle 里的 `JSON.parse('...')` 提取的。
**内容与原始源码一致，但请把它当作"存档"而非"已验证可构建的工程"。**

## 文件清单

| 文件 | 说明 |
| --- | --- |
| `App.js` | 主组件，618 行。包含场景、穴位点、搜索、分类菜单、详情面板等全部逻辑 |
| `index.js` | 入口，`createRoot(...).render(<App/>)` |
| `index.css` | Tailwind 指令 + 自定义样式（`custom-scrollbar` / `fadeInUp` 动画） |
| `data/acupoints_data.json` | 290 个穴位数据（id / name / relativePos / location / massage / contraindications / efficacy） |
| `data/acupoint_categories.js` | 部位分类 + 症状分类定义 |

## 依赖版本（从构建产物中实测得到，非猜测）

| 包 | 版本 | 依据 |
| --- | --- | --- |
| react / react-dom | `18.3.1` | bundle 内 `version:"18.3.1"` |
| gsap | `3.15.0` | `main.*.js.LICENSE.txt` 头部声明 |
| three | 版权年份 2010-2023 → r15x 区间 | LICENSE.txt；建议锁 `0.158.x` 附近 |
| @react-three/fiber | 与 three r15x 配套的 v8.x | 需实测 |
| @react-three/drei | v9.x（含 `Environment` / `useGLTF` / `Html` / `useProgress`） | 需实测 |
| lucide-react | 任意近期版本 | 仅用到图标 |
| tailwindcss | v3（用了 `@tailwind` 三指令 + `content` 扫描） | `index.css` |
| react-scripts | v5（CRA，产物含 `asset-manifest.json`） | 产物结构 |

## 重新构建的步骤（未实测，请自行验证）

```bash
# 1. 建工程
npx create-react-app tcm-3d
cd tcm-3d

# 2. 装依赖（版本对齐上面的表）
npm i three@0.158 @react-three/fiber@8 @react-three/drei@9 gsap@3.15.0 lucide-react
npm i -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# 3. 把本目录的 App.js / index.js / index.css / data/ 放进 src/

# 4. tailwind.config.js 的 content 至少要覆盖 src 下的 js：
#    content: ["./src/**/*.{js,jsx}"]

# 5. 构建
npm run build
```

### 构建后必须补回的两件事

`npm run build` 产出的 `index.html` 是干净的 CRA 版本，
**根目录那份 `index.html` 是手工改造过的**，比 CRA 产物多出：

1. 医疗免责声明条（`.medical-disclaimer`）
2. 启动加载层（`#boot-loading`）+ 启动兜底脚本
3. 资源 `preload`（glb / hdr / draco）
4. `body` 的 flex 列布局（避免 `#root` 顶着 100vh 被挤出视口）

覆盖 `index.html` 前请对照仓库根目录的版本，别把这些改动丢掉。

### 另外要注意

- `public/` 下需要放 `draco/`（Draco 解码器）、`hdri/studio_small_03_1k.hdr`、
  `models/human_body.glb` 与 `models/textures/`。
  **这些已经在仓库根目录了，`npm run build` 不会删除它们，但请勿用 `build/` 整体覆盖仓库根目录。**
- 线上使用的是**相对路径** `./draco/` 和 `./hdri/`（相对当前页面），
  所以资源必须与 `index.html` 同级放置。
- `models/human_body.glb` 是**修复过的版本**，不要用旧的备份文件覆盖它。
  详见仓库根目录 `README.md` 的修复记录。

## 已知的源码与线上产物的差异

线上 `main.ae2dba28.js` 在源码基础上做过两轮补丁（改的是压缩产物，不是源码）：

1. 把第三方 CDN 地址改成自托管：`gstatic.com/draco/...` → `./draco/`，
   `raw.githack.com/.../hdri/` → `./hdri/`
2. 加了一层全局 ErrorBoundary（渲染失败时显示可读的错误面板而不是白屏），
   并把 `<Environment>` 隔离进自己的 Suspense + 错误边界

**如果按本目录重新构建，这两项需要改回源码里**（源码里目前还是旧写法）：

- `App.js` 第 551 行：`<Environment preset="studio" />` 在 `<Suspense>` **外面**，
  建议包一层 `<Suspense fallback={null}>` 和错误边界
- `index.js`：`<App/>` 外面建议包一个 ErrorBoundary
- 入口处建议加 `useGLTF.setDecoderPath('./draco/')`，不要依赖 Draco 的默认 CDN 地址

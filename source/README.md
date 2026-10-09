# `source/` 源码维护说明

`source/` 是当前唯一可维护的 React/Vite 应用源码。Vite 根目录指向 `source/`，因此 `source/index.html` 是唯一开发模板；它保留免责声明、启动加载层、资源预加载和脚本失败兜底。根目录 `index.html`、`static/` 与 `asset-manifest.json` 是当前 GitHub Pages 快照，本阶段不直接编辑。

## 开发与构建

```bash
npm ci
npm run dev
# http://127.0.0.1:5173/

npm test
npm run build
# 输出 dist/index.html、打包资源及运行时模型资源
```

不要重新创建 CRA 工程，也不要把构建结果复制回仓库根目录。`npm run build` 通过 `vite.config.mjs` 生成独立 `dist/`，以相对路径引用资源，并复制根目录的 `models/`、`draco/`、`hdri/`；开发服务器只映射这些明确的资源目录。构建配置会写入 `.nojekyll`，但不会替代 Pages 快照。

## 主要文件

| 路径 | 作用 |
| --- | --- |
| `index.html` | 唯一 HTML 模板，含启动与错误兜底 |
| `index.js` | React 入口与顶层错误处理 |
| `App.js` | 模式、搜索、分类、详情、3D 场景与食养接线 |
| `index.css` | Tailwind 指令与页面布局样式 |
| `data/acupoints_data.json` | 原始 290 条穴位记录；坐标来源 |
| `data/acupoint_categories.js` | 分类定义与分类显示规则 |
| `components/dietary/` | 食养锚点、面板、食物详情与来源展示 |
| `utils/acupointCatalog.mjs` | 目录解析、模型节点过滤与缺失分类引用报告 |

穴位的原始数据、坐标、模型节点名称和相机定位关系是受保护边界。当前工程将 7 个模型节点从展示层排除，得到 283 条候选记录；这不是医学验证数量。21 个分类组的引用中，有 75 个不同名称未匹配到现有定位记录，保持待补充状态，不猜测别名或侧别。任何数据修订都应先补来源并更新保护测试。

食养内容复用已有穴位锚点，不新增人体坐标或因果关系。古籍摘录、来源状态和免责声明应与展示数据分开维护，详见 [食养开发历史记录](../docs/dietary-development.md) 与 [升级规划](../docs/upgrade-plan.md)。

## 资源与兼容性

运行时资源使用当前页面的相对路径：`./models/`、`./draco/`、`./hdri/`。不要恢复第三方 CDN，也不要手工修改 GLB 二进制；如模型资源确需变更，应使用可验证的 glTF 工具并运行完整资源保护与浏览器检查。Three、React Three Fiber、Drei 的版本组合按 `package.json` 锁定，升级需要单独做兼容性回归。

浏览器回归先执行 `npx playwright install --with-deps chromium`，再运行 `npm run test:browser`；已有 Chromium 可通过 `CHROMIUM_PATH` 指定。完整本地门禁是 `npm run check`。CI 在 PR 中只执行检查，主分支通过检查后发布 `dist/` 到 Pages；不包含后端部署。见 [部署说明](../docs/deployment.md)。

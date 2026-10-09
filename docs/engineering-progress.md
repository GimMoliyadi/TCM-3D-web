# 工程阶段进度：统一基线与数据引用修复

> 下文是第一阶段完成时的验收快照。当时尚未发布；之后用户已授权网站上线，后续流程见 [部署与回退](deployment.md)，不要把本页的历史“未部署”状态当成当前发布配置。

验收日期：2026-10-09（Asia/Shanghai）。本阶段在隔离工作树 `C:\Users\30858\.codex\worktrees\tcm-engineering-data\TCM-3D-web` 中完成，基于远端固定提交 `4614879bc908b0b00b8ef4cf52cb2c3e8ec4df17`。

原文件夹 `C:\Users\30858\Desktop\TCM-3D-web` 的本地草稿已备份到 `C:\Users\30858\AppData\Local\codex-backups\TCM-3D-web\20261008-221719`（ZIP、manifest、Git 状态）；最终比对 336 个备份文件，全部保持原样。`_src/` 与小程序草稿暂不自动迁入本工程。

本阶段只做工程入口、资源引用、数据边界和检查门禁的统一，不切换 GitHub Pages，不接入后端，不修改模型二进制、穴位坐标或相机定位逻辑。

## 已完成

- `source/` 成为唯一可维护的 React/Vite 源码，`source/index.html` 成为唯一 HTML 模板。
- `vite.config.mjs` 统一开发与构建入口：输出 `dist/index.html`，使用相对资源路径，安全映射 `models/`、`draco/`、`hdri/`，并写入 `.nojekyll`。
- 移除会覆盖根入口的旧 `dev.html` 与 `prepare-pages` 流程；根 `index.html`、`static/`、`asset-manifest.json` 保留为当前 Pages 快照。
- 保留免责声明、启动加载层、资源失败兜底和食养组件；增加分类标签遮挡与手机搜索遮挡的最小 UI 修复。
- 保留原始 290 条数据、坐标和相机关系；过滤 7 个模型节点后得到 283 条展示候选，这不是医学验证数量。21 个分类组已解析，75 个不同的缺失引用名称不自动映射，数据文件本身未改写。
- Node 基线统一为 `24.14.0` / npm `11.9.0`；Drei 固定为与 Three `0.158.0` 兼容的 `9.88.17`，Vite `6.4.4` 与 PostCSS `8.5.29` 保留。
- 增加只检查、不部署的 CI：`npm ci`、单元测试、构建、Chromium 安装和浏览器冒烟测试；权限为 `contents: read`。

## 尚未完成或待专项

- 根 Pages 快照尚未切换，未推送，未部署；`dist/` 只作为候选构建输出。
- FastAPI、SQLite、业务 API、后端持久化与后端部署均未接入。
- 实体 Android/iOS 触摸、真实移动网络、长期缓存、国内运营商访问和生产监控尚未完成验证。
- 依赖审计未清零：完整审计为 10 条（7 high、3 moderate）；生产范围（`--omit=dev`）为 3 条（2 high、1 moderate），留待专项核查。候选扫描暂时归零不能替代最终生产结论。

## 阶段验收记录

| 检查 | 状态 | 证据或说明 |
| --- | --- | --- |
| `npm ci`（Node 24.14.0 / npm 11.9.0） | 已通过 | 安装 171 个 packages；依赖树检查正常 |
| `npm test` | 已通过 | 干净安装后复跑，8 个单元/数据检查全部通过；无 Git 历史依赖 |
| `npm run build` | 已通过（有告警） | 生成候选 `dist/`；JS 约 1,303.47 kB、gzip 约 366.16 kB，Vite 报 chunk 大于 500 kB |
| 浏览器运行环境 | 已验证 | 本机使用系统 Chrome，由 `CHROMIUM_PATH` 指定；没有运行 Chromium 下载命令。CI 配置包含浏览器安装步骤，但未远端执行 |
| `npm run test:browser` | 已通过 | 桌面 1280×900、手机 390×844、`/TCM-3D-web/` 子路径；无 pageerror、requestfailed、HTTP 4xx；故障回退三项通过。详情见 `.test-output/browser-results.json` |
| Pages/线上切换 | 未执行 | 本阶段明确不部署 |
| 远端 CI | 未执行 | 仅在工作树写入检查定义，尚未提交或推送，不能写作 CI 已通过 |

浏览器回归还覆盖食养三卡、原文展开、空结果、关闭重开、搜索肝俞、分类计数等流程；桌面 Canvas 约 `920×869.8125`、侧栏 `360`，手机 Canvas 约 `390×404.078125`、面板约 `371.359375`。这些结果证明当前候选构建的交互链路，不构成医学内容或生产网络可用性的验证。

阶段完成后的生产动作仍需单独授权：先审阅 `dist/`、保留根 Pages 快照和回滚材料，再决定是否进入部署候选。

ChatGPT 网页协作连接尚未完成首次隧道方式选择；本阶段结论来自本地检查、浏览器回归与子代理复核，没有声称已取得 ChatGPT 网页审查意见。

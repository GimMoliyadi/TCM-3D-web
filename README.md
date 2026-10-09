# TCM 3D Acupoints

一个用于查看中医穴位的 React + Three.js 3D 学习与知识可视化网页。用户可以旋转、缩放人体模型，搜索或按分类查找穴位，并查看位置、说明与食养知识。

线上现有入口：<https://gimmoliyadi.github.io/TCM-3D-web/>

## 当前工程基线

当前开发源代码位于 `source/`，Vite 的唯一 HTML 模板是 `source/index.html`。开发服务器与构建入口均使用这套源码：

```bash
npm ci
npm run dev
# 打开 http://127.0.0.1:5173/

npm test
npm run build

# 首次运行浏览器回归前安装 Chromium
npx playwright install --with-deps chromium
npm run test:browser

# 完整本地门禁：unit test + build + browser smoke
npm run check
```

基线版本是 Node `24.14.0`、npm `11.9.0`（见 `.node-version`、`package.json`）。浏览器测试也可以通过 `CHROMIUM_PATH` 指向已有的 Chromium；CI 会自行安装 Chromium。`npm run check` 不负责安装浏览器。

`npm run build` 输出独立的 `dist/index.html` 及其资源，并复制 `models/`、`draco/`、`hdri/` 和 `.nojekyll`。GitHub Actions 在主分支的测试、构建及浏览器回归通过后，将 `dist/` 发布到现有 GitHub Pages 网址；PR 只执行检查。仓库根目录的 `index.html`、`static/` 与 `asset-manifest.json` 保留为旧版回退快照，构建不覆盖它们。`build:pages` 只执行本地构建。具体配置和回退步骤见 [部署说明](docs/deployment.md)。

## 已保留的功能与数据边界

- 3D 人体模型、Draco 解码器、HDR 与纹理使用仓库内资源，相对路径适用于 GitHub Pages 子路径。
- 原始穴位 JSON 仍保留 290 条记录、坐标及相机定位逻辑。
- 当前有 21 个分类组和 283 条展示候选记录；7 个模型节点被过滤。分类引用中有 75 个不同名称未匹配到现有定位记录，显示为待补充，不自动猜测别名或侧别。283 不是经过医学验证的独立标准穴位数量。
- 搜索、分类、定位、详情、食养阅读、加载提示和错误兜底继续由源码维护。
- 页面免责声明仅作学习与健康科普提示，不能替代诊断、治疗或医生建议。

当前静态工程没有 FastAPI、SQLite、运行时业务 API 或后端部署配置。是否接入后端、知识来源管理和公开部署方案记录在 [升级规划](docs/upgrade-plan.md) 中。

## 目录与变更规则

```text
source/                 # 唯一可维护的 React/Vite 源码与数据
source/index.html       # 唯一 HTML 模板，含免责声明、启动提示和资源预加载
models/ draco/ hdri/    # 运行时 3D 资源
dist/                   # 本地 Vite 构建输出，不作为根 Pages 快照
index.html static/      # 当前 Pages 快照，未经发布流程不要手工改写
tests/                  # 数据保护、单元和浏览器冒烟测试
docs/                   # 审计、升级与阶段记录
```

不要直接编辑压缩后的 `static/js`，不要手工修改 GLB 二进制，也不要为修复一个分类或展示问题复制第二份穴位坐标。请先修改 `source/`，再通过构建检查结果。

相关文档：

- [工程阶段进度](docs/engineering-progress.md)
- [部署与回退](docs/deployment.md)
- [完整审计与升级规划](docs/upgrade-plan.md)
- [源码维护说明](source/README.md)
- [历史食养开发记录](docs/dietary-development.md)
- [历史 Pages 发布记录](docs/pages-publication.md)

## 素材署名

人体基础模型据仓库 [模型许可](models/license.txt) 标注，基于 [Base Mesh](https://sketchfab.com/3d-models/base-mesh-b93d00ae142449c8860ef79755a1c66c)，作者 [Navirobot](https://sketchfab.com/Navirobot)，许可为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，经过格式与展示适配。网站页脚保留署名；各素材许可不代表整个代码仓库采用同一许可。

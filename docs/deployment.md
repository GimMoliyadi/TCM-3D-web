# 网站部署与回退

正式访问地址：https://gimmoliyadi.github.io/TCM-3D-web/

当前应用是纯静态 React + Three.js 网站，由现有 GitHub Pages 托管。此次不购买云服务器或域名，不新增 FastAPI、SQLite、账号系统或后台管理。上线授权覆盖本次源码、构建检查和 Pages 发布；原本地工作目录中的 CRA 与小程序草稿不混入发布。

## 发布流程

`.github/workflows/ci.yml` 同时负责验证和发布：

1. PR 和分支推送执行 `npm ci`、8 项单元/资源保护测试、Vite 构建和 Playwright 浏览器回归。
2. 只有 `main` 的推送或在 `main` 手动运行工作流，才上传通过验证的 `dist/` 为 Pages artifact。
3. 发布 job 等待验证完成，以 `pages: write` 和 `id-token: write` 权限部署；PR 无发布权限。
4. 发布后核对线上 HTML 引用的 JS/CSS 与构建结果，检查模型、纹理、Draco、HDR 请求，并复验桌面和手机交互。

仓库 Pages 发布来源需要设为 **GitHub Actions**（REST API 的 `build_type: workflow`），而不是 `main /` 的旧分支发布方式。切换来源时保留 HTTPS 和现有网址。官方说明：[Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

`npm run build` 与 `npm run build:pages` 都只生成本地 `dist/`，不会单独发布。以后通过经审查的 PR 更新 `main` 即可触发验证和发布；失败的验证不会进入发布 job。

## 当前保护与限制

- 原始 290 条数据、模型二进制、纹理和相机公式保持不变；283 条仅为展示候选，75 个未匹配分类名称标为待补充。
- 3D 基础模型的作者、来源、许可显示在页脚；原始许可文件继续随资源发布。
- 生产依赖仍有 3 项审计告警（Drei 及其 lodash.pick/uuid 依赖链），需独立修复兼容性；此次不为消除告警强行升级 Three.js。
- 主包约 1.3 MB，构建保留体积告警。真实手机触摸、运营商网络和中国大陆访问稳定性仍需实际验证。
- GitHub Pages 不能运行 FastAPI，也不提供 SQLite 写入服务；未来确有动态业务需求时再评估服务器。

## 回退

根目录 `index.html`、`static/` 和 `asset-manifest.json` 保留固定提交 `4614879bc908b0b00b8ef4cf52cb2c3e8ec4df17` 对应的旧版页面，资源保护测试确保它们没有被构建覆盖。

如果本次部署异常，可把 Pages 来源恢复为 **Deploy from a branch → main → /(root)**（REST API 的 `build_type: legacy` 与 `source: {branch: main, path: /}`），触发旧静态入口发布，并复查网址与 3D 资源。无需删除网站、修改 GLB、重写 Git 历史或强制推送。

后续 Actions 版本发生问题时，优先用正常的 revert PR 撤回具体改动，重新通过检查并发布；保留问题版本和最后成功版本的提交及工作流记录。

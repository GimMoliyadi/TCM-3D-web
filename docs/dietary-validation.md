# 验收记录

基线：`b569fa1b52a8cef4329a6e801564ce5fce580ac7`。

| 检查 | 结果 |
| --- | --- |
| `npm run build` | 通过。输出只在 dev-dist；Three 相关主包约 1.30 MB，Vite 提示 chunk 大于 500 KB，未作为失败。 |
| `npm test` | 3/3 通过：保护资产逐字节检查、来源/关系/锚点完整性、坐标与数据分离。 |
| 模型与穴位 | models、290 条穴位原 JSON、分类原文件、模型变换与相机定位公式均未改。 |
| 正式站点 | 根 index.html、static、asset-manifest、draco、hdri 与基线逐字节一致。未部署、未合并 main。 |
| 原文复核 | 三条摘录均在固定仓库提交的实际文件中找到；重新下载后 SHA-256 与 JSON 记录一致。 |
| 桌面 1280×900 | 实际 Chromium/WebGL 加载，食养锚点→3 食物→逐条原文→返回→搜索空结果→反向定位→关闭重开，通过。 |
| 穴位回归 | 桌面搜索肝俞、分类“背部”选择肝俞、详情、ESC；手机尺寸搜索肝俞与详情，通过。 |
| 手机视口 390×844 | 同样完成三条原文和双向交互；Canvas 为 390×472.64，面板 390×371.36，边界相接且不重叠。 |
| JS 异常 | 两种视口 pageerror 均为零。 |

测试使用无头 Chromium 和软件 WebGL。手机结果为浏览器视口模拟，未进行实体 Android/iOS 触摸与性能测试。原有 3D 点点击处理、点位置公式保持原样；本轮直接点击验证的是新增食养标签，原穴位通过搜索与分类验证选择链路。未新增其他五脏入口和配方。

## 复现浏览器流程

先 `npm run build`。测试脚本 `tests/browser-smoke.cjs` 需要 Python 3（本地静态服务器）、Playwright 及 Chromium：

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser-smoke.cjs
```

可选环境变量：`PLAYWRIGHT_MODULE` 指向已安装 Playwright 模块；`CHROMIUM_PATH` 指向已有 Chromium。脚本在本机 5199 端口提供 dev-dist，退出时关闭服务器；截图写入被忽略的 `.test-output/`。服务器不发布到外网。

# TCM 3D Acupoints

一个用于查看中医穴位的 3D 可视化网页。

在线访问：<https://gimmoliyadi.github.io/TCM-3D-web/>

## 项目介绍

TCM 3D Acupoints 希望把常见穴位从平面图片变得更直观。用户可以在 3D 人体模型上旋转、放大、点击穴位，并查看穴位名称、位置和相关说明。

这个项目适合用于中医穴位学习、日常穴位位置参考、健康科普展示和 3D 网页交互演示。

## 主要功能

- 3D 人体模型展示
- 穴位点点击查看详情
- 穴位名称搜索
- 按身体部位分类查找
- 支持旋转、缩放，从不同角度观察穴位位置

## 使用说明

打开网页后，可以直接拖动模型查看不同角度；点击模型上的穴位点，即可查看对应穴位信息。

## 免责声明

本网站内容仅供日常小症状的穴位参考与学习了解，不能代替系统学习中医，也不能代替医院诊断、治疗或医生建议。如有不适，请及时就医。

## 反馈建议

如果你发现穴位信息、位置说明或交互体验有需要改进的地方，欢迎通过 GitHub Issues 提出建议。

---

## 技术说明

### 部署方式

纯静态站点，直接由 GitHub Pages 托管仓库根目录，**不需要构建**：
`index.html` 直接引用 `static/js/main.ae2dba28.js` 和 `static/css/main.2a2c8a65.css`。
改动生效需要等 Pages 缓存刷新（`Cache-Control: max-age=600`，约 10 分钟）。

### 资源全部自托管

页面运行时不请求任何第三方 CDN，所有依赖都在本仓库内：

| 资源 | 路径 | 用途 |
| --- | --- | --- |
| 人体模型 | `models/human_body.glb` + `models/textures/` | 3D 模型与贴图 |
| Draco 解码器 | `draco/` | 解压模型几何数据（模型用了 `KHR_draco_mesh_compression`） |
| 环境光照 | `hdri/studio_small_03_1k.hdr` | `<Environment>` 的 IBL 光照（Poly Haven，CC0） |

> 早前版本依赖 `www.gstatic.com`（Draco）和 `raw.githack.com`（HDR）。
> 前者在中国大陆被墙、后者实测 502，会导致页面**整页白屏**。现已全部改为相对路径自托管。

### 目录结构

```
index.html            # 入口（手工维护，含加载层 / 兜底脚本 / preload）
static/js|css/        # 构建产物
models/ draco/ hdri/  # 自托管资源
source/               # 从 source map 还原的原始源码（不参与部署，仅供以后改代码）
```

### 修复记录

**2026-09-13 —— 整页白屏修复**

`models/human_body.glb` 在上一次提交（把贴图拆成外部文件时）被写坏，叠加两个第三方 CDN 依赖，
导致页面完全空白。共修复 5 个问题：

1. GLB 的 JSON 块用 `NUL` 补齐（规范要求用空格）→ `JSON.parse` 直接抛错
2. 删减 bufferView 后未同步重编号，9 个 mesh 的 Draco `bufferView` 引用越界
3. 所有 bufferView 丢失了 glTF 2.0 必需的 `buffer` 字段
4. `EXT_texture_webp` 留在 `extensionsRequired` 里但已不再使用
5. Draco 解码器与 HDR 走第三方 CDN，且 `<Environment>` 位于 `<Suspense>` 之外、无错误边界

**稳定性加固**

- 加了全局 ErrorBoundary：模型/资源加载失败时显示可读的错误面板和「刷新重试」，
  **不再整页白屏**（`window.__tcmLastError` 可查看具体原因）
- `<Environment>` 隔离进独立的 `Suspense` + 错误边界：HDR 加载慢或失败时
  页面照常可用，只是少了环境光照
- `index.html` 加了启动兜底：脚本报错或资源 404 时给出提示，不留白屏
- 修正免责声明的配色（原为黑字压深蓝底，实际不可见）与 `#root` 被挤出视口导致底部按钮被裁切的问题
- 清理了约 31MB 冗余文件（4 个 `.glb` 备份、2 份旧构建产物及其 source map）

> ⚠️ 以后修改 `models/human_body.glb` 请使用 `@gltf-transform/cli` 等正规工具，
> **不要手写脚本直接改二进制**——上面第 1~4 个问题就是手改产生的。


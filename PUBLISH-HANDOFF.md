# 交接单：用新封面重新发布「中医穴位图谱」

> 交接方：**国际版** WorkBuddy（2026-10-14）
> 接手方：**国内版** WorkBuddy
> 原因：线上域名 `tcm-acupoint-atlas.app.workbuddy.host` 是国内版发布的应用，
> 国际版发不到它上面（国际版只会发到 `*.sg2.agentos-app.run`，是海外链路）。

---

## 一句话任务

把 `C:\Users\30858\WorkBuddy\tcm-site` 这个静态目录**重新发布到已有的应用上**，
让线上 `https://tcm-acupoint-atlas.app.workbuddy.host/` 更新为带首屏封面的版本。

---

## 发布参数

```
directory          = C:\Users\30858\WorkBuddy\tcm-site
action             = deploy
language           = static
entryHtml          = index.html
appName            = 中医穴位图谱
domainPrefix       = tcm-acupoint-atlas
userAskedToPublish = true
```

⚠️ **`directory` 不要改。** 发布工具是「按目录查已有应用」，改目录 = 发到别的应用上
或新建一个应用。要覆盖的就是上面那个域名对应的应用。

## 目标应用

| 项 | 值 |
| --- | --- |
| appId | `wbapp_SbJaLt2P1ZA7iuuzm1873W` |
| 名称 | 中医穴位图谱 |
| 线上域名 | `https://tcm-acupoint-atlas.app.workbuddy.host/` |
| 发布目录 | `C:\Users\30858\WorkBuddy\tcm-site` |
| 发布标记 | `C:\Users\30858\WorkBuddy\tcm\.wbapp_SbJaLt2P1ZA7iuuzm1873W.genie` |

---

## 已经做好的事（不要重做）

`tcm-site` **已经是最新构建，直接发即可**：

- `index.html` 17149 字节，含封面标记 `COVER-CSS:START` / `进入图谱`，**不含**旧的 `boot-loading`
- `assets/dev-BJG19a8g.js`（1,313,555 B）+ `assets/dev-BX6rb9Sz.css`（33,559 B）
- `models/` `draco/` `hdri/` 均已就位

## 发布前自检（三条，10 秒）

```bash
cd /c/Users/30858/WorkBuddy/tcm-site
wc -c index.html                                   # 期望 17149
grep -c 'COVER-CSS:START\|进入图谱' index.html        # 期望 2
grep -c 'boot-loading' index.html                  # 期望 0
```

## 发布后验证

```bash
curl -s https://tcm-acupoint-atlas.app.workbuddy.host/ -o /tmp/live.html
wc -c /tmp/live.html                               # 期望 ≈17149（不再是 3919）
grep -c '进入图谱' /tmp/live.html                    # 期望 ≥1
grep -c 'boot-loading' /tmp/live.html               # 期望 0
```

浏览器打开应看到：深色整屏封面 → 主标题 `TCM ACUPOINT ATLAS` →
按钮「进入图谱」→ 点击后进 3D 穴位图谱。

---

## 同步过来的源码（国内版仓库已更新）

`C:\Users\30858\WorkBuddy\tcm\` 已同步，`npm test` **20/20 通过**（原本 18/20）。
新增/修改：

| 文件 | 说明 |
| --- | --- |
| `dev.html` | 首屏封面（CSS + DOM + 启动脚本） |
| `index.html` | 同上，由 `scripts/sync-cover.cjs` 同步 |
| `scripts/sync-cover.cjs` | **新增**：以 `dev.html` 为唯一来源同步封面到 `index.html` |
| `scripts/prepare-pages.cjs` | 修幂等 bug（`#root` 那条 replace 缺守卫，跑第二次会产出坏 CSS） |
| `tests/cover.test.cjs` | **新增**：5 条封面护栏 |
| `tests/browser-smoke.cjs` | 封面会挡住应用，加「先点进入图谱」 |
| `tests/ui-behavior.test.cjs` | 补上「先剥注释再匹配 CDN 正则」（原缺，导致误报） |
| `tests/dietary.test.cjs` | 补上 git blob 哈希比对版 |
| `docs/COVER.md` | 封面完整设计 + 两个技术坑 + 验证记录 |
| `package.json` | 新增 `sync:cover`，并串进 `build:pages` |

**业务代码零改动**：构建产物 hash 全程未变（`dev-BJG19a8g.js` / `dev-BX6rb9Sz.css`）。

## 改封面时的正确姿势

```bash
# 改 dev.html 里的封面（三块标记之间）→ 然后：
npm run sync:cover     # 同步到 index.html
npm test               # 20 项，含「两份必须逐字一致」的护栏
npm run build          # 产出 dev-dist
```

只改 `index.html` 不改 `dev.html` 会被 `tests/cover.test.cjs` 拦下。

---

## 千万不要

- ❌ 不要改 `directory`（会发到别的应用/新建应用）
- ❌ 不要为了「保险」新建应用 —— 用户手上的分享链接就是这个域名
- ❌ 不要删 `C:\Users\30858\WorkBuddy\tcm\.workbuddy\`（国内版项目记忆）
- ⚠️ 发布很慢属正常：这条链路实测 23 KB/s，JS 主包 1.3 MB 要 **56 秒**，
  glb 1.87 MB 更久。封面已经做了如实提示（「仍在加载… 已等 N 秒」），**慢不等于失败**，
  别把超时当故障去「修」。

---

## 附：国际版误发的应用（已下线）

国际版在交接前误发过一次，生成了另一个应用
（`wbapp_TXY41r2SvB5LDa0MOSJyUP` / `https://2d0f8ff2a7cf40d1b1ecbe53fd594b13.sg2.agentos-app.run`），
**已于 2026-10-14 按用户要求取消发布**，该链接已失效。

它与国内版应用互不影响。

---

## 另一个更快的线上入口：GitHub Pages（已上线）

`https://gimmoliyadi.github.io/TCM-3D-web/` —— 已推送 `main`（`4614879..3331b89`），
内容同样是「UI 升级 + 首屏封面」，浏览器实测通过。

**它比 WorkBuddy 链路快一个数量级**，原因是 WorkBuddy 静态托管**不发 `Content-Encoding`**：

| | WorkBuddy 静态托管 | GitHub Pages |
| --- | --- | --- |
| JS 主包传输 | 1,313,555 B（原样） | 372,673 B（gzip） |
| JS 速度 | 23 KB/s | 220 KB/s |
| GLB 速度 | 未跑完 | 354 KB/s |

两个入口不冲突，国内域名给国内用户，Pages 给海外/备用。

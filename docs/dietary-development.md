# 食养知识层：肝的纵向切片

> **历史文档说明（重要）**：本文记录食养功能最初在 `feature/dietary-nourishment-layer` 分支上的开发与验收事实，文中的 `dev.html`、`dev-dist/`、分支基线和“不发布”约束均属于当时流程。当前工程已统一为 `source/index.html` + Vite `dist/`；请以 [工程阶段进度](engineering-progress.md)、[根目录 README](../README.md) 和 [升级规划](upgrade-plan.md) 作为现行流程。本文后续内容保留原始记录，不作为新的构建或发布指令。

开发分支：`feature/dietary-nourishment-layer`。基线：`b569fa1b52a8cef4329a6e801564ce5fce580ac7`。

## 运行

```sh
npm ci
npm run dev
# 打开 http://127.0.0.1:5173/dev.html
npm test
npm run build
```

构建仅输出 `dev-dist/`，资产复制到输出目录。根目录 `index.html`、`static/`、模型和穴位 JSON 不会被覆盖。没有部署脚本、没有 Pages workflow，本分支不应直接替换正式站点目录。

## 交互与边界

穴位模式保持原搜索、分类、定位及详情。切换食养后从背面定位现有肝俞穴；点击绿色标签打开肝的三条食物卡，点食物展开详情与原文，点“关联：肝”重新定位，支持返回、搜索、空结果与关闭后重开。桌面侧栏分配独立宽度，手机面板占下方 44dvh，Canvas 占上方剩余区域。

只加入肝。坐标只从 `acupoints_data.json` 的 `id=肝俞穴` 读取；标签与原穴位处于同一个父级变换组。没有第二份坐标、器官模型或因果箭头。数据链为 `foodId ↔ relation ↔ anchorAcupointId`。未来新增目标只需关系和已核对来源；不能以空间邻近性证明食物功效。

`source_verified` 仅指已核对仓库电子文本，未做纸本校勘，非现代疗效验证。食物注意事项不补写未经核实的性味、剂量、禁忌。

## 本次来源整理

| 材料 | 检查结果与用途 |
| --- | --- |
| 《食疗本草》 | 卷下“小麦〈平〉”明确记“养肝气”；录入小麦。白鱼条有文本残缺与物种对应问题，暂不采用。 |
| 《饮膳正要》 | 卷第二“五味偏走”明确列粳米、牛肉为传统肝病语境中的宜食之物；分别保留关系，保留共同上下文，不改写为护肝疗效。葵菜现代名称对应未核实，不录入。 |
| 《养老奉亲书》 | 已读取食治材料；以老年人与病证为语境，本轮不抽取普适处方。 |
| 《寿亲养老新书》 | 已读取四时调摄和食治材料；繁体、异体和缺字符号需要进一步校勘，本轮不新增关系。 |
| 《养生随笔》 | 卷五粥谱存在菊花粥等条目，适合作为后续配方—食材关系资料；本轮 recipes 保持空数组。 |
| 药膳食疗参考.md | 仅参考分类方式，不作为任何正式关系的证据。 |
| 《中医饮食营养学》 | 仅用于区分食养（保养）、食疗（治疗语境）、食节（饮食方式）、食忌（宜忌）的框架，不复制正文，不列为古籍证据。 |

以上七份原始材料仅在临时研究目录读取，不提交全文。正式 JSON 只含必要古籍摘录、篇章条目、电子文本 SHA-256、仓库固定提交与行号链接；现代框架来源与古籍证据分开记录。

研究链接：
- https://github.com/jobkoko/tcm-database （实际默认分支 main；用户提供的 master 链接不可直接用作固定来源）
- https://github.com/garychowcmu/daizhigev20
- https://github.com/Lyuyaowei/chinese-medicine/blob/main/references/药膳食疗参考.md
- https://github.com/YuanZHAO321/TCM.Skill

## 文件清单

- 修改：`source/App.js`（模式接线、独立食养相机目标、在原变换组内挂载标签；模型/定位公式未改）；`source/index.js`（恢复可读错误边界）。
- 新增：`source/components/dietary/{DietaryAnchor,DietaryLayer,DietaryPanel,FoodCard,FoodDetail}.jsx`、`dietary.css`。
- 新增：`source/components/SceneErrorBoundary.jsx`、`source/utils/dietaryRelations.js`。
- 新增：`source/data/dietary/{foods,zangfu_relations,dietary_sources,dietary_recipes}.json`。
- 新增开发构建：`package.json`、`package-lock.json`、`vite.config.mjs`、`tailwind.config.cjs`、`postcss.config.cjs`、`dev.html`、`.gitignore`。
- 新增测试及文档：`tests/dietary.test.cjs`、`tests/browser-smoke.cjs`、本文件和验收报告。

源码恢复时同步带回正式产物已存在的本地 Draco/HDR 路径与错误边界，避免恢复后再次依赖第三方 CDN。锁定 React 18、Three 0.158、Fiber 8、Drei 9 的兼容版本。

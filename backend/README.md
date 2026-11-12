# TCM Acupoints Backend

中医穴位数据的 FastAPI + SQLite 后端。

## 数据来源

穴位数据来自本项目前端的 `source/data/acupoints_data.json`（290 条内置数据集）。
后端启动时自动导入到 SQLite，`Cube.*` 占位体和空内容记录会被跳过，实际入库 **283 条**。

> **数据来源未留档**：该 JSON 文件从项目首个提交起就存在，没有采集脚本或上游 URL 记录。
> 见 `/docs/HANDOFF.md` § 数据来源。食养模块（3 条）有完整 GitHub 溯源，穴位数据没有。

## 快速开始

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

打开 http://127.0.0.1:8000/docs 查看交互式 API 文档。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查，返回穴位总数 |
| GET | `/api/acupoints` | 列表，支持 `body_part` / `category` 筛选 + 分页 |
| GET | `/api/acupoints/search?q=` | 关键词搜索，名称命中优先 |
| GET | `/api/acupoints/{id}` | 单条详情（完整字段） |
| GET | `/api/categories` | 按部位分组 |
| GET | `/api/stats` | 数据统计 |

## 数据结构

表 `acupoints`（SQLite）：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | TEXT PK | 穴位标识，如 `百会穴` |
| name | TEXT | 穴位名称 |
| relative_x/y/z | REAL | 3D 模型上的相对坐标 |
| location | TEXT | 体表定位描述 |
| massage | TEXT | 按摩手法 |
| contraindications | TEXT | 禁忌 |
| efficacy | TEXT | 功效 |
| body_part | TEXT | 部位分类（7 类） |
| symptoms | TEXT | 症状分类（14 类） |
| source | TEXT | 数据来源路径 |

### 分类说明

- **部位**（7 类）：头面部 42 / 颈部 11 / 上肢 42 / 胸腹部 40 / 背部 74 / 下肢 46 / 未分类 28
- **症状**（14 类）：疲劳 8 / 鼻塞 5 / 颈肩痛 5 / 膝痛 5 / 眼疲劳 5 / 眩晕 5 / 牙痛 5 / 咳嗽 5 / 胃痛 4 / 焦虑 4 / 腰痛 3 / 便秘 3 / 头痛 1 / 月经不调 1

分类来自 `source/data/acupoint_categories.js` 的两个 export（`bodyPartCategories` / `symptomCategories`），
导入时按 export 边界分别解析——早期版本误把症状当成部位，已修正。

## 免责声明

本接口提供的是传统穴位参考数据，**不构成医疗建议**，不能替代医生诊断或治疗。

## 技术栈

- FastAPI 0.110+
- SQLite（标准库 sqlite3，无 ORM）
- Pydantic v2
- Uvicorn
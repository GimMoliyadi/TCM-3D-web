# FastAPI + SQLite 穴位后端实验

这是与现有 GitHub Pages 静态前端隔离的学习版后端。它只读取并迁移仓库已有的 `source/data/acupoints_data.json`，不生成、不润色、不改写任何穴位医学内容。当前 React 前端、根目录 `index.html` 和 `static/` 均未改动。

> 注意：本项目用于学习与数据展示，不构成医疗建议。

## 数据是怎样流动的

```text
Excel / 原始资料
        ↓ 人工整理、校对
source/data/acupoints_data.json
        ↓ python -m backend.migrate
backend/acupoints.db（SQLite）
        ↓ FastAPI 只读查询
/api/acupoints、/api/acupoints/{id}、/api/search?q=
        ↓ 将来可选接入
React 前端
```

1. **Excel / 原始资料**：最初的数据来源与整理阶段，本实验不读取 Excel。
2. **JSON**：当前前端使用的结构化数据，也是本次迁移的唯一事实来源。
3. **SQLite**：把 290 条 JSON 记录存入单表，便于学习 SQL、筛选和持久化。
4. **FastAPI**：把数据库查询包装成 HTTP JSON 接口。
5. **前端**：目前仍继续直接读取原 JSON；以后确认部署方案后才能切换到 API。

JSON 中缺失的可选医学字段会存为 SQLite 的 `NULL`，不会擅自补写。包括 `Cube.*`、`xuewei.*` 在内的模型节点也会照原数据迁移，保证总数与 JSON 完全一致。

## 主要文件

| 文件 | 作用 |
| --- | --- |
| `backend/database.py` | 表结构、SQLite 连接、JSON 迁移与条数校验 |
| `backend/migrate.py` | 可在命令行运行的迁移入口 |
| `backend/main.py` | FastAPI 应用和三个查询接口 |
| `backend/tests/test_api.py` | 验证 290 条数据、指定 ID、百会搜索及 404 |
| `backend/requirements.txt` | 最少的 Python 依赖 |
| `backend/acupoints.db` | 运行迁移后生成的数据库文件（本分支由 CI 实际生成并验证，不手工编辑） |
| `.github/workflows/backend-tests.yml` | 在本分支/PR 中生成数据库并运行测试 |

## 本地运行

在仓库根目录执行：

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r backend/requirements.txt
python -m backend.migrate
python -m uvicorn backend.main:app --reload
```

迁移成功会输出：`迁移完成：290 条记录 -> .../backend/acupoints.db`。

打开以下地址：

- Swagger 交互文档：<http://127.0.0.1:8000/docs>
- 全部穴位：<http://127.0.0.1:8000/api/acupoints>
- 指定数据库 ID：<http://127.0.0.1:8000/api/acupoints/1>
- 搜索百会：<http://127.0.0.1:8000/api/search?q=百会>

也可以用命令行测试：

```bash
curl "http://127.0.0.1:8000/api/acupoints/1"
curl "http://127.0.0.1:8000/api/search?q=%E7%99%BE%E4%BC%9A"
```

## 运行自动测试

```bash
pytest -q backend/tests
```

测试会在临时目录生成独立数据库，不覆盖你本地的 `backend/acupoints.db`。CI 还会先真实执行迁移，然后用 SQLite 查询并断言数据库正好有 290 条记录。

## 数据库表结构

`acupoints` 表字段：

| 字段 | SQLite 类型 | 含义 |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY | 数据库自增 ID，供详情 API 使用 |
| `source_id` | TEXT UNIQUE NOT NULL | 原 JSON 的 `id`，原样保留 |
| `name` | TEXT NOT NULL | 原名称 |
| `x`, `y`, `z` | REAL NOT NULL | 原 `relativePos` 三维坐标 |
| `location` | TEXT NULL | 原定位文字 |
| `massage` | TEXT NULL | 原按摩说明 |
| `contraindications` | TEXT NULL | 原禁忌说明 |
| `efficacy` | TEXT NULL | 原功效说明 |

这里同时保留自增 `id` 与原 `source_id`，避免把中文名称强行当作数据库行号，并保留原数据身份。

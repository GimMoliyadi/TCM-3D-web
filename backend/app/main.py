"""TCM 穴位数据后端：FastAPI + SQLite。

数据源：source/data/acupoints_data.json（290 条，只读导入）
启动：uvicorn app.main:app --reload
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .db import get_conn, init_db, import_acupoints
from .schemas import Acupoint, AcupointBrief, CategoryGroup, SearchResponse

DATA_JSON = Path(__file__).resolve().parents[2] / "source" / "data" / "acupoints_data.json"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    import_acupoints(DATA_JSON)
    yield


app = FastAPI(
    title="TCM Acupoints API",
    description="中医穴位数据查询接口，数据源为 3D 穴位展示项目的内置数据集。",
    version="1.0.0",
    lifespan=lifespan,
)

# 前端 GitHub Pages 与本服务不同源，开发阶段全放开；上线按需收紧。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health", tags=["运维"])
def health() -> dict:
    """健康检查。"""
    with get_conn() as conn:
        n = conn.execute("SELECT COUNT(*) FROM acupoints").fetchone()[0]
    return {"status": "ok", "acupoints": n}


@app.get("/api/acupoints", response_model=list[AcupointBrief], tags=["穴位"])
def list_acupoints(
    body_part: str | None = Query(None, description="按部位筛选，如 头面部"),
    category: str | None = Query(None, description="按症状分类筛选，如 头痛"),
    limit: int = Query(50, ge=1, le=290),
    offset: int = Query(0, ge=0),
):
    """列出穴位（简要字段，含坐标）。"""
    sql = "SELECT id, name, relative_x, relative_y, relative_z, body_part, symptoms FROM acupoints"
    where, params = [], []
    if body_part:
        where.append("body_part = ?")
        params.append(body_part)
    if category:
        where.append("symptoms LIKE ?")
        params.append(f"%{category}%")
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY id LIMIT ? OFFSET ?"
    params += [limit, offset]
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/acupoints/search", response_model=SearchResponse, tags=["穴位"])
def search_acupoints(
    q: str = Query(..., min_length=1, description="搜索词，匹配名称/定位/功效/按摩手法"),
    limit: int = Query(20, ge=1, le=100),
):
    """关键词搜索。名称命中优先，其次定位、功效、手法。"""
    like = f"%{q}%"
    sql = """
        SELECT id, name, relative_x, relative_y, relative_z, body_part, symptoms,
               location, massage, contraindications, efficacy,
               CASE
                 WHEN name LIKE ? THEN 1
                 WHEN efficacy LIKE ? THEN 2
                 WHEN location LIKE ? THEN 3
                 ELSE 4
               END AS rank
        FROM acupoints
        WHERE name LIKE ? OR efficacy LIKE ? OR location LIKE ? OR massage LIKE ?
        ORDER BY rank, id
        LIMIT ?
    """
    with get_conn() as conn:
        rows = conn.execute(sql, [like, like, like, like, like, like, like, limit]).fetchall()
    return {"query": q, "count": len(rows), "results": [dict(r) for r in rows]}


@app.get("/api/acupoints/{acupoint_id}", response_model=Acupoint, tags=["穴位"])
def get_acupoint(acupoint_id: str):
    """按 id 查单个穴位的完整信息。"""
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM acupoints WHERE id = ?", (acupoint_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"未找到穴位：{acupoint_id}")
    return dict(row)


@app.get("/api/categories", response_model=list[CategoryGroup], tags=["分类"])
def list_categories():
    """按部位分组的穴位列表（供前端分类导航用）。"""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT body_part, id, name FROM acupoints WHERE body_part IS NOT NULL "
            "ORDER BY body_part, id"
        ).fetchall()
    grouped: dict[str, list[dict]] = {}
    for r in rows:
        grouped.setdefault(r["body_part"], []).append({"id": r["id"], "name": r["name"]})
    return [{"body_part": k, "count": len(v), "points": v} for k, v in sorted(grouped.items())]


@app.get("/api/stats", tags=["运维"])
def stats():
    """数据统计：总数、按部位分布。"""
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM acupoints").fetchone()[0]
        rows = conn.execute(
            "SELECT body_part, COUNT(*) c FROM acupoints GROUP BY body_part ORDER BY c DESC"
        ).fetchall()
    return {"total": total, "by_body_part": {r["body_part"]: r["c"] for r in rows}}
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query

from .database import DEFAULT_DB_PATH, connect, ensure_database


def _row_to_dict(row):
    return dict(row)


def create_app(db_path: Path = DEFAULT_DB_PATH) -> FastAPI:
    db_path = Path(db_path)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        ensure_database(db_path)
        yield

    app = FastAPI(
        title="TCM 3D 穴位实验 API",
        description="从现有 JSON 迁移得到的只读穴位查询接口",
        version="0.1.0",
        lifespan=lifespan,
    )

    @app.get("/api/acupoints")
    def list_acupoints():
        with connect(db_path) as connection:
            rows = connection.execute(
                "SELECT * FROM acupoints ORDER BY id"
            ).fetchall()
        return [_row_to_dict(row) for row in rows]

    @app.get("/api/acupoints/{acupoint_id}")
    def get_acupoint(acupoint_id: int):
        with connect(db_path) as connection:
            row = connection.execute(
                "SELECT * FROM acupoints WHERE id = ?",
                (acupoint_id,),
            ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="未找到该穴位")
        return _row_to_dict(row)

    @app.get("/api/search")
    def search_acupoints(q: str = Query(min_length=1)):
        pattern = f"%{q}%"
        with connect(db_path) as connection:
            rows = connection.execute(
                """
                SELECT * FROM acupoints
                WHERE name LIKE ?
                   OR COALESCE(location, '') LIKE ?
                   OR COALESCE(efficacy, '') LIKE ?
                ORDER BY id
                """,
                (pattern, pattern, pattern),
            ).fetchall()
        return [_row_to_dict(row) for row in rows]

    return app


app = create_app()

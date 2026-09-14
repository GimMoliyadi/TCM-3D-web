import json
import sqlite3
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BACKEND_DIR / "acupoints.db"
DEFAULT_JSON_PATH = BACKEND_DIR.parent / "source" / "data" / "acupoints_data.json"

SCHEMA = """
CREATE TABLE IF NOT EXISTS acupoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    location TEXT,
    massage TEXT,
    contraindications TEXT,
    efficacy TEXT
);
CREATE INDEX IF NOT EXISTS idx_acupoints_name ON acupoints(name);
"""


def connect(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def migrate_json_to_sqlite(
    db_path: Path = DEFAULT_DB_PATH,
    json_path: Path = DEFAULT_JSON_PATH,
    *,
    replace: bool = False,
) -> int:
    """将原 JSON 原样映射到 SQLite，不补写或修改医学文本。"""
    db_path = Path(db_path)
    json_path = Path(json_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with json_path.open("r", encoding="utf-8") as source:
        records = json.load(source)

    with connect(db_path) as connection:
        connection.executescript(SCHEMA)
        if replace:
            connection.execute("DELETE FROM acupoints")

        existing = connection.execute(
            "SELECT COUNT(*) AS count FROM acupoints"
        ).fetchone()["count"]
        if existing and not replace:
            return existing

        rows = []
        for record in records:
            position = record["relativePos"]
            rows.append(
                (
                    record["id"],
                    record["name"],
                    position["x"],
                    position["y"],
                    position["z"],
                    record.get("location"),
                    record.get("massage"),
                    record.get("contraindications"),
                    record.get("efficacy"),
                )
            )

        connection.executemany(
            """
            INSERT INTO acupoints (
                source_id, name, x, y, z,
                location, massage, contraindications, efficacy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        count = connection.execute(
            "SELECT COUNT(*) AS count FROM acupoints"
        ).fetchone()["count"]

    if count != len(records):
        raise RuntimeError(f"迁移条数不一致：JSON={len(records)}, SQLite={count}")
    return count


def ensure_database(db_path: Path = DEFAULT_DB_PATH) -> int:
    if not Path(db_path).exists():
        return migrate_json_to_sqlite(db_path)
    with connect(db_path) as connection:
        connection.executescript(SCHEMA)
        return connection.execute(
            "SELECT COUNT(*) AS count FROM acupoints"
        ).fetchone()["count"]

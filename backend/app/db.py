"""SQLite 存储层：建表 + 从 acupoints_data.json 导入。"""
from __future__ import annotations

import json
import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "tcm.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS acupoints (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    relative_x      REAL,
    relative_y      REAL,
    relative_z      REAL,
    location        TEXT,
    massage         TEXT,
    contraindications TEXT,
    efficacy        TEXT,
    body_part       TEXT,
    symptoms        TEXT,
    source          TEXT
);
CREATE INDEX IF NOT EXISTS idx_body_part ON acupoints(body_part);
CREATE INDEX IF NOT EXISTS idx_name ON acupoints(name);
"""


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(SCHEMA)


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _parse_categories() -> tuple[dict[str, list[str]], dict[str, list[str]]]:
    """分别解析 bodyPartCategories 与 symptomCategories。

    文件里有两个 export，必须先按 export 边界切开，否则症状分类会被
    误当成身体部位（曾把「疲劳」「牙痛」写进 body_part）。
    """
    js = DB_PATH.parent.parent.parent / "source" / "data" / "acupoint_categories.js"
    if not js.is_file():
        return {}, {}
    text = js.read_text(encoding="utf-8")
    body_text, symptom_text = "", ""
    idx_symptom = text.find("export const symptomCategories")
    if idx_symptom > 0:
        body_text = text[:idx_symptom]
        symptom_text = text[idx_symptom:]
    else:
        body_text = text

    def _extract(section: str) -> dict[str, list[str]]:
        out: dict[str, list[str]] = {}
        for m in re.finditer(
            r"name:\s*'([^']+)'[\s\S]*?points:\s*\[([\s\S]*?)\]", section
        ):
            names = re.findall(r"'([^']+)'", m.group(2))
            if names:
                out[m.group(1)] = names
        return out

    return _extract(body_text), _extract(symptom_text)


def import_acupoints(json_path: Path) -> int:
    """幂等导入：数据不变就不重复写。返回导入条数。"""
    if not json_path.is_file():
        raise FileNotFoundError(f"穴位数据不存在：{json_path}")
    items = json.loads(json_path.read_text(encoding="utf-8"))
    # 3D 模型里的定位占位体（Cube.001 等）没有医学内容，不导入。
    items = [i for i in items if not str(i.get("id", "")).startswith("Cube")
             and (i.get("efficacy") or i.get("location"))]
    body_cats, symptom_cats = _parse_categories()
    name_to_part = {n: part for part, names in body_cats.items() for n in names}
    name_to_symptoms = {n: part for part, names in symptom_cats.items() for n in names}

    with get_conn() as conn:
        existing = conn.execute("SELECT COUNT(*) FROM acupoints").fetchone()[0]
        if existing == len(items):
            return existing
        conn.execute("DELETE FROM acupoints")
        for it in items:
            pos = it.get("relativePos") or {}
            name = it.get("name") or it.get("id")
            conn.execute(
                """INSERT OR REPLACE INTO acupoints
                   (id, name, relative_x, relative_y, relative_z, location, massage,
                    contraindications, efficacy, body_part, symptoms, source)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    it.get("id"), name,
                    pos.get("x"), pos.get("y"), pos.get("z"),
                    it.get("location"), it.get("massage"),
                    it.get("contraindications"), it.get("efficacy"),
                    name_to_part.get(name),
                    name_to_symptoms.get(name),
                    "source/data/acupoints_data.json",
                ),
            )
        return len(items)
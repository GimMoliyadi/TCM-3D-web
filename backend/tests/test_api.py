import json
import sqlite3

from fastapi.testclient import TestClient

from backend.database import DEFAULT_JSON_PATH, migrate_json_to_sqlite
from backend.main import create_app


def build_test_client(tmp_path):
    db_path = tmp_path / "acupoints.db"
    count = migrate_json_to_sqlite(db_path)
    return db_path, count, TestClient(create_app(db_path))


def test_migration_count_matches_json(tmp_path):
    db_path, count, _ = build_test_client(tmp_path)
    expected = len(json.loads(DEFAULT_JSON_PATH.read_text(encoding="utf-8")))

    with sqlite3.connect(db_path) as connection:
        actual = connection.execute("SELECT COUNT(*) FROM acupoints").fetchone()[0]

    assert expected == 290
    assert count == expected
    assert actual == expected


def test_get_specific_acupoint(tmp_path):
    _, _, client = build_test_client(tmp_path)
    response = client.get("/api/acupoints/1")

    assert response.status_code == 200
    assert response.json()["name"] == "百会穴"
    assert response.json()["x"] == 0


def test_search_baihui(tmp_path):
    _, _, client = build_test_client(tmp_path)
    response = client.get("/api/search", params={"q": "百会"})

    assert response.status_code == 200
    results = response.json()
    assert any(item["name"] == "百会穴" for item in results)


def test_unknown_id_returns_404(tmp_path):
    _, _, client = build_test_client(tmp_path)
    response = client.get("/api/acupoints/999999")
    assert response.status_code == 404

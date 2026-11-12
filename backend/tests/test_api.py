"""后端基础测试：导入、查询、搜索、404。"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health_reports_acupoints(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["acupoints"] == 283


def test_stats_has_body_parts(client):
    body = client.get("/api/stats").json()
    assert body["total"] == 283
    assert "背部" in body["by_body_part"]


def test_list_respects_limit(client):
    rows = client.get("/api/acupoints?limit=5").json()
    assert len(rows) == 5
    assert rows[0]["name"]


def test_list_filters_by_body_part(client):
    rows = client.get("/api/acupoints?body_part=头面部&limit=100").json()
    assert rows
    assert all(r["body_part"] == "头面部" for r in rows)


def test_search_prefers_name_match(client):
    body = client.get("/api/acupoints/search?q=百会").json()
    assert body["count"] >= 1
    assert body["results"][0]["name"] == "百会穴"


def test_detail_returns_full_record(client):
    r = client.get("/api/acupoints/百会穴")
    assert r.status_code == 200
    d = r.json()
    assert d["location"]
    assert d["efficacy"]
    assert d["body_part"] == "头面部"


def test_detail_404(client):
    r = client.get("/api/acupoints/不存在")
    assert r.status_code == 404


def test_categories_grouped(client):
    groups = client.get("/api/categories").json()
    assert groups
    assert all("body_part" in g and "count" in g for g in groups)


def test_no_cube_placeholders_leaked(client):
    """3D 占位体不应进入 API。"""
    rows = client.get("/api/acupoints?limit=290").json()
    assert not any(r["id"].startswith("Cube") for r in rows)
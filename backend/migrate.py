import argparse
from pathlib import Path

from .database import DEFAULT_DB_PATH, DEFAULT_JSON_PATH, migrate_json_to_sqlite


def main() -> None:
    parser = argparse.ArgumentParser(description="将现有穴位 JSON 迁移到 SQLite")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH)
    parser.add_argument("--json", type=Path, default=DEFAULT_JSON_PATH)
    parser.add_argument(
        "--replace",
        action="store_true",
        help="清空已有 acupoints 表后重新迁移",
    )
    args = parser.parse_args()
    count = migrate_json_to_sqlite(args.db, args.json, replace=args.replace)
    print(f"迁移完成：{count} 条记录 -> {args.db}")


if __name__ == "__main__":
    main()

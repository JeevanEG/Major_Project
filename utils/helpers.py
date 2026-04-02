import json
from typing import Any, Dict, Optional

def parse_json_safely(json_str: str, default: Any = None) -> Any:
    try:
        if not json_str:
            return default or {}
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default or {}

def format_skill_name(name: str) -> str:
    return name.strip().title()

def calculate_percentage(part: float, total: float) -> float:
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)

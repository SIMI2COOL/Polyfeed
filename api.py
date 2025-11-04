"""Polymarket public activity endpoint wrapper."""
import requests
from typing import List, Dict, Any

BASE_URL = "https://data-api.polymarket.com/activity"

def fetch_user_trades(wallet: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Returns the most recent `limit` trades for `wallet`.
    Empty list on error or no wallet.
    """
    if not wallet or wallet == "0x...":
        return []

    params = {
        "user": wallet,
        "type": "TRADE",
        "limit": limit,
        "sortBy": "TIMESTAMP",
        "sortDirection": "DESC",
    }

    try:
        resp = requests.get(BASE_URL, params=params, timeout=6)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        print(f"[API] error: {exc}")
        return []
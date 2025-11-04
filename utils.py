"""Tiny helpers – keep the other files tidy."""
from datetime import datetime

EMOJI_BUY = "🟢"
EMOJI_SELL = "🔴"

def format_timestamp(ts: int) -> str:
    return datetime.fromtimestamp(ts).strftime("%m/%d %H:%M")

def side_emoji(side: str):
    return EMOJI_BUY if side == "BUY" else EMOJI_SELL

def truncate(text: str, length: int = 40) -> str:
    return (text[:length] + "...") if len(text) > length else text
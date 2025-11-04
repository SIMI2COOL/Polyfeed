"""Tkinter UI – cute scrolling window."""
import tkinter as tk
from tkinter import ttk
from threading import Thread
from api import fetch_user_trades
from utils import format_timestamp, side_emoji, truncate

BG = "#0b0f19"
PANEL_BG = "#111827"
FG = "#e5e7eb"
ACCENT = "#22d3ee"
BUY_COLOR = "#22c55e"
SELL_COLOR = "#ef4444"
ROW_ALT = "#0f172a"

POLL_MS = 1_000  # 1 second

class TradeFeedApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Polymarket Trade Vibes")
        self.root.geometry("720x540")
        try:
            # Maximize window on launch (Windows/Linux). Keeps taskbar visible.
            self.root.state("zoomed")
        except Exception:
            pass
        self.root.configure(bg=BG)

        self.wallet_var = tk.StringVar(value="0x...")
        self._is_fetching = False
        self._spinner_index = -1
        self._build_ui()
        self._start_polling()

    # ------------------------------------------------------------------ #
    def _build_ui(self):
        # Header + Pixel icons
        header_f = tk.Frame(self.root, bg=BG)
        header_f.pack(pady=10)

        icons_f = tk.Frame(header_f, bg=BG)
        icons_f.pack(side=tk.LEFT, padx=8)

        btc = tk.Canvas(icons_f, width=42, height=42, bg=BG, highlightthickness=0)
        eth = tk.Canvas(icons_f, width=42, height=42, bg=BG, highlightthickness=0)
        sol = tk.Canvas(icons_f, width=42, height=42, bg=BG, highlightthickness=0)
        btc.grid(row=0, column=0, padx=3)
        eth.grid(row=0, column=1, padx=3)
        sol.grid(row=0, column=2, padx=3)

        self._draw_btc_icon(btc)
        self._draw_eth_icon(eth)
        self._draw_sol_icon(sol)

        hdr = tk.Label(
            header_f,
            text="Live Polymarket Trades Feed",
            font=("Courier New", 16, "bold"),
            bg=BG,
            fg=ACCENT,
        )
        hdr.pack(side=tk.LEFT, padx=10)

        # Wallet entry
        inp_f = tk.Frame(self.root, bg=BG)
        inp_f.pack(pady=6)
        tk.Label(inp_f, text="Wallet:", bg=BG, fg=FG, font=("Arial", 10)).pack(
            side=tk.LEFT
        )
        entry = tk.Entry(
            inp_f, textvariable=self.wallet_var, width=52, font=("Arial", 9)
        )
        entry.pack(side=tk.LEFT, padx=6)
        entry.bind("<Return>", lambda _: self._manual_refresh())

        # Styles for a cleaner modern look (dark theme)
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass
        style.configure(
            "Treeview",
            background=PANEL_BG,
            fieldbackground=PANEL_BG,
            foreground=FG,
            rowheight=24,
            font=("Arial", 9),
        )
        style.configure(
            "Treeview.Heading",
            font=("Arial", 10, "bold"),
            background=PANEL_BG,
            foreground=ACCENT,
        )

        # Table (Treeview) + scrollbars
        table_f = tk.Frame(self.root, bg=BG)
        table_f.pack(expand=True, fill="both", padx=22, pady=10)

        columns = ("time", "market", "outcome", "price", "size", "side")
        self.tree = ttk.Treeview(
            table_f, columns=columns, show="headings", selectmode="browse"
        )
        # Headings
        self.tree.heading("time", text="Time")
        self.tree.heading("market", text="Market")
        self.tree.heading("outcome", text="Outcome")
        self.tree.heading("price", text="Price")
        self.tree.heading("size", text="Size")
        self.tree.heading("side", text="Side")
        # Column widths
        self.tree.column("time", width=82, anchor="w")
        self.tree.column("market", width=360, anchor="w")
        self.tree.column("outcome", width=100, anchor="w")
        self.tree.column("price", width=70, anchor="e")
        self.tree.column("size", width=100, anchor="e")
        self.tree.column("side", width=58, anchor="center")

        # Tag-based colors
        self.tree.tag_configure("BUY", foreground=BUY_COLOR)
        self.tree.tag_configure("SELL", foreground=SELL_COLOR)
        self.tree.tag_configure("odd", background=ROW_ALT)

        yscroll = ttk.Scrollbar(table_f, orient=tk.VERTICAL, command=self.tree.yview)
        xscroll = ttk.Scrollbar(table_f, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=yscroll.set, xscrollcommand=xscroll.set)

        self.tree.grid(row=0, column=0, sticky="nsew")
        yscroll.grid(row=0, column=1, sticky="ns")
        xscroll.grid(row=1, column=0, sticky="ew")
        table_f.grid_rowconfigure(0, weight=1)
        table_f.grid_columnconfigure(0, weight=1)

        # Donation banner
        donate_f = tk.Frame(self.root, bg=BG)
        donate_f.pack(pady=4)
        donate_text = (
            "Enjoying it? Send USDC tips to Polymarket account lagartija: "
            "0xa9656833239dC09D0A5C2C3f26246440E2cFfCFC"
        )
        donate_lbl = tk.Label(
            donate_f,
            text=donate_text,
            bg=BG,
            fg=FG,
            font=("Arial", 9),
            cursor="hand2",
        )
        donate_lbl.pack(side=tk.LEFT)
        donate_lbl.bind("<Button-1>", lambda _: self._copy_address())
        copy_btn = tk.Button(
            donate_f,
            text="Copy",
            command=self._copy_address,
            bg="#1f2937",
            fg=FG,
            activebackground="#334155",
            relief=tk.FLAT,
            padx=8,
        )
        copy_btn.pack(side=tk.LEFT, padx=6)

        # Status bar
        self.status = tk.Label(
            self.root,
            text=f"Updating every {POLL_MS // 1000} s…",
            font=("Arial", 8),
            bg=BG,
            fg=FG,
        )
        self.status.pack(pady=4)

    # ------------------------------------------------------------------ #
    def _start_polling(self):
        self._refresh()
        self.root.after(POLL_MS, self._start_polling)

    def _manual_refresh(self):
        self._refresh()

    def _refresh(self):
        if self._is_fetching:
            return
        self._is_fetching = True
        self._tick_spinner()

        wallet = self.wallet_var.get().strip()

        def worker():
            trades = fetch_user_trades(wallet)

            def on_done():
                self._update_list(trades)
                self._is_fetching = False

            # marshal UI updates back to main thread
            self.root.after(0, on_done)

        Thread(target=worker, daemon=True).start()

    def _update_list(self, trades):
        # Clear table
        for child in self.tree.get_children():
            self.tree.delete(child)

        if not trades:
            self.status.config(text="No data – enter a wallet")
            return

        self.status.config(text=f"{len(trades)} recent trades – updated")

        for idx, t in enumerate(trades):
            ts = format_timestamp(t["timestamp"])
            side = t["side"]
            side_mark = side_emoji(side)
            outcome = t.get("outcome", "N/A")
            price = f"${t['price']:.2f}"
            size = f"{t['size']:.2f} shares"
            title = truncate(t.get("title", "Unknown Market"))

            values = (ts, title, outcome, price, size, side_mark)
            tags = (side, "odd") if idx % 2 else (side,)
            self.tree.insert("", "end", values=values, tags=tags)

        # scroll to top
        self.tree.yview_moveto(0)

    def _tick_spinner(self):
        if not self._is_fetching:
            return
        frames = ["⠋", "⠙", "⠸", "⠴", "⠦", "⠇"]
        self._spinner_index = (self._spinner_index + 1) % len(frames)
        self.status.config(
            text=f"{frames[self._spinner_index]} Refreshing… every {POLL_MS // 1000} s"
        )
        self.root.after(200, self._tick_spinner)

    # ------------------------- Pixel icons & helpers ------------------------- #
    def _copy_address(self):
        addr = "0xa9656833239dC09D0A5C2C3f26246440E2cFfCFC"
        try:
            self.root.clipboard_clear()
            self.root.clipboard_append(addr)
            self.status.config(text="Address copied to clipboard ✨")
        except Exception:
            self.status.config(text=addr)
    def _draw_btc_icon(self, c: tk.Canvas):
        # coin base
        c.create_oval(4, 4, 38, 38, fill="#f7931a", outline="")
        # pixel rim
        for i in range(6, 36, 2):
            c.create_rectangle(i, 6, i+1, 8, fill="#ffb84d", outline="")
        # symbol
        c.create_text(21, 21, text="₿", fill="#111111", font=("Arial", 18, "bold"))

    def _draw_eth_icon(self, c: tk.Canvas):
        # diamond body
        c.create_polygon(21, 4, 36, 22, 21, 40, 6, 22, fill="#8b5cf6", outline="")
        c.create_polygon(21, 4, 30, 22, 21, 22, 12, 22, fill="#a78bfa", outline="")
        c.create_polygon(21, 22, 30, 22, 21, 34, 12, 22, fill="#6d28d9", outline="")

    def _draw_sol_icon(self, c: tk.Canvas):
        # three neon bars
        c.create_rectangle(8, 10, 34, 14, fill="#22d3ee", outline="")
        c.create_rectangle(10, 18, 36, 22, fill="#34d399", outline="")
        c.create_rectangle(8, 26, 34, 30, fill="#a78bfa", outline="")

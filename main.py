"""Entry point – launches the UI."""
import tkinter as tk
from ui import TradeFeedApp

if __name__ == "__main__":
    root = tk.Tk()
    app = TradeFeedApp(root)
    root.mainloop()
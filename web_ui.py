import os
import webbrowser
import webview
from api import fetch_user_trades


class ApiBridge:
    def get_trades(self, wallet: str):
        return fetch_user_trades(wallet)
    def open_url(self, url: str):
        try:
            webbrowser.open(url)
            return True
        except Exception:
            return False
    def get_popular_users(self):
        """Return provided users with local avatar images mapped by handle.
        No external fetching. Falls back to identicon when a local file is missing.
        """
        provided = [
            {"handle": "Euan", "address": "0xdd225a03cd7ed89e3931906c67c75ab31cf89ef1"},
            {"handle": "Car", "address": "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b"},
            {"handle": "25usdc", "address": "0x75e765216a57942d738d880ffcda854d9f869080"},
            {"handle": "Dropper", "address": "0x6bab41a0dc40d6dd4c1a915b8c01969479fd1292"},
            {"handle": "gopfan2", "address": "0xf2f6af4f27ec2dcf4072095ab804016e14cd5817"},
            {"handle": "wokerjoesleeper", "address": "0x63d43bbb87f85af03b8f2f9e2fad7b54334fa2f1"},
            {"handle": "cigarettes", "address": "0xd218e474776403a330142299f7796e8ba32eb5c9"},
        ]

        result = []
        for u in provided:
            addr = u["address"]
            handle = u["handle"]
            avatar = self._find_local_avatar(handle) or f"https://api.dicebear.com/7.x/identicon/svg?seed={addr}"
            result.append({
                "name": handle,
                "address": addr,
                "avatar": avatar,
                "handle": handle,
                "url": f"https://polymarket.com/@{handle}",
            })
        return result

    

    def _find_local_avatar(self, handle: str) -> str | None:
        """Return relative URL to a locally provided avatar image if present.
        Looks under web/assets/avatars/<handle>.(png|jpg|jpeg|webp)
        """
        if not handle:
            return None
        base_dir = os.path.dirname(__file__)
        web_dir = os.path.join(base_dir, "web")
        folder = os.path.join(web_dir, "assets", "avatars")
        exts = (".png", ".jpg", ".jpeg", ".webp")
        for ext in exts:
            fname = handle + ext
            fpath = os.path.join(folder, fname)
            if os.path.exists(fpath):
                # URL relative to index.html in web/
                return f"assets/avatars/{fname}"
        return None


def main():
    api = ApiBridge()
    base_dir = os.path.dirname(__file__)
    index_path = os.path.join(base_dir, "web", "index.html")
    window = webview.create_window(
        title="Polyfeed",
        url=index_path,
        js_api=api,
        width=960,
        height=700,
        resizable=True,
        text_select=True,
    )
    # Start maximized with standard window controls (not borderless fullscreen)
    def on_start():
        try:
            # pywebview >=4.4 supports maximize() on Window
            if hasattr(window, 'maximize'):
                window.maximize()
                return
        except Exception:
            pass
        # Fallback: resize to primary screen and move to (0,0)
        try:
            import ctypes
            user32 = ctypes.windll.user32  # Windows
            sw = int(user32.GetSystemMetrics(0))
            sh = int(user32.GetSystemMetrics(1))
            try:
                window.resize(sw, sh)
            except Exception:
                pass
            try:
                window.move(0, 0)
            except Exception:
                pass
        except Exception:
            # As a last resort, keep default size
            pass

    webview.start(on_start)


if __name__ == "__main__":
    main()



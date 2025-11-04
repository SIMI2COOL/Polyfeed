import os
import sys
import time
import subprocess
from typing import Dict, Tuple, List


WATCH_PATHS: List[str] = [
    "web",          # static assets (html/css/js)
    "web_ui.py",    # pywebview entry
    "api.py",
    "utils.py",
    "ui.py",        # tkinter variant
]


def build_signature() -> Tuple[Tuple[str, float, int], ...]:
    entries = []
    base = os.path.dirname(os.path.abspath(__file__))
    for path in WATCH_PATHS:
        abs_path = os.path.join(base, path)
        if not os.path.exists(abs_path):
            continue
        if os.path.isdir(abs_path):
            for root, _dirs, files in os.walk(abs_path):
                for f in files:
                    # watch common dev files only
                    if not f.lower().endswith((".py", ".js", ".css", ".html")):
                        continue
                    fp = os.path.join(root, f)
                    try:
                        st = os.stat(fp)
                        entries.append((os.path.relpath(fp, base), st.st_mtime, st.st_size))
                    except FileNotFoundError:
                        pass
        else:
            try:
                st = os.stat(abs_path)
                entries.append((os.path.relpath(abs_path, base), st.st_mtime, st.st_size))
            except FileNotFoundError:
                pass
    # sorted for stable comparison
    entries.sort(key=lambda t: t[0])
    return tuple(entries)


def run_app() -> subprocess.Popen:
    python = sys.executable or "python"
    # Start web_ui.py as a child process
    return subprocess.Popen([python, "web_ui.py"], close_fds=False)


def terminate(proc: subprocess.Popen) -> None:
    if proc and proc.poll() is None:
        try:
            proc.terminate()
            # give it a moment to exit gracefully
            for _ in range(20):
                if proc.poll() is not None:
                    break
                time.sleep(0.1)
            if proc.poll() is None:
                proc.kill()
        except Exception:
            pass


def main():
    print("[dev] Watching for changes. The app will relaunch automatically…")
    last_sig = build_signature()
    child = run_app()
    try:
        while True:
            time.sleep(0.5)
            sig = build_signature()
            if sig != last_sig:
                print("[dev] Change detected → relaunching app…")
                last_sig = sig
                terminate(child)
                child = run_app()
    except KeyboardInterrupt:
        print("\n[dev] Stopping watcher…")
    finally:
        terminate(child)


if __name__ == "__main__":
    main()



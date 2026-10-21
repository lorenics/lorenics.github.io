# -*- coding: utf-8 -*-
"""sitemap.xml の <lastmod> を、各ページの最後のコミット日に書き換える。

使い方（リポジトリ直下で）:  python _tools/sitemap_lastmod.py
  - 先にページの直しをコミットしてから実行する（日付は git log -1 --format=%cs -- <ファイル> で取る）
  - 書き換わったら sitemap.xml もコミットする
  - --check を付けると書き換えず、ずれている行だけ表示する（ずれがあれば終了コード 1）
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / "sitemap.xml"
SITE = "https://lorenics.com/"

URL_RE = re.compile(r"(<loc>(?P<loc>[^<]+)</loc>\s*<lastmod>)(?P<date>[^<]*)(</lastmod>)")


def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT), *args]).decode("utf-8").strip()


def loc_to_file(loc):
    if not loc.startswith(SITE):
        raise SystemExit(f"[NG] サイトの外のURLです: {loc}")
    path = loc[len(SITE):]
    if path == "" or path.endswith("/"):
        path += "index.html"
    return path


def main():
    check_only = "--check" in sys.argv[1:]
    raw = SITEMAP.read_bytes().decode("utf-8")
    # コミットしていない変更があるファイル（-z で区切り、先頭2文字が状態・3文字目が空白）
    status = subprocess.check_output(["git", "-C", str(ROOT), "status", "--porcelain", "-z"]).decode("utf-8")
    dirty_files = {e[3:] for e in status.split("\0") if len(e) > 3}
    changes = []
    problems = []

    def repl(m):
        f = loc_to_file(m.group("loc"))
        if not (ROOT / f).is_file():
            problems.append(f"ファイルがありません: {f}")
            return m.group(0)
        if f in dirty_files:
            problems.append(f"コミットしていない変更があります（先にコミット）: {f}")
        d = git("log", "-1", "--format=%cs", "--", f)
        if not d:
            problems.append(f"コミットの記録がありません: {f}")
            return m.group(0)
        if d != m.group("date"):
            changes.append(f"{f}: {m.group('date')} -> {d}")
        return m.group(1) + d + m.group(4)

    new = URL_RE.sub(repl, raw)
    for p in problems:
        print("[注意]", p)
    for c in changes:
        print(c)
    if check_only:
        print("ずれ", len(changes), "件")
        sys.exit(1 if changes else 0)
    if new != raw:
        SITEMAP.write_bytes(new.encode("utf-8"))
        print("sitemap.xml を書き換えました（", len(changes), "件）")
    else:
        print("sitemap.xml は最新です")


if __name__ == "__main__":
    main()

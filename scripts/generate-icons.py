#!/usr/bin/env python3
"""アプリアイコン / favicon 一式を public/ に生成する。

  pip install cairosvg pillow
  python3 scripts/generate-icons.py

デザイン: ティールのタイルに白いデータベース（3層）。中央の層だけが
アンバーになり「!」が抜き文字で入る = エラーコードを蓄積するDB。
16/32px では層を2つに減らした簡易版に切り替えて可読性を確保する。
"""
import re
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"
CX = 256

TEAL_LIGHT, TEAL_DARK = "#20B6C4", "#045C6A"
AMBER_LIGHT, AMBER_DARK = "#FFD36B", "#F59E0B"
SEAM = "#0B8494"


def band(top, h, rx, ry, lid=False):
    """円柱の1層。lid=True なら上面（楕円の上半分）を輪郭に使う。"""
    bot = top + h
    return (f"M {CX-rx} {top} A {rx} {ry} 0 0 {'1' if lid else '0'} {CX+rx} {top} "
            f"L {CX+rx} {bot} A {rx} {ry} 0 0 1 {CX-rx} {bot} Z")


def rim(top, rx, ry):
    """上面の手前側の縁（フタに見せるための線）。"""
    return f"M {CX-rx} {top} A {rx} {ry} 0 0 0 {CX+rx} {top}"


def capsule(top, w, h):
    r = w / 2
    return (f"M {CX-r} {top+r} A {r} {r} 0 0 1 {CX+r} {top+r} L {CX+r} {top+h-r} "
            f"A {r} {r} 0 0 1 {CX-r} {top+h-r} Z")


def circle(cy, r):
    return f"M {CX-r} {cy} A {r} {r} 0 0 1 {CX+r} {cy} A {r} {r} 0 0 1 {CX-r} {cy} Z"


def defs(prefix):
    return (
        f'<linearGradient id="{prefix}bg" x1="0" y1="0" x2="0.75" y2="1">'
        f'<stop offset="0" stop-color="{TEAL_LIGHT}"/><stop offset="1" stop-color="{TEAL_DARK}"/></linearGradient>'
        f'<linearGradient id="{prefix}amber" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{AMBER_LIGHT}"/><stop offset="1" stop-color="{AMBER_DARK}"/></linearGradient>'
        f'<linearGradient id="{prefix}sheen" x1="0" y1="0" x2="0.4" y2="1">'
        f'<stop offset="0" stop-color="#fff" stop-opacity="0.22"/>'
        f'<stop offset="0.6" stop-color="#fff" stop-opacity="0"/></linearGradient>'
    )


def glyph(prefix="", scale=1.0):
    """標準マーク（3層 + 「!」抜き）。scale は中心を保ったまま縮小する。"""
    rx, ry = 118, 40
    tops, h_side, h_mid = (140, 212, 312), 56, 88
    bang = capsule(264, 24, 34) + " " + circle(264 + 34 + 9 + 12, 12)
    g = (
        f'<g fill="#fff"><path d="{band(tops[0], h_side, rx, ry, lid=True)}"/>'
        f'<path d="{band(tops[2], h_side, rx, ry)}"/></g>'
        f'<path fill-rule="evenodd" fill="url(#{prefix}amber)" d="{band(tops[1], h_mid, rx, ry)} {bang}"/>'
        f'<path d="{rim(tops[0], rx, ry)}" fill="none" stroke="{SEAM}" stroke-width="13" stroke-opacity="0.45"/>'
    )
    if scale != 1.0:
        g = f'<g transform="translate({CX*(1-scale):.1f} {CX*(1-scale):.1f}) scale({scale})">{g}</g>'
    return g


def glyph_small(prefix=""):
    """16/32px 用の簡易マーク（2層・太め、「!」なし）。"""
    rx, ry, h = 126, 46, 84
    return (f'<path fill="#fff" d="{band(155, h, rx, ry, lid=True)}"/>'
            f'<path fill="url(#{prefix}amber)" d="{band(273, h, rx, ry)}"/>')


def tile(body, prefix="", radius=116):
    corner = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">'
            f"<defs>{defs(prefix)}</defs>"
            f'<rect width="512" height="512"{corner} fill="url(#{prefix}bg)"/>'
            f'<rect width="512" height="512"{corner} fill="url(#{prefix}sheen)"/>'
            f"{body}</svg>")


def png(svg, path, size):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=str(path), output_width=size, output_height=size)


JSX_ATTRS = ("stop-color", "stop-opacity", "fill-rule", "stroke-width", "stroke-opacity",
             "fill-opacity", "stroke-linecap", "stroke-linejoin")


def emit_component():
    """ヘッダーロゴ用の React コンポーネントを favicon と同じ図形から生成する。"""
    body = (f"<defs>{defs('bm-')}</defs>"
            '<rect width="512" height="512" rx="116" fill="url(#bm-bg)"/>'
            '<rect width="512" height="512" rx="116" fill="url(#bm-sheen)"/>'
            f"{glyph('bm-')}")
    for attr in JSX_ATTRS:
        head, *rest = attr.split("-")
        body = body.replace(f"{attr}=", head + "".join(w.capitalize() for w in rest) + "=")
    body = re.sub(r"(<(?:g|path|rect|defs|linearGradient|stop)\b)", r"\n  \1", body).strip()
    (ROOT / "src" / "BrandMark.tsx").write_text(
        "// scripts/generate-icons.py が public/favicon.svg と同じ図形から生成しています。\n"
        "// 直接編集せず、スクリプトを実行して更新してください。\n"
        "export default function BrandMark() {\n"
        '  return <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">\n  '
        + body.replace("\n", "\n  ")
        + "\n  </svg>;\n}\n"
    )


def main():
    OUT.mkdir(exist_ok=True)
    main_svg = tile(glyph())
    small_svg = tile(glyph_small())

    (OUT / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        f"<defs>{defs('')}</defs>"
        '<rect width="512" height="512" rx="116" fill="url(#bg)"/>'
        '<rect width="512" height="512" rx="116" fill="url(#sheen)"/>'
        f"{glyph()}</svg>\n"
    )

    png(main_svg, OUT / "icon-192.png", 192)
    png(main_svg, OUT / "icon-512.png", 512)
    # apple-touch-icon は iOS 側で角丸マスクされるため、角丸なしの全面塗り
    png(tile(glyph(), radius=0), OUT / "apple-touch-icon.png", 180)
    # maskable は安全領域（中央80%）に収める
    png(tile(glyph(scale=0.72), radius=0), OUT / "icon-maskable-512.png", 512)

    # .ico: 16/32 は簡易版、48 は標準マーク
    # Pillow はベース画像より大きいサイズを捨てるので、最大サイズをベースにして
    # append_images で 16/32 の専用フレームを差し替える
    tmp = OUT / "_ico"
    frames = {}
    for size, svg in ((16, small_svg), (32, small_svg), (48, main_svg)):
        png(svg, tmp, size)
        frames[size] = Image.open(tmp).convert("RGBA").copy()
    tmp.unlink()
    frames[48].save(OUT / "favicon.ico", format="ICO",
                    sizes=[(48, 48), (32, 32), (16, 16)],
                    append_images=[frames[32], frames[16]])

    emit_component()

    print("generated:", ", ".join(sorted(p.name for p in OUT.iterdir())), "+ src/BrandMark.tsx")


if __name__ == "__main__":
    main()

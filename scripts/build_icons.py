#!/usr/bin/env python3
"""
Generate the fornlamningar map icon set: one flat, multi-colour SVG per glyph.

Why a generator and not 58 hand-written files: every icon shares one palette,
one grid, one halo treatment and one set of optical margins. Those belong in a
single place. The SVGs it writes are still ordinary editable files -- tweak one
by hand if you like, but know that a rerun overwrites it.

Design constraints, all forced by how the map actually draws these:

  * They render at roughly 14-22 px. That is what killed the stock set this
    replaces: those are 512 px illustrations with hairline outlines, and at
    16 px the outlines merge into grey mush. Everything here is built from a
    few large flat areas on a 24-unit grid, so each glyph keeps a recognisable
    silhouette AND a distinct colour signature even when the detail is gone.

  * They sit on an OSM raster basemap: forest green, field beige, water blue,
    white. So the whole glyph is drawn twice -- once fattened in white to make
    an outer halo, then in colour on top. Doing it in that order matters: a
    per-shape white stroke would also outline every INTERNAL edge, which at
    16 px eats the glyph from the inside.

  * The subject is Swedish archaeology, so the shapes are Swedish. A hog is a
    turf dome on a stone kerb, not a Mesoamerican step pyramid. A runristning
    is a rune band on granite, painted red as they actually were, not a moai.
    Falu red for the fishing huts. Sami classes get a lavvu, not a generic hut.

Palette is warm and slightly desaturated -- friendly rather than austere, and
low enough in chroma not to fight the basemap.

Usage:
    python3 scripts/build_icons.py             # write assets/fornlamningar-icons/
    python3 scripts/build_icons.py --sheet     # + a contact sheet to eyeball
"""

import argparse
import math
import os
import re
import subprocess
import sys

OUT = "assets/fornlamningar-icons"
HALO_W = 2.2

# --- palette ---------------------------------------------------------------
EARTH,   EARTH_D   = "#a97748", "#7d5432"
GRASS,   GRASS_D   = "#82b464", "#5d914a"
STONE,   STONE_D   = "#9ba7b4", "#6e7a88"
GRANITE, GRANITE_D = "#b3aea4", "#8a847a"
RUNE,    RUNE_D    = "#cf5340", "#a53d2d"
OCHRE,   OCHRE_D   = "#df9040", "#b36c28"
FIRE               = "#f3ab3c"
IRON,    IRON_D    = "#5d636d", "#3f444c"
WOOD,    WOOD_D    = "#c28c5c", "#98673e"
WATER,   WATER_D   = "#5ea4d1", "#3d7fae"
CREAM,   CREAM_D   = "#f1e8d9", "#d8c8ae"
ROOF,    ROOF_D    = "#c2473b", "#9c342b"
FALU               = "#a83f34"      # falu rod, the Swedish barn red
GOLD               = "#ecc558"
SNOW               = "#ffffff"

# --- primitives. All return a path string with no fill of its own. ----------


def p_bar(x1, y1, x2, y2, w):
    dx, dy = x2 - x1, y2 - y1
    ln = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / ln * w / 2, dx / ln * w / 2
    return (f'<path d="M{x1+nx:.2f} {y1+ny:.2f}L{x2+nx:.2f} {y2+ny:.2f}'
            f'L{x2-nx:.2f} {y2-ny:.2f}L{x1-nx:.2f} {y1-ny:.2f}Z"/>')


def p_dome(cx, by, rx, ry):
    return (f'<path d="M{cx-rx:.2f} {by:.2f}'
            f'a{rx:.2f} {ry:.2f} 0 0 1 {2*rx:.2f} 0Z"/>')


def p_ring(cx, cy, r, t):
    return (f'<path fill-rule="evenodd" d="M{cx-r:.2f} {cy:.2f}'
            f'a{r:.2f} {r:.2f} 0 1 0 {2*r:.2f} 0a{r:.2f} {r:.2f} 0 1 0 {-2*r:.2f} 0Z'
            f'M{cx-r+t:.2f} {cy:.2f}a{r-t:.2f} {r-t:.2f} 0 1 0 {2*(r-t):.2f} 0'
            f'a{r-t:.2f} {r-t:.2f} 0 1 0 {-2*(r-t):.2f} 0Z"/>')


def p_band(cx, cy, r, t, a0, a1):
    ro, ri = r, r - t
    p0, p1 = math.radians(a0), math.radians(a1)
    big = 1 if abs(a1 - a0) > 180 else 0
    sw = 1 if a1 > a0 else 0
    return (f'<path d="M{cx+ro*math.cos(p0):.2f} {cy-ro*math.sin(p0):.2f}'
            f'A{ro:.2f} {ro:.2f} 0 {big} {1-sw} '
            f'{cx+ro*math.cos(p1):.2f} {cy-ro*math.sin(p1):.2f}'
            f'L{cx+ri*math.cos(p1):.2f} {cy-ri*math.sin(p1):.2f}'
            f'A{ri:.2f} {ri:.2f} 0 {big} {sw} '
            f'{cx+ri*math.cos(p0):.2f} {cy-ri*math.sin(p0):.2f}Z"/>')


def p_dot(cx, cy, r):
    return f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}"/>'


def p_ell(cx, cy, rx, ry):
    return f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rx:.2f}" ry="{ry:.2f}"/>'


def p_rect(x, y, w, h, rx=0):
    r = f' rx="{rx}"' if rx else ""
    return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}"{r}/>'


def p_poly(*pts):
    return '<path d="M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + 'Z"/>'


def p_tri(cx, by, w, h):
    return p_poly((cx - w / 2, by), (cx, by - h), (cx + w / 2, by))


def p_stone(cx, by, w, h, lean=0.0, taper=0.74):
    hw = w / 2
    return p_poly((cx - hw, by), (cx - hw * taper + lean, by - h),
                  (cx + hw * taper + lean, by - h), (cx + hw, by))


def p_flame(cx, by, h):
    w = h * 0.6
    return (f'<path d="M{cx:.2f} {by-h:.2f}'
            f'c{w*0.78:.2f} {h*0.33:.2f} {w*0.5:.2f} {h*0.4:.2f} {w*0.5:.2f} {h*0.6:.2f}'
            f'a{w*0.5:.2f} {w*0.5:.2f} 0 0 1 {-w:.2f} 0'
            f'c0 {-h*0.2:.2f} {w*0.5:.2f} {-h*0.27:.2f} {w*0.5:.2f} {-h*0.6:.2f}Z"/>')


def p_wave(y, x1=2.6, x2=21.4, amp=1.0, w=1.5, n=2):
    out, span = [], (x2 - x1) / n
    for i in range(n):
        xs = x1 + i * span
        out.append(f'<path d="M{xs:.2f} {y:.2f}'
                   f'q{span/4:.2f} {-amp:.2f} {span/2:.2f} 0'
                   f'q{span/4:.2f} {amp:.2f} {span/2:.2f} 0l0 {w:.2f}'
                   f'q{-span/4:.2f} {amp:.2f} {-span/2:.2f} 0'
                   f'q{-span/4:.2f} {-amp:.2f} {-span/2:.2f} 0Z"/>')
    return "".join(out)


def p_cross(cx, cy, h, w, t):
    return (p_bar(cx, cy - h / 2, cx, cy + h / 2, t) +
            p_bar(cx - w / 2, cy - h * 0.12, cx + w / 2, cy - h * 0.12, t))


def soil(c=EARTH, y=18.8, h=2.6):
    return [(p_rect(2.2, y, 19.6, h, 0.9), c)]


def turf():
    return [(p_rect(2.2, 18.8, 19.6, 2.6, 0.9), GRASS_D)]


# ---------------------------------------------------------------------------
# The glyphs. Each is a back-to-front list of (shape, colour).
# ---------------------------------------------------------------------------
ICONS = {

    # --- graves ------------------------------------------------------------
    # A hog is turf over a stone kerb, so: green dome, visible kerb stones.
    "burial-mound": soil() + [
        (p_dome(12, 19.0, 8.4, 7.0), GRASS),
        (p_band(12, 19.0, 8.4, 1.5, 176, 4), GRASS_D),
        (p_dot(5.0, 18.6, 1.35), GRANITE), (p_dot(12, 18.6, 1.35), GRANITE),
        (p_dot(19.0, 18.6, 1.35), GRANITE)],

    "grave-field": soil() + [
        (p_dome(6.2, 19.0, 4.2, 3.6), GRASS_D),
        (p_dome(18.0, 19.0, 3.6, 3.0), GRASS_D),
        (p_dome(12.0, 19.0, 5.6, 5.0), GRASS),
        (p_dot(12, 18.5, 1.2), GRANITE)],

    "cairn": soil() + [
        (p_dot(6.4, 17.4, 2.5), GRANITE_D), (p_dot(17.6, 17.4, 2.5), GRANITE_D),
        (p_dot(12.0, 17.8, 2.7), GRANITE),
        (p_dot(9.0, 13.6, 2.4), GRANITE), (p_dot(15.0, 13.6, 2.4), GRANITE_D),
        (p_dot(12.0, 9.9, 2.4), GRANITE)],

    "fire-cracked-mound": soil() + [
        (p_dome(12, 19.0, 8.2, 6.4), GRANITE),
        (p_poly((7.4, 15.2), (9.2, 12.9), (10.2, 15.4)), GRANITE_D),
        (p_poly((13.4, 14.4), (15.6, 12.6), (16.4, 15.0)), GRANITE_D),
        (p_dot(11.8, 17.0, 1.0), FIRE)],

    # Plan view of a low kerb with a filled interior and a central stone.
    # Deliberately round, to separate it from the rectangular foundations.
    "stone-setting": [
        (p_ell(12, 13.4, 9.4, 7.2), GRASS),
        (p_ell(12, 13.4, 6.6, 4.8), GRASS_D)] + [
        (p_dot(12 + 8.8 * math.cos(math.radians(a)),
               13.4 + 6.6 * math.sin(math.radians(a)), 1.4), GRANITE)
        for a in range(0, 360, 45)] + [
        (p_dot(12, 13.4, 1.9), GRANITE_D)],

    # A flat slab in a rectangular kerb -- the pale slab is what tells it
    # apart from the other plan-view glyphs.
    "grave-flat": turf() + [
        (p_rect(4.4, 8.6, 15.2, 9.4, 1.0), GRASS_D),
        (p_rect(8.8, 11.6, 6.4, 3.4, 0.5), CREAM_D)] + [
        (p_dot(x, y, 1.3), GRANITE)
        for x, y in [(4.4, 8.6), (12.0, 8.6), (19.6, 8.6),
                     (4.4, 13.3), (19.6, 13.3),
                     (4.4, 18.0), (12.0, 18.0), (19.6, 18.0)]],

    "dolmen": soil() + [
        (p_stone(6.8, 19.0, 4.0, 8.4, 0.3), GRANITE_D),
        (p_stone(17.2, 19.0, 4.0, 8.4, -0.3), GRANITE_D),
        (p_poly((3.4, 11.2), (7.0, 8.4), (17.0, 8.4), (20.6, 11.2)), GRANITE)],

    "stone-cist": soil() + [
        (p_rect(4.6, 12.6, 14.8, 6.6, 0.6), GRANITE_D),
        (p_rect(3.4, 10.2, 17.2, 2.9, 0.7), GRANITE),
        (p_bar(9.4, 13.2, 9.4, 19.0, 1.2), GRANITE),
        (p_bar(14.6, 13.2, 14.6, 19.0, 1.2), GRANITE)],

    # Side view. A ring seen in plan reads as a cogwheel at 20 px; a row of
    # uprights with daylight between them reads immediately, and unlike the
    # dolmen there is no capstone bridging them.
    "stone-circle": soil() + [
        (p_stone(5.0, 19.0, 3.6, 8.6, 0.2), GRANITE_D),
        (p_stone(9.7, 19.0, 3.8, 11.0, 0.1), GRANITE),
        (p_stone(14.4, 19.0, 3.8, 9.8, -0.1), GRANITE_D),
        (p_stone(19.0, 19.0, 3.4, 7.8, -0.2), GRANITE)],

    "grave-marked-stone": soil() + [
        (p_dome(12, 19.0, 8.2, 4.4), GRASS),
        (p_poly((8.4, 15.2), (9.6, 6.6), (14.8, 6.2), (16.0, 15.2)), GRANITE),
        (p_poly((8.4, 15.2), (9.6, 6.6), (11.6, 6.5), (11.0, 15.2)), GRANITE_D)],

    "stone-ball": soil() + [
        (p_dot(12, 13.4, 6.8), GRANITE),
        (p_ell(12, 13.4, 6.8, 2.1), GRANITE_D),
        (p_ell(12, 13.4, 2.3, 6.8), GRANITE_D),
        (p_dot(12, 13.4, 1.5), RUNE)],

    "grave-unknown": soil() + [
        (p_dome(12, 19.0, 7.6, 6.0), GRANITE),
        (p_dot(8.8, 8.0, 1.0), GOLD), (p_dot(12.0, 6.9, 1.0), GOLD),
        (p_dot(15.2, 8.0, 1.0), GOLD)],

    "cemetery": turf() + [
        (p_poly((4.0, 18.9), (4.0, 12.6), (8.6, 12.6), (8.6, 18.9)), CREAM_D),
        (p_dome(6.3, 12.8, 2.3, 2.3), CREAM_D),
        (p_poly((15.4, 18.9), (15.4, 13.6), (19.6, 13.6), (19.6, 18.9)), CREAM_D),
        (p_dome(17.5, 13.8, 2.1, 2.1), CREAM_D),
        (p_poly((9.6, 18.9), (9.6, 11.0), (14.4, 11.0), (14.4, 18.9)), CREAM),
        (p_cross(12.0, 7.6, 6.4, 4.6, 1.7), GRANITE_D)],

    "memorial": soil() + [
        (p_poly((6.4, 18.9), (7.4, 16.4), (16.6, 16.4), (17.6, 18.9)), CREAM_D),
        (p_poly((9.4, 16.5), (10.6, 4.2), (13.4, 4.2), (14.6, 16.5)), GRANITE),
        (p_poly((9.4, 16.5), (10.6, 4.2), (12.0, 4.2), (11.9, 16.5)), GRANITE_D),
        (p_rect(10.4, 9.4, 3.2, 4.2, 0.5), GOLD)],

    "labyrinth": [
        (p_ell(12, 13.2, 9.4, 7.4), GRASS),
        (p_band(12, 13.2, 8.4, 1.6, 40, 350), GRANITE),
        (p_band(12, 13.2, 5.2, 1.6, 210, 160), GRANITE),
        (p_dot(12, 13.2, 1.5), GRANITE_D)],

    # The red is the whole point: rune bands were painted. A rainbow band with
    # staves hanging off it is what a runestone looks like from ten metres.
    "runestone": soil() + [
        (p_poly((7.0, 18.9), (8.0, 5.6), (12.0, 4.0), (16.0, 5.6),
                (17.0, 18.9)), GRANITE),
        (p_poly((7.0, 18.9), (8.0, 5.6), (12.0, 4.0), (12.0, 18.9)), GRANITE_D),
        (p_band(12.0, 13.2, 5.1, 1.6, 12, 168), RUNE),
        (p_bar(9.2, 13.4, 9.2, 16.6, 1.3), RUNE),
        (p_bar(12.0, 13.4, 12.0, 16.8, 1.3), RUNE),
        (p_bar(14.8, 13.4, 14.8, 16.6, 1.3), RUNE)],

    # A Bohuslan ship: hull with upturned prow and stem, crew as vertical
    # strokes above it. The most recognisable petroglyph in Sweden.
    "rock-carving": [
        (p_poly((2.4, 20.6), (4.2, 6.4), (19.8, 5.4), (21.6, 20.6)), GRANITE),
        (p_poly((2.4, 20.6), (4.2, 6.4), (11.2, 6.0), (11.2, 20.6)), GRANITE_D),
        (p_band(12.0, 13.4, 5.6, 1.3, 200, 340), RUNE),
        (p_bar(6.6, 13.6, 4.8, 10.6, 1.3), RUNE),
        (p_bar(17.4, 13.6, 19.2, 10.6, 1.3), RUNE)] + [
        (p_bar(x, 13.2, x, 8.6, 1.0), RUNE)
        for x in (8.2, 10.1, 12.0, 13.9, 15.8)],

    # A hand print. The elk figures do not survive the size reduction; a hand
    # does, and it is just as much a hallmalning motif.
    "rock-painting": [
        (p_poly((2.4, 20.6), (4.0, 6.2), (20.0, 5.4), (21.6, 20.6)), GRANITE),
        (p_poly((2.4, 20.6), (4.0, 6.2), (10.6, 5.8), (10.6, 20.6)), GRANITE_D),
        (p_rect(9.0, 11.6, 6.6, 6.2, 1.8), OCHRE),
        (p_bar(9.4, 8.2, 9.4, 12.4, 1.4), OCHRE),
        (p_bar(11.4, 7.2, 11.4, 12.4, 1.4), OCHRE),
        (p_bar(13.4, 7.4, 13.4, 12.4, 1.4), OCHRE),
        (p_bar(15.2, 8.6, 15.2, 12.4, 1.4), OCHRE),
        (p_bar(8.8, 13.4, 6.0, 11.0, 1.5), OCHRE)],

    "carving-historic": [
        (p_poly((3.0, 20.4), (4.6, 7.0), (19.4, 7.0), (21.0, 20.4)), GRANITE),
        (p_poly((3.0, 20.4), (4.6, 7.0), (11.0, 7.0), (11.0, 20.4)), GRANITE_D),
        (p_cross(9.4, 12.6, 7.0, 5.0, 1.8), RUNE),
        (p_bar(16.4, 19.2, 20.4, 13.6, 2.3), WOOD),
        (p_poly((14.0, 20.8), (16.6, 18.9), (17.8, 20.4), (15.2, 22.2)), IRON)],

    # --- fortifications ----------------------------------------------------
    "hillfort": soil() + [
        (p_poly((1.8, 18.9), (7.4, 6.4), (16.6, 6.4), (22.2, 18.9)), GRASS),
        (p_poly((1.8, 18.9), (7.4, 6.4), (12.0, 6.4), (12.0, 18.9)), GRASS_D),
        (p_band(12, 11.4, 6.0, 1.8, 168, 12), STONE),
        (p_band(12, 15.0, 9.0, 1.7, 172, 8), STONE_D)],

    "castle": soil() + [
        (p_rect(8.2, 11.2, 7.6, 7.8, 0.4), STONE),
        (p_rect(3.2, 9.2, 5.4, 9.8, 0.4), STONE_D),
        (p_rect(16.4, 9.2, 5.4, 9.8, 0.4), STONE_D),
        (p_tri(5.9, 9.4, 6.6, 4.2), ROOF),
        (p_tri(19.1, 9.4, 6.6, 4.2), ROOF),
        (p_rect(10.6, 14.6, 2.8, 4.4, 1.4), IRON_D),
        (p_rect(8.2, 10.0, 1.9, 1.6), STONE), (p_rect(11.1, 10.0, 1.9, 1.6), STONE),
        (p_rect(14.0, 10.0, 1.8, 1.6), STONE)],

    "manor": soil() + [
        (p_rect(3.4, 11.8, 17.2, 7.2, 0.4), CREAM),
        (p_poly((2.4, 12.0), (12.0, 7.4), (21.6, 12.0)), ROOF),
        (p_dome(12.0, 7.6, 2.6, 3.0), GOLD),
        (p_bar(12.0, 2.4, 12.0, 4.8, 1.2), GOLD),
        (p_rect(5.6, 14.2, 2.6, 3.2, 0.4), STONE_D),
        (p_rect(10.7, 14.2, 2.6, 4.8, 0.4), IRON_D),
        (p_rect(15.8, 14.2, 2.6, 3.2, 0.4), STONE_D)],

    # Star fort, in plan -- the shape is unmistakable and needs no detail.
    "bastion": [
        (p_poly((12, 2.6), (16.4, 6.0), (21.4, 8.4), (19.4, 13.8),
                (20.2, 19.6), (14.6, 19.0), (12, 21.6), (9.4, 19.0),
                (3.8, 19.6), (4.6, 13.8), (2.6, 8.4), (7.6, 6.0)), STONE),
        (p_ell(12, 12.4, 5.4, 5.0), GRASS),
        (p_dot(12, 12.4, 1.6), STONE_D)],

    "town-wall": soil() + [
        (p_rect(2.6, 10.6, 18.8, 8.4, 0.4), CREAM),
        (p_rect(2.6, 10.6, 6.2, 8.4, 0.4), CREAM_D),
        (p_poly((9.4, 18.9), (9.4, 14.2), (14.6, 14.2), (14.6, 18.9)), IRON_D),
        (p_dome(12.0, 14.4, 2.6, 2.6), IRON_D)] + [
        (p_rect(x, 8.4, 2.6, 2.4), STONE) for x in (2.6, 7.2, 11.8, 16.4)],

    "military": soil() + [
        (p_dome(12, 19.0, 9.0, 7.2), IRON),
        (p_band(12, 19.0, 9.0, 1.8, 176, 4), IRON_D),
        (p_rect(6.8, 13.2, 10.4, 2.4, 0.6), STONE_D)],

    "trench": soil() + [
        (p_poly((2.2, 18.9), (5.0, 13.6), (19.0, 13.6), (21.8, 18.9)), EARTH_D)] + [
        (p_bar(x, 14.0, x - 0.9, 8.0, 1.6), WOOD) for x in (7.0, 12.0, 17.0)] + [
        (p_bar(4.6, 10.8, 19.4, 9.0, 1.4), WOOD_D)],

    # --- religious ---------------------------------------------------------
    "church": turf() + [
        (p_rect(4.2, 12.4, 11.0, 6.5, 0.3), CREAM),
        (p_poly((3.2, 12.6), (9.7, 8.6), (16.2, 12.6)), ROOF),
        (p_rect(15.6, 8.6, 4.6, 10.3, 0.3), CREAM_D),
        (p_tri(17.9, 8.8, 5.4, 3.6), ROOF_D),
        (p_cross(17.9, 3.4, 4.4, 3.2, 1.3), GOLD),
        (p_rect(8.4, 15.0, 2.6, 3.9, 1.3), IRON_D),
        (p_dot(17.9, 12.6, 1.3), IRON_D)],

    "monastery": turf() + [
        (p_rect(2.8, 11.6, 18.4, 7.3, 0.3), CREAM),
        (p_poly((2.0, 11.8), (12.0, 7.4), (22.0, 11.8)), ROOF)] + [
        (p_poly((x, 18.9), (x, 15.0), (x + 3.4, 15.0), (x + 3.4, 18.9)), CREAM_D)
        for x in (4.2, 10.3, 16.4)] + [
        (p_dome(x + 1.7, 15.2, 1.7, 1.9), CREAM_D) for x in (4.2, 10.3, 16.4)] + [
        (p_cross(12.0, 3.8, 4.6, 3.4, 1.3), GOLD)],

    "gallows": turf() + [
        (p_bar(6.4, 18.9, 6.4, 4.6, 2.2), WOOD),
        (p_bar(5.3, 5.6, 17.6, 5.6, 2.2), WOOD),
        (p_bar(6.6, 8.4, 10.4, 5.8, 1.6), WOOD_D),
        (p_ring(15.4, 11.4, 2.7, 1.3), CREAM_D)],

    "spring": [
        (p_ring(12, 13.4, 8.8, 2.8), GRANITE),
        (p_dot(12, 13.4, 6.2), WATER),
        (p_wave(12.0, 6.6, 17.4, 0.9, 1.3, 1), WATER_D),
        (p_wave(15.6, 6.8, 17.2, 0.8, 1.2, 1), WATER_D),
        (p_dot(9.6, 10.6, 1.1), SNOW)],

    "sacred-nature": turf() + [
        (p_bar(16.6, 18.9, 16.6, 12.6, 1.8), WOOD_D),
        (p_dot(16.6, 10.4, 3.9), GRASS),
        (p_poly((3.0, 18.9), (4.4, 9.4), (9.0, 7.6), (12.6, 10.0),
                (12.0, 18.9)), GRANITE),
        (p_poly((3.0, 18.9), (4.4, 9.4), (7.4, 8.2), (7.0, 18.9)), GRANITE_D),
        (p_cross(8.0, 4.2, 4.2, 4.2, 1.5), GOLD)],

    "offering-cairn": turf() + [
        (p_dot(7.4, 17.2, 2.6), GRANITE_D), (p_dot(16.6, 17.2, 2.6), GRANITE_D),
        (p_dot(12.0, 17.6, 2.8), GRANITE),
        (p_dot(9.6, 13.2, 2.5), GRANITE), (p_dot(14.6, 13.4, 2.5), GRANITE_D),
        (p_dot(12.0, 9.6, 2.4), GRANITE),
        (p_dot(12.0, 4.6, 1.9), GOLD),
        (p_bar(12.0, 6.2, 12.0, 7.4, 1.2), GOLD)],

    # --- settlement --------------------------------------------------------
    "settlement": turf() + [
        (p_poly((3.2, 18.9), (10.0, 6.4), (16.8, 18.9)), WOOD),
        (p_poly((3.2, 18.9), (10.0, 6.4), (10.0, 18.9)), WOOD_D),
        (p_poly((8.0, 18.9), (10.0, 12.4), (12.0, 18.9)), IRON_D),
        (p_dot(19.4, 17.2, 2.2), FIRE),
        (p_dot(19.4, 17.2, 1.0), GOLD)],

    "settlement-grave": turf() + [
        (p_dome(17.4, 18.9, 5.4, 4.6), GRASS),
        (p_poly((2.6, 18.9), (8.0, 7.6), (13.4, 18.9)), WOOD),
        (p_poly((2.6, 18.9), (8.0, 7.6), (8.0, 18.9)), WOOD_D),
        (p_dot(17.4, 18.4, 1.1), GRANITE)],

    # Rectangular wall footing with a gap for the doorway and a hearth inside.
    # Brown floor, not green, so it does not read as another grave.
    "house-foundation": turf() + [
        (p_rect(4.0, 8.2, 16.0, 9.8, 0.8), EARTH),
        (p_rect(6.2, 10.4, 11.6, 5.4, 0.6), EARTH_D)] + [
        (p_dot(x, y, 1.35), GRANITE)
        for x, y in [(4.0, 8.2), (9.3, 8.2), (14.7, 8.2), (20.0, 8.2),
                     (4.0, 13.1), (20.0, 13.1),
                     (4.0, 18.0), (7.6, 18.0), (16.4, 18.0), (20.0, 18.0)]] + [
        (p_dot(12.0, 13.2, 1.8), FIRE)],

    "farmstead": turf() + [
        (p_rect(12.6, 12.6, 8.4, 6.3, 0.3), FALU),
        (p_poly((11.4, 12.8), (16.8, 9.0), (22.2, 12.8)), ROOF_D),
        (p_rect(3.0, 14.0, 7.6, 4.9, 0.3), FALU),
        (p_poly((2.0, 14.2), (6.8, 10.8), (11.6, 14.2)), ROOF_D),
        (p_rect(5.4, 16.2, 2.4, 2.7, 0.3), CREAM),
        (p_rect(15.6, 15.0, 2.4, 3.9, 0.3), CREAM)],

    "summer-farm": turf() + [
        (p_rect(4.2, 12.8, 11.4, 6.1, 0.3), FALU),
        (p_poly((3.0, 13.0), (9.9, 8.8), (16.8, 13.0)), ROOF_D),
        (p_rect(8.4, 15.2, 3.0, 3.7, 0.3), CREAM),
        (p_bar(18.0, 18.9, 18.0, 12.0, 1.5), WOOD),
        (p_bar(21.4, 18.9, 21.4, 12.6, 1.5), WOOD),
        (p_bar(16.6, 13.6, 22.2, 14.2, 1.4), WOOD_D),
        (p_bar(16.6, 16.6, 22.2, 17.2, 1.4), WOOD_D)],

    # A lavvu / kata, not a generic hut -- the Sami classes are a distinct set.
    "sami-hut": turf() + [
        (p_poly((3.6, 18.9), (11.4, 5.0), (19.2, 18.9)), CREAM_D),
        (p_poly((3.6, 18.9), (11.4, 5.0), (11.4, 18.9)), STONE_D),
        (p_bar(9.6, 6.2, 8.0, 2.9, 1.3), WOOD),
        (p_bar(13.2, 6.2, 14.8, 2.9, 1.3), WOOD),
        (p_poly((9.0, 18.9), (11.4, 12.0), (13.8, 18.9)), IRON_D)],

    "hearth": [
        (p_ell(12, 13.4, 9.4, 7.2), EARTH),
        (p_dot(12, 13.4, 5.4), EARTH_D)] + [
        (p_dot(12 + 7.6 * math.cos(math.radians(a)),
               13.4 + 5.9 * math.sin(math.radians(a)), 1.6), GRANITE)
        for a in range(0, 360, 51)] + [
        (p_flame(12.0, 16.2, 5.6), FIRE)],

    "cooking-pit": soil() + [
        (p_poly((3.4, 12.0), (20.6, 12.0), (17.0, 19.4), (7.0, 19.4)), EARTH_D),
        (p_dot(6.0, 12.6, 1.6), GRANITE), (p_dot(12.0, 12.2, 1.6), GRANITE),
        (p_dot(18.0, 12.6, 1.6), GRANITE),
        (p_dot(9.2, 16.4, 1.5), GRANITE_D), (p_dot(14.8, 16.4, 1.5), GRANITE_D),
        (p_flame(12.0, 9.8, 5.2), FIRE)],

    "storage-pit": soil() + [
        (p_poly((4.0, 11.4), (20.0, 11.4), (16.6, 19.4), (7.4, 19.4)), EARTH_D),
        (p_ell(12, 11.6, 8.0, 2.4), EARTH),
        (p_dot(9.6, 15.0, 2.3), CREAM_D), (p_dot(14.4, 15.4, 2.1), CREAM),
        (p_dot(11.8, 17.6, 2.0), CREAM_D)],

    # Tomtning: a horseshoe wall open on the lee side. The gap is the glyph.
    "hut-platform": [
        (p_ell(12, 13.6, 9.6, 7.2), GRASS),
        (p_ell(12, 13.2, 6.2, 4.6), GRASS_D)] + [
        (p_dot(12 + 8.6 * math.cos(math.radians(a)),
               13.4 + 6.4 * math.sin(math.radians(a)), 1.45), GRANITE)
        for a in (185, 215, 245, 275, 305, 335, 355)],

    "enclosure": turf() + [
        (p_poly((2.4, 16.6), (11.6, 11.0), (21.6, 13.4), (21.6, 16.2),
                (11.6, 13.8), (2.4, 19.0)), GRANITE),
        (p_poly((2.4, 19.0), (11.6, 13.8), (11.6, 16.4), (2.4, 21.0)), GRANITE_D),
        (p_dot(6.6, 16.0, 1.3), GRANITE_D), (p_dot(16.4, 13.6, 1.3), GRANITE_D)],

    "terrace": [
        (p_poly((2.2, 20.4), (2.2, 15.2), (9.0, 15.2), (9.0, 10.4),
                (15.8, 10.4), (15.8, 5.6), (21.8, 5.6), (21.8, 20.4)), GRASS),
        (p_rect(2.2, 15.2, 6.8, 1.9), GRANITE),
        (p_rect(9.0, 10.4, 6.8, 1.9), GRANITE),
        (p_rect(15.8, 5.6, 6.0, 1.9), GRANITE)],

    "fossil-field": [
        (p_rect(2.2, 8.2, 19.6, 13.0, 0.8), EARTH)] + [
        (p_bar(2.6, y, 21.4, y, 1.7), EARTH_D) for y in (10.6, 14.4, 18.2)] + [
        (p_dot(16.4, 6.0, 2.2), GRANITE), (p_dot(19.4, 6.6, 1.9), GRANITE_D),
        (p_dot(18.0, 3.4, 1.9), GRANITE)],

    "clearance-cairn": [
        (p_rect(2.2, 12.0, 19.6, 9.2, 0.8), EARTH)] + [
        (p_bar(2.6, y, 21.4, y, 1.5), EARTH_D) for y in (14.6, 18.4)] + [
        (p_dot(8.0, 9.6, 2.5), GRANITE_D), (p_dot(15.4, 9.6, 2.5), GRANITE_D),
        (p_dot(11.7, 10.0, 2.7), GRANITE), (p_dot(11.7, 5.8, 2.5), GRANITE)],

    "ditch": [
        (p_rect(2.2, 7.4, 19.6, 13.8, 0.8), EARTH),
        (p_poly((5.0, 7.6), (19.0, 7.6), (14.4, 19.6), (9.6, 19.6)), EARTH_D),
        (p_poly((7.4, 14.0), (16.6, 14.0), (14.4, 19.6), (9.6, 19.6)), WATER),
        (p_bar(8.6, 16.8, 15.4, 16.8, 1.3), WATER_D)],

    # Section: impounded water on one side, an earth bank with a stone crest
    # holding it, dry ground on the other.
    "dam": [
        (p_rect(2.2, 2.8, 19.6, 18.4, 0.8), GRASS_D),
        (p_rect(2.2, 6.2, 7.6, 15.0), WATER),
        (p_wave(7.4, 2.4, 9.8, 0.8, 1.2, 1), WATER_D),
        (p_wave(13.0, 2.4, 9.8, 0.8, 1.2, 1), WATER_D),
        (p_poly((7.2, 21.2), (10.4, 5.4), (14.0, 5.4), (17.2, 21.2)), EARTH),
        (p_poly((7.2, 21.2), (10.4, 5.4), (12.2, 5.4), (12.2, 21.2)), EARTH_D),
        (p_rect(9.8, 4.0, 4.8, 1.9, 0.4), GRANITE)],

    # --- mining, iron, industry -------------------------------------------
    "mine": [
        (p_poly((2.2, 21.0), (4.6, 8.2), (19.4, 8.2), (21.8, 21.0)), GRANITE),
        (p_poly((2.2, 21.0), (4.6, 8.2), (12.0, 8.2), (12.0, 21.0)), GRANITE_D),
        (p_poly((8.0, 21.0), (8.0, 15.0), (16.0, 15.0), (16.0, 21.0)), IRON_D),
        (p_dome(12.0, 15.2, 4.0, 3.6), IRON_D),
        (p_bar(7.4, 8.4, 12.0, 2.8, 1.7), IRON),
        (p_bar(16.6, 8.4, 12.0, 2.8, 1.7), IRON),
        (p_dot(12.0, 2.8, 1.9), GOLD)],

    "quarry": [
        (p_poly((2.2, 21.0), (2.2, 11.6), (8.6, 11.6), (8.6, 8.0),
                (21.8, 8.0), (21.8, 21.0)), GRANITE),
        (p_rect(2.2, 11.6, 6.4, 2.0), GRANITE_D),
        (p_rect(8.6, 8.0, 13.2, 2.0), GRANITE_D),
        (p_bar(13.0, 18.6, 19.4, 12.4, 2.6), WOOD),
        (p_poly((10.4, 20.6), (14.0, 17.2), (15.4, 18.8), (11.8, 22.2)), IRON)],

    "furnace": soil() + [
        (p_poly((6.0, 18.9), (7.4, 6.4), (16.6, 6.4), (18.0, 18.9)), STONE),
        (p_poly((6.0, 18.9), (7.4, 6.4), (12.0, 6.4), (12.0, 18.9)), STONE_D),
        (p_dome(12.0, 18.9, 3.4, 4.2), IRON_D),
        (p_flame(12.0, 18.4, 4.6), FIRE),
        (p_dot(12.0, 3.6, 2.3), STONE_D), (p_dot(15.8, 2.4, 1.7), STONE)],

    "bloomery": soil() + [
        (p_dome(11.0, 18.9, 6.0, 8.2), OCHRE),
        (p_poly((5.0, 18.9), (5.6, 12.0), (11.0, 10.7), (11.0, 18.9)), OCHRE_D),
        (p_rect(8.6, 15.0, 4.8, 3.9, 0.6), IRON_D),
        (p_flame(11.0, 18.6, 4.0), FIRE),
        (p_poly((17.0, 18.9), (17.0, 13.4), (21.6, 11.6), (21.6, 18.9)), WOOD),
        (p_bar(15.2, 16.0, 18.0, 16.0, 1.5), WOOD_D)],

    # A proper anvil: horn, waist, base. Plus a hammer and sparks.
    "forge": soil() + [
        (p_rect(4.4, 10.4, 15.2, 2.3, 0.3), IRON),
        (p_poly((4.6, 10.4), (1.6, 11.6), (4.6, 12.7)), IRON),
        (p_rect(9.8, 12.7, 4.4, 3.2), IRON_D),
        (p_rect(6.4, 15.9, 11.2, 3.0, 0.4), IRON),
        (p_bar(16.6, 7.6, 19.6, 12.2, 1.7), WOOD),
        (p_rect(13.4, 4.2, 5.6, 2.9, 0.4), IRON_D),
        (p_dot(8.0, 8.0, 1.5), FIRE), (p_dot(11.4, 6.6, 1.1), GOLD),
        (p_dot(5.4, 6.2, 1.0), GOLD)],

    "kiln": soil() + [
        (p_dome(12.0, 18.9, 8.4, 9.4), CREAM),
        (p_poly((3.6, 18.9), (4.6, 10.4), (12.0, 9.5), (12.0, 18.9)), CREAM_D),
        (p_band(12.0, 18.9, 8.4, 1.6, 176, 4), CREAM_D),
        (p_rect(9.0, 14.6, 6.0, 4.3, 0.6), IRON_D),
        (p_flame(12.0, 18.4, 4.2), FIRE)],

    "charcoal": soil() + [
        (p_dome(12.0, 18.9, 8.6, 6.8), IRON),
        (p_band(12.0, 18.9, 8.6, 1.7, 176, 4), IRON_D),
        (p_flame(12.0, 12.6, 3.8), FIRE),
        (p_dot(15.6, 6.6, 2.1), STONE), (p_dot(18.6, 4.2, 1.6), STONE_D),
        (p_dot(8.6, 5.6, 1.6), STONE_D)],

    "mill": [
        (p_rect(2.2, 15.6, 19.6, 5.6, 0.6), WATER),
        (p_wave(16.4, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (p_rect(3.4, 6.4, 10.4, 10.0, 0.4), FALU),
        (p_poly((2.2, 6.6), (8.6, 2.6), (15.0, 6.6)), ROOF_D),
        (p_rect(6.2, 10.6, 3.0, 3.4, 0.3), CREAM),
        (p_ring(17.4, 14.0, 5.0, 1.7), WOOD),
        (p_bar(12.4, 14.0, 22.4, 14.0, 1.5), WOOD_D),
        (p_bar(17.4, 9.0, 17.4, 19.0, 1.5), WOOD_D)],

    "industry": soil() + [
        (p_rect(2.6, 12.4, 12.4, 6.5, 0.4), CREAM),
        (p_rect(2.6, 12.4, 4.2, 6.5, 0.4), CREAM_D),
        (p_poly((2.6, 12.6), (5.7, 9.8), (8.8, 12.6)), ROOF),
        (p_poly((8.8, 12.6), (11.9, 9.8), (15.0, 12.6)), ROOF),
        (p_rect(16.2, 5.2, 4.4, 13.7, 0.4), IRON),
        (p_rect(16.2, 5.2, 1.8, 13.7, 0.4), IRON_D),
        (p_dot(18.4, 3.0, 2.1), STONE), (p_dot(21.2, 1.8, 1.5), STONE_D)],

    "log-floating": [
        (p_rect(2.2, 8.0, 19.6, 13.2, 0.6), WATER),
        (p_wave(9.4, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (p_rect(3.0, 12.2, 18.0, 3.0, 1.5), WOOD),
        (p_rect(5.4, 16.4, 14.4, 3.0, 1.5), WOOD_D),
        (p_dot(3.0, 13.7, 1.5), WOOD_D), (p_dot(21.0, 13.7, 1.5), WOOD_D),
        (p_dot(5.4, 17.9, 1.5), WOOD), (p_dot(19.8, 17.9, 1.5), WOOD)],

    # --- roads, boundaries, water crossings -------------------------------
    "road": [
        (p_rect(2.2, 2.6, 19.6, 18.8, 0.8), GRASS),
        (f'<path d="M6.4 21.4q0-8.0 5.6-10.0q5.6-2.0 5.6-8.8h4.2'
         f'q0 9.6-6.8 12.4q-4.4 1.8-4.4 6.4Z"/>', EARTH),
        (f'<path d="M9.4 21.4q0.4-5.6 4.2-7.4"/>', EARTH_D),
        (p_dot(4.6, 12.0, 1.6), GRANITE), (p_dot(19.4, 17.6, 1.6), GRANITE),
        (p_dot(6.6, 6.4, 1.6), GRANITE_D)],

    "milestone": turf() + [
        (p_poly((7.6, 18.9), (8.4, 7.0), (15.6, 7.0), (16.4, 18.9)), CREAM),
        (p_poly((7.6, 18.9), (8.4, 7.0), (12.0, 7.0), (12.0, 18.9)), CREAM_D),
        (p_dome(12.0, 7.2, 3.8, 3.2), CREAM),
        (p_rect(9.8, 11.0, 4.4, 5.2, 0.6), GOLD),
        (p_bar(11.0, 12.4, 11.0, 14.8, 1.3), IRON_D),
        (p_bar(13.0, 12.4, 13.0, 14.8, 1.3), IRON_D)],

    "boundary-stone": turf() + [
        (p_poly((6.8, 18.9), (8.6, 5.2), (15.4, 5.2), (17.2, 18.9)), GRANITE),
        (p_poly((6.8, 18.9), (8.6, 5.2), (12.0, 5.2), (12.0, 18.9)), GRANITE_D),
        (p_cross(12.0, 11.4, 7.4, 5.4, 1.9), RUNE),
        (p_dot(3.4, 18.0, 1.3), GRANITE_D), (p_dot(20.6, 18.0, 1.3), GRANITE_D)],

    "bridge": [
        (p_rect(2.2, 13.0, 19.6, 8.2, 0.6), WATER),
        (p_wave(15.0, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (f'<path d="M2.2 16.8V13.4q4.8 0 4.8-4.0 0-2.6 5.0-2.6t5.0 2.6'
         f'q0 4.0 4.8 4.0v3.4q-8.0 0-8.0-6.2 0-1.4-1.8-1.4t-1.8 1.4'
         f'q0 6.2-8.0 6.2Z"/>', STONE),
        (p_rect(2.2, 5.6, 19.6, 2.6, 0.5), STONE_D)],

    "ford": [
        (p_rect(2.2, 7.0, 19.6, 14.2, 0.6), WATER),
        (p_wave(9.6, 2.4, 21.6, 1.0, 1.4, 2), WATER_D),
        (p_wave(18.0, 2.4, 21.6, 1.0, 1.4, 2), WATER_D),
        (p_dot(6.0, 14.0, 2.7), GRANITE), (p_dot(12.0, 12.6, 2.5), GRANITE_D),
        (p_dot(17.8, 14.4, 2.7), GRANITE)],

    "canal": [
        (p_rect(2.2, 2.6, 19.6, 18.8, 0.8), GRASS_D),
        (p_rect(6.6, 2.6, 10.8, 18.8), WATER),
        (p_wave(8.0, 6.8, 17.2, 0.9, 1.3, 1), WATER_D),
        (p_wave(16.0, 6.8, 17.2, 0.9, 1.3, 1), WATER_D),
        (p_rect(5.0, 11.0, 4.4, 2.6, 0.5), WOOD),
        (p_rect(14.6, 11.0, 4.4, 2.6, 0.5), WOOD),
        (p_dot(6.4, 12.3, 1.6), WOOD_D), (p_dot(17.6, 12.3, 1.6), WOOD_D)],

    "harbour": [
        (p_rect(2.2, 12.4, 19.6, 8.8, 0.6), WATER),
        (p_wave(15.4, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (p_rect(2.2, 9.0, 14.0, 4.0, 0.4), STONE),
        (p_rect(2.2, 12.0, 14.0, 1.6), STONE_D),
        (p_rect(5.6, 4.6, 2.8, 4.6, 1.2), IRON),
        (p_dome(7.0, 4.8, 2.1, 1.7), IRON_D),
        (f'<path d="M8.8 6.0q5.4 0.6 5.4 4.6h-2.6q0-2.2-2.8-2.6Z"/>', WOOD_D)],

    # A slipway: rails running down into the water, boat still on the rollers.
    "boat-landing": [
        (p_rect(2.2, 13.6, 19.6, 7.6, 0.6), WATER),
        (p_wave(16.6, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (p_bar(2.6, 10.0, 21.4, 16.4, 2.2), WOOD),
        (p_bar(2.6, 12.6, 21.4, 19.0, 1.6), WOOD_D),
        (p_poly((5.4, 8.2), (14.2, 10.4), (13.0, 13.0), (5.6, 11.0)), FALU),
        (p_bar(9.0, 9.2, 8.2, 4.4, 1.4), WOOD_D),
        (p_poly((9.2, 4.8), (14.4, 7.0), (9.4, 8.4)), CREAM)],

    "shipwreck": [
        (p_rect(2.2, 6.4, 19.6, 14.8, 0.6), WATER),
        (p_wave(8.4, 2.4, 21.6, 1.0, 1.4, 2), WATER_D),
        (p_poly((3.4, 13.8), (20.6, 10.8), (19.2, 17.0), (4.8, 19.4)), WOOD_D),
        (p_bar(7.4, 13.2, 7.8, 18.9, 1.2), WOOD),
        (p_bar(12.0, 12.4, 12.4, 18.2, 1.2), WOOD),
        (p_bar(16.6, 11.6, 17.0, 17.4, 1.2), WOOD),
        (p_bar(9.0, 12.6, 5.4, 6.4, 1.7), WOOD)],

    "fishing-village": [
        (p_rect(2.2, 15.0, 19.6, 6.2, 0.6), WATER),
        (p_wave(17.4, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (p_rect(2.8, 8.8, 10.4, 6.4, 0.3), FALU),
        (p_poly((1.8, 9.0), (8.0, 5.0), (14.2, 9.0)), ROOF_D),
        (p_rect(5.4, 11.4, 2.8, 3.8, 0.3), CREAM),
        (p_bar(16.0, 15.2, 16.0, 6.6, 1.5), WOOD),
        (p_bar(21.0, 15.2, 21.0, 8.0, 1.5), WOOD),
        (p_bar(14.6, 8.2, 22.2, 9.4, 1.4), WOOD_D),
        (p_bar(14.6, 11.8, 22.2, 13.0, 1.4), WOOD_D)],

    "lighthouse": [
        (p_rect(2.2, 16.6, 19.6, 4.6, 0.6), WATER),
        (p_wave(18.4, 2.4, 21.6, 0.8, 1.2, 2), WATER_D),
        (p_poly((7.0, 16.8), (9.0, 6.6), (15.0, 6.6), (17.0, 16.8)), CREAM),
        (p_poly((8.0, 11.8), (16.0, 11.8), (16.4, 14.2), (7.6, 14.2)), ROOF),
        (p_poly((7.0, 16.8), (9.0, 6.6), (12.0, 6.6), (12.0, 16.8)), CREAM_D),
        (p_rect(9.2, 3.2, 5.6, 3.6, 0.5), IRON),
        (p_dot(12.0, 5.0, 1.6), GOLD),
        (p_bar(15.4, 4.0, 20.6, 2.6, 1.5), GOLD),
        (p_bar(15.4, 6.0, 20.6, 7.4, 1.5), GOLD)],

    "sea-mark": [
        (p_rect(2.2, 15.4, 19.6, 5.8, 0.6), WATER),
        (p_wave(17.0, 2.4, 21.6, 0.9, 1.3, 2), WATER_D),
        (p_dome(11.0, 15.6, 7.4, 4.6), GRANITE),
        (p_dot(7.4, 13.6, 2.0), GRANITE_D), (p_dot(14.2, 13.4, 2.0), GRANITE_D),
        (p_bar(11.0, 15.0, 11.0, 3.4, 1.9), WOOD),
        (p_poly((11.6, 3.6), (18.2, 6.0), (11.6, 8.6)), FALU)],

    "beacon": turf() + [
        (p_dome(12.0, 18.9, 9.0, 4.0), GRASS),
        (p_bar(7.0, 18.2, 14.0, 8.0, 1.8), WOOD),
        (p_bar(17.0, 18.2, 10.0, 8.0, 1.8), WOOD_D),
        (p_bar(6.6, 14.6, 17.4, 14.6, 1.6), WOOD),
        (p_flame(12.0, 9.2, 7.0), FIRE),
        (p_flame(12.0, 8.4, 3.8), GOLD)],

    "pitfall-trap": [
        (p_rect(2.2, 8.6, 19.6, 12.6, 0.8), EARTH),
        (p_poly((6.0, 8.8), (18.0, 8.8), (15.4, 19.8), (8.6, 19.8)), EARTH_D),
        (p_bar(9.6, 19.4, 10.6, 11.0, 1.5), WOOD),
        (p_bar(14.4, 19.4, 13.4, 11.0, 1.5), WOOD),
        (p_bar(12.0, 19.4, 12.0, 10.4, 1.5), WOOD_D),
        (p_bar(4.4, 7.4, 19.6, 7.4, 1.6), GRASS_D)],

    "pitfall-system": [
        (p_rect(2.2, 6.0, 19.6, 15.2, 0.8), EARTH)] + [
        (p_ell(x, y, 3.6, 2.8), EARTH_D) for x, y in
        [(6.6, 9.6), (16.0, 8.0), (8.8, 17.0), (18.0, 15.4)]] + [
        (p_bar(9.4, 10.4, 13.6, 9.0, 1.4), WOOD_D),
        (p_bar(11.4, 16.0, 15.4, 15.0, 1.4), WOOD_D),
        (p_dot(6.6, 9.6, 1.3), WOOD), (p_dot(16.0, 8.0, 1.3), WOOD),
        (p_dot(8.8, 17.0, 1.3), WOOD), (p_dot(18.0, 15.4, 1.3), WOOD)],

    "forestry": turf() + [
        (p_bar(5.4, 18.9, 5.4, 13.6, 2.4), WOOD_D),
        (p_ell(5.4, 13.4, 2.4, 1.2), WOOD),
        (p_bar(11.6, 18.9, 11.6, 15.0, 2.2), WOOD_D),
        (p_ell(11.6, 14.8, 2.2, 1.1), WOOD),
        (p_bar(17.4, 18.9, 17.4, 11.0, 1.9), WOOD_D),
        (p_dot(17.4, 7.6, 3.9), GRASS),
        (p_bar(6.0, 11.0, 12.6, 6.8, 2.4), WOOD),
        (p_poly((4.0, 13.4), (7.6, 9.6), (9.4, 11.6), (5.8, 15.4)), IRON)],

    # --- misc --------------------------------------------------------------
    "town-layer": [
        (p_rect(2.2, 4.0, 19.6, 17.2, 0.8), CREAM_D),
        (p_rect(2.2, 9.0, 19.6, 4.2), EARTH),
        (p_rect(2.2, 13.2, 19.6, 4.2), EARTH_D),
        (p_rect(2.2, 17.4, 19.6, 3.8), GRANITE_D),
        (p_dot(8.0, 11.0, 1.5), CREAM), (p_dot(15.4, 15.2, 1.5), CREAM),
        (f'<path d="M11.0 5.6q4.0 0 4.0 3.0h-2.2q0-1.2-1.8-1.2Z"/>', FALU)],

    "park": [
        (p_rect(2.2, 2.6, 19.6, 18.8, 0.8), GRASS),
        (p_rect(2.2, 10.8, 19.6, 2.6), CREAM_D),
        (p_rect(10.8, 2.6, 2.6, 18.8), CREAM_D),
        (p_ell(6.6, 6.6, 3.4, 3.0), GRASS_D),
        (p_ell(17.4, 17.4, 3.4, 3.0), GRASS_D),
        (p_bar(17.4, 6.0, 17.4, 9.0, 1.6), WOOD_D),
        (p_dot(17.4, 5.4, 3.2), GRASS_D),
        (p_dot(6.6, 17.0, 2.0), FALU), (p_dot(6.6, 17.0, 0.9), GOLD)],

    "well": turf() + [
        (p_bar(6.0, 18.0, 6.0, 8.0, 1.7), WOOD),
        (p_bar(18.0, 18.0, 18.0, 8.0, 1.7), WOOD),
        (p_poly((3.4, 8.6), (12.0, 3.4), (20.6, 8.6)), ROOF_D),
        (p_rect(6.6, 14.0, 10.8, 4.9, 0.5), STONE),
        (p_rect(6.6, 14.0, 10.8, 1.8, 0.5), STONE_D),
        (p_dot(12.0, 12.0, 2.1), WATER),
        (p_bar(12.0, 8.8, 12.0, 11.2, 1.2), IRON_D)],

    "unknown": turf() + [
        (p_poly((4.6, 18.9), (6.0, 8.4), (12.0, 6.0), (18.0, 8.4),
                (19.4, 18.9)), GRANITE),
        (p_poly((4.6, 18.9), (6.0, 8.4), (12.0, 6.0), (12.0, 18.9)), GRANITE_D),
        (f'<path d="M9.4 12.0q0-2.9 2.8-2.9 2.6 0 2.6 2.3 0 1.5-1.4 2.3'
         f'-0.9 0.5-0.9 1.5h-2.0q0-1.9 1.2-2.7 0.9-0.6 0.9-1.2'
         f'0-0.6-0.6-0.6-0.7 0-0.7 1.0Z"/>', GOLD),
        (p_dot(12.0, 17.0, 1.2), GOLD)],

    # A potsherd: the rim survives, the body is broken away.
    "finds": soil() + [
        (p_dome(12.0, 19.0, 8.6, 3.2), EARTH_D),
        (p_poly((8.0, 16.6), (7.2, 11.6), (16.8, 11.6), (16.0, 16.6),
                (13.6, 15.2), (12.0, 16.8), (10.2, 15.0)), CREAM),
        (p_rect(6.2, 9.8, 11.6, 2.0, 0.5), CREAM_D),
        (p_dot(19.0, 6.0, 1.8), GOLD),
        (p_bar(19.0, 2.6, 19.0, 4.0, 1.2), GOLD),
        (p_bar(21.6, 4.4, 20.6, 5.2, 1.2), GOLD)],
}


# ---------------------------------------------------------------------------
# Every dominant_class the pipeline can emit -> a glyph. All 153 of them, so
# nothing lands on a fallback; the map has no "?" pins.
#
# Where classes share a glyph it is because they are the same thing to a
# visitor. Hyttomrade / Hyttlamning / Hytt- och hammaromrade are three
# administrative shades of "there was a blast furnace here", and no drawing
# survives at 16 px that could tell them apart anyway. The frequent classes
# all get their own.
# ---------------------------------------------------------------------------
CLASS_ICON = {
    # graves
    "Hög": "burial-mound",
    "Gravfält": "grave-field",
    "Röse": "cairn",
    "Skärvstenshög": "fire-cracked-mound",
    "Stensättning": "stone-setting",
    "Flatmarksgrav": "grave-flat",
    "Gravhägnad": "grave-flat",
    "Stenkammargrav": "dolmen",
    "Järnåldersdös": "dolmen",
    "Stenkistgrav": "stone-cist",
    "Stenkrets/stenrad": "stone-circle",
    "Stenring": "stone-circle",
    "Grav markerad av sten/block": "grave-marked-stone",
    "Gravklot": "stone-ball",
    "Grav - uppgift om typ saknas": "grave-unknown",
    "Grav övrig": "grave-unknown",
    "Begravningsplats": "cemetery",
    "Begravningsplats enstaka": "cemetery",
    "Gravvård": "cemetery",
    "Minnesmärke": "memorial",
    "Labyrint": "labyrinth",
    "Grav- och boplatsområde": "settlement-grave",

    # rune stones and rock art
    "Runristning": "runestone",
    "Hällristning": "rock-carving",
    "Bildristning": "rock-carving",
    "Hällmålning": "rock-painting",
    "Ristning, medeltid/historisk tid": "carving-historic",
    "Kompassros/väderstreckspil": "carving-historic",

    # fortifications
    "Fornborg": "hillfort",
    "Borg": "castle",
    "Slott/herresäte": "manor",
    "Fästning/skans": "bastion",
    "Stadsbefästning": "bastion",
    "Stadsvall/stadsmur": "town-wall",
    "Vallanläggning": "town-wall",
    "Militär anläggning övrig": "military",
    "Område med militära anläggningar": "military",
    "Militär mötesplats": "military",
    "Slagfält": "military",
    "Luftfarkost": "military",
    "Stridsvärn": "trench",
    "Spärranordning": "trench",

    # religious and traditional
    "Kyrka/kapell": "church",
    "Kloster": "monastery",
    "Avrättningsplats": "gallows",
    "Källa med tradition": "spring",
    "Brunn/kallkälla": "well",
    "Naturföremål/-bildning med bruk, tradition eller namn": "sacred-nature",
    "Plats med tradition": "sacred-nature",
    "Samlingsplats": "sacred-nature",
    "Offerkast": "offering-cairn",
    "Offerplats": "offering-cairn",

    # settlement
    "Boplats": "settlement",
    "Boplatsområde": "settlement",
    "Boplatslämning övrig": "settlement",
    "Husgrund, förhistorisk/medeltida": "house-foundation",
    "Husgrund, historisk tid": "house-foundation",
    "Lägenhetsbebyggelse": "house-foundation",
    "Bytomt/gårdstomt": "farmstead",
    "Kyrkstad": "farmstead",
    "Fäbod": "summer-farm",
    "Kåta": "sami-hut",
    "Viste": "sami-hut",
    "Stalotomt": "sami-hut",
    "Renvall": "sami-hut",
    "Härd": "hearth",
    "Kokgrop": "cooking-pit",
    "Stenugn": "kiln",
    "Boplatsgrop": "storage-pit",
    "Förvaringsanläggning": "storage-pit",
    "Bengömma": "storage-pit",
    "Hornsamling": "finds",
    "Tomtning": "hut-platform",
    "Boplatsvall": "hut-platform",
    "Skåre/jaktvärn": "hut-platform",
    "Hägnad": "enclosure",
    "Hägnadssystem": "enclosure",
    "Rengärda": "enclosure",
    "Gistgård": "enclosure",
    "Stadslager": "town-layer",
    "Park-/trädgårdsanläggning": "park",

    # farming and earthworks
    "Terrassering": "terrace",
    "Fossil åker": "fossil-field",
    "Område med fossil åkermark": "fossil-field",
    "Röjningsröse": "clearance-cairn",
    "Stenröjd yta": "clearance-cairn",
    "Dike/ränna": "ditch",
    "Dammvall": "dam",

    # mining, iron and industry
    "Gruvområde": "mine",
    "Gruvhål": "mine",
    "Flintgruva": "mine",
    "Uppfordringsanläggning": "mine",
    "Bergshistorisk lämning övrig": "mine",
    "Brott/täkt": "quarry",
    "Brytningsyta": "quarry",
    "Stenindustri": "quarry",
    "Hyttområde": "furnace",
    "Hyttlämning": "furnace",
    "Hytt- och hammarområde": "furnace",
    "Metallindustri/järnbruk": "furnace",
    "Blästplats": "bloomery",
    "Blästbrukslämning": "bloomery",
    "Hammare/smedja": "forge",
    "Hammarområde": "forge",
    "Smideslämning": "forge",
    "Smidesområde": "forge",
    "Gjuteri": "forge",
    "Kalkugn": "kiln",
    "Tegelindustri": "kiln",
    "Kolningsanläggning": "charcoal",
    "Kvarn": "mill",
    "Glasindustri": "industry",
    "Pappersindustri": "industry",
    "Livsmedelsindustri": "industry",
    "Textilindustri": "industry",
    "Träindustri": "industry",
    "Kemisk industri": "industry",
    "Småindustriområde": "industry",
    "Industri övrig": "industry",
    "Område med skogsbrukslämningar": "forestry",
    "Område med flottningsanläggningar": "log-floating",
    "Flottningsanläggning": "log-floating",

    # roads and boundaries
    "Färdväg": "road",
    "Färdvägssystem": "road",
    "Drag": "boat-landing",
    "Vägmärke": "milestone",
    "Gränsmärke": "boundary-stone",
    "Gränsbestämt område": "boundary-stone",
    "Rösning": "boundary-stone",
    "Bro": "bridge",
    "Vad": "ford",
    "Kanal": "canal",

    # maritime
    "Hamnområde": "harbour",
    "Hamnanläggning": "harbour",
    "Förtöjningsanordning": "harbour",
    "Ballastplats": "harbour",
    "Båtlänning": "boat-landing",
    "Varv/slip": "boat-landing",
    "Fartygs-/båtlämning": "shipwreck",
    "Område med fartygslämningar": "shipwreck",
    "Fiskeläge": "fishing-village",
    "Fyr": "lighthouse",
    "Sjömärke": "sea-mark",
    "Kanalmärke": "sea-mark",
    "Vårdkase": "beacon",

    # hunting
    "Fångstgrop": "pitfall-trap",
    "Fångstanläggning övrig": "pitfall-trap",
    "Fångstgropssystem": "pitfall-system",
    "Fångstgård": "pitfall-system",

    # residual
    "Fyndplats": "finds",
    "Övrigt": "unknown",
    "Fornlämningsliknande bildning": "unknown",
    "Fornlämningsliknande lämning": "unknown",
}


# A primitive may expand to SEVERAL elements -- p_cross is two bars, p_wave is
# one path per wavelet. Colour every one of them, not just the first.
_TAG = re.compile(r"<(path|circle|ellipse|rect)\b([^>]*?)/>")


def paint(shape, colour):
    return _TAG.sub(lambda m: f'<{m.group(1)}{m.group(2)} fill="{colour}"/>', shape)


def render(name):
    """One SVG: a fattened white pass for the halo, then the colour pass.

    Order matters. A white stroke on each individual shape would also trace
    every internal edge and, at 16 px, hollow the glyph out from the inside.
    """
    shapes = ICONS[name]
    halo = "".join(s for s, _ in shapes)
    body = "".join(paint(s, c) for s, c in shapes)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
        'width="64" height="64">'
        f'<g fill="#ffffff" stroke="#ffffff" stroke-width="{HALO_W}" '
        f'stroke-linejoin="round" stroke-linecap="round">{halo}</g>'
        f'<g>{body}</g></svg>')


def contact_sheet(path, cols=10, cell=76):
    """Every glyph at 20 px next to a 56 px version, over basemap colours."""
    names = sorted(ICONS)
    rows = (len(names) + cols - 1) // cols
    W, H = cols * cell + 8, rows * (cell + 16) + 8
    bg = ["#e8e0d8", "#c9dfae", "#a9cbe8", "#ffffff"]
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
           f'viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#f7f5f2"/>']
    for i, n in enumerate(names):
        r, c = divmod(i, cols)
        x, y = 4 + c * cell, 4 + r * (cell + 16)
        out.append(f'<rect x="{x}" y="{y}" width="{cell-4}" height="{cell-4}" '
                   f'rx="4" fill="{bg[(r+c) % 4]}"/>')
        inner = render(n).split(">", 1)[1].rsplit("</svg>", 1)[0]
        out.append(f'<g transform="translate({x+4} {y+8}) scale({56/24:.3f})">'
                   f'{inner}</g>')
        out.append(f'<g transform="translate({x+cell-26} {y+cell-28}) '
                   f'scale({20/24:.3f})">{inner}</g>')
        out.append(f'<text x="{x+2}" y="{y+cell+9}" font-family="Helvetica" '
                   f'font-size="8.5" fill="#444">{n}</text>')
    out.append("</svg>")
    open(path, "w").write("".join(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--sheet", nargs="?", const="/tmp/icon-sheet.svg", default=None)
    ap.add_argument("--svg-out", default="public/fornlamningar-icons/svg",
                   help="also copy the SVGs somewhere the app can serve them; "
                        "the sprite is for the map canvas only and cannot be "
                        "used by ordinary UI like the filter list")
    ap.add_argument("--ts", default="app/fornlamningar/iconForClass.ts",
                    help="also emit the class->icon table the map style reads")
    a = ap.parse_args()

    unused = set(ICONS) - set(CLASS_ICON.values())
    missing = sorted(set(CLASS_ICON.values()) - set(ICONS))
    if missing:
        sys.exit(f"CLASS_ICON points at glyphs that do not exist: {missing}")

    os.makedirs(a.out, exist_ok=True)
    for n in sorted(ICONS):
        open(os.path.join(a.out, f"{n}.svg"), "w").write(render(n))
    print(f"{len(ICONS)} svg -> {a.out}")

    if a.svg_out:
        os.makedirs(a.svg_out, exist_ok=True)
        for fn in os.listdir(a.svg_out):
            if fn.endswith(".svg"):
                os.remove(os.path.join(a.svg_out, fn))
        for n in sorted(ICONS):
            open(os.path.join(a.svg_out, f"{n}.svg"), "w").write(render(n))
        print(f"{len(ICONS)} svg -> {a.svg_out} (for UI use)")
    print(f"{len(CLASS_ICON)} classes mapped, "
          f"{len(set(CLASS_ICON.values()))} glyphs in use"
          + (f", unused: {sorted(unused)}" if unused else ""))

    if a.ts:
        rows = "\n".join(f"  {k!r}: {v!r},".replace("'", '"')
                         for k, v in sorted(CLASS_ICON.items()))
        open(a.ts, "w").write(
            "// GENERATED by scripts/build_icons.py -- do not edit by hand.\n"
            "// Maps every RAA class the tile pipeline emits to a sprite icon.\n"
            "export const ICON_FOR_CLASS: Record<string, string> = {\n"
            f"{rows}\n}};\n\n"
            "export const FALLBACK_ICON = 'unknown';\n")
        print(f"wrote {a.ts}")

    if a.sheet:
        contact_sheet(a.sheet)
        print(f"sheet -> {a.sheet}")


if __name__ == "__main__":
    main()

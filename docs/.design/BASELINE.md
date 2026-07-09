# DemoPlayground visual baseline — "Instrument Panel"

Testable reference for the `docs/src/components/DemoPlayground.tsx` rebuild. The
gates in P2/P3/P5 assert against the enumerated values below (not a vague "matches
the mock"). Colors are exact; dimensions are the design's own.

## Source of truth (canonical)

The design is a Claude Design project. An authorized session (`/design-login`) can
re-fetch the raw specs via the `DesignSync` MCP tool:

- Project: `bcbd2a04-7399-4643-b85d-b941492b7b24`
- `DemoPage.dc.html` — the component being matched (the "Instrument Panel").
- `Instrument Panel Demo.dc.html` — catalog of 8 target states (2a–2h).

The mocked top-bar / sidebar / right-outline in `DemoPage.dc.html` are just the Vocs
chrome and are OUT OF SCOPE — only the bordered **Instrument Panel** card is rebuilt.

## Component props (from the design)

`theme: 'dark'|'light'` · `xray: boolean` · `loadMode: 'auto'|'manual'` ·
`loading: boolean` · `aggregated: boolean` · `touring: boolean`.
In our build: theme follows Vocs (`data-vocs-theme`); `xray` is `useState(true)`
(no toggle); the rest are real local state driven by controls.

## Palette (exact hexes)

Brand constants (theme-invariant): coral `#F47067`; lane L0 `#5B8DEF` (blue),
L1 `#3DA35D` (green), L2 `#B983FF` (purple).

| token | light | dark |
|---|---|---|
| page | #ffffff | #121113 |
| surf | #f9f9f9 | #0e0d0f |
| card | #ffffff | #17161a |
| panel | #f9f9f9 | #141316 |
| border | #ececec | #2b292d |
| border2 | #d4d4d4 | #3c393f |
| heading | #202020 | #ffffff |
| text | #4c4c4c | #cfccd6 |
| t2 | #646464 | #b5b2bc |
| t3 | #838383 | #8f8c96 |
| t4 | #bbbbbb | #625f69 |
| barName | #d0d0d0 | #3a373f |
| barHandle | #e4e4e4 | #282630 |
| barLine | #ececec | #232127 |
| avatar | #e2e2e2 | #2b292d |
| stripe1 | #f0f0f0 | #1a191b |
| stripe2 | #f7f7f7 | #232127 |
| link | #0588f0 | #3b9eff |
| track | #ececec | #232127 |
| mark | #202020 | #ffffff |
| markText | #ffffff | #121113 |
| sidebarActive | #f0f0f0 | #232225 |
| skbg (skeleton) | #ececec | #26242a |

## Structure — one bordered rounded card (radius 12px, `border`, bg `page`)

### 1. Header strip (padding 14×16, bottom border, bg `surf`)
- Left: stat pods, each = big mono value (19px, tabular-nums) over a 9px `t3`
  uppercase label with `.09em` tracking:
  - `ITEMS` = `12,000` (real: `data.length`)
  - `MOUNTED` = `24` (real: `items.length`)
  - `VISIBLE` = `9` (real: items intersecting the stage viewport)
  - Middot `·` separators in `border2`.
  - `+10k` chip: mono 11px `t2`, bg `panel`, `border`, radius 6, pad 4×8.
- Right: `CONTAINER` pod = `lanes: 3` (real `useMasonry().lanes`); vertical
  divider; `TOUR` button (▶ idle / ❚❚ running; coral active style when touring).
  - **SSR "PRE-RENDERED" pod is DROPPED** (ssr is type-exclusive with
    scrollElementRef; SSR story stays on OverviewMasonry).
- Under x-ray: stat numerals turn coral `#F47067`.

### 2. Control panel (padding 16, bottom border)
- Row: `SCROLL API` mono label (11px, `.09em`, `t3`) + code chip on the right
  showing `scrollToIndex(184, { align: 'start' })` (mono 12px; coral-tinted bg +
  border + glow under x-ray).
- 4 align buttons (flex, gap 10), each = big mono number + `→` over a sub-label:
  `184 START` (active), `198 CENTER`, `212 END`, `random AUTO`. Active = coral
  border + tint (solid coral fill under x-ray).
- `LOAD` row: 78px mono label + segmented `AUTO | MANUAL` (30px tall, `border`,
  radius 8; active segment bg `sidebarActive`, coral text under x-ray) + caption
  `endReachedDisabled: false|true`.
- 3 sliders (label 78px + 4px track `track` + fill + 12px knob + right-aligned
  value): `GUTTER 16 px` (fill 40%), `OVERSCAN 3` (fill 30%), `THRESHOLD` (fill 60%).
  Fill = `#5b5860` dark / `#a8a8ac` light; **coral under x-ray**. Knob `#eeeef0`
  dark / white+`border` light. NOTE: THRESHOLD relabeled to **items-from-end**
  (drives `endReachedThreshold`), not px.

### 3. Stage row (padding 16, flex gap 14)
- **Minimap** (60px wide): `RANGE` mono label (9px) over a bordered box (bg `surf`,
  radius 8) with a proportional 3-lane block schematic; a "visible" window box
  (glows coral under x-ray); optional `≈1k / blk` aggregated caption.
- **Stage** (flex, **height 544px**, `border`, radius 8, overflow hidden): the real
  `scrollElementRef` container. Holds masonry cards (social-feed archetypes
  image/short/tall/quote: 34px avatar + name/handle bars + line/image/quote rows +
  optional engagement `↩ 12  ⇄ 4  ♡ 88`).
  - Top-right `--lanes: 3` readout (mono, coral text, `readoutBg`, `border`).
  - Right-edge 10px drag handle (ew-resize; 3 dots).
  - Footer (fades in over `page`): AUTO → coral code chip
    `useEndReached → fetchNextPage()` + (loading) 3 pulsing coral dots (`rvmdot`) +
    `mounting 12 skeletons`; MANUAL → `↓ Load more` button + `endReachedDisabled: true`.
- **x-ray per card**: content dimmed (opacity .14 dark / .20 light); coral overlay
  border + glow; 3px lane-accent stripe (L0 blue / L1 green / L2 purple by
  `item.lane`); coral chip top-left `#<item.index> · <item.size>px`; lane badge
  top-right `L<item.lane>` (lane color). Dashed coral `endReachedThreshold` trigger
  line near stage bottom. Light x-ray adds a faint blueprint grid on the stage bg.
- Below the card: mono `t4` note `// heights are measured post-layout, never equalized · the feed only grows`.

## Keyframes
- `rvmdot` — pulsing loading dots (opacity .25→1→.25).
- `rvmsk` — skeleton shimmer (opacity .5→1→.5).
Both must be disabled under `prefers-reduced-motion`.

## 8 target catalog states (from `Instrument Panel Demo.dc.html`)
2a dark·product · 2b dark·x-ray · 2c light·product · 2d light·x-ray(blueprint) ·
2e AUTO loading (12 skeletons) · 2f MANUAL loading · 2g controls/minimap sheet ·
2h OG image. Our gates cover: dark, light, dark-x-ray, light-x-ray(blueprint),
auto-loading, manual-loading.

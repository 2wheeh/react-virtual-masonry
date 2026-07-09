---
'react-virtual-masonry': minor
---

Add `computeMasonryLayout({ sizes, lanes, gutter })` — a pure helper that returns the full shortest-column packing (`{ items: { index, lane, start, size }[], totalSize }`) so whole-list UIs like minimaps can reuse the library's layout instead of forking it.

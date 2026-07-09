---
'react-virtual-masonry': minor
---

`useMasonry` now returns `scrollOffset` and `viewportSize` for the active scroller, so consumers building scroll-aware UI (minimaps, position indicators) don't need to attach their own scroll listener + ResizeObserver.

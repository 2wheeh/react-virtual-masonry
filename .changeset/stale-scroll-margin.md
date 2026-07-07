---
'react-virtual-masonry': patch
---

Keep `scrollMargin` fresh when content above the grid changes height: `useOffsetTop` also observes the document body, so ancestor layout shifts that move `offsetTop` without resizing the grid no longer leave the virtualizer's scroll mapping stale.

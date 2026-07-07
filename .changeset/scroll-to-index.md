---
'react-virtual-masonry': minor
---

Add first-class `scrollToIndex(index, options?)` to `useMasonry`. It's also reachable from the `<Masonry>` component via a `ref` typed `MasonryHandle` (exposing `scrollToIndex` and the `virtualizer` escape hatch), so imperative control no longer requires composing the hook.

---
'react-virtual-masonry': minor
---

`<Masonry>`'s `renderItem` callback now receives the full TanStack `VirtualItem` (`key`, `index`, `start`, `end`, `size`, `lane`) alongside the data `item`. This is additive — existing `({ item, index }) => ...` call sites keep working — and lets consumers read `lane` / `size` / `start` without dropping down to `useMasonry`.

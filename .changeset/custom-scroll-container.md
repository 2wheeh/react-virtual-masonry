---
'react-virtual-masonry': minor
---

Add `scrollElementRef` to `useMasonry` for virtualizing inside a scroll container. Pass a ref to an `overflow:auto` element and the grid windows against that element instead of the page; omit it for window scrolling (unchanged default). Container mode is client-only — `scrollElementRef` and `ssr` are mutually exclusive at the type level. Content above the grid inside the container must have stable height (simplest: make the grid the container's first child).

---
'react-virtual-masonry': patch
---

Re-export the `VirtualItem` type from `@tanstack/react-virtual`, so consumers can type items from `useMasonry`/`getItemProps` directly instead of deriving `UseMasonryReturn['items'][number]`.

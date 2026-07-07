---
'react-virtual-masonry': minor
---

Add `useEndReached`, a small fetching-agnostic hook for infinite loading. Pass it `useMasonry().items` plus your data length and a callback; it fires when the last rendered item nears the end of loaded data. Wire the callback to `fetchNextPage` (TanStack Query), `setSize` (SWR), `fetchMore` (Apollo), or any loader — the hook never fetches itself. The `<Masonry>` component also accepts `onEndReached` (with `endReachedThreshold` / `endReachedDisabled`) so component users get infinite loading without composing the hook.

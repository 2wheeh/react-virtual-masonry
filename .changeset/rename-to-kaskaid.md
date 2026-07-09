---
'kaskaid': minor
---

Rename the package from `react-virtual-masonry` to `kaskaid`.

The component and hook API is unchanged — `<Masonry />`, `useMasonry`, and `useEndReached` keep their names. Only the package specifier and the emitted data attributes change.

```diff
-import { Masonry } from 'react-virtual-masonry';
+import { Masonry } from 'kaskaid';
```

**Breaking:** the data attributes emitted on the grid and its items are renamed. Update any CSS or test selectors that target them.

```diff
-[data-rvm-grid]  [data-rvm-lanes]  [data-rvm-item]
+[data-kaskaid-grid]  [data-kaskaid-lanes]  [data-kaskaid-item]
```

---
'react-virtual-masonry': minor
---

**Breaking:** replace the `columnsCountBreakPoints` prop with a CSS-driven lane count. The library now reads the `--lanes` custom property from the grid root (`[data-rvm-grid]`), so `@media` / `@container` rules own responsiveness. Also extract the headless `useMasonry` hook (`<Masonry>` is now a thin wrapper) and rename `ssr.columnsCount` to `ssr.lanes`.

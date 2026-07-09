---
'react-virtual-masonry': patch
---

Clamp out-of-range indices before invoking the consumer's `estimateSize`, so estimators like `(i) => data[i].height` no longer throw when the virtualizer transiently probes an index outside the data range.

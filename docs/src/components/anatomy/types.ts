import type { UseMasonryReturn } from 'react-virtual-masonry';

// The library returns TanStack `VirtualItem`s but doesn't re-export the type;
// derive it from the return shape so docs needn't depend on @tanstack directly.
export type VirtualItem = UseMasonryReturn['items'][number];

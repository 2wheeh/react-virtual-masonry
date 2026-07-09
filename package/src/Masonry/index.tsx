import {
  CSSProperties,
  forwardRef,
  ReactElement,
  ReactNode,
  Ref,
  useImperativeHandle,
} from 'react';
import type { ScrollToOptions, VirtualItem, Virtualizer } from '@tanstack/react-virtual';

import { useMasonry, type UseMasonryOptions } from '../hooks/useMasonry';
import { useEndReached } from '../hooks/useEndReached';

export type { SSRConfig } from '../hooks/useMasonry';

const NOOP = () => {};

/** Imperative handle exposed via `ref` on {@link Masonry} — the subset of
 *  {@link useMasonry}'s return worth calling from outside the grid. For anything
 *  more, use the hook directly. */
export interface MasonryHandle {
  /** See {@link useMasonry}'s `scrollToIndex`. */
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
  /** Underlying TanStack virtualizer — escape hatch for other imperative APIs.
   *  Element-scoped when `scrollElementRef` is set, else window-scoped. */
  virtualizer: Virtualizer<HTMLElement, Element> | Virtualizer<Window, Element>;
}

// `UseMasonryOptions` is a discriminated union — use intersection, not `extends`.
type Props<Data> = UseMasonryOptions<Data> & {
  /** Renders one item. Receives the data element as `item`, plus every field of
   *  the underlying TanStack {@link VirtualItem}: `key`, `index`, `start`, `end`,
   *  `size`, and `lane`. `index` maps into `data` exactly as before. The extra
   *  fields — notably `lane` (which column), `size` (measured/estimated height),
   *  and `start` (offset within its lane) — previously forced consumers off
   *  `<Masonry>` and down to {@link useMasonry} just to read them. */
  renderItem: (props: VirtualItem & { item: Data }) => ReactNode;
  /** Instance-specific selector when multiple grids need different styling.
   *  Most usage can target `[data-rvm-grid]` and omit this. */
  className?: string;
  /** Merged after the library's grid styles. Do not override `height` / `width`
   *  / `position`. */
  style?: CSSProperties;
  /** Infinite loading: fires as the last rendered item nears the end of `data`.
   *  Wraps {@link useEndReached} — pass `fetchNextPage` / `setSize` / a loader. */
  onEndReached?: () => void;
  /** Items-from-end distance at which `onEndReached` fires. @default 0 */
  endReachedThreshold?: number;
  /** Suppress `onEndReached`, e.g. while fetching or when no data remains. */
  endReachedDisabled?: boolean;
};

function MasonryInner<Data>(props: Props<Data>, ref: Ref<MasonryHandle>) {
  // Don't destructure the union-tagged fields — destructuring widens `ssr` /
  // `estimateSize` to optional and breaks the discriminated union narrowing.
  const { renderItem, className, style, onEndReached, endReachedThreshold, endReachedDisabled } =
    props;
  const { gridProps, getItemProps, items, scrollToIndex, virtualizer } = useMasonry(props);

  // Imperative access for component users — `scrollToIndex` (and the virtualizer
  // escape hatch) without dropping to the hook. Hook composers read these off the
  // return value instead.
  useImperativeHandle(ref, () => ({ scrollToIndex, virtualizer }), [scrollToIndex, virtualizer]);

  useEndReached(items, props.data.length, onEndReached ?? NOOP, {
    threshold: endReachedThreshold,
    disabled: endReachedDisabled || !onEndReached,
  });

  return (
    <div {...gridProps} className={className} style={{ ...gridProps.style, ...style }}>
      {items.map((virtualItem) => (
        <div key={virtualItem.key} {...getItemProps(virtualItem)}>
          {renderItem({ ...virtualItem, item: props.data[virtualItem.index] })}
        </div>
      ))}
    </div>
  );
}

/**
 * Default Masonry component — thin wrapper around {@link useMasonry}. For custom
 * JSX structure (different outer element, extra attributes), use the hook directly.
 *
 * Pass `onEndReached` for infinite loading, or a `ref` typed {@link MasonryHandle}
 * for imperative access (`scrollToIndex`, the virtualizer escape hatch) — both
 * without composing the hook yourself.
 *
 * Lane count source: the `--lanes` CSS custom property resolved on the grid root.
 * The library never declares `container-type` — wrap externally for `@container`.
 */
// `forwardRef` erases the generic; the cast restores `<Data>` inference at the
// call site (the peer range includes React 18, where `ref` isn't yet a plain prop).
export const Masonry = forwardRef(MasonryInner) as <Data = unknown>(
  props: Props<Data> & { ref?: Ref<MasonryHandle> }
) => ReactElement;

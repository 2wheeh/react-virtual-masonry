import {
  CSSProperties,
  forwardRef,
  ReactElement,
  ReactNode,
  Ref,
  useImperativeHandle,
} from 'react';
import type { ScrollToOptions, Virtualizer } from '@tanstack/react-virtual';

import { useMasonry, type UseMasonryOptions } from '../hooks/useMasonry';

export type { SSRConfig } from '../hooks/useMasonry';

/** Imperative handle exposed via `ref` on {@link Masonry} — the subset of
 *  {@link useMasonry}'s return worth calling from outside the grid. For anything
 *  more, use the hook directly. */
export interface MasonryHandle {
  /** See {@link useMasonry}'s `scrollToIndex`. */
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
  /** Underlying TanStack virtualizer — escape hatch for other imperative APIs. */
  virtualizer: Virtualizer<Window, Element>;
}

// `UseMasonryOptions` is a discriminated union — use intersection, not `extends`.
type Props<Data> = UseMasonryOptions<Data> & {
  renderItem: (props: { item: Data; index: number }) => ReactNode;
  /** Instance-specific selector when multiple grids need different styling.
   *  Most usage can target `[data-rvm-grid]` and omit this. */
  className?: string;
  /** Merged after the library's grid styles. Do not override `height` / `width`
   *  / `position`. */
  style?: CSSProperties;
};

function MasonryInner<Data>(props: Props<Data>, ref: Ref<MasonryHandle>) {
  // Don't destructure the union-tagged fields — destructuring widens `ssr` /
  // `estimateSize` to optional and breaks the discriminated union narrowing.
  const { renderItem, className, style } = props;
  const { gridProps, getItemProps, items, scrollToIndex, virtualizer } = useMasonry(props);

  // Imperative access for component users — `scrollToIndex` (and the virtualizer
  // escape hatch) without dropping to the hook. Hook composers read these off the
  // return value instead.
  useImperativeHandle(ref, () => ({ scrollToIndex, virtualizer }), [scrollToIndex, virtualizer]);

  return (
    <div {...gridProps} className={className} style={{ ...gridProps.style, ...style }}>
      {items.map((item) => (
        <div key={item.key} {...getItemProps(item)}>
          {renderItem({ item: props.data[item.index], index: item.index })}
        </div>
      ))}
    </div>
  );
}

/**
 * Default Masonry component — thin wrapper around {@link useMasonry}. For custom
 * JSX structure (different outer element, extra attributes), use the hook directly.
 *
 * Pass a `ref` typed {@link MasonryHandle} for imperative access (`scrollToIndex`,
 * the virtualizer escape hatch) without composing the hook yourself.
 *
 * Lane count source: the `--lanes` CSS custom property resolved on the grid root.
 * The library never declares `container-type` — wrap externally for `@container`.
 */
// `forwardRef` erases the generic; the cast restores `<Data>` inference at the
// call site (the peer range includes React 18, where `ref` isn't yet a plain prop).
export const Masonry = forwardRef(MasonryInner) as <Data = unknown>(
  props: Props<Data> & { ref?: Ref<MasonryHandle> }
) => ReactElement;

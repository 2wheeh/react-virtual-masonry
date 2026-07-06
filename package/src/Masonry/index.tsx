import { CSSProperties, ReactNode } from 'react';

import { useMasonry, type UseMasonryOptions } from '../hooks/useMasonry';

export type { SSRConfig } from '../hooks/useMasonry';

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

/**
 * Default Masonry component — thin wrapper around {@link useMasonry}. For custom
 * JSX structure (different outer element, extra attributes), use the hook directly.
 *
 * Lane count source: the `--lanes` CSS custom property resolved on the grid root.
 * The library never declares `container-type` — wrap externally for `@container`.
 */
export function Masonry<Data = unknown>(props: Props<Data>) {
  // Don't destructure the union-tagged fields — destructuring widens `ssr` /
  // `estimateSize` to optional and breaks the discriminated union narrowing.
  const { renderItem, className, style } = props;
  const { gridProps, getItemProps, items } = useMasonry(props);

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

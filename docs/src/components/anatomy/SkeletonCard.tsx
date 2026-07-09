import { css } from '../../../styled-system/css';

// ---------------------------------------------------------------------------
// In-flight page placeholder. Same descriptor height as the eventual real card
// (so lanes don't reflow when it resolves), a shimmering `skbg` fill, and no
// x-ray chip — a skeleton has no measured `item` identity worth annotating.
// The `data-rvm-anim` hook lets the reduced-motion `<style>` kill the shimmer.
// ---------------------------------------------------------------------------
export function SkeletonCard({ height }: { height: number }) {
  return (
    <div
      className={css({
        boxSizing: 'border-box',
        border: '1px solid',
        borderColor: 'border',
        borderRadius: '10px',
        bg: 'card',
        overflow: 'hidden',
        p: '10px',
      })}
      style={{ height }}
    >
      <div
        data-rvm-anim
        className={css({
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          animation: 'rvmsk 1.2s ease-in-out infinite',
        })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', gap: '8px' })}>
          <div
            className={css({
              width: '34px',
              height: '34px',
              borderRadius: 'full',
              bg: 'skbg',
              flexShrink: 0,
            })}
          />
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6px' })}>
            <div
              className={css({ width: '90px', height: '8px', borderRadius: '3px', bg: 'skbg' })}
            />
            <div
              className={css({ width: '60px', height: '6px', borderRadius: '3px', bg: 'skbg' })}
            />
          </div>
        </div>
        <div className={css({ flex: '1', borderRadius: '8px', bg: 'skbg' })} />
      </div>
    </div>
  );
}

// Three coral dots that pulse in sequence — the "fetching" tell in the footer.
export function LoadingDots() {
  return (
    <span aria-hidden className={css({ display: 'inline-flex', gap: '4px', alignItems: 'center' })}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-rvm-anim
          className={css({
            width: '5px',
            height: '5px',
            borderRadius: 'full',
            bg: 'coral',
            animation: 'rvmdot 1s ease-in-out infinite',
          })}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

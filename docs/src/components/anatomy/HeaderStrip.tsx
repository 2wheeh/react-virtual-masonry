import { css } from '../../../styled-system/css';

// Monospace stack for the instrument-panel numerals / code chips. Declared
// file-local (not imported) so Panda statically extracts the font-family rule.
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

// ---------------------------------------------------------------------------
// Header stat pod.
// ---------------------------------------------------------------------------
function StatPod({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '3px' })}>
      <span
        data-testid={testId}
        className={css({
          fontFamily: MONO,
          fontSize: '19px',
          lineHeight: '1',
          fontVariantNumeric: 'tabular-nums',
          color: 'heading',
          _xray: { color: 'coral' },
        })}
      >
        {value}
      </span>
      <span
        className={css({
          fontSize: '9px',
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          color: 't3',
        })}
      >
        {label}
      </span>
    </div>
  );
}

function Middot() {
  return (
    <span aria-hidden className={css({ color: 'border2', fontSize: '14px', userSelect: 'none' })}>
      ·
    </span>
  );
}

// ---------------------------------------------------------------------------
// Panel header — ITEMS / MOUNTED / VISIBLE counters plus the CONTAINER lanes.
// ---------------------------------------------------------------------------
export function HeaderStrip({
  items,
  mounted,
  visible,
  lanes,
}: {
  items: number;
  mounted: number;
  visible: number;
  lanes: number;
}) {
  return (
    <div
      className={css({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        px: '16px',
        py: '14px',
        borderBottom: '1px solid',
        borderColor: 'border',
        bg: 'surf',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          rowGap: '10px',
        })}
      >
        <StatPod label="Items" value={items.toLocaleString()} testId="stat-items" />
        <Middot />
        <StatPod label="Mounted" value={`${mounted}`} testId="stat-mounted" />
        <Middot />
        <StatPod label="Visible" value={`${visible}`} testId="stat-visible" />
      </div>

      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          rowGap: '10px',
        })}
      >
        <StatPod label="Container" value={`lanes: ${lanes}`} />
      </div>
    </div>
  );
}

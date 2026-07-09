import { css } from '../../../styled-system/css';

// Slider fill (product mode) — not a semantic token; theme-flipped inline.
const FILL_LIGHT = '#a8a8ac';
const FILL_DARK = '#5b5860';
const KNOB_LIGHT = '#ffffff';
const KNOB_DARK = '#eeeef0';

export function Slider({
  label,
  value,
  fillPct,
  min,
  max,
  step = 1,
  numericValue,
  onChange,
}: {
  label: string;
  value: string;
  fillPct: number;
  min: number;
  max: number;
  step?: number;
  numericValue: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '12px' })}>
      <span
        className={css({
          fontFamily: 'mono',
          fontSize: '11px',
          letterSpacing: '.06em',
          color: 't3',
          width: '78px',
          flexShrink: 0,
        })}
      >
        {label}
      </span>
      <div
        className={css({
          position: 'relative',
          flex: '1',
          height: '12px',
          borderRadius: '2px',
          // The real <input> is opacity:0, so surface its keyboard focus here.
          '&:has(input:focus-visible)': {
            outline: '2px solid',
            outlineColor: 'coral',
            outlineOffset: '4px',
          },
        })}
      >
        <div
          className={css({
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '4px',
            transform: 'translateY(-50%)',
            bg: 'track',
            borderRadius: 'full',
          })}
        />
        <div
          className={css({
            position: 'absolute',
            top: '50%',
            left: 0,
            height: '4px',
            transform: 'translateY(-50%)',
            bg: FILL_LIGHT,
            _dark: { bg: FILL_DARK },
            _xray: { bg: 'coral' },
            borderRadius: 'full',
          })}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className={css({
            position: 'absolute',
            top: '50%',
            width: '12px',
            height: '12px',
            transform: 'translate(-50%, -50%)',
            borderRadius: 'full',
            bg: KNOB_LIGHT,
            border: '1px solid',
            borderColor: 'border',
            _dark: { bg: KNOB_DARK, borderColor: 'transparent' },
          })}
          style={{ left: `${fillPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          onChange={(e) => onChange?.(Number(e.target.value))}
          aria-label={label}
          aria-valuetext={value}
          className={css({
            position: 'absolute',
            inset: 0,
            width: '100%',
            margin: 0,
            opacity: 0,
            cursor: 'pointer',
          })}
        />
      </div>
      <span
        className={css({
          fontFamily: 'mono',
          fontSize: '11px',
          color: 't2',
          minWidth: '64px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        {value}
      </span>
    </div>
  );
}

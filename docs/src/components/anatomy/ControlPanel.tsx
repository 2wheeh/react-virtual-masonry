import { css } from '../../../styled-system/css';
import { SectionLabel } from './SectionLabel';
import { AlignButton } from './AlignButton';
import { Segmented } from './Segmented';
import { Slider } from './Slider';
import { SCROLL_OFFSET_PX, SCROLL_TARGETS } from './data';
import type { ScrollBtn, ScrollCall } from './types';

// ---------------------------------------------------------------------------
// Control panel — SCROLL API code chip + align buttons, LOAD segmented, and the
// GUTTER / OVERSCAN / THRESHOLD sliders.
// ---------------------------------------------------------------------------
export function ControlPanel({
  scrollCall,
  scrollBtn,
  runScroll,
  loadMode,
  setLoadMode,
  gutter,
  setGutter,
  overscan,
  setOverscan,
  threshold,
  setThreshold,
}: {
  scrollCall: ScrollCall;
  scrollBtn: ScrollBtn;
  runScroll: (btn: ScrollBtn) => void;
  loadMode: 'auto' | 'manual';
  setLoadMode: (v: 'auto' | 'manual') => void;
  gutter: number;
  setGutter: (v: number) => void;
  overscan: number;
  setOverscan: (v: number) => void;
  threshold: number;
  setThreshold: (v: number) => void;
}) {
  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        p: '16px',
        borderBottom: '1px solid',
        borderColor: 'border',
      })}
    >
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        })}
      >
        <SectionLabel>Scroll API</SectionLabel>
        <code
          data-testid="scroll-api"
          className={css({
            fontFamily: 'mono',
            fontSize: '12px',
            color: 't2',
            bg: 'panel',
            border: '1px solid',
            borderColor: 'border',
            borderRadius: '6px',
            px: '8px',
            py: '4px',
            // Narrow viewports: scroll the chip within itself rather than
            // letting the glyph string push the panel wider.
            maxWidth: '100%',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            _xray: {
              color: 'coral',
              bg: 'rgba(244,112,103,0.10)',
              borderColor: 'coral',
              boxShadow: '0 0 0 3px rgba(244,112,103,0.12)',
            },
          })}
        >
          {scrollCall.kind === 'index'
            ? `scrollToIndex(${scrollCall.index}, { align: '${scrollCall.align}' })`
            : `scrollToOffset(${scrollCall.offset}, { align: '${scrollCall.align}' })`}
        </code>
      </div>

      <div className={css({ display: 'flex', gap: '10px' })}>
        <AlignButton
          num={String(SCROLL_TARGETS.start)}
          sub="START"
          active={scrollBtn === 'start'}
          onClick={() => runScroll('start')}
        />
        <AlignButton
          num={String(SCROLL_TARGETS.center)}
          sub="CENTER"
          active={scrollBtn === 'center'}
          onClick={() => runScroll('center')}
        />
        {/* Resolves against the live feed length, so it has no fixed numeral. */}
        <AlignButton
          num="end"
          sub="SCROLL TO END"
          active={scrollBtn === 'end'}
          onClick={() => runScroll('end')}
        />
        {/* Raw px offset — a different API (scrollToOffset), not an index. */}
        <AlignButton
          num={`${SCROLL_OFFSET_PX}px`}
          sub="OFFSET"
          active={scrollBtn === 'offset'}
          onClick={() => runScroll('offset')}
        />
      </div>

      <div
        className={css({ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' })}
      >
        <SectionLabel width="78px">Load</SectionLabel>
        <Segmented value={loadMode} onChange={setLoadMode} />
        <code
          data-testid="load-caption"
          className={css({ fontFamily: 'mono', fontSize: '11px', color: 't3' })}
        >
          endReachedDisabled: {loadMode === 'manual' ? 'true' : 'false'}
        </code>
      </div>

      <div className={css({ display: 'flex', flexDirection: 'column', gap: '10px' })}>
        <Slider
          label="GUTTER"
          value={`${gutter} px`}
          fillPct={Math.round((gutter / 40) * 100)}
          min={0}
          max={40}
          step={2}
          numericValue={gutter}
          onChange={setGutter}
        />
        <Slider
          label="OVERSCAN"
          value={`${overscan}`}
          fillPct={Math.round((overscan / 10) * 100)}
          min={0}
          max={10}
          numericValue={overscan}
          onChange={setOverscan}
        />
        <Slider
          label="THRESHOLD"
          value={`${threshold} items`}
          fillPct={Math.round((threshold / 10) * 100)}
          min={0}
          max={10}
          numericValue={threshold}
          onChange={setThreshold}
        />
      </div>
    </div>
  );
}

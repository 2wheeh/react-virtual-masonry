import { createFileRoute } from '@tanstack/react-router';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

export const Route = createFileRoute('/ssr-debug')({
  component: SsrDebugPage,
});

const COUNT = 200;
const LANES = 3;

function SsrDebugPage() {
  'use no memo';

  const virtualizer = useWindowVirtualizer({
    count: COUNT,
    estimateSize: () => 200,
    lanes: LANES,
    gap: 16,
    overscan: 3,
    laneAssignmentMode: 'measured',
  });

  // Calling getVirtualItems() triggers the internal getMeasurements() memo chain,
  // populating the public `measurementsCache` field as a side effect.
  // We can't call getMeasurements() directly because it's marked `private` in TanStack Virtual.
  const visibleItems = virtualizer.getVirtualItems();
  const measurements = virtualizer.measurementsCache;

  const snapshot = {
    runtime: typeof window === 'undefined' ? 'server' : 'client',
    count: COUNT,
    lanes: LANES,
    totalSize: virtualizer.getTotalSize(),
    measurementsLength: measurements.length,
    measurementsFirst: measurements[0] ?? null,
    measurementsLast: measurements[measurements.length - 1] ?? null,
    visibleItemsLength: visibleItems.length,
    visibleItemsFirst: visibleItems[0] ?? null,
  };

  return (
    <section data-testid="ssr-debug">
      <h1>SSR debug snapshot</h1>
      <p style={{ color: '#555' }}>
        Inspect <code>useWindowVirtualizer</code> state at render time on both server and client.
        Tests parse the JSON below to validate RFC-0002 assumptions.
      </p>
      <pre
        data-testid="snapshot"
        style={{
          padding: 16,
          background: '#f6f6f6',
          borderRadius: 8,
          overflow: 'auto',
          fontSize: 13,
        }}
      >
        {JSON.stringify(snapshot, null, 2)}
      </pre>
    </section>
  );
}

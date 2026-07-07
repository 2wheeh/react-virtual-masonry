'use client';

import { useState } from 'react';

const PMS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
type PM = (typeof PMS)[number];

const PREFIX: Record<PM, string> = {
  npm: 'install',
  pnpm: 'add',
  yarn: 'add',
  bun: 'add',
};

function ClipboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="vocs:size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="vocs:size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Like vocs' `HomePage.InstallPackage`, but copy feedback swaps a trailing
 *  icon (clipboard → check) instead of replacing the command text, so the
 *  panel never shifts layout. */
export function InstallPackage({ name }: { name: string }) {
  const [selected, setSelected] = useState<PM>('npm');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${selected} ${PREFIX[selected]} ${name}`);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="vocs:min-w-[300px] vocs:max-w-sm">
      <div className="vocs:flex vocs:justify-center vocs:gap-1 vocs:mb-2">
        {PMS.map((pm) => (
          <button
            key={pm}
            type="button"
            data-active={selected === pm || undefined}
            onClick={() => {
              setSelected(pm);
              setCopied(false);
            }}
            className="vocs:px-3 vocs:py-1.5 vocs:text-sm vocs:font-medium vocs:text-secondary vocs:rounded-md vocs:transition-all vocs:duration-150 vocs:cursor-pointer vocs:hover:text-heading vocs:hover:bg-surfaceTint/50 vocs:data-active:bg-surfaceTint vocs:data-active:text-heading"
          >
            {pm}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={copied ? 'Copied' : 'Copy command'}
        data-copied={copied}
        onClick={handleCopy}
        className="vocs:w-full vocs:flex vocs:items-center vocs:gap-3 vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-lg vocs:py-3 vocs:px-4 vocs:font-mono vocs:text-sm vocs:text-secondary vocs:cursor-pointer vocs:transition-colors vocs:hover:border-accent7/50"
      >
        <span className="vocs:flex-1 vocs:text-left">
          <span className="vocs:text-accent7">{selected}</span> {PREFIX[selected]} {name}
        </span>
        <span
          className="vocs:shrink-0 vocs:transition-colors vocs:data-[copied=true]:text-success"
          data-copied={copied}
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
        </span>
      </button>
    </div>
  );
}

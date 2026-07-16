interface AvatarProps {
  initials: string;
  bg: string;
  color: string;
  size?: 'sm' | 'md';
}

// eslint-disable-next-line react-refresh/only-export-components
export const getInitials = (name: string) =>
  (name || '')
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

export function Avatar({ initials, bg, color, size = 'sm' }: AvatarProps) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[11px] rounded-[7px]' : 'w-8 h-8 text-[12px] rounded-lg';
  return (
    <div
      className={`${sz} flex items-center justify-center font-medium flex-shrink-0`}
      style={{ background: bg, color }}
    >
      {initials}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = 'var(--teal)', height = 4 }: ProgressBarProps) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: 'var(--surf2)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

interface TabBarProps {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-[var(--b)] mb-3">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onChange(i)}
          className={`px-3 py-1.5 text-[12px] border-b-2 -mb-px transition-colors cursor-pointer ${
            active === i
              ? 'text-[var(--blue-tx)] border-[var(--blue)] font-medium'
              : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

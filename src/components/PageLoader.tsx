import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0 h-full w-full bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-3 opacity-60">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--blue-tx)]" />
        <span className="text-[12px] font-medium text-[var(--tx2)]">Loading module...</span>
      </div>
    </div>
  );
}

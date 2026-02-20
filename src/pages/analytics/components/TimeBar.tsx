interface TimeBarProps {
  prod: number;
  internal: number;
  idle: number;
  presence: number;
}

export default function TimeBar({ prod, internal, idle, presence }: TimeBarProps) {
  if (!presence) return null;

  const prodPct = (prod / presence) * 100;
  const internalPct = (internal / presence) * 100;
  const idlePct = (idle / presence) * 100;

  return (
    <div className="mt-3">
      <div className="flex h-2 rounded-md overflow-hidden bg-background-black">
        <div style={{ width: `${prodPct}%` }} className="bg-gradient-to-r from-dark-green to-main" />
        <div style={{ width: `${internalPct}%` }} className="bg-gradient-to-r from-yellow-600 to-yellow-400" />
        <div style={{ width: `${idlePct}%` }} className="bg-section-grey-dark" />
      </div>
      <div className="flex gap-3 mt-1 text-xs">
        <span className="text-main">Prod {prod.toFixed(1)}h ({prodPct.toFixed(0)}%)</span>
        <span className="text-yellow-400">Wewn {internal.toFixed(1)}h ({internalPct.toFixed(0)}%)</span>
        <span className="text-power-grey">Bezcz {idle.toFixed(1)}h ({idlePct.toFixed(0)}%)</span>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  mode: "workers" | "teams";
  getName: (id: string) => string;
  showIdleLine?: boolean;
  showInternalLine?: boolean;
  showCombinedLine?: boolean;
}

export default function CustomTooltip({ active, payload, label, mode, getName }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  // Filter out the _originalDate field
  const filteredPayload = payload.filter(p => p.dataKey !== "_originalDate");

  return (
    <div className="bg-section-grey border border-grey-outline rounded-xl p-3 text-sm">
      <div className="text-dark-green font-bold mb-2">{label}</div>
      {filteredPayload.map(p => {
        const isIdleLine = p.dataKey.startsWith("idle_");
        const isInternalLine = p.dataKey.startsWith("internal_");
        const isCombinedLine = p.dataKey.startsWith("combined_");
        const isSecondaryLine = isIdleLine || isInternalLine || isCombinedLine;

        let workerId = p.dataKey;
        if (isIdleLine) workerId = p.dataKey.replace("idle_", "");
        if (isInternalLine) workerId = p.dataKey.replace("internal_", "");
        if (isCombinedLine) workerId = p.dataKey.replace("combined_", "");

        let formattedValue: string;
        if (mode === "teams") {
          formattedValue = `${p.value}h`;
        } else if (isSecondaryLine) {
          formattedValue = `${p.value.toFixed(2)}%`;
        } else {
          formattedValue = `${p.value.toFixed(2)}x`;
        }

        let displayName: string;
        if (mode === "workers") {
          if (isIdleLine) {
            displayName = `${getName(workerId)} (bezczynnosc)`;
          } else if (isInternalLine) {
            displayName = `${getName(workerId)} (prace wew.)`;
          } else if (isCombinedLine) {
            displayName = `${getName(workerId)} (polaczone)`;
          } else {
            displayName = getName(workerId);
          }
        } else {
          displayName = p.dataKey.split("+").map(getName).join(" + ");
        }

        return (
          <div key={p.dataKey} style={{ color: p.color, opacity: isSecondaryLine ? 0.8 : 1 }} className="mb-1">
            {displayName}: <b>{formattedValue}</b>
          </div>
        );
      })}
    </div>
  );
}

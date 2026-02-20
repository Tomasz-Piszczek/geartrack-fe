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

// Helper to format composite ID (workerId|resourceId) as display name
function formatCompositeId(compositeId: string, getName: (id: string) => string): string {
  if (compositeId.includes("|")) {
    const [workerId, resourceId] = compositeId.split("|");
    const workerName = getName(workerId);
    const resourceName = getName(resourceId);
    return workerId === resourceId ? workerName : `${workerName} (${resourceName})`;
  }
  return getName(compositeId);
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

        let compositeId = p.dataKey;
        if (isIdleLine) compositeId = p.dataKey.replace("idle_", "");
        if (isInternalLine) compositeId = p.dataKey.replace("internal_", "");
        if (isCombinedLine) compositeId = p.dataKey.replace("combined_", "");

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
          const baseName = formatCompositeId(compositeId, getName);
          if (isIdleLine) {
            displayName = `${baseName} (bezczynnosc)`;
          } else if (isInternalLine) {
            displayName = `${baseName} (prace wew.)`;
          } else if (isCombinedLine) {
            displayName = `${baseName} (polaczone)`;
          } else {
            displayName = baseName;
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

import { useState } from "react";
import { X, ChevronUp, ChevronDown, ArrowUpDown, AlertTriangle } from "lucide-react";
import type { DailyWorkerDetailDto, CappedDayDto } from "../../../api/bi-service";
import { getBucketLabel } from "../utils";

type SortField = "date" | "production" | "internal" | "idle" | "attendance";
type SortDirection = "asc" | "desc";

interface DailyBreakdownModalProps {
  workerId: string | null;
  workerName: string;
  dailyDetails: DailyWorkerDetailDto[];
  cappedDays: CappedDayDto[];
  onClose: () => void;
  filterBucket?: string | null;
  granularity?: "daily" | "weekly" | "monthly";
}

export default function DailyBreakdownModal({
  workerId,
  workerName,
  dailyDetails,
  cappedDays,
  onClose,
  filterBucket = null,
  granularity = "daily"
}: DailyBreakdownModalProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  if (!workerId) return null;

  // Create a map of capped days for quick lookup
  const cappedDaysMap = new Map<string, CappedDayDto>();
  cappedDays
    .filter(cd => cd.workerId === workerId)
    .forEach(cd => cappedDaysMap.set(cd.date, cd));

  // Filter by bucket if provided
  const filteredDetails = filterBucket
    ? dailyDetails.filter(d => getBucketLabel(d.date, granularity) === filterBucket)
    : dailyDetails;

  // Sort
  const sortedDetails = [...filteredDetails].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "date":
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "production":
        cmp = a.productionHours - b.productionHours;
        break;
      case "internal":
        cmp = a.internalHours - b.internalHours;
        break;
      case "idle":
        cmp = a.idleHours - b.idleHours;
        break;
      case "attendance":
        cmp = a.attendanceHours - b.attendanceHours;
        break;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // Totals
  const totals = sortedDetails.reduce(
    (acc, d) => ({
      production: acc.production + d.productionHours,
      internal: acc.internal + d.internalHours,
      idle: acc.idle + d.idleHours,
      attendance: acc.attendance + d.attendanceHours,
    }),
    { production: 0, internal: 0, idle: 0, attendance: 0 }
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "desc" : "desc");
    }
  };

  const SortHeader = ({ field, children, align = "center" }: { field: SortField; children: React.ReactNode; align?: "left" | "right" | "center" }) => (
    <th
      className={`p-3 text-power-grey font-bold cursor-pointer hover:text-white transition-colors select-none ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      }`}
      onClick={() => handleSort(field)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "center" ? "justify-center" : ""}`}>
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-dark-green" /> : <ChevronDown className="w-3 h-3 text-dark-green" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </span>
    </th>
  );

  const cappedCount = sortedDetails.filter(d => d.wasCapped).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-section-grey rounded-xl border border-grey-outline max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-grey-outline flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {workerName} - Rozklad dzienny
              {filterBucket && (
                <span className="text-sm font-normal text-dark-green">
                  ({filterBucket})
                </span>
              )}
            </h3>
            <p className="text-sm text-power-grey">
              {sortedDetails.length} dni
              {cappedCount > 0 && (
                <span className="ml-2 text-red-400">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {cappedCount} dni z przekroczeniem limitu
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-jet-color rounded-lg">
            <X className="w-5 h-5 text-power-grey" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-section-grey-dark">
                <SortHeader field="date" align="left">Data</SortHeader>
                <SortHeader field="production">Produkcja</SortHeader>
                <SortHeader field="internal">Prace wew.</SortHeader>
                <SortHeader field="idle">Bezczynnosc</SortHeader>
                <SortHeader field="attendance">Czas Pracy</SortHeader>
                <th className="p-3 text-center text-power-grey font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedDetails.map((d, idx) => {
                const cappedDay = cappedDaysMap.get(d.date);
                const total = d.productionHours + d.internalHours + d.idleHours;
                const prodPct = total > 0 ? (d.productionHours / total) * 100 : 0;
                const intPct = total > 0 ? (d.internalHours / total) * 100 : 0;
                const idlePct = total > 0 ? (d.idleHours / total) * 100 : 0;

                return (
                  <tr
                    key={d.date}
                    className={`border-b border-grey-outline ${
                      d.wasCapped ? "bg-red-500/10" : idx % 2 === 0 ? "" : "bg-background-black/50"
                    }`}
                  >
                    <td className="p-3 text-main font-medium">
                      {d.date}
                      {d.wasCapped && (
                        <AlertTriangle className="w-4 h-4 inline ml-2 text-red-400" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-green-400 font-semibold">{d.productionHours.toFixed(1)}h</span>
                      <span className="text-power-grey text-xs ml-1">({prodPct.toFixed(0)}%)</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-yellow-400 font-semibold">{d.internalHours.toFixed(1)}h</span>
                      <span className="text-power-grey text-xs ml-1">({intPct.toFixed(0)}%)</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-power-grey font-semibold">{d.idleHours.toFixed(1)}h</span>
                      <span className="text-power-grey text-xs ml-1">({idlePct.toFixed(0)}%)</span>
                    </td>
                    <td className="p-3 text-center text-white">
                      {d.attendanceHours.toFixed(1)}h
                    </td>
                    <td className="p-3 text-center">
                      {d.wasCapped && cappedDay ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                          Limit! {cappedDay.originalHours.toFixed(1)}h → {cappedDay.cappedHours.toFixed(1)}h
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-dark-green/20 text-dark-green">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-section-grey-dark border-t-2 border-grey-outline">
                <td className="p-3 text-white font-bold">Suma</td>
                <td className="p-3 text-center text-green-400 font-bold">{totals.production.toFixed(1)}h</td>
                <td className="p-3 text-center text-yellow-400 font-bold">{totals.internal.toFixed(1)}h</td>
                <td className="p-3 text-center text-power-grey font-bold">{totals.idle.toFixed(1)}h</td>
                <td className="p-3 text-center text-white font-bold">{totals.attendance.toFixed(1)}h</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

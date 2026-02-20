import { useState } from "react";
import { X, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { TeamInfo } from "../types";
import { formatWorkerWithResource } from "../utils";

type SortField = "zp" | "date" | "product" | "average";
type SortDirection = "asc" | "desc";

interface TeamDetailModalProps {
  team: TeamInfo | null;
  onClose: () => void;
  getName: (id: string) => string;
  getProduct: (id: string) => string;
  benchmarks?: Record<string, number>;
}

export default function TeamDetailModal({ team, onClose, getName, getProduct, benchmarks = {} }: TeamDetailModalProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  if (!team) return null;

  const jobsWithCalcs = team.jobs.map(j => {
    const benchmark = benchmarks[j.productTypeId];
    const efficiencyDiff = benchmark ? ((benchmark - j.totalHours) / benchmark) * 100 : null;
    return {
      ...j,
      benchmark,
      efficiencyDiff,
      isFaster: efficiencyDiff !== null && efficiencyDiff > 5,
      isSlower: efficiencyDiff !== null && efficiencyDiff < -5,
    };
  });

  const sortedJobs = [...jobsWithCalcs].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "zp":
        cmp = a.numerZlecenia.localeCompare(b.numerZlecenia);
        break;
      case "date":
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "product":
        cmp = getProduct(a.productTypeId).localeCompare(getProduct(b.productTypeId));
        break;
      case "average":
        cmp = (a.benchmark || 0) - (b.benchmark || 0);
        break;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  const SortHeader = ({ field, children, align = "left" }: { field: SortField; children: React.ReactNode; align?: "left" | "right" | "center" }) => (
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-section-grey rounded-xl border border-grey-outline max-w-7xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-grey-outline flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {team.workerIds.map(getName).join(" + ")}
            </h3>
            <p className="text-sm text-power-grey">
              {team.count} zlecen - srednia {team.avgTime.toFixed(2)}h
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
                <SortHeader field="zp">ZP</SortHeader>
                <SortHeader field="date">Data</SortHeader>
                <SortHeader field="product">Produkt</SortHeader>
                <th className="p-3 text-center text-power-grey font-bold">Ilosc</th>
                <th className="p-3 text-center text-power-grey font-bold">Czas/szt</th>
                <SortHeader field="average" align="center">Srednia/Zlecenie</SortHeader>
                <th className="p-3 text-left text-power-grey font-bold">Brygada</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((j, idx) => (
                <tr
                  key={j.id}
                  className={`border-b border-grey-outline ${idx % 2 === 0 ? "" : "bg-background-black/50"}`}
                >
                  <td className="p-3 text-center text-main font-mono text-xs">{j.numerZlecenia}</td>
                  <td className="p-3 text-center text-main">{j.date}</td>
                  <td className="p-3 text-center text-white">{getProduct(j.productTypeId)}</td>
                  <td className="p-3 text-center text-white">{j.quantity}</td>
                  <td className={`p-3 text-center font-semibold ${
                    j.isFaster ? "text-green-400" : j.isSlower ? "text-red-400" : "text-white"
                  }`}>
                    {j.totalHours.toFixed(2)}h
                  </td>
                  <td className="p-3 text-center text-power-grey">
                    {j.benchmark ? `${j.benchmark.toFixed(2)}h` : "-"}
                  </td>
                  <td className="p-3 text-power-grey text-xs">
                    {j.workers.map(w => `${formatWorkerWithResource(w.workerId, w.resourceId, getName)} (${w.hoursWorked.toFixed(2)}h)`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { TransformedJob } from "../types";
import { formatWorkerWithResource } from "../utils";

type SortField = "zp" | "date" | "time" | "quantity" | "total";
type SortDirection = "asc" | "desc";

interface ProductDetailModalProps {
  productId: string | null;
  productName: string;
  jobs: TransformedJob[];
  onClose: () => void;
  getName: (id: string) => string;
  benchmarks?: Record<string, number>;
}

export default function ProductDetailModal({
  productId,
  productName,
  jobs,
  onClose,
  getName,
  benchmarks = {}
}: ProductDetailModalProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  if (!productId) return null;

  // Filter jobs for this product
  const productJobs = jobs.filter(j => j.productTypeId === productId);

  const benchmark = benchmarks[productId];

  // Calculate stats
  const jobsWithCalcs = productJobs.map(j => {
    const efficiencyDiff = benchmark ? ((benchmark - j.totalHours) / benchmark) * 100 : null;
    const totalJobHours = j.workers.reduce((sum, w) => sum + w.hoursWorked * j.quantity, 0);
    return {
      ...j,
      efficiencyDiff,
      totalJobHours,
      isFaster: efficiencyDiff !== null && efficiencyDiff > 5,
      isSlower: efficiencyDiff !== null && efficiencyDiff < -5,
    };
  });

  // Sort
  const sortedJobs = [...jobsWithCalcs].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "zp":
        cmp = a.numerZlecenia.localeCompare(b.numerZlecenia);
        break;
      case "date":
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "time":
        cmp = a.totalHours - b.totalHours;
        break;
      case "quantity":
        cmp = a.quantity - b.quantity;
        break;
      case "total":
        cmp = a.totalJobHours - b.totalJobHours;
        break;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  // Totals
  const totalQuantity = sortedJobs.reduce((sum, j) => sum + j.quantity, 0);
  const avgTimePerUnit = sortedJobs.length > 0
    ? sortedJobs.reduce((sum, j) => sum + j.totalHours, 0) / sortedJobs.length
    : 0;
  const totalHours = sortedJobs.reduce((sum, j) => sum + j.totalJobHours, 0);

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-section-grey rounded-xl border border-grey-outline max-w-6xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-grey-outline flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{productName}</h3>
            <p className="text-sm text-power-grey">
              {sortedJobs.length} zlecen | {totalQuantity} szt | Srednia: {avgTimePerUnit.toFixed(2)}h/szt
              {benchmark && (
                <span className="ml-2 text-dark-green">(Benchmark: {benchmark.toFixed(2)}h)</span>
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
                <SortHeader field="zp" align="left">ZP</SortHeader>
                <SortHeader field="date">Data</SortHeader>
                <SortHeader field="quantity">Ilosc</SortHeader>
                <SortHeader field="time">Czas/szt</SortHeader>
                <SortHeader field="total">Lacznie</SortHeader>
                <th className="p-3 text-left text-power-grey font-bold">Brygada</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((j, idx) => (
                <tr
                  key={j.id}
                  className={`border-b border-grey-outline ${idx % 2 === 0 ? "" : "bg-background-black/50"}`}
                >
                  <td className="p-3 text-main font-mono text-xs">{j.numerZlecenia}</td>
                  <td className="p-3 text-center text-main">{j.date}</td>
                  <td className="p-3 text-center text-white">{j.quantity}</td>
                  <td className={`p-3 text-center font-semibold ${
                    j.isFaster ? "text-green-400" : j.isSlower ? "text-red-400" : "text-white"
                  }`}>
                    {j.totalHours.toFixed(2)}h
                  </td>
                  <td className="p-3 text-center text-power-grey">{j.totalJobHours.toFixed(2)}h</td>
                  <td className="p-3 text-power-grey text-xs">
                    {j.workers.map(w => `${formatWorkerWithResource(w.workerId, w.resourceId, getName)} (${w.hoursWorked.toFixed(2)}h)`).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-section-grey-dark border-t-2 border-grey-outline">
                <td className="p-3 text-white font-bold" colSpan={2}>Suma</td>
                <td className="p-3 text-center text-white font-bold">{totalQuantity}</td>
                <td className="p-3 text-center text-white font-bold">{avgTimePerUnit.toFixed(2)}h</td>
                <td className="p-3 text-center text-white font-bold">{totalHours.toFixed(2)}h</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

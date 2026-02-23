import { useState } from "react";
import { X, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import type { TransformedJob } from "../types";
import { getBucketLabel, formatWorkerWithResource, isInternalWorkJob } from "../utils";
import ProductDetailModal from "./ProductDetailModal";

type SortField = "zp" | "date" | "product" | "average" | "impact";
type SortDirection = "asc" | "desc";

interface WorkerDetailModalProps {
  workerId: string | null;
  resourceId?: string | null;
  jobs: TransformedJob[];
  onClose: () => void;
  getName: (id: string) => string;
  getProduct: (id: string) => string;
  benchmarks?: Record<string, number>;
  filterDate?: string | null;
  filterBucket?: string | null;
  granularity?: "daily" | "weekly" | "monthly";
  ignoreInternalWork?: boolean;
}

export default function WorkerDetailModal({
  workerId,
  resourceId,
  jobs,
  onClose,
  getName,
  getProduct,
  benchmarks = {},
  filterDate = null,
  filterBucket = null,
  granularity = "daily",
  ignoreInternalWork = false
}: WorkerDetailModalProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (!workerId) return null;

  // If resourceId is provided, filter by both workerId AND resourceId
  const effectiveResourceId = resourceId || workerId;
  const workerJobs = jobs
    .filter(j => !ignoreInternalWork || !isInternalWorkJob(j))
    .filter(j => j.workers.some(w =>
      w.workerId === workerId && (w.resourceId || w.workerId) === effectiveResourceId
    ));

  // Filter by bucket if provided (for weekly/monthly), or by exact date for daily
  const filteredJobs = filterBucket
    ? workerJobs.filter(j => getBucketLabel(j.date, granularity) === filterBucket)
    : filterDate
      ? workerJobs.filter(j => j.date === filterDate)
      : workerJobs;

  // Prepare jobs with calculated values for sorting
  const jobsWithCalcs = filteredJobs.map(j => {
    const me = j.workers.find(w =>
      w.workerId === workerId && (w.resourceId || w.workerId) === effectiveResourceId
    );
    const myHoursPerUnit = me?.hoursWorked || 0;
    const myTotalHours = myHoursPerUnit * j.quantity;

    // Czas/szt = sum of ALL workers' hours per unit on this job
    const totalHoursPerUnit = j.workers.reduce((sum, w) => sum + w.hoursWorked, 0);

    // Lacznie = total hours × quantity
    const totalJobHours = totalHoursPerUnit * j.quantity;

    const benchmark = benchmarks[j.productTypeId];

    // Get speed index contribution from backend (already calculated)
    const speedIndexContribution = me?.speedIndexContributionPercentage || null;

    const efficiencyDiff = benchmark ? ((benchmark - totalHoursPerUnit) / benchmark) * 100 : null;

    return {
      ...j,
      myHoursPerUnit,
      myTotalHours,
      totalHoursPerUnit,
      totalJobHours,
      benchmark,
      speedIndexContribution,
      efficiencyDiff,
      isFaster: efficiencyDiff !== null && efficiencyDiff > 5,
      isSlower: efficiencyDiff !== null && efficiencyDiff < -5,
    };
  });

  // Sort jobs
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
      case "impact":
        cmp = (a.speedIndexContribution || 0) - (b.speedIndexContribution || 0);
        break;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const avgTime = sortedJobs.length > 0 ? sortedJobs.reduce((s, j) => s + j.totalHours, 0) / sortedJobs.length : 0;

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
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div
          className="bg-section-grey rounded-xl border border-grey-outline max-w-7xl w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-grey-outline flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                {getName(workerId)} ({getName(effectiveResourceId)})
                {(filterBucket || filterDate) && (
                  <span className="ml-2 text-sm font-normal text-dark-green">
                    - {filterBucket || filterDate}
                  </span>
                )}
              </h3>
              <p className="text-sm text-power-grey">
                {sortedJobs.length} zlecen - srednia {avgTime.toFixed(2)}h/szt
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
                  <th className="p-3 text-center text-power-grey font-bold">Lacznie</th>
                  <th className="p-3 text-center text-power-grey font-bold">Czas ({getName(workerId)})</th>
                  <SortHeader field="average" align="center">Srednia/Zlecenie</SortHeader>
                  <SortHeader field="impact" align="center">Wplyw</SortHeader>
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
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedProductId(j.productTypeId)}
                        className="text-white hover:text-dark-green hover:underline transition-colors cursor-pointer"
                      >
                        {getProduct(j.productTypeId)}
                      </button>
                    </td>
                    <td className="p-3 text-center text-white">{j.quantity}</td>
                    <td className={`p-3 text-center font-semibold ${
                      j.isFaster ? "text-green-400" : j.isSlower ? "text-red-400" : "text-white"
                    }`}>
                      {j.totalHoursPerUnit.toFixed(2)}h
                    </td>
                    <td className="p-3 text-center text-power-grey">{j.totalJobHours.toFixed(2)}h</td>
                    <td className="p-3 text-center text-white font-semibold">{j.myHoursPerUnit.toFixed(2)}h</td>
                    <td className="p-3 text-center text-power-grey">
                      {j.benchmark ? `${j.benchmark.toFixed(2)}h` : "-"}
                    </td>
                    <td className="p-3 text-center">
                      {j.speedIndexContribution !== null ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          j.speedIndexContribution >= 10 ? "bg-dark-green/20 text-dark-green" :
                          j.speedIndexContribution >= 5 ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-section-grey-dark text-power-grey"
                        }`}>
                          {j.speedIndexContribution.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-power-grey text-xs">-</span>
                      )}
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

      <ProductDetailModal
        productId={selectedProductId}
        productName={getProduct(selectedProductId || "")}
        jobs={jobs}
        onClose={() => setSelectedProductId(null)}
        getName={getName}
        benchmarks={benchmarks}
        ignoreInternalWork={ignoreInternalWork}
      />
    </>
  );
}

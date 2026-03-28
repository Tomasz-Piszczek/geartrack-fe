import { useState } from "react";
import { X, ChevronUp, ChevronDown, ArrowUpDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { biServiceApi, type WorkerDailyJobEntryDto } from "../../../api/bi-service";

type SortField = "numerZlecenia" | "productTypeId" | "minutesWorked" | "timeFrom";
type SortDirection = "asc" | "desc";

const formatTime = (isoString: string | null): string => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
};

interface WorkerDayJobsModalProps {
  workerId: string;
  workerName: string;
  date: string;
  onClose: () => void;
}

export default function WorkerDayJobsModal({
  workerId,
  workerName,
  date,
  onClose,
}: WorkerDayJobsModalProps) {
  const [sortField, setSortField] = useState<SortField>("timeFrom");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["worker-daily-jobs", workerId, date],
    queryFn: () => biServiceApi.getWorkerDailyJobs(workerId, date),
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedJobs = jobs ? [...jobs].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "numerZlecenia":
        cmp = a.numerZlecenia.localeCompare(b.numerZlecenia);
        break;
      case "productTypeId":
        cmp = a.productTypeId.localeCompare(b.productTypeId);
        break;
      case "minutesWorked":
        cmp = a.minutesWorked - b.minutesWorked;
        break;
      case "timeFrom":
        const timeA = a.timeFrom ? new Date(a.timeFrom).getTime() : 0;
        const timeB = b.timeFrom ? new Date(b.timeFrom).getTime() : 0;
        cmp = timeA - timeB;
        break;
    }
    return sortDirection === "asc" ? cmp : -cmp;
  }) : [];

  const totalMinutes = sortedJobs.reduce((sum, job) => sum + job.minutesWorked, 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

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
        className="bg-section-grey rounded-xl border border-grey-outline max-w-3xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-grey-outline flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {workerName} - Zlecenia
            </h3>
            <p className="text-sm text-power-grey">
              {date}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-jet-color rounded-lg">
            <X className="w-5 h-5 text-power-grey" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-dark-green animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Blad podczas ladowania danych
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="text-center py-8 text-power-grey">
              Brak zlecen dla tego dnia
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-section-grey-dark">
                  <SortHeader field="timeFrom" align="left">Godziny</SortHeader>
                  <SortHeader field="numerZlecenia" align="left">Nr zlecenia</SortHeader>
                  <SortHeader field="productTypeId" align="left">Produkt</SortHeader>
                  <SortHeader field="minutesWorked" align="right">Czas (min)</SortHeader>
                  <th className="p-3 text-power-grey font-bold text-right">Czas (h)</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map((job, idx) => (
                  <tr
                    key={`${job.numerZlecenia}-${idx}`}
                    className={`border-b border-grey-outline ${idx % 2 === 0 ? "" : "bg-background-black/50"}`}
                  >
                    <td className="p-3 text-power-grey whitespace-nowrap">
                      <span className="text-dark-green">{formatTime(job.timeFrom)}</span>
                      <span className="mx-1">-</span>
                      <span className="text-yellow-400">{formatTime(job.timeTo)}</span>
                    </td>
                    <td className="p-3 text-main font-medium">{job.numerZlecenia}</td>
                    <td className="p-3 text-power-grey">{job.productTypeId}</td>
                    <td className="p-3 text-right text-white">{job.minutesWorked.toFixed(0)}</td>
                    <td className="p-3 text-right text-dark-green font-semibold">
                      {(job.minutesWorked / 60).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-section-grey-dark border-t-2 border-grey-outline">
                  <td className="p-3 text-white font-bold" colSpan={3}>
                    Suma ({sortedJobs.length} zlecen)
                  </td>
                  <td className="p-3 text-right text-white font-bold">{totalMinutes.toFixed(0)}</td>
                  <td className="p-3 text-right text-dark-green font-bold">{totalHours}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

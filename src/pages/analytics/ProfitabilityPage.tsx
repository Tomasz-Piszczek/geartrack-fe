import { useState, useMemo, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  Award,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ClipboardList,
  EyeOff,
  Coins,
  FileText,
  Hammer,
  Layers,
  PackageOpen,
  RefreshCw,
  Receipt,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  biServiceApi,
  type ConfidenceFilter,
  type JobProfitabilityRowDto,
  type WorkerCashRowDto,
} from "../../api/bi-service";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const fmt = (n: number | undefined | null, digits = 2) =>
  n === undefined || n === null
    ? "—"
    : n.toLocaleString("pl-PL", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

const fmtPLN = (n: number | undefined | null) => `${fmt(n)} zł`;

const profitClass = (v: number) =>
  v > 0
    ? "text-emerald-400"
    : v < 0
    ? "text-rose-400"
    : "text-gray-300";

const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

// Sort
type JobSortKey =
  | "zlecenie"
  | "produkt"
  | "invoice"
  | "revenue"
  | "material"
  | "labor"
  | "profit"
  | "margin";

/**
 * Parse Comarch invoice numbers like "FS/142/04/2026" into {year, month, number} so months
 * and years sort chronologically rather than lexicographically (FS/2 < FS/100 within a period).
 * Mirrors the backend ProfitabilityService.compareInvoiceNo logic.
 */
const parseInvoiceKey = (s: string | null | undefined): [number, number, number] => {
  if (!s) return [0, 0, 0];
  const parts = s.split("/");
  if (parts.length < 4) return [0, 0, 0];
  const n = parts.length;
  const safe = (x: string) => {
    const v = parseInt(x.trim(), 10);
    return Number.isFinite(v) ? v : 0;
  };
  return [safe(parts[n - 1]), safe(parts[n - 2]), safe(parts[n - 3])];
};

const compareInvoiceNo = (a?: string, b?: string): number => {
  const ka = parseInvoiceKey(a);
  const kb = parseInvoiceKey(b);
  for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
  return (a || "").localeCompare(b || "");
};

const sortRowsBy = (
  rows: JobProfitabilityRowDto[],
  key: JobSortKey,
  dir: "asc" | "desc"
): JobProfitabilityRowDto[] => {
  const mul = dir === "desc" ? -1 : 1;
  const num = (n: number | null | undefined) => (n == null ? 0 : n);
  const cmp: Record<JobSortKey, (a: JobProfitabilityRowDto, b: JobProfitabilityRowDto) => number> = {
    zlecenie: (a, b) => a.numerZlecenia.localeCompare(b.numerZlecenia),
    produkt:  (a, b) => (a.productTypeId || "").localeCompare(b.productTypeId || ""),
    invoice:  (a, b) => compareInvoiceNo(a.invoiceNumber, b.invoiceNumber),
    revenue:  (a, b) => num(a.revenue) - num(b.revenue),
    material: (a, b) => num(a.materialCost) - num(b.materialCost),
    labor:    (a, b) => num(a.laborCost) - num(b.laborCost),
    profit:   (a, b) => num(a.profit) - num(b.profit),
    margin:   (a, b) => num(a.marginPct) - num(b.marginPct),
  };
  return [...rows].sort((a, b) => mul * cmp[key](a, b));
};

const defaultDateRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
};

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function ProfitabilityPage() {
  const def = defaultDateRange();
  const [dateFrom, setDateFrom] = useState(def.from);
  const [dateTo, setDateTo] = useState(def.to);
  const [hourlyRate, setHourlyRate] = useState<number>(60);
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("ALL");
  const [view, setView] = useState<"jobs" | "workers">("jobs");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<JobSortKey>("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [drill, setDrill] = useState<{ type: "ro" | "fs"; value: string } | null>(null);

  const toggleSort = (key: JobSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      hourlyRate,
      ignoreInternalWork: true,
      confidenceFilter,
    }),
    [dateFrom, dateTo, hourlyRate, confidenceFilter]
  );

  const jobsQ = useQuery({
    queryKey: ["job-profitability", filters],
    queryFn: () => biServiceApi.getJobProfitability(filters),
  });

  const workersQ = useQuery({
    queryKey: ["worker-cash", filters],
    queryFn: () => biServiceApi.getWorkerCashContribution(filters),
  });

  const refreshAll = () => {
    jobsQ.refetch();
    workersQ.refetch();
  };

  return (
    <div className="flex flex-col gap-6 py-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wallet className="w-8 h-8 text-yellow-400" />
            Rentowność
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Zysk na każdym zleceniu i każdym pracowniku ·{" "}
            <span className="italic">faktura − materiały − robocizna</span>
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-4 py-2 bg-background-card hover:bg-gray-700 rounded-lg text-sm transition"
          disabled={jobsQ.isFetching || workersQ.isFetching}
          data-testid="refresh-btn"
        >
          <RefreshCw
            className={cn("w-4 h-4", jobsQ.isFetching && "animate-spin")}
          />
          Odśwież
        </button>
      </div>

      {/* Filters */}
      <div className="bg-background-card rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Od
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-background-black border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-main"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Do
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-background-black border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-main"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Stawka godz. (PLN)
          </label>
          <input
            type="number"
            value={hourlyRate}
            min={0}
            step={5}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            className="bg-background-black border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-main"
            data-testid="hourly-rate-input"
          />
        </div>
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-xs text-gray-400">Pokaż</span>
          <div className="inline-flex flex-wrap rounded-lg border border-gray-700 bg-background-black overflow-hidden text-xs">
            <ConfidenceButton
              active={confidenceFilter === "ALL"}
              onClick={() => setConfidenceFilter("ALL")}
              icon={<Layers className="w-3.5 h-3.5" />}
              label="Wszystkie"
            />
            <ConfidenceButton
              active={confidenceFilter === "WITH_INVOICE"}
              onClick={() => setConfidenceFilter("WITH_INVOICE")}
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label="Z fakturą"
            />
            <ConfidenceButton
              active={confidenceFilter === "NO_INVOICE"}
              onClick={() => setConfidenceFilter("NO_INVOICE")}
              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              label="Bez faktury"
            />
            <ConfidenceButton
              active={confidenceFilter === "HIDDEN"}
              onClick={() => setConfidenceFilter("HIDDEN")}
              icon={<EyeOff className="w-3.5 h-3.5 text-gray-400" />}
              label="Ukryte"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryRow
        loading={jobsQ.isLoading}
        summary={jobsQ.data?.summary}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <TabButton
          label="Według zleceń"
          icon={<FileText className="w-4 h-4" />}
          active={view === "jobs"}
          onClick={() => setView("jobs")}
          testid="tab-jobs"
        />
        <TabButton
          label="Według pracowników"
          icon={<Users className="w-4 h-4" />}
          active={view === "workers"}
          onClick={() => setView("workers")}
          testid="tab-workers"
        />
        {(jobsQ.isFetching || workersQ.isFetching) && (
          <span className="ml-auto text-xs text-gray-400 self-center">
            Ładowanie…
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-2.5 left-3 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={
            view === "jobs"
              ? "Szukaj zlecenia, faktury, produktu…"
              : "Szukaj pracownika…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-background-card border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-main"
        />
      </div>

      {/* Body */}
      {view === "jobs" ? (
        <JobsTable
          rows={jobsQ.data?.rows ?? []}
          loading={jobsQ.isLoading}
          search={search}
          error={jobsQ.error?.message}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          onDrill={setDrill}
        />
      ) : (
        <WorkersView
          rows={workersQ.data?.rows ?? []}
          loading={workersQ.isLoading}
          search={search}
          error={workersQ.error?.message}
        />
      )}

      {drill && (
        <DrillModal
          drill={drill}
          rows={jobsQ.data?.rows ?? []}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Summary cards
// ------------------------------------------------------------

function SummaryRow({
  loading,
  summary,
}: {
  loading: boolean;
  summary?: import("../../api/bi-service").JobProfitabilitySummaryDto;
}) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-background-card rounded-xl p-5 h-28 animate-pulse opacity-50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        title="Przychód netto"
        value={fmtPLN(summary.totalRevenue)}
        icon={<Receipt className="w-5 h-5" />}
        accent="from-blue-500 to-cyan-500"
        testid="summary-revenue"
      />
      <SummaryCard
        title="Materiały"
        value={fmtPLN(summary.totalMaterialCost)}
        sub={`Robocizna: ${fmtPLN(summary.totalLaborCost)}`}
        icon={<PackageOpen className="w-5 h-5" />}
        accent="from-orange-500 to-amber-500"
      />
      <SummaryCard
        title="Zysk"
        value={fmtPLN(summary.totalProfit)}
        sub={`Marża śr.: ${fmt(summary.avgMarginPct)}%`}
        icon={<TrendingUp className="w-5 h-5" />}
        accent={
          summary.totalProfit >= 0
            ? "from-emerald-500 to-green-500"
            : "from-rose-500 to-red-500"
        }
        testid="summary-profit"
      />
      <SummaryCard
        title="Zlecenia"
        value={String(summary.totalJobs)}
        sub={`${summary.withInvoiceJobs} z fakturą · ${summary.noInvoiceJobs} bez faktury · ${summary.hiddenUninvoicedJobs} ukryte`}
        icon={<FileText className="w-5 h-5" />}
        accent="from-violet-500 to-fuchsia-500"
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
  icon,
  accent,
  testid,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent: string;
  testid?: string;
}) {
  return (
    <div
      className="bg-background-card rounded-xl p-5 relative overflow-hidden"
      data-testid={testid}
    >
      <div
        className={cn(
          "absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl",
          accent
        )}
      />
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span
          className={cn(
            "p-1.5 rounded-lg bg-gradient-to-br text-white",
            accent
          )}
        >
          {icon}
        </span>
        <span>{title}</span>
      </div>
      <div className="text-2xl font-bold mt-3">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function ConfidenceButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 transition border-r border-gray-700 last:border-r-0",
        active
          ? "bg-main/20 text-white"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
  testid,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm transition border-b-2 -mb-px",
        active
          ? "border-main text-white"
          : "border-transparent text-gray-400 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ------------------------------------------------------------
// Jobs table
// ------------------------------------------------------------

const PAGE_SIZE = 500;

function JobsTable({
  rows,
  loading,
  search,
  error,
  sortKey,
  sortDir,
  onSort,
  onDrill,
}: {
  rows: JobProfitabilityRowDto[];
  loading: boolean;
  search: string;
  error?: string;
  sortKey: JobSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: JobSortKey) => void;
  onDrill: (d: { type: "ro" | "fs"; value: string }) => void;
}) {
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = !s
      ? rows
      : rows.filter(
          (r) =>
            r.numerZlecenia.toLowerCase().includes(s) ||
            (r.invoiceNumber || "").toLowerCase().includes(s) ||
            (r.productTypeId || "").toLowerCase().includes(s) ||
            (r.roNumer || "").toLowerCase().includes(s)
        );
    return sortRowsBy(base, sortKey, sortDir);
  }, [rows, search, sortKey, sortDir]);

  // Reset to page 0 whenever the underlying row set changes (filter/sort/search/data refresh).
  useEffect(() => {
    setPage(0);
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageSlice = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage]
  );

  if (error) return <ErrorBox text={error} />;
  if (loading) return <SkeletonTable />;
  if (rows.length === 0)
    return <EmptyBox text="Brak zafakturowanych zleceń w wybranym zakresie." />;

  return (
    <div className="bg-background-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="jobs-table">
          <thead className="bg-background-black/40 text-xs text-gray-400 uppercase">
            <tr>
              <th className="text-left px-4 py-3 w-8" />
              <SortableTh label="Zlecenie" colKey="zlecenie" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="left" />
              <SortableTh label="Produkt" colKey="produkt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="left" />
              <SortableTh label="Faktura" colKey="invoice" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="left" />
              <SortableTh label="Przychód" colKey="revenue" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <SortableTh label="Materiały" colKey="material" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <SortableTh label="Robocizna" colKey="labor" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <SortableTh label="Zysk" colKey="profit" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <SortableTh label="Marża" colKey="margin" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {pageSlice.map((row) => (
              <JobRow key={row.cznId} row={row} onDrill={onDrill} />
            ))}
          </tbody>
        </table>
      </div>
      <Pager
        page={safePage}
        pageCount={pageCount}
        pageStart={safePage * PAGE_SIZE + 1}
        pageEnd={Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
        total={filtered.length}
        rawTotal={rows.length}
        onPage={setPage}
      />
    </div>
  );
}

function Pager({
  page,
  pageCount,
  pageStart,
  pageEnd,
  total,
  rawTotal,
  onPage,
}: {
  page: number;
  pageCount: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  rawTotal: number;
  onPage: (p: number) => void;
}) {
  const filteredOut = rawTotal - total;
  return (
    <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-800 flex items-center gap-3 flex-wrap">
      <span>
        Wyświetlono {total === 0 ? 0 : `${pageStart}–${pageEnd}`} z {total}
        {filteredOut > 0 && <span className="text-gray-600"> · {filteredOut} ukryto wyszukiwarką</span>}
      </span>
      {pageCount > 1 && (
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2 py-1 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronsLeft className="w-3 h-3" />
            Poprz.
          </button>
          <span className="text-gray-400">
            Strona <span className="text-white font-semibold">{page + 1}</span> z {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPage(Math.min(pageCount - 1, page + 1))}
            disabled={page >= pageCount - 1}
            className="px-2 py-1 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Nast.
            <ChevronsRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function SortableTh({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort,
  align,
}: {
  label: string;
  colKey: JobSortKey;
  sortKey: JobSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: JobSortKey) => void;
  align: "left" | "right";
}) {
  const active = sortKey === colKey;
  const Icon = !active ? ChevronsUpDown : sortDir === "desc" ? ArrowDown : ArrowUp;
  return (
    <th className={cn("px-4 py-3", align === "left" ? "text-left" : "text-right")}>
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={cn(
          "inline-flex items-center gap-1.5 uppercase font-semibold tracking-wide transition",
          align === "right" && "flex-row-reverse",
          active ? "text-white" : "text-gray-400 hover:text-white"
        )}
      >
        <Icon className={cn("w-3 h-3", active ? "text-main" : "text-gray-500")} />
        <span>{label}</span>
      </button>
    </th>
  );
}

function JobRow({
  row,
  onDrill,
}: {
  row: JobProfitabilityRowDto;
  onDrill: (d: { type: "ro" | "fs"; value: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-background-black/40 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        data-testid={`job-row-${row.cznId}`}
      >
        <td className="px-4 py-3">
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </td>
        <td className="px-4 py-3 font-mono text-xs">
          <div className="font-semibold">{row.numerZlecenia}</div>
          <div className="text-gray-500">{row.orderDate}</div>
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">{row.productTypeId}</div>
          <div className="text-xs text-gray-500">
            ilość: {fmt(row.orderQuantity, 0)}
          </div>
        </td>
        <td className="px-4 py-3 align-top">
          {row.invoiceNumber ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDrill({ type: "fs", value: row.invoiceNumber });
              }}
              className="font-mono text-xs flex items-center gap-1.5 hover:text-blue-300 hover:underline underline-offset-2 transition"
              title="Pokaż wszystkie ZP na tej fakturze"
            >
              <Receipt className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="font-semibold">{row.invoiceNumber}</span>
            </button>
          ) : row.revenueAttributionConfidence === "HIDDEN" ? (
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-gray-800 text-gray-400 border border-gray-700 inline-flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> ukryte
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-amber-900/40 text-amber-300 border border-amber-800 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> bez faktury
            </span>
          )}
          {row.roNumer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDrill({ type: "ro", value: row.roNumer! });
              }}
              className="font-mono text-[11px] flex items-center gap-1.5 mt-0.5 text-violet-300/90 hover:text-violet-200 hover:underline underline-offset-2 transition"
              title="Pokaż wszystkie ZP w tym RO"
            >
              <ClipboardList className="w-3 h-3 text-violet-400 shrink-0" />
              <span>{row.roNumer}</span>
            </button>
          )}
          {(row.invoiceDate || row.fskorAdjustmentApplied) && (
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
              {row.invoiceDate}
              {row.fskorAdjustmentApplied && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-900/40 text-rose-300 border border-rose-800">
                  korekta
                </span>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-right">{fmtPLN(row.revenue)}</td>
        <td className="px-4 py-3 text-right text-orange-300">
          {fmtPLN(row.materialCost)}
        </td>
        <td className="px-4 py-3 text-right text-cyan-300">
          {fmtPLN(row.laborCost)}
          <div className="text-xs text-gray-500">{fmt(row.laborHours)}h</div>
        </td>
        <td
          className={cn(
            "px-4 py-3 text-right font-semibold",
            profitClass(row.profit)
          )}
        >
          {row.profit >= 0 ? (
            <ArrowUpRight className="inline w-4 h-4 -mt-1" />
          ) : (
            <ArrowDownRight className="inline w-4 h-4 -mt-1" />
          )}
          {fmtPLN(row.profit)}
        </td>
        <td
          className={cn(
            "px-4 py-3 text-right font-semibold",
            profitClass(row.marginPct)
          )}
        >
          {fmt(row.marginPct)}%
        </td>
      </tr>
      {open && <JobDetailRow row={row} />}
    </>
  );
}

function JobDetailRow({ row }: { row: JobProfitabilityRowDto }) {
  return (
    <tr className="bg-background-black/30">
      <td colSpan={9} className="px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Workers */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Pracownicy
              ({row.workers.length})
            </h4>
            <div className="space-y-1.5">
              {row.workers.map((w, idx) => {
                const isGroup =
                  w.resourceId !== w.workerId && w.resourceId !== null;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-background-black/40 rounded px-3 py-2"
                  >
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {w.workerId}
                        {isGroup && (
                          <span className="text-xs px-1.5 py-0.5 bg-violet-900/40 text-violet-300 rounded">
                            ↳ {w.resourceId}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {fmt(w.hours)} h ·{" "}
                        <span>{fmt(w.sharePct)}% udziału</span>{" "}
                        · koszt {fmtPLN(w.laborCost)}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-right text-sm font-semibold",
                        profitClass(w.shareOfProfit)
                      )}
                    >
                      {fmtPLN(w.shareOfProfit)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Materials */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-400" /> Materiały (RW)
              {row.rwElements && row.rwElements.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({row.rwElements.length} pozycji)
                </span>
              )}
            </h4>
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {(row.rwElements || []).length === 0 ? (
                <div className="text-xs text-gray-500 italic">
                  Brak pobrań RW
                </div>
              ) : (
                (row.rwElements || []).map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-background-black/40 rounded px-3 py-1.5 text-xs"
                  >
                    <div className="flex-1 truncate pr-2">
                      <span className="font-mono text-gray-300">
                        {m.twrKod}
                      </span>
                      <span className="text-gray-500 ml-2">
                        × {fmt(m.ilosc, 2)}
                      </span>
                    </div>
                    <div className="text-orange-300 font-semibold whitespace-nowrap">
                      {fmtPLN(m.wartoscNetto)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-xs flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-violet-300">
                <ClipboardList className="w-3 h-3" />
                Zamówienie odbiorcy:
                <span className="font-mono">{row.roNumer}</span>
              </span>
              {row.fskorAdjustmentApplied && (
                <span className="px-1.5 py-0.5 bg-rose-900/30 text-rose-300 rounded text-[10px]">
                  korekta zastosowana
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ------------------------------------------------------------
// Workers view (cards + chart)
// ------------------------------------------------------------

function WorkersView({
  rows,
  loading,
  search,
  error,
}: {
  rows: WorkerCashRowDto[];
  loading: boolean;
  search: string;
  error?: string;
}) {
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.workerId.toLowerCase().includes(s));
  }, [rows, search]);

  if (error) return <ErrorBox text={error} />;
  if (loading) return <SkeletonGrid />;
  if (rows.length === 0)
    return <EmptyBox text="Brak danych pracowników." />;

  return (
    <div className="space-y-6">
      {/* Profit per hour chart */}
      <div className="bg-background-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Zysk na godzinę (PLN/h) — kto zarabia firmie najwięcej
        </h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart
              data={filtered.slice(0, 15).map((r) => ({
                name:
                  r.workerId.length > 14
                    ? r.workerId.slice(0, 12) + "…"
                    : r.workerId,
                fullName: r.workerId,
                resourceId: r.resourceId,
                profitPerHour: r.profitPerHour,
                profit: r.attributedProfit,
              }))}
              margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                stroke="#999"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-22}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#999" tick={{ fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{
                  background: "#1a1d24",
                  border: "1px solid #444",
                  borderRadius: 8,
                }}
                formatter={(value, name) => {
                  if (name === "profitPerHour")
                    return [`${fmt(Number(value))} PLN/h`, "Zysk/godz"];
                  return [String(value), String(name)];
                }}
                labelFormatter={(_, payload) => {
                  if (!payload || payload.length === 0) return "";
                  const d = payload[0].payload as { fullName: string; resourceId: string };
                  return `${d.fullName} (${d.resourceId})`;
                }}
              />
              <Bar dataKey="profitPerHour" radius={[6, 6, 0, 0]}>
                {filtered.slice(0, 15).map((r, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      r.profitPerHour >= 0
                        ? idx === 0
                          ? "#fbbf24"
                          : "#10b981"
                        : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worker cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w, idx) => (
          <WorkerCard key={`${w.workerId}|${w.resourceId}`} w={w} rank={idx + 1} />
        ))}
      </div>
    </div>
  );
}

function WorkerCard({ w, rank }: { w: WorkerCashRowDto; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const isGroup = w.resourceId !== w.workerId && w.resourceId !== null;

  return (
    <div
      className="bg-background-card rounded-xl p-5 relative overflow-hidden"
      data-testid={`worker-card-${rank}`}
    >
      {rank <= 3 && (
        <div className="absolute -top-1 -right-1 px-2 py-1 rounded-bl-lg bg-yellow-500 text-black text-xs font-bold flex items-center gap-1">
          <Award className="w-3 h-3" />#{rank}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{w.workerId}</div>
          {isGroup && (
            <div className="text-xs text-violet-300 mt-0.5">
              ↳ {w.resourceId}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {fmt(w.totalHours)} h · {w.jobsTouched} zleceń
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-2xl font-bold",
              profitClass(w.profitPerHour)
            )}
          >
            {fmt(w.profitPerHour)}
          </div>
          <div className="text-[10px] uppercase text-gray-500 -mt-1">
            PLN / godz.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Przychód" value={fmtPLN(w.attributedRevenue)} />
        <Stat
          label="Mat.+rob."
          value={fmtPLN(w.attributedMaterialCost + w.attributedLaborCost)}
        />
        <Stat
          label="Zysk"
          value={fmtPLN(w.attributedProfit)}
          highlight={w.attributedProfit >= 0 ? "good" : "bad"}
        />
      </div>

      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-4 w-full text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 py-1.5 rounded bg-background-black/40"
      >
        {expanded ? (
          <>
            <ChevronDown className="w-3 h-3" /> Ukryj zlecenia
          </>
        ) : (
          <>
            <ChevronRight className="w-3 h-3" /> Pokaż top zlecenia
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="text-xs text-emerald-400 mb-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Najlepsze
            </div>
            {w.topJobs.slice(0, 5).map((j, i) => (
              <JobMini key={i} j={j} />
            ))}
          </div>
          {w.worstJobs.length > 0 &&
            w.worstJobs[0].myShareOfProfit < w.topJobs[0]?.myShareOfProfit && (
              <div className="mt-3">
                <div className="text-xs text-rose-400 mb-1.5 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Najsłabsze
                </div>
                {w.worstJobs.slice(0, 3).map((j, i) => (
                  <JobMini key={i} j={j} />
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function JobMini({ j }: { j: import("../../api/bi-service").WorkerCashTopJobDto }) {
  return (
    <div className="flex items-center justify-between bg-background-black/30 rounded px-2 py-1.5 text-xs">
      <div className="min-w-0 flex-1">
        <div className="font-mono truncate">{j.numerZlecenia}</div>
        <div className="text-gray-500 text-[10px] truncate">
          {j.productTypeId} · {j.invoiceNumber}
        </div>
      </div>
      <div
        className={cn(
          "font-semibold pl-2 whitespace-nowrap",
          profitClass(j.myShareOfProfit)
        )}
      >
        {fmtPLN(j.myShareOfProfit)}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "good" | "bad";
}) {
  return (
    <div className="bg-background-black/40 rounded px-2 py-1.5">
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      <div
        className={cn(
          "text-xs font-semibold mt-0.5",
          highlight === "good" && "text-emerald-400",
          highlight === "bad" && "text-rose-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Misc
// ------------------------------------------------------------

function SkeletonTable() {
  return (
    <div className="bg-background-card rounded-xl p-5 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-9 bg-background-black/40 rounded animate-pulse"
          style={{ opacity: 0.5 - i * 0.04 }}
        />
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-background-card rounded-xl p-5 h-44 animate-pulse"
          style={{ opacity: 0.55 - i * 0.06 }}
        />
      ))}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="bg-background-card rounded-xl p-10 text-center text-gray-400">
      {text}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-5 text-rose-200">
      Błąd: {text}
    </div>
  );
}

// ------------------------------------------------------------
// Drilldown modal — list every ZP that shares the clicked RO or FS
// ------------------------------------------------------------

function DrillModal({
  drill,
  rows,
  onClose,
}: {
  drill: { type: "ro" | "fs"; value: string };
  rows: JobProfitabilityRowDto[];
  onClose: () => void;
}) {
  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const matched = useMemo(
    () =>
      rows.filter((r) =>
        drill.type === "ro" ? r.roNumer === drill.value : r.invoiceNumber === drill.value
      ),
    [rows, drill]
  );

  const totalRevenue = matched.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalProfit = matched.reduce((s, r) => s + (r.profit || 0), 0);
  const totalMaterial = matched.reduce((s, r) => s + (r.materialCost || 0), 0);
  const totalLabor = matched.reduce((s, r) => s + (r.laborCost || 0), 0);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="border border-gray-700 rounded-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "#303030" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {drill.type === "fs" ? (
              <Receipt className="w-5 h-5 text-blue-400" />
            ) : (
              <ClipboardList className="w-5 h-5 text-violet-400" />
            )}
            <div>
              <div className="text-base font-semibold text-white">
                {drill.type === "fs" ? "Faktura" : "Zamówienie odbiorcy"}{" "}
                <span className="font-mono text-amber-300">{drill.value}</span>
              </div>
              <div className="text-xs text-gray-400">
                {matched.length} {matched.length === 1 ? "zlecenie" : "zleceń"}
                {" · "}Przychód {fmtPLN(totalRevenue)}
                {" · "}Zysk {fmtPLN(totalProfit)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {matched.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Brak zleceń pasujących do {drill.type === "fs" ? "tej faktury" : "tego RO"}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-background-black/40 text-xs text-gray-400 uppercase sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5">Zlecenie</th>
                  <th className="text-left px-4 py-2.5">Produkt</th>
                  {drill.type === "ro" && (
                    <th className="text-left px-4 py-2.5">Faktura</th>
                  )}
                  <th className="text-right px-4 py-2.5">Ilość</th>
                  <th className="text-right px-4 py-2.5">Przychód</th>
                  <th className="text-right px-4 py-2.5">Materiały</th>
                  <th className="text-right px-4 py-2.5">Robocizna</th>
                  <th className="text-right px-4 py-2.5">Zysk</th>
                  <th className="text-right px-4 py-2.5">Marża</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {matched.map((r) => {
                  const isNoInv = r.revenueAttributionConfidence === "NO_INVOICE"
                    || r.revenueAttributionConfidence === "LOW";
                  return (
                    <tr key={r.cznId} className="hover:bg-background-black/40">
                      <td className="px-4 py-2 font-mono text-xs">
                        <div className="font-semibold">{r.numerZlecenia}</div>
                        <div className="text-gray-500">{r.orderDate}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{r.productTypeId}</div>
                        {isNoInv && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-300 border border-amber-800">
                            bez faktury
                          </span>
                        )}
                      </td>
                      {drill.type === "ro" && (
                        <td className="px-4 py-2 font-mono text-xs">
                          {r.invoiceNumber}
                          <div className="text-gray-500">{r.invoiceDate}</div>
                        </td>
                      )}
                      <td className="px-4 py-2 text-right">{fmt(r.orderQuantity, 0)}</td>
                      <td className="px-4 py-2 text-right">{fmtPLN(r.revenue)}</td>
                      <td className="px-4 py-2 text-right text-orange-300">{fmtPLN(r.materialCost)}</td>
                      <td className="px-4 py-2 text-right text-cyan-300">{fmtPLN(r.laborCost)}</td>
                      <td className={cn("px-4 py-2 text-right font-semibold", profitClass(r.profit))}>
                        {fmtPLN(r.profit)}
                      </td>
                      <td className={cn("px-4 py-2 text-right font-semibold", profitClass(r.marginPct))}>
                        {fmt(r.marginPct)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-background-black/40 text-xs uppercase">
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-gray-300" colSpan={drill.type === "ro" ? 4 : 3}>
                    Razem
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">{fmtPLN(totalRevenue)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-orange-300">{fmtPLN(totalMaterial)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-cyan-300">{fmtPLN(totalLabor)}</td>
                  <td className={cn("px-4 py-2.5 text-right font-semibold", profitClass(totalProfit))}>
                    {fmtPLN(totalProfit)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Check, User, RefreshCw, BarChart3, AlertTriangle } from "lucide-react";
import { biServiceApi, type JobDto, type WorkerTimeDto, type WorkerAnalyticsRequestDto, type WorkerStatsDto } from "../../api/bi-service";
import { QUERY_KEYS } from "../../constants";
import type { TransformedJob, TeamInfo } from "./types";
import {
  calcTeamList,
  calcTeamTrend,
  getDefaultDateRange,
  getWorkerColor,
  groupJobsByBucket,
  sortBucketKeys,
  formatWorkerWithResource,
  TEAM_COLORS,
} from "./utils";
import {
  MultiSelectDropdown,
  WorkerDetailModal,
  TeamDetailModal,
  DailyBreakdownModal,
  CustomTooltip,
  TimeBar,
} from "./components";

const HIDDEN_WORKERS = ["Wycinanie", "Produkcja"];

export default function WorkerAnalyticsPage() {
  const [view, setView] = useState<"rankings" | "teams" | "trend" | "zlecenia" | "worker">("rankings");
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [trendMode, setTrendMode] = useState<"workers" | "teams">("workers");
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedTrendWorkers, setSelectedTrendWorkers] = useState<Set<string>>(new Set());
  const [selectedTrendTeams, setSelectedTrendTeams] = useState<Set<string>>(new Set());
  const [soloOnly, setSoloOnly] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null);
  const [selectedWorkerModal, setSelectedWorkerModal] = useState<string | null>(null);
  const [selectedResourceModal, setSelectedResourceModal] = useState<string | null>(null);
  const [showIdleLine, setShowIdleLine] = useState(false);
  const [showInternalLine, setShowInternalLine] = useState(false);
  const [showCombinedLine, setShowCombinedLine] = useState(false);
  const [ignoreInternalWork, setIgnoreInternalWork] = useState(false);
  const [modalFilterDate, setModalFilterDate] = useState<string | null>(null);
  const [modalFilterBucket, setModalFilterBucket] = useState<string | null>(null);
  const [dailyBreakdownWorker, setDailyBreakdownWorker] = useState<string | null>(null);
  const [dailyBreakdownBucket, setDailyBreakdownBucket] = useState<string | null>(null);

  const defaultRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);

  const [appliedFilters, setAppliedFilters] = useState<WorkerAnalyticsRequestDto>({
    dateFrom: defaultRange.from || undefined,
    dateTo: defaultRange.to || undefined,
  });

  const pendingFilters: WorkerAnalyticsRequestDto = useMemo(() => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    selectedProducts: selectedProducts.size > 0 ? Array.from(selectedProducts) : undefined,
    excludedWorkers: excluded.size > 0 ? Array.from(excluded) : undefined,
    soloOnly: soloOnly || undefined,
    ignoreInternalWork: ignoreInternalWork || undefined,
  }), [dateFrom, dateTo, selectedProducts, excluded, soloOnly, ignoreInternalWork]);

  const filtersChanged = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.WORKER_ANALYTICS, appliedFilters],
    queryFn: () => biServiceApi.getWorkerAnalytics(appliedFilters),
  });

  const allWorkers = useMemo(() => {
    if (!data?.allWorkerIds) return [];
    return data.allWorkerIds.map(id => ({ id, name: id }));
  }, [data?.allWorkerIds]);

  const allProducts = useMemo(() => {
    if (!data?.allProductIds) return [];
    return data.allProductIds.map(id => ({ id, name: id })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data?.allProductIds]);

  const transformedJobs = useMemo(() => {
    if (!data?.jobs) return [];
    return data.jobs
      .filter((job: JobDto) => job.date != null)
      .map((job: JobDto) => {
        const totalMinutes = job.totalMinutes || 0;
        const totalHours = totalMinutes / 60;
        const quantity = job.quantity || 1;
        const hoursPerUnit = totalHours / quantity;

        const workersList = (job.workers || []).map((w: WorkerTimeDto) => {
          const workerMinutes = w.minutesWorked || 0;
          const workerHours = workerMinutes / 60;
          const workerHoursPerUnit = workerHours / quantity;
          return { workerId: w.workerId, resourceId: w.resourceId || w.workerId, hoursWorked: workerHoursPerUnit };
        });

        return {
          id: `J${job.id}`,
          numerZlecenia: job.numerZlecenia,
          date: job.date,
          productTypeId: job.productTypeId,
          quantity: quantity,
          workers: workersList,
          totalHours: hoursPerUnit,
        };
      });
  }, [data?.jobs]);

  const initializedProducts = useRef(false);
  useEffect(() => {
    if (allProducts.length > 0 && !initializedProducts.current) {
      const allProductIds = allProducts.map(p => p.id);
      setSelectedProducts(new Set(allProductIds));
      setAppliedFilters(prev => ({ ...prev, selectedProducts: allProductIds }));
      initializedProducts.current = true;
    }
  }, [allProducts]);

  const getName = (id: string) => allWorkers.find(w => w.id === id)?.name || id;
  const getProduct = (id: string) => allProducts.find(p => p.id === id)?.name || id;

  const toggleExclude = (id: string) => {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExcluded(next);
    if (next.has(selectedWorker || "")) setSelectedWorker(null);
  };

  const toggleTrendWorker = (id: string) => {
    const next = new Set(selectedTrendWorkers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTrendWorkers(next);
  };

  const toggleTrendTeam = (key: string) => {
    const next = new Set(selectedTrendTeams);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedTrendTeams(next);
  };

  const benchmarks = useMemo(() => data?.benchmarks || {}, [data?.benchmarks]);
  const cappedDays = useMemo(() => data?.cappedDays || [], [data?.cappedDays]);

  // Map of workerId -> their capped days count
  const workerCappedDaysCount = useMemo(() => {
    const map: Record<string, number> = {};
    cappedDays.forEach(cd => {
      map[cd.workerId] = (map[cd.workerId] || 0) + 1;
    });
    return map;
  }, [cappedDays]);

  // Map of "workerId|resourceId" -> their stats (for DailyBreakdownModal)
  const workerStatsMap = useMemo(() => {
    const map: Record<string, WorkerStatsDto> = {};
    data?.workerStats?.forEach(ws => {
      const resourceId = ws.resourceId || ws.workerId;
      const compositeKey = `${ws.workerId}|${resourceId}`;
      map[compositeKey] = ws;
    });
    return map;
  }, [data?.workerStats]);

  // List of all worker+resource combinations with data (for exclusion and trend selection)
  const workerResourceCombinations = useMemo(() => {
    if (!data?.workerStats) return [];
    return data.workerStats.map(ws => {
      const resourceId = ws.resourceId || ws.workerId;
      return {
        compositeId: `${ws.workerId}|${resourceId}`,
        workerId: ws.workerId,
        resourceId: resourceId,
        displayName: ws.workerId === resourceId ? ws.workerId : `${ws.workerId} (${resourceId})`,
        jobCount: ws.jobCount
      };
    }).filter(w => w.jobCount > 0);
  }, [data?.workerStats]);

  const rankings = useMemo(() => {
    if (!data?.workerStats) return [];
    return data.workerStats
      .map(ws => {
        const resourceId = ws.resourceId || ws.workerId;
        // Create composite ID for unique identification
        const compositeId = `${ws.workerId}|${resourceId}`;
        // Display name: "WorkerName (ResourceName)"
        const displayName = `${ws.workerId} (${resourceId})`;
        return {
          id: compositeId,
          workerId: ws.workerId,
          resourceId: resourceId,
          name: displayName,
          efficiency: ws.speedIndex || 0,
          jobCount: ws.jobCount,
          presence: ws.presence,
          production: ws.production,
          internalWork: ws.internalWork,
          idle: ws.idle,
          hasCappedDays: (workerCappedDaysCount[ws.workerId] || 0) > 0,
          cappedDaysCount: workerCappedDaysCount[ws.workerId] || 0
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [data?.workerStats, workerCappedDaysCount]);

  const rankingsWithData = useMemo(() => {
    return rankings.filter(r => r.jobCount > 0);
  }, [rankings]);

  const rankingsVisible = useMemo(() => {
    return rankingsWithData.filter(r =>
      !HIDDEN_WORKERS.includes(r.workerId) && !HIDDEN_WORKERS.includes(r.resourceId)
    );
  }, [rankingsWithData]);

  const teamList = useMemo(() => calcTeamList(transformedJobs), [transformedJobs]);

  const teamListVisible = useMemo(() => {
    return teamList.filter(t => !t.workerIds.some(id => HIDDEN_WORKERS.includes(id)));
  }, [teamList]);

  const productBenchmarks = useMemo(() => {
    const bm: Record<string, { avg: number; count: number; jobs: TransformedJob[] }> = {};
    allProducts.forEach(p => {
      const pJobs = transformedJobs.filter(j => j.productTypeId === p.id);
      bm[p.id] = {
        avg: pJobs.reduce((s, j) => s + j.totalHours, 0) / (pJobs.length || 1),
        count: pJobs.length,
        jobs: pJobs,
      };
    });
    return bm;
  }, [allProducts, transformedJobs]);

  const maxEff = rankingsWithData[0]?.efficiency || 1;

  // For trend: use composite IDs (workerId|resourceId)
  const visibleTrendCompositeIds = useMemo(() =>
    workerResourceCombinations
      .filter(w => !HIDDEN_WORKERS.includes(w.workerId) && !HIDDEN_WORKERS.includes(w.resourceId))
      .map(w => w.compositeId),
    [workerResourceCombinations]
  );
  const activeWorkerIds = useMemo(() => [...selectedTrendWorkers].filter(id => visibleTrendCompositeIds.includes(id)), [selectedTrendWorkers, visibleTrendCompositeIds]);
  const activeTeams = useMemo(() => teamListVisible.filter(t => selectedTrendTeams.has(t.key)), [teamListVisible, selectedTrendTeams]);

  // Build a map of worker+resource daily details for chart data (keyed by compositeId)
  const workerDailyDetailsMap = useMemo(() => {
    const map: Record<string, Record<string, { idle: number; internal: number; production: number }>> = {};
    data?.workerStats?.forEach(ws => {
      if (!ws.dailyDetails) return;
      const resourceId = ws.resourceId || ws.workerId;
      const compositeId = `${ws.workerId}|${resourceId}`;
      map[compositeId] = {};
      ws.dailyDetails.forEach(d => {
        map[compositeId][d.date] = {
          idle: d.idleHours,
          internal: d.internalHours,
          production: d.productionHours
        };
      });
    });
    return map;
  }, [data?.workerStats]);

  const workerTrendData = useMemo(() => {
    const bucketMap = groupJobsByBucket(transformedJobs, granularity);
    const sortedKeys = sortBucketKeys(Object.keys(bucketMap), granularity);
    return sortedKeys.map(b => {
      const bucketJobs = bucketMap[b];
      // Get all unique dates in this bucket for click handling
      const bucketDates = [...new Set(bucketJobs.map(j => j.date))].sort();
      const entry: Record<string, string | number> = { week: b, _bucketKey: b, _originalDate: bucketDates[0] || "" };

      // activeWorkerIds now contains composite IDs (workerId|resourceId)
      activeWorkerIds.forEach(compositeId => {
        const [workerId, resourceId] = compositeId.split("|");
        let sumExp = 0;
        let sumAct = 0;

        // Collect unique dates where this worker+resource worked
        const workerDatesInBucket = new Set<string>();

        bucketJobs.forEach(j => {
          // Find worker entries matching both workerId AND resourceId
          const worker = j.workers.find(w =>
            w.workerId === workerId &&
            (w.resourceId || w.workerId) === resourceId
          );
          if (!worker) return;
          const benchmark = benchmarks[j.productTypeId] || j.totalHours;
          const workerContribution = worker.hoursWorked / j.totalHours;
          sumExp += benchmark * workerContribution;
          sumAct += worker.hoursWorked;
          workerDatesInBucket.add(j.date);
        });

        if (sumAct > 0) {
          entry[compositeId] = +(sumExp / sumAct).toFixed(2);
        }

        // Aggregate daily details for all dates in this bucket (using composite ID)
        let totalIdle = 0;
        let totalInternal = 0;
        let totalProduction = 0;

        workerDatesInBucket.forEach(date => {
          const dailyDetail = workerDailyDetailsMap[compositeId]?.[date];
          if (dailyDetail) {
            totalIdle += dailyDetail.idle;
            totalInternal += dailyDetail.internal;
            totalProduction += dailyDetail.production;
          }
        });

        // Calculate percentages for idle/internal lines
        const totalPresence = totalProduction + totalInternal + totalIdle;
        if (totalPresence > 0) {
          entry[`idle_${compositeId}`] = +((totalIdle / totalPresence) * 100).toFixed(1);
          entry[`internal_${compositeId}`] = +((totalInternal / totalPresence) * 100).toFixed(1);
          entry[`combined_${compositeId}`] = +(((totalIdle + totalInternal) / totalPresence) * 100).toFixed(1);
        }
      });
      return entry;
    });
  }, [activeWorkerIds, transformedJobs, granularity, benchmarks, workerDailyDetailsMap]);

  const teamTrendData = useMemo(() => calcTeamTrend(activeTeams, transformedJobs, granularity), [activeTeams, transformedJobs, granularity]);

  const workerChartStats = useMemo(() => {
    if (workerTrendData.length === 0 || activeWorkerIds.length === 0) return null;
    let sum = 0, count = 0;
    workerTrendData.forEach(entry => {
      activeWorkerIds.forEach(id => {
        const val = entry[id];
        if (typeof val === "number") { sum += val; count++; }
      });
    });
    const avg = count > 0 ? sum / count : 0;
    const firstDate = workerTrendData[0]?.week as string;
    const lastDate = workerTrendData[workerTrendData.length - 1]?.week as string;
    return { avg, firstDate, lastDate };
  }, [workerTrendData, activeWorkerIds]);

  const teamChartStats = useMemo(() => {
    if (teamTrendData.length === 0 || activeTeams.length === 0) return null;
    let sum = 0, count = 0;
    teamTrendData.forEach(entry => {
      activeTeams.forEach(t => {
        const val = entry[t.key];
        if (typeof val === "number") { sum += val; count++; }
      });
    });
    const avg = count > 0 ? sum / count : 0;
    const firstDate = teamTrendData[0]?.week as string;
    const lastDate = teamTrendData[teamTrendData.length - 1]?.week as string;
    return { avg, firstDate, lastDate };
  }, [teamTrendData, activeTeams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-black p-6 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-black p-6 flex items-center justify-center">
        <div className="text-red-500">Blad ladowania danych</div>
      </div>
    );
  }

  const tabs: { id: typeof view; label: string }[] = [
    { id: "rankings", label: "Ranking" },
    { id: "teams", label: "Zespoly" },
    { id: "trend", label: "Trend" },
    { id: "zlecenia", label: "Zlecenia" },
    { id: "worker", label: "Pracownik" },
  ];

  return (
    <div className="min-h-screen bg-background-black p-6">
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(48%) sepia(30%) saturate(500%) hue-rotate(50deg) brightness(95%) contrast(90%);
          cursor: pointer;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-main mb-6">Analiza Pracownikow</h1>

        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex gap-2 flex-wrap">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  view === id
                    ? "bg-dark-green text-white"
                    : "bg-section-grey text-power-grey hover:bg-jet-color"
                }`}
                onClick={() => { setView(id); if (id !== "worker") setSelectedWorker(null); }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <MultiSelectDropdown
              options={allProducts}
              selected={selectedProducts}
              onChange={setSelectedProducts}
              placeholder="Wybierz produkty"
            />
          </div>
        </div>

        <div className="bg-section-grey rounded-xl p-4 border border-grey-outline mb-4 flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-green" />
            <span className="text-sm font-bold text-white">Zakres dat:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-power-grey">Od:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-section-grey-dark text-white border border-grey-outline rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-power-grey">Do:</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-section-grey-dark text-white border border-grey-outline rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={() => {
              const range = getDefaultDateRange();
              setDateFrom(range.from);
              setDateTo(range.to);
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-section-grey-dark text-power-grey hover:bg-jet-color border border-grey-outline"
          >
            Ostatni miesiac
          </button>
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-section-grey-dark text-power-grey hover:bg-jet-color border border-grey-outline"
          >
            Wszystko
          </button>
          <span className="text-xs text-power-grey ml-auto">{transformedJobs.length} zlecen w zakresie</span>
        </div>

        <div className="bg-section-grey rounded-xl p-4 border border-grey-outline mb-4 flex items-center flex-wrap gap-3">
          <span className="text-sm font-bold text-red-400">Wyklucz:</span>
          {workerResourceCombinations
            .filter(w => !HIDDEN_WORKERS.includes(w.workerId) && !HIDDEN_WORKERS.includes(w.resourceId))
            .map(w => (
            <button
              key={w.compositeId}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                excluded.has(w.compositeId)
                  ? "border-red-500 bg-soft-red text-red-400"
                  : "border-grey-outline bg-section-grey-dark text-power-grey hover:border-dark-green"
              }`}
              onClick={() => toggleExclude(w.compositeId)}
            >
              {w.displayName} {excluded.has(w.compositeId) && "x"}
              <span className="text-xs opacity-60 ml-1">({w.jobCount})</span>
            </button>
          ))}
          {excluded.size > 0 && (
            <span className="text-xs text-red-400">{excluded.size} wykluczonych</span>
          )}
          <div className="w-px h-6 bg-grey-outline mx-2" />
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all flex items-center gap-2 ${
              soloOnly
                ? "border-dark-green bg-dark-green/20 text-dark-green"
                : "border-grey-outline bg-section-grey-dark text-power-grey hover:border-dark-green"
            }`}
            onClick={() => setSoloOnly(!soloOnly)}
          >
            <User className="w-4 h-4" />
            Tylko solo
            {soloOnly && <Check className="w-3 h-3" />}
          </button>
          <div className="w-px h-6 bg-grey-outline mx-2" />
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all flex items-center gap-2 ${
              ignoreInternalWork
                ? "border-yellow-500 bg-yellow-500/20 text-yellow-500"
                : "border-grey-outline bg-section-grey-dark text-power-grey hover:border-dark-green"
            }`}
            onClick={() => setIgnoreInternalWork(!ignoreInternalWork)}
          >
            Ignoruj Prace Wewnetrzne
            {ignoreInternalWork && <Check className="w-3 h-3" />}
          </button>
        </div>

        {filtersChanged && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-yellow-500 text-sm">Filtry zostaly zmienione. Kliknij aby zaladowac nowe dane.</span>
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-dark-green text-white hover:bg-dark-green/80 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualizuj
            </button>
          </div>
        )}

        {view === "rankings" && (
          <div className="bg-section-grey rounded-xl p-6 border border-grey-outline">
            <h2 className="text-lg font-bold mb-1 text-white">Ranking Efektywnosci</h2>
            <p className="text-xs text-power-grey mb-4">Kliknij aby zobaczyc szczegoly zlecen.</p>
            {rankingsVisible.length === 0 && <p className="text-power-grey">Brak danych dla wybranych kryteriow.</p>}
            {rankingsVisible.map((w, i) => {
              const isTop = i === 0;
              const isBot = i === rankingsVisible.length - 1 && rankingsVisible.length > 1;
              const pct = i > 0 ? ((w.efficiency / rankingsVisible[0].efficiency) * 100).toFixed(1) : null;

              return (
                <div
                  key={w.id}
                  className={`bg-section-grey-dark rounded-xl p-4 mb-3 border cursor-pointer hover:bg-jet-color transition-colors ${
                    isTop ? "border-dark-green" : isBot ? "border-red-500/30" : "border-grey-outline"
                  }`}
                  onClick={() => {
                    setSelectedWorkerModal(w.workerId);
                    setSelectedResourceModal(w.resourceId);
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`font-bold text-base ${
                        i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-500" : "text-power-grey"
                      }`}>#{i + 1}</span>
                      <span className="font-bold text-white">{w.name}</span>
                      {w.hasCappedDays && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          {w.cappedDaysCount} dni
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-main">{w.efficiency.toFixed(2)}x</div>
                      <div className="text-xs text-power-grey">
                        {w.efficiency >= 1.1 ? "szybciej" : w.efficiency >= 0.9 ? "srednia" : "wolniej"}
                      </div>
                      {pct && (
                        <div className={`text-sm font-bold ${
                          parseFloat(pct) >= 90 ? "text-green-400" : parseFloat(pct) >= 75 ? "text-yellow-500" : "text-red-400"
                        }`}>
                          {pct}% vs #1
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-background-black rounded-md h-2 mb-2">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-dark-green to-main transition-all"
                      style={{ width: `${(w.efficiency / maxEff) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-power-grey">{w.jobCount} zlecen</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDailyBreakdownWorker(w.id); // Use composite ID: "workerId|resourceId"
                        setDailyBreakdownBucket(null);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-background-black text-power-grey hover:text-white hover:bg-jet-color transition-colors"
                    >
                      <BarChart3 className="w-3 h-3" />
                      Rozklad dzienny
                    </button>
                  </div>
                  {w.presence > 0 && (
                    <TimeBar
                      prod={w.production}
                      internal={w.internalWork}
                      idle={w.idle}
                      presence={w.presence}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "teams" && (
          <div className="bg-section-grey rounded-xl p-6 border border-grey-outline">
            <h2 className="text-lg font-bold mb-1 text-white">Ranking zespolow</h2>
            <p className="text-xs text-power-grey mb-5">Posortowane od najszybszego do najwolniejszego. Kliknij aby zobaczyc szczegoly.</p>
            {teamListVisible.length === 0 && <p className="text-power-grey">Brak danych.</p>}
            {(() => {
              const maxT = Math.max(...teamListVisible.map(t => t.avgTime), 1);
              const minT = teamListVisible[0]?.avgTime || 0;
              return teamListVisible.map((t, i) => {
                const isTop = i === 0;
                const isBot = i === teamListVisible.length - 1 && teamListVisible.length > 1;
                const pct = i > 0 ? ((minT / t.avgTime) * 100).toFixed(1) : null;
                const names = t.workerIds.map(getName);
                return (
                  <div
                    key={t.key}
                    className={`bg-section-grey-dark rounded-xl p-4 mb-3 border cursor-pointer hover:bg-jet-color transition-colors ${
                      isTop ? "border-green-500" : isBot ? "border-red-500/30" : "border-grey-outline"
                    }`}
                    onClick={() => setSelectedTeam(t)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-base ${isTop ? "text-green-500" : isBot ? "text-red-500" : "text-power-grey"}`}>#{i + 1}</span>
                        <span className="font-bold text-white">{names.join(" + ")}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-main">{t.avgTime.toFixed(1)}<span className="text-xs text-power-grey ml-1">h sr.</span></div>
                        {pct && (
                          <div className={`text-sm font-bold ${
                            parseFloat(pct) >= 90 ? "text-green-400" : parseFloat(pct) >= 75 ? "text-yellow-500" : "text-red-400"
                          }`}>
                            {pct}% vs #1
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-background-black rounded-md h-2 mb-2">
                      <div
                        className={`h-full rounded-md transition-all ${isTop ? "bg-green-500" : isBot ? "bg-red-500" : "bg-power-grey"}`}
                        style={{ width: `${(t.avgTime / maxT) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-power-grey">{t.count} zlecen</div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        <TeamDetailModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          getName={getName}
          getProduct={getProduct}
          benchmarks={benchmarks}
        />

        <WorkerDetailModal
          workerId={selectedWorkerModal}
          resourceId={selectedResourceModal}
          jobs={transformedJobs}
          onClose={() => {
            setSelectedWorkerModal(null);
            setSelectedResourceModal(null);
            setModalFilterDate(null);
            setModalFilterBucket(null);
          }}
          getName={getName}
          getProduct={getProduct}
          benchmarks={benchmarks}
          filterDate={modalFilterDate}
          filterBucket={modalFilterBucket}
          granularity={granularity}
        />

        <DailyBreakdownModal
          workerId={dailyBreakdownWorker}
          workerName={(() => {
            if (!dailyBreakdownWorker) return "";
            const [workerId, resourceId] = dailyBreakdownWorker.split("|");
            return `${getName(workerId)} (${getName(resourceId || workerId)})`;
          })()}
          dailyDetails={workerStatsMap[dailyBreakdownWorker || ""]?.dailyDetails || []}
          cappedDays={cappedDays}
          onClose={() => {
            setDailyBreakdownWorker(null);
            setDailyBreakdownBucket(null);
          }}
          filterBucket={dailyBreakdownBucket}
          granularity={granularity}
        />

        {view === "trend" && (
          <div className="bg-section-grey rounded-xl p-6 border border-grey-outline">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white mb-4">Trend Efektywnosci</h2>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex bg-background-black rounded-lg p-1 gap-1">
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${trendMode === "workers" ? "bg-dark-green text-white" : "text-power-grey"}`}
                    onClick={() => setTrendMode("workers")}
                  >Pracownicy</button>
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${trendMode === "teams" ? "bg-dark-green text-white" : "text-power-grey"}`}
                    onClick={() => setTrendMode("teams")}
                  >Zespoly</button>
                </div>
                <div className="w-px h-7 bg-grey-outline" />
                <div className="flex bg-background-black rounded-lg p-1 gap-1">
                  {([["daily", "Dziennie"], ["weekly", "Tygodniowo"], ["monthly", "Miesiecznie"]] as const).map(([g, label]) => (
                    <button
                      key={g}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs ${granularity === g ? "bg-dark-green text-white" : "text-power-grey"}`}
                      onClick={() => setGranularity(g)}
                    >{label}</button>
                  ))}
                </div>
                {trendMode === "workers" && (
                  <>
                    <div className="w-px h-7 bg-grey-outline" />
                    <div className="flex bg-background-black rounded-lg p-1 gap-1">
                      <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          showIdleLine
                            ? "bg-power-grey/30 text-white"
                            : "text-power-grey/60 hover:text-power-grey"
                        }`}
                        onClick={() => {
                          setShowIdleLine(!showIdleLine);
                          if (!showIdleLine) setShowCombinedLine(false);
                        }}
                      >
                        <span className="w-4 h-0.5 border-t border-dashed border-power-grey" />
                        Bezczynnosc
                        {showIdleLine && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          showInternalLine
                            ? "bg-power-grey/30 text-white"
                            : "text-power-grey/60 hover:text-power-grey"
                        }`}
                        onClick={() => {
                          setShowInternalLine(!showInternalLine);
                          if (!showInternalLine) setShowCombinedLine(false);
                        }}
                      >
                        <span className="w-4 h-0.5 border-t-2 border-dotted border-power-grey" />
                        Prace wew.
                        {showInternalLine && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          showCombinedLine
                            ? "bg-dark-green/30 text-dark-green"
                            : "text-power-grey/60 hover:text-power-grey"
                        }`}
                        onClick={() => {
                          setShowCombinedLine(!showCombinedLine);
                          if (!showCombinedLine) {
                            setShowIdleLine(false);
                            setShowInternalLine(false);
                          }
                        }}
                      >
                        <span className="w-4 h-0.5 border-t-2 border-dashed border-dark-green" />
                        Polacz
                        {showCombinedLine && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {trendMode === "workers" && (
              <div className="mb-5">
                <p className="text-xs text-power-grey mb-3">Wybierz pracownikow do wykresu:</p>
                <div className="flex gap-2 flex-wrap">
                  {workerResourceCombinations
                    .filter(w => !HIDDEN_WORKERS.includes(w.workerId) && !HIDDEN_WORKERS.includes(w.resourceId))
                    .map(w => (
                    <button
                      key={w.compositeId}
                      onClick={() => toggleTrendWorker(w.compositeId)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-sm border-2 transition-all ${
                        selectedTrendWorkers.has(w.compositeId)
                          ? "border-dark-green text-main"
                          : "border-grey-outline text-power-grey"
                      }`}
                      style={{ borderColor: selectedTrendWorkers.has(w.compositeId) ? getWorkerColor(w.compositeId, allWorkers) : undefined }}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getWorkerColor(w.compositeId, allWorkers) }}
                      />
                      {w.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {trendMode === "teams" && (
              <div className="mb-5">
                <p className="text-xs text-power-grey mb-3">Wybierz zespoly do wykresu:</p>
                <div className="flex gap-2 flex-wrap">
                  {teamListVisible.map((t, i) => {
                    const names = t.workerIds.map(getName).join(" + ");
                    const color = TEAM_COLORS[i % TEAM_COLORS.length];
                    const active = selectedTrendTeams.has(t.key);
                    return (
                      <button
                        key={t.key}
                        onClick={() => toggleTrendTeam(t.key)}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-sm border-2 transition-all ${
                          active ? "text-main" : "border-grey-outline text-power-grey"
                        }`}
                        style={{ borderColor: active ? color : undefined }}
                      >
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color }} />
                        {names}
                      </button>
                    );
                  })}
                </div>
                {selectedTrendTeams.size === 0 && <p className="text-xs text-power-grey mt-2">Zaznacz co najmniej jeden zespol.</p>}
              </div>
            )}

            <div className="bg-background-black rounded-xl p-5 border border-grey-outline">
              {trendMode === "workers" && activeWorkerIds.length > 0 && workerTrendData.length > 0 ? (
                <>
                  <p className="text-xs text-power-grey mb-3">
                    Speed Index (wyzej = lepiej)
                    {(showIdleLine || showInternalLine || showCombinedLine) && (
                      <span className="ml-2 text-power-grey">
                        (linia przerywana = %
                        {showIdleLine && " bezczynnosci"}
                        {showInternalLine && " prac wew."}
                        {showCombinedLine && " razem"}
                        )
                      </span>
                    )}
                    <span className="ml-4 text-dark-green">Kliknij punkt aby zobaczyc szczegoly dnia</span>
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={workerTrendData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#464646" />
                      <XAxis dataKey="week" tick={{ fill: "#A5A7AA", fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fill: "#A5A7AA", fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
                      {(showIdleLine || showInternalLine || showCombinedLine) && (
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#A5A7AA", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                      )}
                      <Tooltip content={<CustomTooltip mode="workers" getName={getName} showIdleLine={showIdleLine} showInternalLine={showInternalLine} showCombinedLine={showCombinedLine} />} />
                      <Legend formatter={v => {
                        // v is now a compositeId like "workerId|resourceId" or "idle_workerId|resourceId"
                        const getDisplayName = (compositeId: string) => {
                          const combo = workerResourceCombinations.find(c => c.compositeId === compositeId);
                          return combo?.displayName || compositeId;
                        };
                        if (v.startsWith("idle_")) {
                          const compositeId = v.replace("idle_", "");
                          return <span style={{ color: getWorkerColor(compositeId, allWorkers), fontSize: 13, opacity: 0.6 }}>{getDisplayName(compositeId)} (bezcz.)</span>;
                        }
                        if (v.startsWith("internal_")) {
                          const compositeId = v.replace("internal_", "");
                          return <span style={{ color: getWorkerColor(compositeId, allWorkers), fontSize: 13, opacity: 0.6 }}>{getDisplayName(compositeId)} (wew.)</span>;
                        }
                        if (v.startsWith("combined_")) {
                          const compositeId = v.replace("combined_", "");
                          return <span style={{ color: getWorkerColor(compositeId, allWorkers), fontSize: 13, opacity: 0.6 }}>{getDisplayName(compositeId)} (polacz.)</span>;
                        }
                        return <span style={{ color: getWorkerColor(v, allWorkers), fontSize: 13 }}>{getDisplayName(v)}</span>;
                      }} />
                      {activeWorkerIds.map(compositeId => {
                        const [workerId, resourceId] = compositeId.split("|");
                        return (
                        <Line
                          key={compositeId}
                          type="monotone"
                          dataKey={compositeId}
                          stroke={getWorkerColor(compositeId, allWorkers)}
                          strokeWidth={2.5}
                          dot={{ fill: getWorkerColor(compositeId, allWorkers), r: 5, cursor: "pointer" }}
                          activeDot={{
                            r: 8,
                            cursor: "pointer",
                            onClick: (_, payload) => {
                              const data = (payload as { payload?: { _bucketKey?: string; _originalDate?: string } })?.payload;
                              if (data?._bucketKey) {
                                setModalFilterBucket(data._bucketKey);
                                setModalFilterDate(data._originalDate || null);
                                setSelectedWorkerModal(workerId);
                                setSelectedResourceModal(resourceId);
                              }
                            }
                          }}
                          connectNulls
                          yAxisId="left"
                        />
                      );})}
                      {showIdleLine && activeWorkerIds.map(compositeId => (
                        <Line
                          key={`idle_${compositeId}`}
                          type="monotone"
                          dataKey={`idle_${compositeId}`}
                          stroke={getWorkerColor(compositeId, allWorkers)}
                          strokeWidth={1.5}
                          strokeDasharray="6 4"
                          strokeOpacity={0.5}
                          dot={{ r: 3, fill: getWorkerColor(compositeId, allWorkers), opacity: 0.5, cursor: "pointer" }}
                          activeDot={{
                            r: 6,
                            cursor: "pointer",
                            onClick: (_, payload) => {
                              const data = (payload as { payload?: { _bucketKey?: string } })?.payload;
                              if (data?._bucketKey) {
                                setDailyBreakdownBucket(data._bucketKey);
                                setDailyBreakdownWorker(compositeId);
                              }
                            }
                          }}
                          connectNulls
                          yAxisId="right"
                        />
                      ))}
                      {showInternalLine && activeWorkerIds.map(compositeId => (
                        <Line
                          key={`internal_${compositeId}`}
                          type="monotone"
                          dataKey={`internal_${compositeId}`}
                          stroke={getWorkerColor(compositeId, allWorkers)}
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          dot={{ r: 3, fill: getWorkerColor(compositeId, allWorkers), opacity: 0.5, cursor: "pointer" }}
                          activeDot={{
                            r: 6,
                            cursor: "pointer",
                            onClick: (_, payload) => {
                              const data = (payload as { payload?: { _bucketKey?: string } })?.payload;
                              if (data?._bucketKey) {
                                setDailyBreakdownBucket(data._bucketKey);
                                setDailyBreakdownWorker(compositeId);
                              }
                            }
                          }}
                          connectNulls
                          yAxisId="right"
                        />
                      ))}
                      {showCombinedLine && activeWorkerIds.map(compositeId => (
                        <Line
                          key={`combined_${compositeId}`}
                          type="monotone"
                          dataKey={`combined_${compositeId}`}
                          stroke={getWorkerColor(compositeId, allWorkers)}
                          strokeWidth={2}
                          strokeDasharray="8 4"
                          strokeOpacity={0.6}
                          dot={{ r: 3, fill: getWorkerColor(compositeId, allWorkers), opacity: 0.6, cursor: "pointer" }}
                          activeDot={{
                            r: 6,
                            cursor: "pointer",
                            onClick: (_, payload) => {
                              const data = (payload as { payload?: { _bucketKey?: string } })?.payload;
                              if (data?._bucketKey) {
                                setDailyBreakdownBucket(data._bucketKey);
                                setDailyBreakdownWorker(compositeId);
                              }
                            }
                          }}
                          connectNulls
                          yAxisId="right"
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  {workerChartStats && (
                    <div className="mt-4 p-3 bg-section-grey rounded-lg border border-grey-outline">
                      <span className="text-sm text-power-grey">Srednia w przedziale od </span>
                      <span className="text-sm text-main font-semibold">{workerChartStats.firstDate}</span>
                      <span className="text-sm text-power-grey"> do </span>
                      <span className="text-sm text-main font-semibold">{workerChartStats.lastDate}</span>
                      <span className="text-sm text-power-grey"> = </span>
                      <span className="text-sm text-white font-bold">{workerChartStats.avg.toFixed(2)}x</span>
                    </div>
                  )}
                </>
              ) : trendMode === "workers" ? (
                <div className="h-72 flex items-center justify-center text-power-grey">Wybierz pracownikow powyzej.</div>
              ) : null}

              {trendMode === "teams" && activeTeams.length > 0 && teamTrendData.length > 0 ? (
                <>
                  <p className="text-xs text-power-grey mb-3">Sredni czas zlecenia (nizej = lepiej)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={teamTrendData} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#464646" />
                      <XAxis dataKey="week" tick={{ fill: "#A5A7AA", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#A5A7AA", fontSize: 11 }} unit="h" />
                      <Tooltip content={<CustomTooltip mode="teams" getName={getName} />} />
                      <Legend formatter={v => <span style={{ fontSize: 13, color: TEAM_COLORS[teamListVisible.findIndex(t => t.key === v) % TEAM_COLORS.length] }}>{v.split("+").map(getName).join(" + ")}</span>} />
                      {activeTeams.map((t) => (
                        <Line key={t.key} type="monotone" dataKey={t.key} stroke={TEAM_COLORS[teamListVisible.findIndex(tt => tt.key === t.key) % TEAM_COLORS.length]}
                          strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  {teamChartStats && (
                    <div className="mt-4 p-3 bg-section-grey rounded-lg border border-grey-outline">
                      <span className="text-sm text-power-grey">Srednia w przedziale od </span>
                      <span className="text-sm text-main font-semibold">{teamChartStats.firstDate}</span>
                      <span className="text-sm text-power-grey"> do </span>
                      <span className="text-sm text-main font-semibold">{teamChartStats.lastDate}</span>
                      <span className="text-sm text-power-grey"> = </span>
                      <span className="text-sm text-white font-bold">{teamChartStats.avg.toFixed(2)}h</span>
                    </div>
                  )}
                </>
              ) : trendMode === "teams" && selectedTrendTeams.size === 0 ? (
                <div className="h-72 flex items-center justify-center text-power-grey">Wybierz zespol powyzej.</div>
              ) : trendMode === "teams" ? (
                <div className="h-72 flex items-center justify-center text-power-grey">Brak danych dla wybranych zespolow.</div>
              ) : null}
            </div>
          </div>
        )}

        {view === "zlecenia" && (
          <div className="bg-section-grey rounded-xl p-6 border border-grey-outline">
            <h2 className="text-lg font-bold mb-5 text-white">Zlecenia wg produktow</h2>
            {allProducts.map(p => {
              const bm = productBenchmarks[p.id];
              if (!bm || bm.count === 0) return null;
              const sorted = [...bm.jobs].sort((a, b) => a.totalHours - b.totalHours);
              return (
                <div key={p.id} className="bg-section-grey-dark rounded-xl p-4 mb-4 border border-grey-outline">
                  <div className="font-bold text-base text-main mb-3">
                    {p.name}
                    <span className="text-power-grey font-normal text-sm ml-3">
                      srednia {bm.avg.toFixed(1)}h - {bm.count} zlecen
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sorted.map(j => {
                      const diff = j.totalHours - bm.avg;
                      const colorClass = diff <= -0.5 ? "border-green-500 text-green-400" : diff >= 0.5 ? "border-red-500 text-red-400" : "border-yellow-500 text-yellow-400";
                      return (
                        <div key={j.id} className={`bg-background-black rounded-lg p-3 border ${colorClass.split(" ")[0]}`}>
                          <div className="text-xs text-power-grey mb-1">{j.date}</div>
                          <div className={`font-bold text-sm ${colorClass.split(" ")[1]}`}>
                            {j.totalHours.toFixed(2)}h <span className="text-xs">({diff > 0 ? "+" : ""}{diff.toFixed(2)})</span>
                          </div>
                          <div className="text-xs text-power-grey mt-1">
                            {j.workers.map(w => `${formatWorkerWithResource(w.workerId, w.resourceId, getName)} (${w.hoursWorked.toFixed(2)}h)`).join(" + ")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="text-xs mt-2 flex gap-4">
              <span className="text-green-500">Szybciej niz srednia</span>
              <span className="text-yellow-500">Blisko sredniej</span>
              <span className="text-red-500">Wolniej niz srednia</span>
            </div>
          </div>
        )}

        {view === "worker" && (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {rankingsWithData.map((w, i) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorker(w.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    selectedWorker === w.id ? "bg-dark-green text-white" : "bg-section-grey text-power-grey hover:bg-jet-color"
                  }`}
                >
                  #{i + 1} {w.name}
                </button>
              ))}
              {rankingsWithData.length === 0 && <p className="text-power-grey text-sm">Brak danych dla wybranych kryteriow.</p>}
            </div>
            {selectedWorker && (() => {
              const w = rankingsWithData.find(r => r.id === selectedWorker);
              if (!w) return null;
              const workerJobs = transformedJobs.filter(j => j.workers.some(ww => ww.workerId === selectedWorker)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const rank = rankingsWithData.findIndex(r => r.id === selectedWorker) + 1;
              return (
                <div className="bg-section-grey rounded-xl p-6 border border-grey-outline">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-main">{w.name}</h2>
                      <p className="text-sm text-power-grey mt-1">Pozycja #{rank} z {rankingsWithData.length} - {w.jobCount} zlecen</p>
                    </div>
                    <div className="text-right bg-section-grey-dark rounded-xl p-4">
                      <div className="text-3xl font-bold text-main">{w.efficiency.toFixed(2)}x</div>
                      <div className="text-xs text-power-grey">Speed Index</div>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-3">Historia zlecen</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-section-grey-dark">
                          {["Data", "Produkt", "Ilosc", "Brygada", "Czas", "Lacznie"].map(h => (
                            <th key={h} className="p-3 text-left text-power-grey font-bold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {workerJobs.map((j, idx) => {
                          const me = j.workers.find(ww => ww.workerId === selectedWorker);
                          return (
                            <tr key={j.id} className={`border-b border-grey-outline ${idx % 2 === 0 ? "" : "bg-background-black/50"}`}>
                              <td className="p-3 text-main">{j.date}</td>
                              <td className="p-3 text-white">{getProduct(j.productTypeId)}</td>
                              <td className="p-3 text-white">{j.quantity}</td>
                              <td className="p-3 text-power-grey">
                                {j.workers.map(ww => `${formatWorkerWithResource(ww.workerId, ww.resourceId, getName)} (${ww.hoursWorked.toFixed(2)}h)`).join(", ")}
                              </td>
                              <td className="p-3 font-semibold text-white">{me?.hoursWorked.toFixed(2)}h</td>
                              <td className="p-3 text-power-grey">{j.totalHours.toFixed(2)}h</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
            {!selectedWorker && rankingsWithData.length > 0 && (
              <div className="bg-section-grey rounded-xl p-10 border border-grey-outline text-center text-power-grey">
                Wybierz pracownika powyzej, aby zobaczyc szczegoly
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

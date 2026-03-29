import { useState, useMemo } from "react";
import { X, Loader2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { biServiceApi, type WorkerDailyJobEntryDto, type SessionDto } from "../../../api/bi-service";
import type { TransformedJob } from "../types";
import ProductDetailModal from "./ProductDetailModal";

interface WorkerDayJobsModalProps {
  workerId: string;
  workerName: string;
  date: string;
  onClose: () => void;
  jobs?: TransformedJob[];
  getName?: (id: string) => string;
  getProduct?: (id: string) => string;
  benchmarks?: Record<string, number>;
}

interface TimelineSegment {
  type: "work" | "idle";
  startTime: Date;
  endTime: Date;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  job?: WorkerDailyJobEntryDto;
  session?: SessionDto;
  isInternal?: boolean;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
};

const getMinutesFromMidnight = (date: Date): number => {
  return date.getHours() * 60 + date.getMinutes();
};

// Fixed timeline range: 7:00 - 17:00
const TIMELINE_START = 7 * 60; // 7:00 in minutes
const TIMELINE_END = 17 * 60;  // 17:00 in minutes
const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START; // 10 hours = 600 minutes

// Generate hour markers for the timeline
const HOUR_MARKERS = Array.from({ length: 11 }, (_, i) => ({
  hour: 7 + i,
  minutes: (7 + i) * 60,
  label: `${7 + i}:00`,
}));

export default function WorkerDayJobsModal({
  workerId,
  workerName,
  date,
  onClose,
  jobs = [],
  getName = (id) => id,
  getProduct = (id) => id,
  benchmarks = {},
}: WorkerDayJobsModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: dayJobs, isLoading, error } = useQuery({
    queryKey: ["worker-daily-jobs", workerId, date],
    queryFn: () => biServiceApi.getWorkerDailyJobs(workerId, date),
  });

  // Build timeline segments from sessions
  const { segments, totalProduction, totalInternal, totalIdle } = useMemo(() => {
    if (!dayJobs || dayJobs.length === 0) {
      return { segments: [], totalProduction: 0, totalInternal: 0, totalIdle: 0 };
    }

    // Flatten all sessions from all jobs with their parent job info
    type SessionWithJob = {
      session: SessionDto;
      job: WorkerDailyJobEntryDto;
      isInternal: boolean;
    };

    const allSessions: SessionWithJob[] = [];
    for (const job of dayJobs) {
      const isInternal = /PRACE\s*WEWN/i.test(job.productTypeId);
      if (job.sessions && job.sessions.length > 0) {
        for (const session of job.sessions) {
          if (session.timeFrom) {
            allSessions.push({ session, job, isInternal });
          }
        }
      }
    }

    // Sort sessions by timeFrom
    allSessions.sort((a, b) =>
      new Date(a.session.timeFrom!).getTime() - new Date(b.session.timeFrom!).getTime()
    );

    if (allSessions.length === 0) {
      return { segments: [], totalProduction: 0, totalInternal: 0, totalIdle: 0 };
    }

    const result: TimelineSegment[] = [];
    let totalProd = 0;
    let totalInt = 0;
    let totalIdleTime = 0;

    let lastEndTime: Date | null = null;

    for (const { session, job, isInternal } of allSessions) {
      const sessionStart = new Date(session.timeFrom!);
      const sessionEnd = session.timeTo
        ? new Date(session.timeTo)
        : new Date(sessionStart.getTime() + session.minutesWorked * 60000);

      // Check for idle gap before this session
      if (lastEndTime && sessionStart > lastEndTime) {
        const gapMinutes = (sessionStart.getTime() - lastEndTime.getTime()) / 60000;
        if (gapMinutes >= 10) {
          result.push({
            type: "idle",
            startTime: lastEndTime,
            endTime: sessionStart,
            startMinutes: getMinutesFromMidnight(lastEndTime),
            endMinutes: getMinutesFromMidnight(sessionStart),
            durationMinutes: gapMinutes,
          });
          totalIdleTime += gapMinutes;
        }
      }

      // Add work segment
      result.push({
        type: "work",
        startTime: sessionStart,
        endTime: sessionEnd,
        startMinutes: getMinutesFromMidnight(sessionStart),
        endMinutes: getMinutesFromMidnight(sessionEnd),
        durationMinutes: session.minutesWorked,
        job,
        session,
        isInternal,
      });

      if (isInternal) {
        totalInt += session.minutesWorked;
      } else {
        totalProd += session.minutesWorked;
      }

      // Update last end time
      if (!lastEndTime || sessionEnd > lastEndTime) {
        lastEndTime = sessionEnd;
      }
    }

    return {
      segments: result,
      totalProduction: totalProd,
      totalInternal: totalInt,
      totalIdle: totalIdleTime,
    };
  }, [dayJobs]);

  // Filter jobs for ProductDetailModal
  const productJobs = useMemo(() => {
    if (!selectedProductId) return [];
    return jobs.filter(j => j.productTypeId === selectedProductId);
  }, [jobs, selectedProductId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-section-grey rounded-xl border border-grey-outline max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-grey-outline flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {workerName} - Os czasu
            </h3>
            <p className="text-sm text-power-grey flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {date}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-jet-color rounded-lg">
            <X className="w-5 h-5 text-power-grey" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-dark-green animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Blad podczas ladowania danych
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-8 text-power-grey">
              Brak zlecen dla tego dnia
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
                  <div className="text-xs text-green-400/80 uppercase tracking-wide mb-1">Produkcja</div>
                  <div className="text-2xl font-bold text-green-400">{(totalProduction / 60).toFixed(2)}<span className="text-sm ml-1">h</span></div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/30">
                  <div className="text-xs text-orange-400/80 uppercase tracking-wide mb-1">Prace wew.</div>
                  <div className="text-2xl font-bold text-orange-400">{(totalInternal / 60).toFixed(2)}<span className="text-sm ml-1">h</span></div>
                </div>
                <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 rounded-xl p-4 border border-gray-500/30">
                  <div className="text-xs text-power-grey uppercase tracking-wide mb-1">Przerwy</div>
                  <div className="text-2xl font-bold text-power-grey">{(totalIdle / 60).toFixed(2)}<span className="text-sm ml-1">h</span></div>
                </div>
                <div className="bg-gradient-to-br from-dark-green/20 to-dark-green/10 rounded-xl p-4 border border-dark-green/30">
                  <div className="text-xs text-main/80 uppercase tracking-wide mb-1">Zlecenia</div>
                  <div className="text-2xl font-bold text-main">{dayJobs?.length || 0}</div>
                </div>
              </div>

              {/* Timeline visualization */}
              <div className="mb-8 bg-section-grey-dark rounded-xl p-4 border border-grey-outline">
                {/* Hour labels */}
                <div className="relative h-6 mb-1">
                  {HOUR_MARKERS.map((marker) => {
                    const left = ((marker.minutes - TIMELINE_START) / TIMELINE_DURATION) * 100;
                    return (
                      <div
                        key={marker.hour}
                        className="absolute text-xs text-power-grey transform -translate-x-1/2"
                        style={{ left: `${left}%` }}
                      >
                        {marker.label}
                      </div>
                    );
                  })}
                </div>

                {/* Timeline bar with grid */}
                <div className="relative h-16 bg-background-black rounded-lg overflow-hidden border border-grey-outline">
                  {/* Hour grid lines */}
                  {HOUR_MARKERS.map((marker) => {
                    const left = ((marker.minutes - TIMELINE_START) / TIMELINE_DURATION) * 100;
                    return (
                      <div
                        key={`grid-${marker.hour}`}
                        className="absolute top-0 h-full w-px border-l border-dashed border-grey-outline/50"
                        style={{ left: `${left}%` }}
                      />
                    );
                  })}

                  {/* Work segments */}
                  {segments.map((seg, idx) => {
                    // Clamp to timeline bounds
                    const segStart = Math.max(seg.startMinutes, TIMELINE_START);
                    const segEnd = Math.min(seg.endMinutes, TIMELINE_END);

                    if (segEnd <= TIMELINE_START || segStart >= TIMELINE_END) return null;

                    const left = ((segStart - TIMELINE_START) / TIMELINE_DURATION) * 100;
                    const width = ((segEnd - segStart) / TIMELINE_DURATION) * 100;

                    const isWork = seg.type === "work";
                    const bgColor = seg.type === "idle"
                      ? "bg-gradient-to-b from-gray-600/40 to-gray-700/40"
                      : seg.isInternal
                        ? "bg-gradient-to-b from-orange-400 to-orange-600"
                        : "bg-gradient-to-b from-green-400 to-green-600";

                    const hoverClass = isWork
                      ? "cursor-pointer hover:brightness-110 hover:scale-y-105 origin-bottom"
                      : "";

                    return (
                      <div
                        key={idx}
                        className={`absolute top-1 bottom-1 rounded-md ${bgColor} ${hoverClass} transition-all shadow-sm`}
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(width, 0.3)}%`,
                        }}
                        onClick={() => {
                          if (isWork && seg.job) {
                            setSelectedProductId(seg.job.productTypeId);
                          }
                        }}
                        title={isWork && seg.job
                          ? `${seg.job.productTypeId}\n${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}\n${seg.durationMinutes.toFixed(0)} min`
                          : `Przerwa: ${seg.durationMinutes.toFixed(0)} min`
                        }
                      >
                        {/* Show label for wider segments */}
                        {width > 8 && isWork && seg.job && (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-1">
                            <span className="text-[10px] font-semibold text-white/90 truncate drop-shadow">
                              {seg.job.numerZlecenia}
                            </span>
                          </div>
                        )}
                        {width > 4 && width <= 8 && isWork && seg.session && (
                          <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-0.5">
                            <span className="text-[8px] font-semibold text-white/80">
                              {seg.session.minutesWorked}m
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-6 text-xs mt-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-3 bg-gradient-to-b from-green-400 to-green-600 rounded shadow-sm" />
                    <span className="text-power-grey">Produkcja</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-3 bg-gradient-to-b from-orange-400 to-orange-600 rounded shadow-sm" />
                    <span className="text-power-grey">Prace wewnetrzne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-3 bg-gradient-to-b from-gray-600/40 to-gray-700/40 rounded" />
                    <span className="text-power-grey">Przerwy</span>
                  </div>
                </div>
              </div>

              {/* Detailed job list */}
              <div>
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-dark-green rounded-full"></span>
                  Szczegoly zlecen
                </h4>
                <div className="grid gap-2">
                  {segments
                    .filter(s => s.type === "work")
                    .map((seg, idx) => (
                      <div
                        key={idx}
                        className={`group bg-section-grey-dark rounded-xl p-4 border-l-4 cursor-pointer hover:bg-jet-color transition-all ${
                          seg.isInternal ? "border-l-orange-500" : "border-l-green-500"
                        }`}
                        onClick={() => seg.job && setSelectedProductId(seg.job.productTypeId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              seg.isInternal
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-green-500/20 text-green-400"
                            }`}>
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm group-hover:text-main transition-colors">
                                {seg.job?.numerZlecenia}
                              </div>
                              <div className="text-xs text-power-grey mt-0.5">
                                {getProduct(seg.job?.productTypeId || "")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono text-main bg-background-black px-3 py-1 rounded-lg">
                              {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                            </div>
                            <div className={`text-xs font-semibold mt-1 ${seg.isInternal ? "text-orange-400" : "text-green-400"}`}>
                              {seg.durationMinutes.toFixed(0)} min ({(seg.durationMinutes / 60).toFixed(2)}h)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Idle gaps */}
                {segments.filter(s => s.type === "idle").length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-power-grey mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-gray-500 rounded-full"></span>
                      Przerwy
                    </h4>
                    <div className="grid gap-2">
                      {segments
                        .filter(s => s.type === "idle")
                        .map((seg, idx) => (
                          <div
                            key={`idle-${idx}`}
                            className="bg-section-grey-dark/50 rounded-xl p-3 border-l-4 border-l-gray-500/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                </div>
                                <div className="text-sm text-power-grey">Bezczynnosc</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-mono text-power-grey">
                                  {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                                </div>
                                <div className="text-xs text-power-grey/70">
                                  {seg.durationMinutes.toFixed(0)} min
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          productName={getProduct(selectedProductId)}
          jobs={productJobs}
          onClose={() => setSelectedProductId(null)}
          getName={getName}
          benchmarks={benchmarks}
        />
      )}
    </div>
  );
}

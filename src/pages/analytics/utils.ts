import type { TransformedJob, TeamInfo, WorkerInfo } from "./types";

export const WORKER_COLORS: Record<string, string> = {};
export const COLOR_PALETTE = ["#7c9357", "#60a5fa", "#f59e0b", "#ec4899", "#a78bfa", "#34d399", "#fb923c", "#818cf8"];
export const TEAM_COLORS = ["#7c9357", "#60a5fa", "#f59e0b", "#ec4899", "#a78bfa", "#34d399", "#fb923c", "#818cf8"];

export function getWorkerColor(workerId: string, workers: WorkerInfo[]): string {
  if (!WORKER_COLORS[workerId]) {
    const idx = workers.findIndex(w => w.id === workerId);
    WORKER_COLORS[workerId] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
  }
  return WORKER_COLORS[workerId];
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "unknown";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function getBucketLabel(dateStr: string, gran: string): string {
  if (!dateStr) return "unknown";
  if (gran === "daily") return formatDateLabel(dateStr);
  if (gran === "monthly") {
    const parts = dateStr.split("-");
    return `${parts[1]}-${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "unknown";
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  const isoDate = mon.toISOString().split("T")[0];
  return formatDateLabel(isoDate);
}

export function groupJobsByBucket(jobs: TransformedJob[], gran: string): Record<string, TransformedJob[]> {
  const map: Record<string, TransformedJob[]> = {};
  jobs.forEach(j => {
    if (!j.date) return;
    const b = getBucketLabel(j.date, gran);
    if (b === "unknown") return;
    if (!map[b]) map[b] = [];
    map[b].push(j);
  });
  return map;
}

// Parse formatted date label back to sortable format
export function parseDateLabel(label: string, gran: string): Date {
  if (gran === "monthly") {
    // Format: "MM-YYYY"
    const [month, year] = label.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }
  // Format: "DD-MM-YYYY"
  const [day, month, year] = label.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

export function sortBucketKeys(keys: string[], gran: string): string[] {
  return [...keys].sort((a, b) => {
    const dateA = parseDateLabel(a, gran);
    const dateB = parseDateLabel(b, gran);
    return dateA.getTime() - dateB.getTime();
  });
}

export function calcTeamTrend(teams: TeamInfo[], jobs: TransformedJob[], gran: string) {
  const bucketMap = groupJobsByBucket(jobs, gran);
  const sortedKeys = sortBucketKeys(Object.keys(bucketMap), gran);
  return sortedKeys.map(b => {
    const entry: Record<string, string | number> = { week: b };
    teams.forEach(t => {
      const teamJobs = bucketMap[b].filter(j => j.workers.map(w => w.workerId).sort().join("+") === t.key);
      if (teamJobs.length > 0) {
        entry[t.key] = +(teamJobs.reduce((s, j) => s + j.totalHours, 0) / teamJobs.length).toFixed(2);
      }
    });
    return entry;
  });
}

export function calcTeamList(jobs: TransformedJob[]): TeamInfo[] {
  const map: Record<string, { key: string; workerIds: string[]; times: number[]; count: number; jobs: TransformedJob[] }> = {};
  jobs.forEach(j => {
    const key = j.workers.map(w => w.workerId).sort().join("+");
    if (!map[key]) map[key] = { key, workerIds: j.workers.map(w => w.workerId).sort(), times: [], count: 0, jobs: [] };
    map[key].times.push(j.totalHours);
    map[key].count++;
    map[key].jobs.push(j);
  });
  return Object.values(map).map(t => ({ ...t, avgTime: t.times.reduce((a, b) => a + b, 0) / t.times.length }))
    .sort((a, b) => a.avgTime - b.avgTime);
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return { from: formatDateForInput(from), to: formatDateForInput(to) };
}

/**
 * Formats a worker's display name with their resource.
 * Always shows "WorkerName (ResourceName)" format for transparency.
 * Example: "Kamil Rygiel (Kamil Rygiel)" or "Kamil Rygiel (Wycinanie)"
 */
export function formatWorkerWithResource(
  workerId: string,
  resourceId: string,
  getName: (id: string) => string
): string {
  const workerName = getName(workerId);
  const resourceName = getName(resourceId || workerId);

  return `${workerName} (${resourceName})`;
}

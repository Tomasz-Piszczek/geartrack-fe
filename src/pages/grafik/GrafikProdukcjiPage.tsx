import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGrafik, useGrafikSearch, useGrafikOrderDetail, useUpdateGrafikAssignment } from '../../hooks/useBiService';
import type { GrafikResponseDto, GrafikSearchResultDto } from '../../api/bi-service';

/** Workers hidden from the grafik view on request (not shown on the board or in search). */
const HIDDEN_WORKERS = new Set(['piszczek paweł1', 'małgorzata jasica']);
const isHiddenWorker = (name: string | null | undefined) =>
  HIDDEN_WORKERS.has((name ?? '').trim().toLowerCase());

/**
 * Grafik produkcji — per-worker daily production schedule (Gantt) read from
 * dbo.CtiZasobDok. Blocks can be dragged/resized (15-min snap) or edited in a
 * popover (start/end day + time). Tasks that span days are shown and editable on
 * every day they cover. Overlapping tasks stack in lanes. Hours outside the
 * worker's availability (CtiZasobDostepny) are shaded red. Deletion is not offered.
 */

const DS = 360;   // 06:00
const DE = 1320;  // 22:00
const SNAP = 15;
const HOUR_FROM = 6;
const HOUR_TO = 22;

const PL_MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const PL_WEEKDAYS = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

const HOUR_WIDTH = 82;
const ROW_MIN_H = 66;
const BLOCK_H = 54;
const LANE_GAP = 4;
const NAME_W = 210;
const BLOCK_TOP = 8;
const TIMELINE_W = HOUR_WIDTH * (HOUR_TO - HOUR_FROM);
const PM = HOUR_WIDTH / 60; // px per minute
const MONO = 'ui-monospace,SFMono-Regular,Menlo,monospace';

interface Assignment {
  czsId: number;
  orderId: number;
  workerName: string;
  orderNumber: string;
  contractorName: string;
  product: string;
  quantity: number;
  status: number;
  hue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  startMin: number;  // real time-of-day of start (on startDate)
  endMin: number;    // real time-of-day of end (on endDate)
  workHours: number;
}

type DragMode = 'body' | 'left' | 'right';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayOf = (iso: string) => iso.split('T')[0];
const timeMin = (iso: string): number => {
  const t = iso.split('T')[1] ?? '00:00:00';
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const hhmmToMin = (s: string): number => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const addDays = (dateStr: string, n: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toIsoDate(new Date(y, m - 1, d + n));
};
const dayDiff = (a: string, b: string): number => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
};
/** minutes of the span, valid only if >= SNAP */
const spanMinutes = (sd: string, sm: number, ed: string, em: number) => dayDiff(sd, ed) * 1440 + em - sm;

const fmt = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const dm = (dateStr: string) => `${dateStr.slice(8, 10)}.${dateStr.slice(5, 7)}`;
const dt = (dateStr: string, min: number) => `${dm(dateStr)} ${fmt(min)}`;

const durText = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  let s = '';
  if (h) s += `${h} h`;
  if (m) s += `${s ? ' ' : ''}${m} min`;
  return s || '0 h';
};
const durBlock = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m ? String(m) : ''}`;
};

const searchDateLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dd = new Date(y, m - 1, d);
  return `${PL_WEEKDAYS[dd.getDay()]}, ${d} ${PL_MONTHS[dd.getMonth()]} ${y}`;
};
const statusText = (s: number) => (s >= 3 ? 'Zamknięte' : s === 0 ? 'Otwarte' : 'W toku');
const statusColor = (s: number) => (s >= 3 ? '#6b7280' : s === 0 ? '#a8853a' : '#2f7d4f');

const plurZ = (n: number) => {
  if (n === 1) return '1 zlecenie';
  const l = n % 10;
  const l2 = n % 100;
  if (l >= 2 && l <= 4 && !(l2 >= 12 && l2 <= 14)) return `${n} zlecenia`;
  return `${n} zleceń`;
};

const hueFor = (orderNumber: string) => {
  let h = 0;
  for (let i = 0; i < orderNumber.length; i++) h = (h * 31 + orderNumber.charCodeAt(i)) % 360;
  return h;
};
const colorFor = (hue: number) => ({
  spine: `hsl(${hue} 68% 62%)`,
  bg: `hsl(${hue} 38% 19%)`,
  border: `hsl(${hue} 40% 34%)`,
  text: `hsl(${hue} 72% 84%)`,
  meta: `hsl(${hue} 28% 64%)`,
  pill: `hsl(${hue} 60% 56%)`,
  pillText: `hsl(${hue} 55% 12%)`,
  dot: `hsl(${hue} 66% 58%)`,
});

const mapResponse = (data: GrafikResponseDto): Assignment[] => {
  const out: Assignment[] = [];
  for (const w of data.workers) {
    if (isHiddenWorker(w.workerName)) continue;
    for (const e of w.entries) {
      out.push({
        czsId: e.czsId,
        orderId: e.orderId,
        workerName: w.workerName,
        orderNumber: e.orderNumber,
        contractorName: (e.contractorName ?? '').trim() || e.orderNumber,
        product: e.productCode,
        quantity: e.quantity,
        status: e.orderStatus,
        hue: hueFor(e.orderNumber),
        startDate: dayOf(e.startTime),
        endDate: dayOf(e.endTime),
        startMin: timeMin(e.startTime),
        endMin: timeMin(e.endTime),
        workHours: e.plannedHours ?? 0,
      });
    }
  }
  return out;
};

const GrafikProdukcjiPage: React.FC = () => {
  const [date, setDate] = useState<Date>(() => new Date());
  const dateIso = toIsoDate(date);
  const [mode, setMode] = useState<'plan' | 'actual'>('plan');
  const isActual = mode === 'actual';

  const { data, isLoading, isError, error } = useGrafik(dateIso, dateIso, mode);
  const updateMutation = useUpdateGrafikAssignment();

  // actual-view order detail popover
  const [detailOrder, setDetailOrder] = useState<{ orderId: number; orderNumber: string; contractorName?: string | null; product: string; workerName: string; range: string } | null>(null);
  const { data: orderDetail, isLoading: detailLoading } = useGrafikOrderDetail(detailOrder?.orderId ?? null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const baselineRef = useRef<Map<number, { startDate: string; endDate: string; startMin: number; endMin: number }>>(new Map());
  const [editing, setEditing] = useState<{ czsId: number; top: number; left: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const toastTimer = useRef<number | null>(null);

  // ---- search (contractor / order number) ----
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightCzs, setHighlightCzs] = useState<Set<number>>(() => new Set());
  const highlightTimer = useRef<number | null>(null);
  const focusNonce = useRef(0);
  const [focus, setFocus] = useState<{ date: string; czsIds: number[]; n: number } | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 220);
    return () => window.clearTimeout(id);
  }, [search]);
  const { data: searchResults, isFetching: searchLoading } = useGrafikSearch(debounced);

  const dragRef = useRef<
    | { czsId: number; mode: DragMode; startX: number; os: number; oe: number; moved: boolean; el: HTMLElement }
    | null
  >(null);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    try {
      if (typeof withPicker.showPicker === 'function') withPicker.showPicker();
      else el.focus();
    } catch {
      el.focus();
    }
  };
  const onPickDate = (value: string) => {
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    setDate(new Date(y, m - 1, d));
  };

  const availByWorker = useMemo(() => {
    const map = new Map<string, { from: number; to: number }[]>();
    for (const w of data?.workers ?? []) {
      map.set(
        w.workerName,
        (w.available ?? []).map((iv) => ({ from: hhmmToMin(iv.from), to: hhmmToMin(iv.to) }))
      );
    }
    return map;
  }, [data]);

  useEffect(() => {
    if (data) {
      const mapped = mapResponse(data);
      setAssignments(mapped);
      const bl = new Map<number, { startDate: string; endDate: string; startMin: number; endMin: number }>();
      mapped.forEach((a) => bl.set(a.czsId, { startDate: a.startDate, endDate: a.endDate, startMin: a.startMin, endMin: a.endMin }));
      baselineRef.current = bl;
      setEditing(null);
      setDetailOrder(null);
    }
  }, [data]);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
  }, []);

  // Jump to a search hit: switch day, then highlight + scroll its blocks into view.
  const goToResult = (r: GrafikSearchResultDto) => {
    const [y, m, d] = r.date.split('-').map(Number);
    setDate(new Date(y, m - 1, d));
    setSearch('');
    setDebounced('');
    setSearchOpen(false);
    focusNonce.current += 1;
    setFocus({ date: r.date, czsIds: r.czsIds, n: focusNonce.current });
  };

  useEffect(() => {
    if (!focus || dateIso !== focus.date) return;
    const ids = focus.czsIds.filter((id) => assignments.some((a) => a.czsId === id));
    if (ids.length === 0) return; // data for that day not loaded yet
    setFocus(null);
    setHighlightCzs(new Set(ids));
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightCzs(new Set()), 3200);
    window.setTimeout(() => {
      const el = document.querySelector(`[data-czs="${ids[0]}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }, 80);
  }, [focus, assignments, dateIso]);

  // span info relative to the viewed day
  const spanOf = (a: Assignment) => ({ before: a.startDate < dateIso, after: a.endDate > dateIso });
  const sameDay = (a: Assignment) => a.startDate === dateIso && a.endDate === dateIso;
  const dispOf = (a: Assignment) => {
    const { before, after } = spanOf(a);
    const start = before ? DS : clamp(a.startMin, DS, DE);
    let end = after ? DE : clamp(a.endMin <= a.startMin && !before ? a.startMin + SNAP : a.endMin, DS, DE);
    if (end <= start) end = Math.min(start + SNAP, DE);
    return { start, end };
  };

  // ---- drag / resize (same-day blocks only) ----
  const onMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const raw = e.clientX - d.startX;
    if (Math.abs(raw) > 3) d.moved = true;
    const dMin = Math.round(raw / PM / SNAP) * SNAP;
    let ns = d.os;
    let ne = d.oe;
    if (d.mode === 'left') ns = clamp(d.os + dMin, DS, d.oe - SNAP);
    else if (d.mode === 'right') ne = clamp(d.oe + dMin, d.os + SNAP, DE);
    else {
      const dd = clamp(dMin, DS - d.os, DE - d.oe);
      ns = d.os + dd;
      ne = d.oe + dd;
    }
    setAssignments((prev) => prev.map((x) => (x.czsId === d.czsId ? { ...x, startMin: ns, endMin: ne } : x)));
  }, []);

  const onUp = useCallback(() => {
    const d = dragRef.current;
    dragRef.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    if (d && !d.moved && d.mode === 'body') {
      const r = d.el.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.left), window.innerWidth - 360);
      const top = Math.min(r.bottom + 8, window.innerHeight - 340);
      setEditing({ czsId: d.czsId, top, left });
    }
  }, [onMove]);

  const startDrag = useCallback(
    (e: React.PointerEvent, czsId: number, mode: DragMode) => {
      if (mode !== 'body') e.stopPropagation();
      e.preventDefault();
      const a = assignments.find((x) => x.czsId === czsId);
      if (!a) return;
      dragRef.current = {
        czsId, mode, startX: e.clientX, os: a.startMin, oe: a.endMin, moved: false,
        el: e.currentTarget as HTMLElement,
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    },
    [assignments, onMove, onUp]
  );

  const openEditorAt = (e: React.PointerEvent, czsId: number) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left), window.innerWidth - 360);
    const top = Math.min(r.bottom + 8, window.innerHeight - 340);
    setEditing({ czsId, top, left });
  };

  // ---- editor: time + day changes, keeping start < end ----
  const editTime = (czsId: number, which: 'start' | 'end', delta: number) =>
    setAssignments((prev) => prev.map((x) => {
      if (x.czsId !== czsId) return x;
      if (which === 'start') {
        const nm = clamp(x.startMin + delta, 0, 1440 - SNAP);
        return spanMinutes(x.startDate, nm, x.endDate, x.endMin) >= SNAP ? { ...x, startMin: nm } : x;
      }
      const nm = clamp(x.endMin + delta, SNAP, 1440);
      return spanMinutes(x.startDate, x.startMin, x.endDate, nm) >= SNAP ? { ...x, endMin: nm } : x;
    }));

  const editDay = (czsId: number, which: 'start' | 'end', n: number) =>
    setAssignments((prev) => prev.map((x) => {
      if (x.czsId !== czsId) return x;
      if (which === 'start') {
        const nd = addDays(x.startDate, n);
        return spanMinutes(nd, x.startMin, x.endDate, x.endMin) >= SNAP ? { ...x, startDate: nd } : x;
      }
      const nd = addDays(x.endDate, n);
      return spanMinutes(x.startDate, x.startMin, nd, x.endMin) >= SNAP ? { ...x, endDate: nd } : x;
    }));

  const shift = (czsId: number, delta: number) =>
    setAssignments((prev) => prev.map((x) => {
      if (x.czsId !== czsId) return x;
      return { ...x, startMin: clamp(x.startMin + delta, 0, 1440), endMin: clamp(x.endMin + delta, 0, 1440) };
    }));

  // ---- changes / save ----
  const changes = useMemo(() => {
    const out: Assignment[] = [];
    for (const a of assignments) {
      const b = baselineRef.current.get(a.czsId);
      if (b && (b.startMin !== a.startMin || b.endMin !== a.endMin || b.startDate !== a.startDate || b.endDate !== a.endDate)) out.push(a);
    }
    return out;
  }, [assignments]);

  const commit = async () => {
    if (changes.length === 0) return;
    setSaving(true);
    setConfirmOpen(false);
    try {
      for (const a of changes) {
        await updateMutation.mutateAsync({
          czsId: a.czsId,
          startTime: `${a.startDate}T${fmt(a.startMin)}:00`,
          endTime: `${a.endDate}T${fmt(a.endMin)}:00`,
        });
      }
      showToast('Zapisano', 'success');
    } catch {
      showToast('Błąd zapisu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onSave = () => {
    if (changes.length === 0) return;
    if (changes.length > 1) { setConfirmOpen(true); return; }
    void commit();
  };

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  };

  // ---- derived view (lanes + availability gaps) ----
  const workers = useMemo(() => {
    const byName = new Map<string, Assignment[]>();
    const order = (data?.workers.map((w) => w.workerName) ?? []).filter((n) => !isHiddenWorker(n));
    order.forEach((n) => byName.set(n, []));
    for (const a of assignments) {
      // only show blocks that still cover the viewed day (edits can move a block off it)
      if (a.startDate > dateIso || a.endDate < dateIso) continue;
      if (!byName.has(a.workerName)) byName.set(a.workerName, []);
      byName.get(a.workerName)!.push(a);
    }
    return Array.from(byName.entries()).map(([name, as]) => {
      const laid = as
        .map((a) => ({ a, ...dispOf(a) }))
        .sort((p, q) => p.start - q.start || p.end - q.end);
      const laneEnds: number[] = [];
      const placed = laid.map((it) => {
        let lane = laneEnds.findIndex((end) => end <= it.start);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(it.end); }
        else laneEnds[lane] = it.end;
        return { ...it, lane };
      });
      const laneCount = Math.max(1, laneEnds.length);
      const rowH = Math.max(ROW_MIN_H, BLOCK_TOP * 2 + laneCount * BLOCK_H + (laneCount - 1) * LANE_GAP);
      const total = as.reduce((s, x) => {
        const sp = spanOf(x);
        return s + (sp.before || sp.after ? Math.round(x.workHours * 60) : x.endMin - x.startMin);
      }, 0);
      const avail = (availByWorker.get(name) ?? [])
        .map((iv) => ({ from: clamp(iv.from, DS, DE), to: clamp(iv.to, DS, DE) }))
        .filter((iv) => iv.to > iv.from)
        .sort((p, q) => p.from - q.from);
      const gaps: { from: number; to: number }[] = [];
      let cursor = DS;
      for (const iv of avail) {
        if (iv.from > cursor) gaps.push({ from: cursor, to: iv.from });
        cursor = Math.max(cursor, iv.to);
      }
      if (cursor < DE) gaps.push({ from: cursor, to: DE });
      const fullyUnavailable = avail.length === 0;
      return { name, placed, rowH, total, count: as.length, gaps, fullyUnavailable };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, data, availByWorker, dateIso]);

  const editingAssignment = editing ? assignments.find((x) => x.czsId === editing.czsId) : undefined;

  // one vertical line per hour, at exactly the same x as the ruler labels
  const grid = `repeating-linear-gradient(90deg, #3a3a3a 0 1px, transparent 1px ${HOUR_WIDTH}px)`;
  // stronger red for unavailable hours
  const redStripe = 'repeating-linear-gradient(45deg, rgba(255,55,55,.42) 0 8px, rgba(255,55,55,.20) 8px 16px)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#1F1F1F', color: '#fff', fontFamily: "'Inter',ui-sans-serif,system-ui,sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '16px 22px', borderBottom: '1px solid #2c2c2c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DFFFA9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#161616', fontWeight: 800, fontSize: 16 }}>G</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}>Grafik</div>
        </div>
        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => shiftDay(-1)} style={navBtn}>‹</button>
            <div style={{ textAlign: 'center', minWidth: 172 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.09em', color: '#727272', fontWeight: 600 }}>{PL_WEEKDAYS[date.getDay()]}</div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}>{`${date.getDate()} ${PL_MONTHS[date.getMonth()]} ${date.getFullYear()}`}</div>
            </div>
            <button onClick={() => shiftDay(1)} style={navBtn}>›</button>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button onClick={openDatePicker} title="Wybierz dzień" aria-label="Wybierz dzień" style={{ ...navBtn, marginLeft: 2 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
              <input ref={dateInputRef} type="date" value={dateIso} onChange={(e) => onPickDate(e.target.value)} style={{ position: 'absolute', left: 0, bottom: 0, width: 34, height: 1, opacity: 0, border: 'none', padding: 0, pointerEvents: 'none' }} tabIndex={-1} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Planowany / Rzeczywisty toggle */}
          <div style={{ display: 'flex', background: '#2a2a2a', border: '1px solid #464646', borderRadius: 10, padding: 3 }}>
            <button onClick={() => setMode('plan')} style={segBtn(!isActual)}>Planowany</button>
            <button onClick={() => setMode('actual')} style={segBtn(isActual)}>Rzeczywisty</button>
          </div>
          {!isActual && (
            <button onClick={onSave} disabled={changes.length === 0 || saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', background: '#DFFFA9', color: '#161616', cursor: changes.length === 0 || saving ? 'not-allowed' : 'pointer', opacity: changes.length === 0 || saving ? 0.4 : 1 }}>
              {saving ? 'Zapisywanie…' : changes.length > 0 ? `Zapisz zmiany · ${changes.length}` : 'Zapisz zmiany'}
            </button>
          )}
        </div>
      </header>

      {/* Search: contractor name or order number */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 160)}
              placeholder="Szukaj kontrahenta lub numeru zlecenia…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 34px 10px 36px', borderRadius: 10, border: '1px solid #464646', background: '#2a2a2a', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
            {search && (
              <button onMouseDown={(e) => { e.preventDefault(); setSearch(''); setDebounced(''); }} title="Wyczyść" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#8a8a8a', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 4 }}>✕</button>
            )}
          </div>

          {searchOpen && debounced.trim().length >= 2 && (() => {
            const results = (searchResults ?? [])
              .map((r) => ({ ...r, workers: r.workers.filter((w) => !isHiddenWorker(w)) }))
              .filter((r) => r.workers.length > 0);
            return (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: '#2a2a2a', border: '1px solid #464646', borderRadius: 12, boxShadow: '0 18px 44px rgba(0,0,0,.5)', maxHeight: 420, overflowY: 'auto', padding: 6 }}>
                {searchLoading && results.length === 0 && (
                  <div style={{ padding: '14px 12px', color: '#A5A7AA', fontSize: 13 }}>Szukam…</div>
                )}
                {!searchLoading && results.length === 0 && (
                  <div style={{ padding: '14px 12px', color: '#A5A7AA', fontSize: 13 }}>Brak wyników dla „{debounced.trim()}".</div>
                )}
                {results.map((r) => (
                  <button
                    key={`${r.orderNumber}|${r.date}`}
                    onMouseDown={(e) => { e.preventDefault(); goToResult(r); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '9px 10px', borderRadius: 8, color: '#fff', fontFamily: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#343434')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.contractorName && r.contractorName !== r.orderNumber ? r.contractorName : r.orderNumber}
                      </span>
                      <span style={{ flex: '0 0 auto', fontSize: 10, fontWeight: 700, color: '#fff', background: statusColor(r.orderStatus), borderRadius: 5, padding: '1px 6px' }}>{statusText(r.orderStatus)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: '#A5A7AA', flex: '0 0 auto' }}>{r.orderNumber}</span>
                      <span style={{ fontSize: 11, color: '#8a8a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.productCode}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: '#DFFFA9', fontWeight: 600, flex: '0 0 auto' }}>{searchDateLabel(r.date)} · {r.startTime}</span>
                      <span style={{ fontSize: 11, color: '#8a8a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.workers.join(', ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <div style={{ padding: '18px 22px 26px' }}>
        {isLoading && <div style={{ color: '#A5A7AA', padding: 40, textAlign: 'center' }}>Ładowanie grafiku…</div>}
        {isError && (
          <div style={{ color: '#FF6B6B', padding: 24 }}>
            Nie udało się pobrać grafiku{error instanceof Error ? `: ${error.message}` : ''}.
          </div>
        )}
        {!isLoading && !isError && workers.length === 0 && (
          <div style={{ color: '#A5A7AA', padding: 40, textAlign: 'center', border: '1px solid #343434', borderRadius: 12, background: '#232323' }}>
            Brak zaplanowanych zleceń na ten dzień.
          </div>
        )}

        {!isLoading && !isError && workers.length > 0 && (
          <div style={{ border: '1px solid #3d3d3d', borderRadius: 12, overflow: 'hidden', background: '#232323' }}>
            <div style={{ overflowX: 'auto', overflowY: 'visible', background: '#232323' }}>
              <div style={{ width: NAME_W + TIMELINE_W }}>
                {/* Ruler */}
                <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 30, background: '#343434', borderBottom: '2px solid #4a4a4a' }}>
                  <div style={{ width: NAME_W, flex: `0 0 ${NAME_W}px`, position: 'sticky', left: 0, zIndex: 32, background: '#343434', borderRight: '2px solid #4a4a4a', display: 'flex', alignItems: 'center', padding: '0 16px', height: 42 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#A5A7AA', textTransform: 'uppercase' }}>Pracownik</span>
                  </div>
                  <div style={{ position: 'relative', width: TIMELINE_W, height: 42 }}>
                    {Array.from({ length: HOUR_TO - HOUR_FROM + 1 }, (_, i) => HOUR_FROM + i).map((h) => {
                      const isFirst = h === HOUR_FROM;
                      const isEnd = h === HOUR_TO;
                      // centre each label on its hour gridline; clamp the first/last to the edges
                      const pos = isEnd ? { right: 4 } : isFirst ? { left: 2 } : { left: (h - HOUR_FROM) * HOUR_WIDTH };
                      const transform = isEnd || isFirst ? 'translateY(-50%)' : 'translate(-50%, -50%)';
                      return (
                        <span key={h} style={{ position: 'absolute', top: '50%', transform, fontFamily: MONO, fontSize: 11, color: '#A5A7AA', fontWeight: 600, whiteSpace: 'nowrap', ...pos }}>
                          {String(h).padStart(2, '0')}:00
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Rows — strong separators between workers */}
                {workers.map((w, idx) => {
                  const bg = idx % 2 === 1 ? '#242424' : '#1c1c1c';
                  return (
                    <div key={w.name} style={{ display: 'flex', borderBottom: '2px solid #454545' }}>
                      <div style={{ width: NAME_W, flex: `0 0 ${NAME_W}px`, position: 'sticky', left: 0, zIndex: 20, borderRight: '2px solid #454545', display: 'flex', alignItems: 'center', padding: '0 16px', height: w.rowH, background: bg }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', lineHeight: 1.2 }}>{w.name}</span>
                          <span style={{ fontSize: 11, color: w.fullyUnavailable ? '#FF6B6B' : '#8a8a8a', fontFamily: MONO, marginTop: 2 }}>
                            {durText(w.total)} · {plurZ(w.count)}{w.fullyUnavailable ? ' · niedostępny' : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ position: 'relative', width: TIMELINE_W, height: w.rowH, backgroundColor: bg, backgroundImage: grid }}>
                        {w.gaps.map((g, i) => (
                          <div key={`gap${i}`} title="Pracownik niedostępny" style={{ position: 'absolute', top: 0, bottom: 0, left: (g.from - DS) * PM, width: (g.to - g.from) * PM, background: redStripe, borderLeft: '1px solid rgba(255,55,55,.55)', borderRight: '1px solid rgba(255,55,55,.55)', pointerEvents: 'none', zIndex: 1 }} />
                        ))}
                        {w.placed.map(({ a, start, end, lane }) => {
                          const c = colorFor(a.hue);
                          const { before, after } = spanOf(a);
                          const spanning = before || after;
                          const canDrag = !isActual && sameDay(a);
                          const left = (start - DS) * PM;
                          const width = Math.max((end - start) * PM, 46);
                          const top = BLOCK_TOP + lane * (BLOCK_H + LANE_GAP);
                          const timeLabel = before
                            ? `${dt(a.startDate, a.startMin)} → ${fmt(a.endMin)}`
                            : after ? `${fmt(a.startMin)} → ${dt(a.endDate, a.endMin)}` : `${fmt(a.startMin)}–${fmt(a.endMin)}`;
                          const pill = spanning ? durBlock(Math.round(a.workHours * 60)) : durBlock(a.endMin - a.startMin);
                          const hl = highlightCzs.has(a.czsId);
                          return (
                            <div
                              key={a.czsId}
                              data-czs={a.czsId}
                              title={spanning ? `Wielodniowe: ${dt(a.startDate, a.startMin)} → ${dt(a.endDate, a.endMin)} · kliknij aby edytować` : undefined}
                              onPointerDown={isActual ? () => setDetailOrder({ orderId: a.orderId, orderNumber: a.orderNumber, contractorName: a.contractorName, product: a.product, workerName: a.workerName, range: a.startDate === a.endDate ? `${dm(a.startDate)} ${fmt(a.startMin)}–${fmt(a.endMin)}` : `${dm(a.startDate)} ${fmt(a.startMin)} → ${dm(a.endDate)} ${fmt(a.endMin)}` }) : canDrag ? (e) => startDrag(e, a.czsId, 'body') : (e) => openEditorAt(e, a.czsId)}
                              style={{
                                position: 'absolute', top, left, width, height: BLOCK_H, boxSizing: 'border-box',
                                background: c.bg, border: `1px solid ${hl ? '#DFFFA9' : c.border}`, borderLeft: `3px solid ${hl ? '#DFFFA9' : c.spine}`,
                                borderRadius: 8, padding: '5px 10px', color: c.text, cursor: 'pointer', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                boxShadow: hl ? '0 0 0 2px #DFFFA9, 0 0 18px rgba(223,255,169,.75)' : '0 1px 3px rgba(0,0,0,.35)',
                                touchAction: 'none', fontSize: 12, lineHeight: 1.15, zIndex: hl ? 5 : 2,
                                transition: 'box-shadow .2s ease, border-color .2s ease',
                              }}
                            >
                              {canDrag && <div onPointerDown={(e) => startDrag(e, a.czsId, 'left')} style={{ position: 'absolute', top: 0, bottom: 0, left: -1, width: 10, cursor: 'ew-resize', zIndex: 3, borderRadius: '8px 0 0 8px' }} />}
                              {before && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.spine, fontWeight: 800, fontSize: 13, background: `linear-gradient(270deg, transparent, ${c.bg})` }}>‹</div>}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0, letterSpacing: '.01em' }}>{a.product}</span>
                                <span style={{ background: c.pill, color: c.pillText, borderRadius: 5, padding: '1px 5px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: MONO, flex: '0 0 auto' }}>{pill}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, marginTop: 1 }}>
                                <span style={{ fontFamily: MONO, fontWeight: 600, whiteSpace: 'nowrap' }}>{timeLabel}</span>
                                <span title={a.contractorName} style={{ color: c.meta, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.contractorName}</span>
                              </div>
                              {canDrag
                                ? <div onPointerDown={(e) => startDrag(e, a.czsId, 'right')} style={{ position: 'absolute', top: 0, bottom: 0, right: -1, width: 10, cursor: 'ew-resize', zIndex: 3, borderRadius: '0 8px 8px 0' }} />
                                : after ? <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.spine, fontWeight: 800, fontSize: 13, background: `linear-gradient(90deg, transparent, ${c.bg})` }}>›</div> : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor popover */}
      {editing && editingAssignment && (() => {
        const a = editingAssignment;
        const c = colorFor(a.hue);
        return (
          <div>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setEditing(null)} />
            <div style={{ position: 'fixed', top: editing.top, left: editing.left, zIndex: 41, width: 330, background: '#303030', border: '1px solid #464646', borderRadius: 14, boxShadow: '0 18px 44px rgba(0,0,0,.5)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 2 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: c.dot, flex: '0 0 auto' }} />
                <span style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{a.product}</span>
                <button onClick={() => setEditing(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#A5A7AA', lineHeight: 1, padding: '2px 4px' }}>✕</button>
              </div>
              {a.contractorName && a.contractorName !== a.orderNumber && (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#DFE1E5', marginBottom: 2 }}>{a.contractorName}</div>
              )}
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#A5A7AA', marginBottom: 1 }}>{a.orderNumber}</div>
              <div style={{ fontSize: 12, color: '#727272', marginBottom: 14 }}>{a.workerName}</div>

              <EditorEndpoint label="Początek" dateStr={a.startDate} min={a.startMin}
                onDay={(n) => editDay(a.czsId, 'start', n)} onTime={(d) => editTime(a.czsId, 'start', d)} />
              <EditorEndpoint label="Koniec" dateStr={a.endDate} min={a.endMin}
                onDay={(n) => editDay(a.czsId, 'end', n)} onTime={(d) => editTime(a.czsId, 'end', d)} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#A5A7AA', textTransform: 'uppercase', letterSpacing: '.06em' }}>Przesuń całość</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => shift(a.czsId, -SNAP)} style={{ ...moveBtn }}>wcześniej</button>
                  <button onClick={() => shift(a.czsId, SNAP)} style={{ ...moveBtn }}>później</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 13, paddingTop: 12, borderTop: '1px solid #3d3d3d' }}>
                <span style={{ fontSize: 13, color: '#A5A7AA' }}>Czas pracy: <b style={{ color: '#fff' }}>{durText(Math.round(a.workHours * 60))}</b></span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Order detail (actual view): who worked + materials */}
      {detailOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDetailOrder(null)}>
          <div style={{ width: '100%', maxWidth: 560, maxHeight: '86vh', overflowY: 'auto', background: '#232323', border: '1px solid #464646', borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #343434', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{detailOrder.contractorName || detailOrder.orderNumber}</div>
                <div style={{ fontSize: 12, color: '#8a8a8a', fontFamily: MONO, marginTop: 3 }}>{detailOrder.orderNumber} · {detailOrder.product}</div>
                <div style={{ fontSize: 13, color: '#DFFFA9', marginTop: 8, fontFamily: MONO }}>{detailOrder.workerName}: {detailOrder.range}</div>
              </div>
              <button onClick={() => setDetailOrder(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#A5A7AA', lineHeight: 1, padding: '2px 4px' }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {detailLoading && <div style={{ color: '#A5A7AA', padding: '8px 0' }}>Ładowanie szczegółów…</div>}
              {!detailLoading && orderDetail && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#8a8a8a', textTransform: 'uppercase', marginBottom: 8 }}>Kto pracował</div>
                  {orderDetail.workers.length === 0 && <div style={{ color: '#727272', fontSize: 13, marginBottom: 8 }}>Brak zalogowanej pracy.</div>}
                  {orderDetail.workers.map((w, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #2c2c2c' }}>
                      <span style={{ fontSize: 14, color: '#fff' }}>{w.workerName}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: '#DFFFA9', fontWeight: 600 }}>{durText(w.minutes)}</span>
                    </div>
                  ))}

                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#8a8a8a', textTransform: 'uppercase', margin: '18px 0 8px' }}>Materiały pobrane</div>
                  {orderDetail.materials.length === 0 && <div style={{ color: '#727272', fontSize: 13 }}>Brak pobranych materiałów (RW).</div>}
                  {orderDetail.materials.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #2c2c2c' }}>
                      <span style={{ fontSize: 13, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.twrKod}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: '#A5A7AA', flex: '0 0 auto' }}>{m.ilosc} szt</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: '#c7d99a', flex: '0 0 auto', minWidth: 78, textAlign: 'right' }}>{Math.round(m.wartoscNetto).toLocaleString('pl-PL')} zł</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setConfirmOpen(false)}>
          <div style={{ width: '100%', maxWidth: 520, background: '#232323', border: '1px solid #464646', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: '#2563eb', color: '#fff', padding: '15px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Potwierdź zmiany w grafiku</h3>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#A5A7AA' }}>Zmieniono {changes.length === 1 ? '1 przydział' : `${changes.length} przydziałów`}. Sprawdź i potwierdź:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto', margin: '0 -6px' }}>
                {changes.map((a) => {
                  const c = colorFor(a.hue);
                  const b = baselineRef.current.get(a.czsId)!;
                  return (
                    <div key={a.czsId} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 6px', borderBottom: '1px solid #2c2c2c' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: c.dot, flex: '0 0 auto' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.workerName}</div>
                        <div style={{ fontSize: 11, color: '#727272', fontFamily: MONO, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.orderNumber} · {a.product}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: '0 0 auto', fontFamily: MONO, fontSize: 11 }}>
                        <span style={{ color: '#727272' }}>{dt(b.startDate, b.startMin)} – {dt(b.endDate, b.endMin)}</span>
                        <span style={{ color: '#DFFFA9', fontWeight: 700 }}>{dt(a.startDate, a.startMin)} – {dt(a.endDate, a.endMin)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #343434' }}>
              <button onClick={() => setConfirmOpen(false)} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#4b5563', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Anuluj</button>
              <button onClick={() => void commit()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#DFFFA9', color: '#161616', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Potwierdź</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 200, right: 22, zIndex: 70, display: 'flex', alignItems: 'center', gap: 10, background: '#343434', border: `1px solid ${toast.type === 'error' ? 'rgba(255,74,74,.35)' : 'rgba(255,255,255,.1)'}`, borderRadius: 14, padding: '12px 18px', color: '#fff', fontSize: 14, boxShadow: '0 12px 32px rgba(0,0,0,.4)' }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: toast.type === 'error' ? '#FF4A4A' : '#DFFFA9', color: toast.type === 'error' ? '#fff' : '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flex: '0 0 auto' }}>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

const navBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid #464646', background: '#343434',
  cursor: 'pointer', fontSize: 18, color: '#A5A7AA', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const segBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
  background: active ? '#DFFFA9' : 'transparent', color: active ? '#161616' : '#A5A7AA',
});
const moveBtn: React.CSSProperties = {
  height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid #464646', background: '#343434',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'inherit',
};
const stepBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid #464646', background: '#343434',
  cursor: 'pointer', fontSize: 17, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
};
const miniBtn: React.CSSProperties = {
  width: 26, height: 30, borderRadius: 8, border: '1px solid #464646', background: '#343434',
  cursor: 'pointer', fontSize: 16, fontWeight: 600, color: '#A5A7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
};

const EditorEndpoint: React.FC<{ label: string; dateStr: string; min: number; onDay: (n: number) => void; onTime: (d: number) => void }> = ({ label, dateStr, min, onDay, onTime }) => (
  <div style={{ marginBottom: 11 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#A5A7AA', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <button onClick={() => onDay(-1)} title="dzień wcześniej" style={miniBtn}>‹</button>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, minWidth: 46, textAlign: 'center', color: '#fff' }}>{dm(dateStr)}</span>
        <button onClick={() => onDay(1)} title="dzień później" style={miniBtn}>›</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onTime(-15)} style={stepBtn}>−</button>
        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, minWidth: 54, textAlign: 'center', color: '#fff' }}>{fmt(min)}</span>
        <button onClick={() => onTime(15)} style={stepBtn}>+</button>
      </div>
    </div>
  </div>
);

export default GrafikProdukcjiPage;

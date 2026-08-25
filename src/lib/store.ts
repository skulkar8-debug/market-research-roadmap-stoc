'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { AppData, Sector, CalendarEvent } from './types'
import { SEED_DATA } from './seedData'
import { WORKFLOW_EVENTS } from './workflowEvents'

// Bump the version suffix whenever the schema or baked-in seed changes, so
// browsers holding an older cached copy pick up the new data.
const STORAGE_KEY = 'researchRoadmapData.v8'

// ─── Calendar derivation (always fresh — never stale from localStorage) ───────
function addDaysISO(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

// Migrate legacy status names coming from an older localStorage or repo copy
function normalizeSectors(sectors: Sector[]): Sector[] {
  return sectors.map(s => ({
    ...s,
    targetMonth: s.targetMonth ?? '',
    targetSlot: s.targetSlot ?? '',
    status: (s.status as string) === 'Research Done' ? ('Target & Platform Research' as Sector['status']) : s.status,
  }))
}

export function deriveCalendar(sectors: Sector[]): CalendarEvent[] {
  return sectors
    .filter(s => !!s.publishDate)
    .flatMap(s =>
      WORKFLOW_EVENTS.map(ev => ({
        id:     `EVT-${s.id}-${ev.key.toUpperCase()}`,
        date:   addDaysISO(s.publishDate, ev.sOff),
        type:   ev.label,               // always the current canonical label
        sector: s.name,
        notes:  `${ev.label} · ${ev.phase}`,
      }))
    )
}

// ─── Shared save status (module-level so any component can display it) ────────
// 'local'  — edits only in this browser (repo save not configured)
// 'saving' — a commit to the repo is in flight
// 'saved'  — latest edits are committed to the repo
// 'error'  — the last repo save failed
export type SaveStatus = 'local' | 'saving' | 'saved' | 'error'

let currentStatus: SaveStatus = 'local'
const statusListeners = new Set<(s: SaveStatus) => void>()
function setStatus(s: SaveStatus) {
  currentStatus = s
  statusListeners.forEach(l => l(s))
}

export function useSaveStatus(): SaveStatus {
  const [status, set] = useState<SaveStatus>(currentStatus)
  useEffect(() => {
    statusListeners.add(set)
    return () => { statusListeners.delete(set) }
  }, [])
  return status
}

// ─── Remote persistence: commit edits back to the GitHub repo ─────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRemoteSave(sectors: Sector[]) {
  if (saveTimer) clearTimeout(saveTimer)
  setStatus('saving')
  saveTimer = setTimeout(async () => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectors }),
      })
      if (res.status === 503) setStatus('local')       // GITHUB_TOKEN not configured
      else if (res.ok) setStatus('saved')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }, 800)
}

// ─── Persistence (localStorage — instant load + offline fallback) ─────────────
function loadData(): Omit<AppData, 'calendar'> {
  if (typeof window === 'undefined') return structuredClone(SEED_DATA)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(SEED_DATA)
    const parsed = JSON.parse(raw) as AppData
    // Strip stale calendar — we derive it fresh every time
    const { calendar: _dropped, ...rest } = parsed
    return { ...rest, sectors: normalizeSectors(rest.sectors ?? []) }
  } catch {
    return structuredClone(SEED_DATA)
  }
}

function persistData(data: Omit<AppData, 'calendar'>) {
  try {
    // Never persist calendar — it's derived
    const { calendar: _dropped, ...rest } = data as AppData
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch { /* storage full */ }
}

// ─── Store hook ───────────────────────────────────────────────────────────────
export function useStore() {
  const [base, setBase] = useState<Omit<AppData, 'calendar'>>(SEED_DATA)

  useEffect(() => {
    // Instant paint from localStorage (or the bundled seed)…
    setBase(loadData())
    // …then adopt the shared repo copy as the source of truth when available.
    fetch('/api/data', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(body => {
        if (body?.configured && Array.isArray(body.sectors) && body.sectors.length > 0) {
          const next = { sectors: normalizeSectors(body.sectors as Sector[]) }
          setBase(next)
          persistData(next)
          setStatus('saved')
        }
      })
      .catch(() => { /* offline or not configured — stay on local copy */ })
  }, [])

  // Calendar is ALWAYS derived from current sectors — never from storage
  const calendar = useMemo(() => deriveCalendar(base.sectors), [base.sectors])

  const data: AppData = useMemo(() => ({ ...base, calendar }), [base, calendar])

  const save = useCallback((next: Omit<AppData, 'calendar'>) => {
    setBase(next)
    persistData(next)
    scheduleRemoteSave(next.sectors)
  }, [])

  // ── Sectors ──────────────────────────────────────────────────────────────
  const addSector    = useCallback((s: Sector)   => save({ ...base, sectors: [...base.sectors, s] }), [base, save])
  const updateSector = useCallback((u: Sector)   => save({ ...base, sectors: base.sectors.map(s => s.id === u.id ? u : s) }), [base, save])

  // ── Reset / Export ─────────────────────────────────────────────────────────
  const resetToSeed = useCallback(() => {
    const fresh = structuredClone(SEED_DATA)
    setBase(fresh)
    persistData(fresh)
    scheduleRemoteSave(fresh.sectors)
  }, [])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'market-research-roadmap-export.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [data])

  return {
    data,
    addSector, updateSector,
    resetToSeed, exportJson,
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
// Always compute today at call-time so calculations stay accurate as real dates advance
export function getToday(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function daysFrom(dateStr: string): number | null {
  if (!dateStr) return null
  return Math.round((new Date(dateStr + 'T00:00:00Z').getTime() - getToday().getTime()) / 86_400_000)
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—'
  // Always use UTC timezone to avoid off-by-one day errors when the user's
  // local timezone is behind UTC (e.g. '2026-06-11' parsed as UTC midnight
  // would display as Jun 10 in US Eastern time without this flag).
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

/** 'YYYY-MM' → 'Aug 2026' */
export function fmtMonth(month: string): string {
  if (!month) return '—'
  return new Date(month + '-01T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

// STORAGE_KEY export for the settings page sync flow
export { STORAGE_KEY }

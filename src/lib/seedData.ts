import type { AppData, Sector, CalendarEvent } from './types'
import { WORKFLOW_EVENTS } from './workflowEvents'
import RAW_SECTORS from '../data/sectors.json'

// The sector table lives in src/data/sectors.json — the app's source of truth.
// Edits made in the app are committed back to that file via /api/data.
export const SECTORS: Sector[] = RAW_SECTORS as Sector[]

// ─── helpers ─────────────────────────────────────────────────────────────────
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

// ─── derive calendar events from sector publish dates ────────────────────────
function sectorToCalendarEvents(s: Sector): CalendarEvent[] {
  if (!s.publishDate) return []
  const p = s.publishDate
  return WORKFLOW_EVENTS.map(ev => ({
    id:     `EVT-${s.id}-${ev.key.toUpperCase()}`,
    date:   addDays(p, ev.sOff),       // use start date for calendar placement
    type:   ev.label,
    sector: s.name,
    notes:  `${ev.label} · ${ev.phase}`,
  }))
}

// ─── assemble ─────────────────────────────────────────────────────────────────
export const SEED_DATA: AppData = {
  sectors:  SECTORS,
  calendar: SECTORS.flatMap(sectorToCalendarEvents),
}

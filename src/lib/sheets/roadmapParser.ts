import type { Sector, SectorStatus } from '../types'

function parseDate(raw: string): string {
  if (!raw || raw.trim() === '') return ''
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  let m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/)
  if (m) return `20${m[3]}-${m[1]}-${m[2]}`
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  return ''
}

const STATUS_MAP: Record<string, SectorStatus> = {
  completed: 'Published',
  complete: 'Published',
  done: 'Published',
  planned: 'Planning',
  planning: 'Planning',
  'not started': 'Planning',
  active: 'In Progress',
  'in progress': 'In Progress',
  'research done': 'Target & Platform Research',
  'research complete': 'Target & Platform Research',
  'target & platform research': 'Target & Platform Research',
  'target and platform research': 'Target & Platform Research',
  'done/in review': 'Done/In Review',
  'done / in review': 'Done/In Review',
  'in review': 'Done/In Review',
  review: 'Done/In Review',
  published: 'Published',
  released: 'Published',
}

/**
 * Column resolution by header name, so the sheet's tab layout can evolve
 * without breaking the sync. Each field lists match predicates tried in
 * order against the lowercased header row.
 */
type Matcher = (h: string) => boolean
const FIELD_MATCHERS: Record<string, Matcher[]> = {
  id:           [h => h === 'id' || h === 'sector id'],
  name:         [h => h === 'sector' || h === 'sector name' || h === 'name'],
  status:       [h => h === 'status', h => h.includes('status') && !h.includes('outreach') && !h.includes('tip')],
  publishDate:  [h => h.includes('publish')],
  reportLink:   [h => h.includes('report') && h.includes('link'), h => h === 'report'],
  dataLink:     [h => h.includes('data') && h.includes('link'), h => h === 'data'],
  tipLink:      [h => h.includes('tip') && h.includes('link'), h => h === 'tip'],
  linkedinLink: [h => h.includes('linkedin')],
  websiteLink:  [h => h.includes('website'), h => h.includes('web link')],
  notes:        [h => h.includes('note')],
}

function resolveColumns(headerRow: string[]): Record<string, number> {
  const headers = headerRow.map(h => h.trim().toLowerCase())
  const cols: Record<string, number> = {}
  for (const [field, matchers] of Object.entries(FIELD_MATCHERS)) {
    for (const matches of matchers) {
      const idx = headers.findIndex(matches)
      if (idx !== -1) { cols[field] = idx; break }
    }
  }
  return cols
}

// Legacy fixed positions from the original 20-column Sectors tab —
// used only when the header row can't be matched.
const LEGACY_COLS: Record<string, number> = {
  id: 0, name: 1, status: 2, publishDate: 3,
  reportLink: 14, tipLink: 15, dataLink: 16, notes: 18,
}

export function parseSectorsFromRows(rows: string[][]): Sector[] {
  if (rows.length < 2) return []

  let cols = resolveColumns(rows[0])
  // Header matching must at least find ID + name to be trusted
  if (cols.id === undefined || cols.name === undefined) cols = LEGACY_COLS

  const cell = (r: string[], field: string): string => {
    const idx = cols[field]
    return idx === undefined ? '' : (r[idx] ?? '').trim()
  }

  return rows
    .slice(1)
    .map((r) => {
      const rawStatus = cell(r, 'status').toLowerCase()
      return {
        id: cell(r, 'id'),
        name: cell(r, 'name'),
        status: STATUS_MAP[rawStatus] ?? 'Planning',
        publishDate: parseDate(cell(r, 'publishDate')),
        reportLink: cell(r, 'reportLink'),
        dataLink: cell(r, 'dataLink'),
        tipLink: cell(r, 'tipLink'),
        linkedinLink: cell(r, 'linkedinLink'),
        websiteLink: cell(r, 'websiteLink'),
        notes: cell(r, 'notes'),
      }
    })
    .filter((s) => s.id && s.name)
}

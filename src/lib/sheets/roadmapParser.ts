import type { Priority, Sector, SectorStatus } from '../types'

function parseDate(raw: string): string {
  if (!raw || raw.trim() === '') return ''
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/)
  if (m) return `20${m[3]}-${m[1]}-${m[2]}`
  return ''
}

const STATUS_MAP: Record<string, SectorStatus> = {
  completed: 'Completed',
  planned: 'Planning',
  planning: 'Planning',
  active: 'In Progress',
  'in progress': 'In Progress',
  published: 'Published',
}

export function parseSectorsFromRows(rows: string[][]): Sector[] {
  if (rows.length < 2) return []

  return rows
    .slice(1)
    .map((r) => {
      const id = (r[0] ?? '').trim()
      const name = (r[1] ?? '').trim()
      const rawSt = (r[2] ?? '').trim().toLowerCase()
      const status = STATUS_MAP[rawSt] ?? 'Planning'
      const pub = parseDate(r[3] ?? '')
      const rptLnk = (r[14] ?? '').trim()
      const tipLnk = (r[15] ?? '').trim()
      const dataLnk = (r[16] ?? '').trim()
      const notes = (r[18] ?? '').trim()

      return {
        id,
        name,
        status,
        priority: 'Medium' as Priority,
        publishDate: pub,
        reportLink: rptLnk,
        dataLink: dataLnk,
        tipLink: tipLnk,
        // The sheet has no columns for these — local values are preserved on merge
        linkedinLink: '',
        websiteLink: '',
        notes,
      }
    })
    .filter((s) => s.id && s.name)
}

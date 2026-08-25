export type SectorStatus = 'Planning' | 'Target & Platform Research' | 'In Progress' | 'Done/In Review' | 'Published'
// EventType is open-ended to support the workflow labels
export type EventType = string

export interface Sector {
  id: string
  name: string
  status: SectorStatus
  publishDate: string
  /** Priority scheduling: month (YYYY-MM) and slot 1 or 2 — two sectors per month */
  targetMonth: string
  targetSlot: string
  reportLink: string
  dataLink: string
  tipLink: string
  linkedinLink: string
  websiteLink: string
  notes: string
}

export interface CalendarEvent {
  id: string
  date: string
  type: EventType
  sector: string
  notes: string
}

export interface AppData {
  sectors: Sector[]
  calendar: CalendarEvent[]
}

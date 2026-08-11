export type SectorStatus = 'Planning' | 'In Progress' | 'Published' | 'Completed'
export type Priority = 'High' | 'Medium' | 'Low'
// EventType is open-ended to support the workflow labels
export type EventType = string

export interface Sector {
  id: string
  name: string
  status: SectorStatus
  priority: Priority
  publishDate: string
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

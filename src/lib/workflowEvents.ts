/**
 * Publishing-pipeline event definitions.
 * All timing is relative to Report Publish Date (offset 0).
 */

export interface WorkflowEvent {
  key:   string
  phase: string
  label: string          // clean display label
  bg:    string
  border: string
  text:  string
  sOff:  number          // start day offset from publish date
  eOff:  number          // end day offset (inclusive)
}

export const WORKFLOW_EVENTS: WorkflowEvent[] = [
  { key: 'dataprep',  phase: 'Research/Data', label: 'Data Prep',         bg: '#e0e7ff', border: '#6366f1', text: '#3730a3', sOff: -35, eOff: -22 },
  { key: 'research',  phase: 'Research/Data', label: 'Sector Research',   bg: '#ddd6fe', border: '#7c3aed', text: '#4c1d95', sOff: -35, eOff: -22 },
  { key: 'build',     phase: 'Report',        label: 'Build & QA Report', bg: '#c7d2fe', border: '#818cf8', text: '#3730a3', sOff: -21, eOff: -1  },
  { key: 'publish',   phase: 'Report',        label: 'Publish Report',    bg: '#bbf7d0', border: '#22c55e', text: '#14532d', sOff:  0,  eOff:  0  },
  { key: 'linkedin',  phase: 'Content',       label: 'LinkedIn Post',     bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a8a', sOff:  0,  eOff:  1  },
]

// Quick lookup by event key (available for future use)
export const WF_BY_KEY = Object.fromEntries(WORKFLOW_EVENTS.map(e => [e.key, e]))

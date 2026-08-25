'use client'

import { cn } from '@/lib/utils'
import type { SectorStatus } from '@/lib/types'
import { WORKFLOW_EVENTS } from '@/lib/workflowEvents'

interface ChipProps { label: string; className: string }
function Chip({ label, className }: ChipProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap', className)}>
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: SectorStatus }) {
  const cls: Record<SectorStatus, string> = {
    Planning:                     'bg-gray-100 text-gray-700',
    'Target & Platform Research': 'bg-purple-100 text-purple-800',
    'In Progress':                'bg-blue-100 text-blue-800',
    'Done/In Review':             'bg-amber-100 text-amber-800',
    Published:                    'bg-green-100 text-green-800',
  }
  return <Chip label={status} className={cls[status]} />
}

export function EventTypeBadge({ type }: { type: string }) {
  // Colors derived directly from WORKFLOW_EVENTS so they never go stale
  const ev = WORKFLOW_EVENTS.find(e => e.label === type)
  if (ev) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
        style={{ background: ev.bg, borderColor: ev.border, color: ev.text }}>
        {type}
      </span>
    )
  }
  return <Chip label={type} className="bg-gray-100 text-gray-700" />
}

'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useStore, daysFrom, fmtDate } from '@/lib/store'
import { StatusBadge } from '@/components/roadmap/StatusBadge'
import type { Sector } from '@/lib/types'

const STAT_COLORS: Record<string, string> = {
  indigo: 'border-l-indigo-500 text-indigo-600',
  blue:   'border-l-blue-500 text-blue-600',
  yellow: 'border-l-yellow-500 text-yellow-600',
  green:  'border-l-green-500 text-green-600',
  red:    'border-l-red-500 text-red-600',
}

interface StatCardProps {
  label: string
  value: number
  color: keyof typeof STAT_COLORS
}
function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 p-4 ${STAT_COLORS[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

const ASSET_FIELDS: { field: keyof Sector; label: string }[] = [
  { field: 'reportLink',   label: 'Report'   },
  { field: 'dataLink',     label: 'Data'     },
  { field: 'tipLink',      label: 'TIP'      },
  { field: 'linkedinLink', label: 'LinkedIn' },
  { field: 'websiteLink',  label: 'Website'  },
]

function AssetChips({ sector }: { sector: Sector }) {
  const present = ASSET_FIELDS.filter(a => sector[a.field])
  if (present.length === 0) return <span className="text-[10px] text-gray-300 italic">no assets yet</span>
  return (
    <span className="flex items-center gap-2 flex-wrap">
      {present.map(a => (
        <a key={a.field} href={sector[a.field] as string} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:underline">
          {a.label}<ExternalLink className="size-2.5" />
        </a>
      ))}
    </span>
  )
}

export default function DashboardPage() {
  const { data } = useStore()
  const { sectors } = data

  const released = sectors
    .filter(s => s.status === 'Published' || s.status === 'Completed')
    .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
  const inProgress = sectors.filter(s => s.status === 'In Progress')
  const publishingSoon = sectors
    .filter(s => { const d = daysFrom(s.publishDate); return d !== null && d >= 0 && d <= 30 && s.status !== 'Completed' && s.status !== 'Published' })
    .sort((a, b) => a.publishDate.localeCompare(b.publishDate))
  const missingAssets = released.filter(s => !s.reportLink || !s.dataLink)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          One view of the market research publishing pipeline — research in motion, upcoming releases, and every published asset.
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Sectors in Pipeline"   value={sectors.length}        color="indigo" />
        <StatCard label="Research In Progress"  value={inProgress.length}     color="blue"   />
        <StatCard label="Publishing ≤30d"       value={publishingSoon.length} color="yellow" />
        <StatCard label="Reports Released"      value={released.length}       color="green"  />
        <StatCard label="Released, Assets Missing" value={missingAssets.length} color="red"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* In progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Research In Progress</div>
          {inProgress.length === 0
            ? <p className="text-sm text-gray-400">No sectors currently in research.</p>
            : inProgress.map(s => {
              const d = daysFrom(s.publishDate)
              const overdue = d !== null && d < 0
              return (
                <Link key={s.id} href={`/roadmap/sectors/${s.id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded px-1 -mx-1">
                  <span className="text-sm font-medium text-indigo-600">{s.name}</span>
                  {overdue
                    ? <span className="text-xs font-medium text-amber-600">Publish date passed — {fmtDate(s.publishDate)}</span>
                    : <span className="text-xs text-gray-500">{d === null ? 'No publish date' : `Publishes ${fmtDate(s.publishDate)}`}</span>
                  }
                </Link>
              )
            })
          }
        </div>

        {/* Publishing soon */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Publishing Soon (≤30 days)</div>
          {publishingSoon.length === 0
            ? <p className="text-sm text-gray-400">No reports scheduled in the next 30 days.</p>
            : publishingSoon.map(s => (
              <Link key={s.id} href={`/roadmap/sectors/${s.id}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded px-1 -mx-1">
                <span className="text-sm font-medium text-indigo-600">{s.name}</span>
                <span className="text-xs text-gray-500">{fmtDate(s.publishDate)}</span>
              </Link>
            ))
          }
        </div>
      </div>

      {/* Released reports + assets */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Released Reports &amp; Assets</div>
        {released.length === 0
          ? <p className="text-sm text-gray-400">No reports released yet.</p>
          : released.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <Link href={`/roadmap/sectors/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline truncate">{s.name}</Link>
                <StatusBadge status={s.status} />
                <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.publishDate)}</span>
              </div>
              <AssetChips sector={s} />
            </div>
          ))
        }
      </div>
    </div>
  )
}

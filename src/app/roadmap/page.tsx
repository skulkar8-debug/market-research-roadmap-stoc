'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useStore, daysFrom, fmtDate, fmtMonth } from '@/lib/store'
import { StatusBadge } from '@/components/roadmap/StatusBadge'
import type { Sector } from '@/lib/types'

const STAT_COLORS: Record<string, string> = {
  indigo: 'border-l-indigo-500 text-indigo-600',
  blue:   'border-l-blue-500 text-blue-600',
  teal:   'border-l-teal-500 text-teal-600',
  amber:  'border-l-amber-500 text-amber-600',
  yellow: 'border-l-yellow-500 text-yellow-600',
  green:  'border-l-green-500 text-green-600',
}

interface StatCardProps {
  label: string
  value: number
  color: keyof typeof STAT_COLORS
  href: string
}
function StatCard({ label, value, color, href }: StatCardProps) {
  return (
    <Link href={href} className={`block bg-white rounded-xl border border-gray-200 border-l-4 p-4 hover:shadow-sm hover:border-gray-300 transition-all ${STAT_COLORS[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </Link>
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

  const published    = sectors
    .filter(s => s.status === 'Published')
    .sort((a, b) => (b.publishDate || '').localeCompare(a.publishDate || ''))
  const inProgress   = sectors.filter(s => s.status === 'In Progress')
  const researchDone = sectors.filter(s => s.status === 'Target & Platform Research')
  const doneReview   = sectors.filter(s => s.status === 'Done/In Review')
  const remaining    = sectors.filter(s => s.status !== 'Published')
  const publishingSoon = sectors
    .filter(s => { const d = daysFrom(s.publishDate); return d !== null && d >= 0 && d <= 30 && s.status !== 'Published' })

  // Monthly priority schedule: two slots per month
  const monthGroups = (() => {
    const byMonth = new Map<string, Sector[]>()
    sectors.filter(s => s.targetMonth).forEach(s => {
      byMonth.set(s.targetMonth, [...(byMonth.get(s.targetMonth) ?? []), s])
    })
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, list]) => ({
        month,
        list: list.sort((a, b) => (a.targetSlot || '9').localeCompare(b.targetSlot || '9')),
      }))
  })()

  const publishInfo = (s: Sector) => {
    const d = daysFrom(s.publishDate)
    if (d === null) return <span className="text-xs text-gray-400 whitespace-nowrap">No publish date</span>
    if (d < 0)      return <span className="text-xs font-medium text-amber-600 whitespace-nowrap">Publish date passed — {fmtDate(s.publishDate)}</span>
    return <span className="text-xs text-gray-500 whitespace-nowrap">Publishes {fmtDate(s.publishDate)}</span>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          One view of the market research publishing pipeline — research in motion, upcoming releases, and every published asset.
        </p>
      </div>

      {/* KPI funnel — each card clicks through to its filtered view */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Remaining Sectors in Pipeline" value={remaining.length}      color="indigo" href="/roadmap/sectors" />
        <StatCard label="Target & Platform Research"    value={researchDone.length}   color="teal"   href="/roadmap/sectors?status=Target & Platform Research" />
        <StatCard label="In Progress"                   value={inProgress.length}     color="blue"   href="/roadmap/sectors?status=In Progress" />
        <StatCard label="Done / In Review"              value={doneReview.length}     color="amber"  href="/roadmap/sectors?status=Done/In Review" />
        <StatCard label="Publishing ≤30d"               value={publishingSoon.length} color="yellow" href="/roadmap/calendar" />
        <StatCard label="Reports Published"             value={published.length}      color="green"  href="/roadmap/sectors?status=Published" />
      </div>

      {/* Monthly priorities — 2 sectors per month */}
      <div className="bg-white rounded-xl border border-indigo-200 p-5 mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">Monthly Priorities</div>
        <p className="text-xs text-gray-400 mb-3">Two sectors per month. Set a sector's target from the Sectors table (Target column) or its detail page.</p>
        {monthGroups.length === 0
          ? <p className="text-sm text-gray-400">No monthly targets set yet.</p>
          : <div className="flex gap-4 flex-wrap">
              {monthGroups.map(({ month, list }) => (
                <div key={month} className="border border-gray-200 rounded-lg px-4 py-3 min-w-[220px]">
                  <div className="text-xs font-bold text-gray-900 mb-2">{fmtMonth(month)}</div>
                  {[ '1', '2' ].map(slot => {
                    const sec = list.find(s => s.targetSlot === slot)
                    return (
                      <div key={slot} className="flex items-center gap-2 py-1">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">{slot}</span>
                        {sec
                          ? <>
                              <Link href={`/roadmap/sectors/${sec.id}`} className="text-sm font-medium text-indigo-600 hover:underline truncate">{sec.name}</Link>
                              <StatusBadge status={sec.status} />
                            </>
                          : <span className="text-sm text-gray-300 italic">open slot</span>
                        }
                      </div>
                    )
                  })}
                  {list.filter(s => s.targetSlot !== '1' && s.targetSlot !== '2').map(sec => (
                    <div key={sec.id} className="flex items-center gap-2 py-1">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">+</span>
                      <Link href={`/roadmap/sectors/${sec.id}`} className="text-sm font-medium text-indigo-600 hover:underline truncate">{sec.name}</Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Buckets — one column per pipeline stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Target & Platform Research */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-3">Target &amp; Platform Research</div>
          {researchDone.length === 0
            ? <p className="text-sm text-gray-400">No sectors in this stage.</p>
            : researchDone.map(s => (
              <div key={s.id} className="py-2 border-b border-gray-50 last:border-0">
                <Link href={`/roadmap/sectors/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline">{s.name}</Link>
                <div className="mt-1"><AssetChips sector={s} /></div>
              </div>
            ))
          }
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-3">In Progress</div>
          {inProgress.length === 0
            ? <p className="text-sm text-gray-400">No sectors in progress.</p>
            : inProgress.map(s => (
              <div key={s.id} className="py-2 border-b border-gray-50 last:border-0">
                <Link href={`/roadmap/sectors/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline">{s.name}</Link>
                <div className="mt-0.5">{publishInfo(s)}</div>
                <div className="mt-1"><AssetChips sector={s} /></div>
              </div>
            ))
          }
        </div>

        {/* Done / In Review */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">Done / In Review</div>
          {doneReview.length === 0
            ? <p className="text-sm text-gray-400">Nothing in review.</p>
            : doneReview.map(s => (
              <div key={s.id} className="py-2 border-b border-gray-50 last:border-0">
                <Link href={`/roadmap/sectors/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline">{s.name}</Link>
                <div className="mt-0.5">{publishInfo(s)}</div>
                <div className="mt-1"><AssetChips sector={s} /></div>
              </div>
            ))
          }
        </div>

        {/* Published */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-3">Published</div>
          {published.length === 0
            ? <p className="text-sm text-gray-400">No reports published yet.</p>
            : published.map(s => (
              <div key={s.id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/roadmap/sectors/${s.id}`} className="text-sm font-medium text-indigo-600 hover:underline">{s.name}</Link>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.publishDate)}</span>
                </div>
                <div className="mt-1"><AssetChips sector={s} /></div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

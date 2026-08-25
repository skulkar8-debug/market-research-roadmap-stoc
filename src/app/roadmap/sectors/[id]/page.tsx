'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react'
import { useStore, daysFrom, fmtDate } from '@/lib/store'
import { StatusBadge, EventTypeBadge } from '@/components/roadmap/StatusBadge'
import { Modal } from '@/components/roadmap/Modal'
import type { Sector, SectorStatus } from '@/lib/types'

const STATUSES: SectorStatus[] = ['Planning', 'In Progress', 'Research Done', 'Done/In Review', 'Published']

function LinkOrMissing({ url, label }: { url: string; label: string }) {
  if (!url) return (
    <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
      <AlertTriangle className="size-3" /> Missing
    </span>
  )
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 text-sm hover:underline">
      {label} <ExternalLink className="size-3" />
    </a>
  )
}

const ASSET_CARDS: { field: keyof Sector; title: string; linkLabel: string; hint: string }[] = [
  { field: 'reportLink',   title: 'Report',        linkLabel: 'View Report',       hint: 'Published report PDF' },
  { field: 'dataLink',     title: 'Data',          linkLabel: 'Open Data',         hint: 'Underlying dataset / source files' },
  { field: 'tipLink',      title: 'TIP',           linkLabel: 'View TIP',          hint: 'The Insights Piece' },
  { field: 'linkedinLink', title: 'LinkedIn Post', linkLabel: 'View Post',         hint: 'Supporting social content' },
  { field: 'websiteLink',  title: 'Website',       linkLabel: 'View on Site',      hint: 'Public report page on stocadvisory.com' },
]

export default function SectorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data, updateSector } = useStore()
  const [editOpen, setEditOpen] = useState(false)

  const sector = data.sectors.find(s => s.id === id)

  if (!sector) {
    return (
      <div className="p-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="size-4" /> Back
        </button>
        <p className="text-gray-500">Sector not found.</p>
      </div>
    )
  }

  const relCal = data.calendar.filter(e => e.sector === sector.name).sort((a, b) => a.date.localeCompare(b.date))

  const daysLeft = daysFrom(sector.publishDate)
  const daysStr  = daysLeft === null ? '—' : daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Today' : `In ${daysLeft}d`

  const handleSave = (updated: Sector) => {
    updateSector(updated)
    setEditOpen(false)
  }

  const inp = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300'
  const row = 'flex flex-col gap-1'
  const lbl = 'text-xs font-semibold text-gray-600'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="size-4" /> Back to Sectors
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{sector.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={sector.status} />
            <span className="text-xs text-gray-500">{sector.id}</span>
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Edit Sector
        </button>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Overview</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-xs text-gray-400 block">Publish Date</span><span className="font-medium">{fmtDate(sector.publishDate)}</span> <span className="text-xs text-gray-400">({daysStr})</span></div>
          <div><span className="text-xs text-gray-400 block">Status</span><span className="font-medium">{sector.status}</span></div>
        </div>
        {sector.notes && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">{sector.notes}</div>
        )}
      </div>

      {/* Assets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {ASSET_CARDS.map(({ field, title, linkLabel, hint }) => (
          <div key={field} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</div>
            <LinkOrMissing url={sector[field] as string} label={linkLabel} />
            <div className="mt-2 text-[10px] text-gray-400">{hint}</div>
          </div>
        ))}
      </div>

      {/* Pipeline timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Publishing Timeline</div>
        {relCal.length === 0
          ? <p className="text-sm text-gray-400">No timeline yet — set a publish date to generate one.</p>
          : relCal.map(e => (
            <div key={e.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
              <div>
                <EventTypeBadge type={e.type} />
                <div className="text-xs text-gray-400 mt-0.5">{e.notes}</div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(e.date)}</span>
            </div>
          ))
        }
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${sector.name}`} size="lg">
        <form onSubmit={e => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          handleSave({
            ...sector,
            name:         fd.get('name') as string,
            status:       fd.get('status') as SectorStatus,
            publishDate:  fd.get('publishDate') as string,
            reportLink:   fd.get('reportLink') as string,
            dataLink:     fd.get('dataLink') as string,
            tipLink:      fd.get('tipLink') as string,
            linkedinLink: fd.get('linkedinLink') as string,
            websiteLink:  fd.get('websiteLink') as string,
            notes:        fd.get('notes') as string,
          })
        }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`${row} col-span-2`}><label className={lbl}>Sector Name</label><input name="name" className={inp} defaultValue={sector.name} /></div>
            <div className={row}><label className={lbl}>Status</label><select name="status" className={inp} defaultValue={sector.status}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className={row}><label className={lbl}>Publish Date</label><input type="date" name="publishDate" className={inp} defaultValue={sector.publishDate} /></div>
            <div className={`${row} col-span-2`}><label className={lbl}>Report Link</label><input name="reportLink" className={inp} placeholder="https://…" defaultValue={sector.reportLink} /></div>
            <div className={`${row} col-span-2`}><label className={lbl}>Data Link</label><input name="dataLink" className={inp} placeholder="https://…" defaultValue={sector.dataLink} /></div>
            <div className={`${row} col-span-2`}><label className={lbl}>TIP Link</label><input name="tipLink" className={inp} placeholder="https://…" defaultValue={sector.tipLink} /></div>
            <div className={`${row} col-span-2`}><label className={lbl}>LinkedIn Post Link</label><input name="linkedinLink" className={inp} placeholder="https://…" defaultValue={sector.linkedinLink} /></div>
            <div className={`${row} col-span-2`}><label className={lbl}>Website Link</label><input name="websiteLink" className={inp} placeholder="https://…" defaultValue={sector.websiteLink} /></div>
            <div className={`${row} col-span-2`}><label className={lbl}>Notes</label><textarea name="notes" className={inp} rows={2} defaultValue={sector.notes} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

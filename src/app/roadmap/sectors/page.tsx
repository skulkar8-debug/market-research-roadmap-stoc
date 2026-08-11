'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, ExternalLink, ChevronDown } from 'lucide-react'
import { useStore, fmtDate } from '@/lib/store'
import { StatusBadge } from '@/components/roadmap/StatusBadge'
import { Modal } from '@/components/roadmap/Modal'
import type { Sector, SectorStatus } from '@/lib/types'

const STATUSES: SectorStatus[] = ['Planning', 'In Progress', 'Research Done', 'Published']

// List order: most advanced stage first, regardless of publish date
const STATUS_ORDER: Record<SectorStatus, number> = {
  'Published': 0, 'In Progress': 1, 'Research Done': 2, 'Planning': 3,
}

// ── Inline cell editors ────────────────────────────────────────────────────────

function InlineSelect<T extends string>({
  value, options, onSave, onCancel,
}: {
  value: T
  options: T[]
  onSave: (v: T) => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <select
        autoFocus
        className="border border-indigo-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
        defaultValue={value}
        onClick={e => e.stopPropagation()}
        onChange={e => { onSave(e.target.value as T); }}
        onBlur={onCancel}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function InlineDateInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input
        ref={ref}
        type="date"
        defaultValue={value}
        className="border border-indigo-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32"
        onKeyDown={e => {
          if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value)
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={e => onSave(e.target.value)}
      />
    </div>
  )
}

// ── Asset columns ──────────────────────────────────────────────────────────────
const ASSETS: { field: keyof Sector; label: string }[] = [
  { field: 'reportLink',   label: 'Report'   },
  { field: 'dataLink',     label: 'Data'     },
  { field: 'tipLink',      label: 'TIP'      },
  { field: 'linkedinLink', label: 'LinkedIn' },
  { field: 'websiteLink',  label: 'Website'  },
]

// ── Main page ──────────────────────────────────────────────────────────────────
type EditCell = { id: string; field: 'status' | 'publishDate' }

function SectorsPageContent() {
  const { data, addSector, updateSector } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filters — ?status= in the URL (e.g. from dashboard KPI cards) pre-filters the list
  const statusParam = searchParams.get('status') ?? ''
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState((STATUSES as string[]).includes(statusParam) ? statusParam : '')

  // Inline editing
  const [editing, setEditing] = useState<EditCell | null>(null)

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [newSector, setNewSector] = useState<Partial<Sector>>({
    status: 'Planning',
  })

  const filtered = data.sectors
    .filter(s => {
      if (search  && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false
      if (statusF && s.status !== statusF) return false
      return true
    })
    .sort((a, b) => {
      // Stage first (Published → In Progress → Research Done → Planning),
      // then by publish date within a stage, then by sector ID
      const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (so !== 0) return so
      if (a.publishDate && b.publishDate) return a.publishDate.localeCompare(b.publishDate)
      if (a.publishDate && !b.publishDate) return -1
      if (!a.publishDate && b.publishDate) return 1
      return a.id.localeCompare(b.id)
    })

  const saveField = (id: string, field: keyof Sector, value: string) => {
    const s = data.sectors.find(x => x.id === id)
    if (!s) return
    updateSector({ ...s, [field]: value })
    setEditing(null)
  }

  const isEditing = (id: string, field: string) => editing?.id === id && editing?.field === field

  const startEdit = (e: React.MouseEvent, id: string, field: EditCell['field']) => {
    e.stopPropagation()
    setEditing({ id, field })
  }

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSector.name?.trim()) return
    const newId = `S${String(data.sectors.length + 1).padStart(3, '0')}`
    addSector({
      reportLink: '', dataLink: '', tipLink: '', linkedinLink: '', websiteLink: '',
      publishDate: '', notes: '',
      ...newSector, id: newId,
    } as Sector)
    setAddOpen(false)
    setNewSector({ status: 'Planning' })
  }

  const inp  = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300'
  const finp = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300'
  const lbl  = 'text-xs font-semibold text-gray-600'
  const row  = 'flex flex-col gap-1'

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sectors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} of {data.sectors.length} sectors · Click a cell to edit inline, or row to view detail
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
          <Plus className="size-4" /> Add Sector
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <input
          className={`${inp} w-48`}
          placeholder="Search name or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={`${inp} w-38`} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || statusF) && (
          <button
            onClick={() => { setSearch(''); setStatusF('') }}
            className="text-xs text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="text-[10px] text-gray-400 mb-2 ml-1">
        💡 <strong>Tip:</strong> Click Status or Publish Date cells to edit inline.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs">ID</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs">Sector</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs cursor-pointer select-none">
                Status <span className="text-indigo-400">✎</span>
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs">
                Publish Date <span className="text-indigo-400">✎</span>
              </th>
              {ASSETS.map(a => (
                <th key={a.field} className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs">{a.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">No sectors found.</td></tr>
            )}
            {filtered.map(s => (
              <tr
                key={s.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => { if (!editing) router.push(`/roadmap/sectors/${s.id}`) }}
              >
                <td className="px-3 py-2 text-xs text-gray-400 font-semibold">{s.id}</td>
                <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap max-w-[220px]">
                  <span className="truncate block">{s.name}</span>
                </td>

                {/* Status — inline edit */}
                <td className="px-3 py-2" onClick={e => startEdit(e, s.id, 'status')}>
                  {isEditing(s.id, 'status')
                    ? <InlineSelect
                        value={s.status} options={STATUSES}
                        onSave={v => saveField(s.id, 'status', v)}
                        onCancel={() => setEditing(null)}
                      />
                    : <div className="group flex items-center gap-1">
                        <StatusBadge status={s.status} />
                        <ChevronDown className="size-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                  }
                </td>

                {/* Publish Date — inline edit */}
                <td className="px-3 py-2 whitespace-nowrap" onClick={e => startEdit(e, s.id, 'publishDate')}>
                  {isEditing(s.id, 'publishDate')
                    ? <InlineDateInput
                        value={s.publishDate}
                        onSave={v => saveField(s.id, 'publishDate', v)}
                        onCancel={() => setEditing(null)}
                      />
                    : <span className={`text-sm group flex items-center gap-1 ${s.publishDate ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                        {s.publishDate ? fmtDate(s.publishDate) : 'No date'}
                        <ChevronDown className="size-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                  }
                </td>

                {/* One column per asset */}
                {ASSETS.map(({ field }) => {
                  const url = s[field] as string
                  return (
                    <td key={field} className="px-3 py-2">
                      {url
                        ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-0.5">Open<ExternalLink className="size-2.5" /></a>
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Sector Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Sector" size="lg">
        <form onSubmit={handleAddSector} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`${row} col-span-2`}><label className={lbl}>Sector Name *</label>
              <input className={finp} value={newSector.name ?? ''} onChange={e => setNewSector(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className={row}><label className={lbl}>Status</label>
              <select className={finp} value={newSector.status} onChange={e => setNewSector(f => ({...f, status: e.target.value as SectorStatus}))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={row}><label className={lbl}>Publish Date</label>
              <input type="date" className={finp} value={newSector.publishDate ?? ''} onChange={e => setNewSector(f => ({...f, publishDate: e.target.value}))} />
            </div>
            <div className={`${row} col-span-2`}><label className={lbl}>Notes</label>
              <textarea className={finp} rows={2} value={newSector.notes ?? ''} onChange={e => setNewSector(f => ({...f, notes: e.target.value}))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Sector</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function SectorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading sectors…</div>}>
      <SectorsPageContent />
    </Suspense>
  )
}

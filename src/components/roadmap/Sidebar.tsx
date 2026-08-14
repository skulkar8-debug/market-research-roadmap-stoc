'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSaveStatus, type SaveStatus } from '@/lib/store'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Settings,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  HardDrive,
} from 'lucide-react'

const SAVE_BADGE: Record<SaveStatus, { icon: React.ElementType; label: string; cls: string }> = {
  saved:  { icon: CheckCircle2, label: 'Saved to repo',    cls: 'text-green-600'  },
  saving: { icon: RefreshCw,    label: 'Saving…',          cls: 'text-indigo-500' },
  error:  { icon: AlertCircle,  label: 'Save failed',      cls: 'text-red-500'    },
  local:  { icon: HardDrive,    label: 'Local edits only', cls: 'text-gray-400'   },
}

const NAV = [
  { href: '/roadmap',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap/sectors',  label: 'Sectors',   icon: Building2       },
  { href: '/roadmap/calendar', label: 'Calendar',  icon: CalendarDays    },
  { href: '/roadmap/settings', label: 'Settings',  icon: Settings        },
]

export function Sidebar() {
  const pathname = usePathname()
  const saveStatus = useSaveStatus()
  const badge = SAVE_BADGE[saveStatus]
  const BadgeIcon = badge.icon

  const isActive = (href: string) => {
    if (href === '/roadmap') return pathname === '/roadmap'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.stocadvisory.com/stoc-main-logo-cropped.png"
          alt="STOC Advisory"
          className="h-9 w-auto"
        />
        <div className="text-[10px] text-gray-400 tracking-wide mt-1.5">Market Research Roadmap</div>
      </div>

      <nav className="flex-1 px-2 pb-4 space-y-0.5 pt-2">
        {NAV.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className={cn('flex items-center gap-1.5 text-[11px] font-medium', badge.cls)}>
          <BadgeIcon className={cn('size-3.5', saveStatus === 'saving' && 'animate-spin')} />
          {badge.label}
        </div>
      </div>
    </aside>
  )
}

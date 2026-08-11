'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Settings,
} from 'lucide-react'

const NAV = [
  { href: '/roadmap',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap/sectors',  label: 'Sectors',   icon: Building2       },
  { href: '/roadmap/calendar', label: 'Calendar',  icon: CalendarDays    },
  { href: '/roadmap/settings', label: 'Settings',  icon: Settings        },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/roadmap') return pathname === '/roadmap'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 pt-5 pb-3">
        <div className="text-[15px] font-bold text-indigo-600">Market Research Roadmap</div>
        <div className="text-[11px] text-gray-400 mt-0.5">STOC Advisory · Internal</div>
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
    </aside>
  )
}

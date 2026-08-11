import { Sidebar } from '@/components/roadmap/Sidebar'

export const metadata = {
  title: 'STOC | Market Research Roadmap',
  description: 'One view of the market research publishing pipeline across sectors',
}

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

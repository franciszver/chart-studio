'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  ChartBar, 
  Database, 
  SquaresFour,
} from 'phosphor-react'

const navigation = [
  { name: 'Dashboards', href: '/dashboards', icon: ChartBar },
  { name: 'Data Explorer', href: '/explorer', icon: Database },
  { name: 'Templates', href: '/templates', icon: SquaresFour },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

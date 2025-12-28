'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChartBar, SquaresFour, File } from 'phosphor-react'
import { cn } from '@/lib/utils'
import ProfileDropdown from './profile-dropdown'

const navigation = [
  { name: 'Dashboards', href: '/dashboards', icon: ChartBar },
  { name: 'Data Explorer', href: '/explorer', icon: SquaresFour },
  { name: 'Templates', href: '/templates', icon: File },
]

export default function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-background border-b border-border">
      <div className="px-6">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboards" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
              <h1 className="text-xl font-semibold text-foreground">
                Leap Dashboard Studio
              </h1>
            </Link>
            
            <div className="flex items-center space-x-6">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-4 text-sm font-medium transition-colors border-b-2 border-transparent',
                      isActive
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <Icon size={18} className="mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  )
}

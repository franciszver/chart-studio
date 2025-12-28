'use client'

import Image from 'next/image'
import ProfileDropdown from './profile-dropdown'

export default function Header() {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
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
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}

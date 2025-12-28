'use client'

import { useState, useEffect } from 'react'
import TopNav from './top-nav'

interface AppLayoutProps {
  children: React.ReactNode
}

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Loading spinner overlay */}
      {isLoading && <LoadingSpinner />}

      {/* Main content with fade-in transition */}
      <div
        className={`h-screen flex flex-col transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </>
  )
}

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface LoadingContextType {
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({ isLoading: true })

export function useLoading() {
  return useContext(LoadingContext)
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const pathname = usePathname()

  // Initial page load - 2 second delay
  useEffect(() => {
    if (!hasInitialLoad) {
      const timer = setTimeout(() => {
        setIsLoading(false)
        setHasInitialLoad(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasInitialLoad])

  // Navigation between pages - 2 second delay
  useEffect(() => {
    if (hasInitialLoad) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [pathname, hasInitialLoad])

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="spinner"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50"
          >
            <LoadingSpinner />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </LoadingContext.Provider>
  )
}

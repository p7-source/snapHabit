"use client"

import { useEffect } from 'react'

/**
 * Global error handler component to suppress harmless browser extension errors
 * These errors are typically from React DevTools, Redux DevTools, ad blockers, etc.
 */
export default function ErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Handle unhandled promise rejections from browser extensions
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason || '')
      const isExtensionError = 
        errorMessage.includes('Could not establish connection') ||
        errorMessage.includes('Receiving end does not exist') ||
        errorMessage.includes('Extension context invalidated') ||
        errorMessage.includes('message port closed')
      
      if (isExtensionError) {
        event.preventDefault() // Suppress the error
        // Silently ignore - these are harmless browser extension errors
        return
      }
    }

    // Handle uncaught errors from browser extensions
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || String(event.error || '')
      const isExtensionError = 
        errorMessage.includes('Could not establish connection') ||
        errorMessage.includes('Receiving end does not exist') ||
        errorMessage.includes('Extension context invalidated')
      
      if (isExtensionError) {
        event.preventDefault() // Suppress the error
        // Silently ignore - these are harmless browser extension errors
        return
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null
}


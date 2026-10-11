'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

export function LandingHeader({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollYRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const hiddenRef = useRef(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    lastScrollYRef.current = Math.max(window.scrollY, 0)

    const updateVisibility = () => {
      frameRef.current = null

      const currentScrollY = Math.max(window.scrollY, 0)
      const scrollDelta = currentScrollY - lastScrollYRef.current
      lastScrollYRef.current = currentScrollY

      if (headerRef.current?.matches(':focus-within')) return

      const nextHidden =
        currentScrollY >= 120 && scrollDelta > 4
          ? true
          : currentScrollY < 16 || scrollDelta < -4
            ? false
            : hiddenRef.current

      if (nextHidden === hiddenRef.current) return

      hiddenRef.current = nextHidden
      setHidden(nextHidden)
    }

    const handleScroll = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(updateVisibility)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <header
      ref={headerRef}
      onFocusCapture={() => {
        if (!hiddenRef.current) return
        hiddenRef.current = false
        setHidden(false)
      }}
      className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4"
    >
      <div
        className={`mx-auto flex min-h-[60px] max-w-[1180px] items-center justify-between gap-4 rounded-2xl border border-white/80 bg-[#f7f6f3]/85 px-3 shadow-[0_12px_30px_rgba(36,35,31,0.08)] backdrop-blur-xl transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:min-h-[64px] sm:rounded-full sm:px-5 ${hidden ? '-translate-y-[calc(100%+1rem)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        {children}
      </div>
    </header>
  )
}

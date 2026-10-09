'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches

    if (reducedMotion || coarsePointer) return

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
    })

    const frame = (time: number) => {
      lenis.raf(time)
      frameRef.current = window.requestAnimationFrame(frame)
    }

    frameRef.current = window.requestAnimationFrame(frame)

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      lenis.destroy()
    }
  }, [])

  return children
}

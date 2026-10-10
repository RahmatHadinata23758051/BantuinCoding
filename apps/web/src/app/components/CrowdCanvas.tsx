'use client'

import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

type SpriteRect = [number, number, number, number]

type Stage = {
  width: number
  height: number
}

type WalkProps = {
  startX: number
  startY: number
  endX: number
}

type Peep = {
  image: HTMLImageElement
  sourceRect: SpriteRect
  width: number
  height: number
  x: number
  y: number
  anchorY: number
  scaleX: number
  walk: gsap.core.Timeline | null
  setScale: (scale: number) => void
  render: (context: CanvasRenderingContext2D) => void
}

type WalkFactory = (peep: Peep, props: WalkProps) => gsap.core.Timeline

const DEFAULT_SPRITE = '/crowd-sprite.png'
const MAX_ACTIVE_PEEPS = 14
const MOBILE_MAX_ACTIVE_PEEPS = 7

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function takeRandom<T>(items: T[]) {
  if (items.length === 0) return undefined
  return items.splice((Math.random() * items.length) | 0, 1)[0]
}

function getRandom<T>(items: T[]) {
  if (items.length === 0) return undefined
  return items[(Math.random() * items.length) | 0]
}

function getSpriteScale(stageWidth: number) {
  return Math.min(0.82, Math.max(0.42, stageWidth / 1500))
}

export function CrowdCanvas({
  className,
  src = DEFAULT_SPRITE,
  rows = 15,
  cols = 7,
}: {
  className?: string
  src?: string
  rows?: number
  cols?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || rows < 1 || cols < 1) return

    let active = true
    let imageReady = false
    let animationStarted = false
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stage: Stage = { width: 0, height: 0 }
    const allPeeps: Peep[] = []
    const availablePeeps: Peep[] = []
    const crowd: Peep[] = []
    const timelines = new Set<gsap.core.Timeline>()

    const image = new Image()
    image.decoding = 'async'

    const render = () => {
      if (!active || !canvas) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.save()
      context.scale(ratio, ratio)
      crowd.forEach((peep) => peep.render(context))
      context.restore()
    }

    const killAnimations = () => {
      timelines.forEach((timeline) => timeline.kill())
      timelines.clear()
      crowd.forEach((peep) => {
        peep.walk?.kill()
        peep.walk = null
      })
    }

    const resetPool = () => {
      killAnimations()
      crowd.length = 0
      availablePeeps.length = 0
      availablePeeps.push(...allPeeps)
    }

    const resetPeep = (peep: Peep): WalkProps => {
      const direction = Math.random() > 0.5 ? 1 : -1
      const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random())
      const startY = stage.height - peep.height + offsetY
      const startX = direction === 1 ? -peep.width : stage.width + peep.width
      const endX = direction === 1 ? stage.width : -peep.width

      peep.scaleX = direction
      peep.x = startX
      peep.y = startY
      peep.anchorY = startY

      return { startX, startY, endX }
    }

    const normalWalk: WalkFactory = (peep, props) => {
      const xDuration = randomRange(8, 13)
      const yDuration = 0.25
      const timeline = gsap.timeline({ timeScale: randomRange(0.7, 1.25) })

      timeline.to(peep, { duration: xDuration, x: props.endX, ease: 'none' }, 0)
      timeline.to(peep, {
        duration: yDuration,
        repeat: Math.ceil(xDuration / yDuration),
        yoyo: true,
        y: props.startY - 10,
        ease: 'sine.inOut',
      }, 0)

      return timeline
    }

    const addPeepToCrowd = () => {
      const peep = takeRandom(availablePeeps)
      const walkFactory = getRandom([normalWalk])
      if (!peep || !walkFactory) return

      const walk = walkFactory(peep, resetPeep(peep))
      peep.walk = walk
      crowd.push(peep)
      crowd.sort((first, second) => first.anchorY - second.anchorY)
      timelines.add(walk)
      walk.eventCallback('onComplete', () => {
        timelines.delete(walk)
        if (!active) return
        const index = crowd.indexOf(peep)
        if (index >= 0) crowd.splice(index, 1)
        availablePeeps.push(peep)
        addPeepToCrowd()
      })
    }

    const initCrowd = () => {
      const maxActive = stage.width < 640 ? MOBILE_MAX_ACTIVE_PEEPS : MAX_ACTIVE_PEEPS
      while (availablePeeps.length > 0 && crowd.length < maxActive) {
        addPeepToCrowd()
        const peep = crowd[crowd.length - 1]
        peep?.walk?.progress(Math.random())
      }
    }

    const initStaticCrowd = () => {
      const staticPeeps = allPeeps.slice(0, stage.width < 640 ? 3 : 5)
      staticPeeps.forEach((peep, index) => {
        peep.scaleX = index % 2 === 0 ? 1 : -1
        peep.x = stage.width * ((index + 1) / (staticPeeps.length + 1)) - (peep.scaleX < 0 ? peep.width : 0)
        peep.y = stage.height - peep.height + (index % 2) * 8
        peep.anchorY = peep.y
      })
      crowd.push(...staticPeeps)
      crowd.sort((first, second) => first.anchorY - second.anchorY)
    }

    const resize = () => {
      if (!canvas || !imageReady) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      stage.width = canvas.clientWidth
      stage.height = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(stage.width * ratio))
      canvas.height = Math.max(1, Math.round(stage.height * ratio))

      const scale = getSpriteScale(stage.width)
      allPeeps.forEach((peep) => peep.setScale(scale))
      resetPool()

      if (mediaQuery.matches) {
        initStaticCrowd()
      } else {
        initCrowd()
      }
      render()
    }

    const createPeeps = () => {
      const rectWidth = image.naturalWidth / rows
      const rectHeight = image.naturalHeight / cols
      const total = rows * cols

      for (let index = 0; index < total; index += 1) {
        const sourceRect: SpriteRect = [
          (index % rows) * rectWidth,
          Math.floor(index / rows) * rectHeight,
          rectWidth,
          rectHeight,
        ]
        const peep: Peep = {
          image,
          sourceRect,
          width: rectWidth,
          height: rectHeight,
          x: 0,
          y: 0,
          anchorY: 0,
          scaleX: 1,
          walk: null,
          setScale: (scale) => {
            peep.width = sourceRect[2] * scale
            peep.height = sourceRect[3] * scale
          },
          render: (drawContext) => {
            drawContext.save()
            drawContext.translate(peep.x, peep.y)
            drawContext.scale(peep.scaleX, 1)
            drawContext.drawImage(
              peep.image,
              peep.sourceRect[0],
              peep.sourceRect[1],
              peep.sourceRect[2],
              peep.sourceRect[3],
              0,
              0,
              peep.width,
              peep.height,
            )
            drawContext.restore()
          },
        }
        allPeeps.push(peep)
      }
    }

    const handleImageLoad = () => {
      if (!active || image.naturalWidth === 0 || image.naturalHeight === 0) return
      imageReady = true
      createPeeps()
      resize()
      if (!mediaQuery.matches && !animationStarted) {
        animationStarted = true
        gsap.ticker.add(render)
      }
    }

    const handleResize = () => resize()

    image.addEventListener('load', handleImageLoad)
    image.src = src
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas)

    return () => {
      active = false
      image.removeEventListener('load', handleImageLoad)
      resizeObserver?.disconnect()
      gsap.ticker.remove(render)
      killAnimations()
    }
  }, [cols, rows, src])

  return (
    <div className={`pointer-events-none h-full w-full ${className ?? ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

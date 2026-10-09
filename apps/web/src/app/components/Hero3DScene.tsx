'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export interface HeroPrompt {
  label: string
  accent: string
}

interface Hero3DSceneProps {
  ariaLabel: string
  statusLabel: string
  packMeta: string
  promptLabel: string
  prompts: HeroPrompt[]
  note: string
}

const paperColors = ['#fffdfa', '#f5eee5', '#f4a261', '#e9eee6']

function StaticPack({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className="relative flex h-full min-h-[360px] items-center justify-center overflow-hidden bg-[#25241f]" role="img" aria-label={ariaLabel}>
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="relative h-52 w-64 [perspective:900px] sm:h-64 sm:w-80">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="absolute inset-x-6 top-7 flex h-36 flex-col justify-between border border-[#24231f]/20 p-4 shadow-[12px_12px_0_rgba(0,0,0,.18)] transition-transform duration-700 sm:inset-x-8 sm:h-44 sm:p-5"
            style={{
              background: paperColors[index],
              transform: `translate3d(${index * 11 - 18}px, ${index * -10 + 20}px, ${index * 8}px) rotate(${index % 2 ? 2 : -3}deg)`,
              zIndex: index,
            }}
          >
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.15em] text-[#24231f]/65">
              <span>{['PRD', 'ARCH', 'RULES', 'BACKLOG'][index]}</span>
              <span>0{index + 1}</span>
            </div>
            <div className="space-y-2">
              <span className="block h-2 w-3/4 bg-[#24231f]/70" />
              <span className="block h-2 w-1/2 bg-[#24231f]/30" />
              <span className="block h-2 w-2/3 bg-[#24231f]/20" />
            </div>
          </div>
        ))}
        <span className="absolute -bottom-2 right-0 z-10 border border-[#f4a261] bg-[#f4a261] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#25241f] shadow-[5px_5px_0_#0d0d0c]">READY</span>
      </div>
    </div>
  )
}

export function Hero3DScene({ ariaLabel, statusLabel, packMeta, promptLabel, prompts, note }: Hero3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const [supported, setSupported] = useState(false)
  const [activePrompt, setActivePrompt] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const mount = mountRef.current
    if (!canvas || !mount) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower = (navigator.hardwareConcurrency || 4) <= 2 || Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)
    const mobile = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches
    if (reducedMotion || lowPower || mobile) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    camera.position.set(0, 0.1, 7.6)
    camera.lookAt(0, 0, 0)

    const root = new THREE.Group()
    scene.add(root)
    const ambient = new THREE.AmbientLight('#fff4df', 2.4)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight('#f4a261', 4.5)
    keyLight.position.set(-3, 4, 6)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight('#b9d7ff', 3, 12)
    rimLight.position.set(3, -2, 4)
    scene.add(rimLight)

    const sheets: THREE.Mesh[] = []
    const geometry = new THREE.BoxGeometry(2.65, 1.65, 0.12)
    const accent = new THREE.Color('#f4a261')

    for (let index = 0; index < 4; index += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: paperColors[index],
        roughness: 0.75,
        metalness: 0.02,
      })
      const sheet = new THREE.Mesh(geometry, material)
      sheet.position.set(index * 0.08 - 0.18, index * 0.12 - 0.05, index * 0.12)
      sheet.rotation.z = (index % 2 ? 1 : -1) * 0.035
      root.add(sheet)
      sheets.push(sheet)

      const lineGeometry = new THREE.BoxGeometry(1.6 - index * 0.12, 0.035, 0.02)
      const lineMaterial = new THREE.MeshBasicMaterial({ color: index === 2 ? accent : '#24231f', transparent: true, opacity: index === 2 ? 0.95 : 0.48 })
      const line = new THREE.Mesh(lineGeometry, lineMaterial)
      line.position.set(-0.22 + index * 0.06, -0.25 + index * 0.08, 0.08 + index * 0.12)
      line.rotation.z = sheet.rotation.z
      root.add(line)
    }

    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(36 * 3)
    for (let index = 0; index < 36; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 6.2
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 4.2
      particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 2
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#f4a261', size: 0.025, transparent: true, opacity: 0.7 }))
    scene.add(particles)

    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = mount.getBoundingClientRect()
      target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.8
      target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -0.55
    }
    const handlePointerLeave = () => { target.x = 0; target.y = 0 }
    mount.addEventListener('pointermove', handlePointerMove)
    mount.addEventListener('pointerleave', handlePointerLeave)

    let frame = 0
    let visible = true
    let lastFrame = 0
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.05 })
    observer.observe(mount)

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const render = (timestamp: number) => {
      frame = window.requestAnimationFrame(render)
      if (!visible || timestamp - lastFrame < 33) return
      lastFrame = timestamp
      pointer.x += (target.x - pointer.x) * 0.05
      pointer.y += (target.y - pointer.y) * 0.05
      root.rotation.y = pointer.x * 0.28
      root.rotation.x = pointer.y * 0.18
      root.position.y = Math.sin(timestamp / 1700) * 0.08
      particles.rotation.y = timestamp / 16000
      sheets.forEach((sheet, index) => { sheet.rotation.y = pointer.x * (0.05 + index * 0.01) })
      renderer.render(scene, camera)
    }

    resize()
    window.addEventListener('resize', resize)
    window.requestAnimationFrame(() => setSupported(true))
    frame = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      mount.removeEventListener('pointermove', handlePointerMove)
      mount.removeEventListener('pointerleave', handlePointerLeave)
      geometry.dispose()
      particleGeometry.dispose()
      particles.material.dispose()
      root.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry !== geometry) object.geometry.dispose()
        if (object instanceof THREE.Mesh && Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        if (object instanceof THREE.Mesh && !Array.isArray(object.material)) object.material.dispose()
      })
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={mountRef} className="relative min-h-[430px] overflow-hidden border border-[#3e3c35] bg-[#25241f] shadow-[14px_14px_0_#f4a261] sm:min-h-[500px]">
      <div className="absolute left-5 right-5 top-4 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 sm:left-7 sm:right-7">
        <span>{statusLabel}</span>
        <span className="text-[#f4a261]">{packMeta}</span>
      </div>
      <div className="absolute bottom-5 left-5 z-10 max-w-[230px] sm:bottom-7 sm:left-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/45">{note}</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={promptLabel}>
          {prompts.map((prompt, index) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => setActivePrompt(index)}
              className={`border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] ${activePrompt === index ? 'border-[#f4a261] bg-[#f4a261] text-[#25241f]' : 'border-white/25 text-white/65 hover:border-white/60 hover:text-white'}`}
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${supported ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
      {!supported && <StaticPack ariaLabel={ariaLabel} />}
      <p className="sr-only" aria-live="polite">{prompts[activePrompt]?.label}</p>
    </div>
  )
}

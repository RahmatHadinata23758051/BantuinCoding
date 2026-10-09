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

const artifactRows = ['PRD.md', 'SRS.md', 'ARCHITECTURE.md', 'AGENT.md', 'RULES.md', 'SKILLS/', 'BACKLOG.md']

function StaticPack({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className="relative flex h-full min-h-[360px] items-center justify-center overflow-hidden bg-[#25241f] p-5" role="img" aria-label={ariaLabel}>
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="relative w-full max-w-[460px] border border-white/20 bg-[#171714] p-3 shadow-[8px_8px_0_rgba(0,0,0,.24)] sm:p-4">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-3">
          <span className="size-2 rounded-full bg-[#e27d60]" />
          <span className="size-2 rounded-full bg-[#f4a261]" />
          <span className="size-2 rounded-full bg-[#b8d8bd]" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">bootstrap-pack / validated</span>
        </div>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-[1.15fr_.85fr]">
          <div className="border border-white/10 bg-[#22221e] p-3">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-white/45"><span>artifact tree</span><span className="text-[#f4a261]">06 files</span></div>
            <div className="mt-3 space-y-1.5">
              {artifactRows.map((row, index) => <div key={row} className="flex items-center justify-between gap-2 border-b border-white/7 pb-1.5 font-mono text-[10px] text-white/70"><span>{row}</span><span className={index === 0 ? 'text-[#f4a261]' : 'text-white/25'}>{index === 0 ? '01' : '—'}</span></div>)}
            </div>
          </div>
          <div className="grid gap-1.5">
            <div className="border border-white/10 bg-[#22221e] p-3"><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#b9d7ff]">context.json</span><div className="mt-4 space-y-2"><span className="block h-1.5 w-4/5 bg-white/45" /><span className="block h-1.5 w-3/5 bg-white/20" /><span className="block h-1.5 w-2/3 bg-[#f4a261]/80" /></div></div>
            <div className="border border-[#f4a261]/45 bg-[#f4a261]/10 p-3"><div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4a261]"><span>handoff</span><span>ready</span></div><div className="mt-4 h-1.5 w-3/4 bg-[#f4a261]/65" /></div>
          </div>
        </div>
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
    const ambient = new THREE.AmbientLight('#fff4df', 1.6)
    scene.add(ambient)
    const keyLight = new THREE.DirectionalLight('#f4a261', 2.8)
    keyLight.position.set(-3, 4, 6)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight('#b9d7ff', 2.2, 12)
    rimLight.position.set(3, -2, 4)
    scene.add(rimLight)

    const sheets: THREE.Mesh[] = []
    const sheetGeometry = new THREE.BoxGeometry(3.9, 2.45, 0.08)
    const windowMaterial = new THREE.MeshStandardMaterial({ color: '#171714', roughness: 0.9, metalness: 0.02 })
    const workbench = new THREE.Mesh(sheetGeometry, windowMaterial)
    root.add(workbench)

    const frameGeometry = new THREE.BoxGeometry(4.08, 2.64, 0.04)
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#4a4941', roughness: 0.75, metalness: 0.15 })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.z = -0.08
    root.add(frame)

    const rowGeometry = new THREE.BoxGeometry(2.65, 0.1, 0.035)
    const rowMaterial = new THREE.MeshBasicMaterial({ color: '#f7f6f3', transparent: true, opacity: 0.32 })
    const rowMeshes: THREE.Mesh[] = []
    const accent = new THREE.Color('#f4a261')
    artifactRows.forEach((_, index) => {
      const row = new THREE.Mesh(rowGeometry, index === 0 ? new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }) : rowMaterial)
      row.position.set(-0.25, 0.65 - index * 0.18, 0.08)
      row.scale.x = index === 0 ? 1 : 0.78 - index * 0.04
      root.add(row)
      rowMeshes.push(row)
    })

    const paneGeometry = new THREE.BoxGeometry(1.15, 1.38, 0.045)
    const paneMaterial = new THREE.MeshStandardMaterial({ color: '#242a30', roughness: 0.85, metalness: 0.1 })
    const pane = new THREE.Mesh(paneGeometry, paneMaterial)
    pane.position.set(1.15, -0.33, 0.07)
    root.add(pane)
    const paneAccent = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.07, 0.03), new THREE.MeshBasicMaterial({ color: '#b9d7ff', transparent: true, opacity: 0.75 }))
    paneAccent.position.set(1.05, -0.05, 0.11)
    root.add(paneAccent)
    const statusPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.46, 0.05), new THREE.MeshStandardMaterial({ color: '#423126', roughness: 0.86 }))
    statusPanel.position.set(-1.15, -0.8, 0.07)
    root.add(statusPanel)
    const statusLine = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.07, 0.03), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.88 }))
    statusLine.position.set(-1.3, -0.8, 0.11)
    root.add(statusLine)

    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(24 * 3)
    for (let index = 0; index < 24; index += 1) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 6.2
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 4.2
      particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 2
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#f4a261', size: 0.02, transparent: true, opacity: 0.46 }))
    scene.add(particles)
    sheets.push(workbench, frame, pane, statusPanel)

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

    let animationFrame = 0
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
      animationFrame = window.requestAnimationFrame(render)
      if (!visible || timestamp - lastFrame < 33) return
      lastFrame = timestamp
      pointer.x += (target.x - pointer.x) * 0.05
      pointer.y += (target.y - pointer.y) * 0.05
      root.rotation.y = pointer.x * 0.28
      root.rotation.x = pointer.y * 0.18
      root.position.y = Math.sin(timestamp / 1700) * 0.08
      particles.rotation.y = timestamp / 16000
      sheets.forEach((sheet, index) => { sheet.rotation.y = pointer.x * (0.05 + index * 0.01) })
      rowMeshes.forEach((row, index) => { row.position.x = -0.25 + Math.sin(timestamp / 1900 + index) * 0.025 })
      renderer.render(scene, camera)
    }

    resize()
    window.addEventListener('resize', resize)
    window.requestAnimationFrame(() => setSupported(true))
    animationFrame = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      mount.removeEventListener('pointermove', handlePointerMove)
      mount.removeEventListener('pointerleave', handlePointerLeave)
      sheetGeometry.dispose()
      frameGeometry.dispose()
      rowGeometry.dispose()
      paneGeometry.dispose()
      particleGeometry.dispose()
      particles.material.dispose()
      root.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry !== sheetGeometry && object.geometry !== frameGeometry && object.geometry !== rowGeometry && object.geometry !== paneGeometry) object.geometry.dispose()
        if (object instanceof THREE.Mesh && Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        if (object instanceof THREE.Mesh && !Array.isArray(object.material)) object.material.dispose()
      })
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={mountRef} className="relative min-h-[430px] overflow-hidden border border-[#3e3c35] bg-[#25241f] shadow-[8px_8px_0_rgba(36,35,31,.18)] sm:min-h-[500px]">
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

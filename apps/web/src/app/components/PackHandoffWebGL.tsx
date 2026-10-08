'use client'

import { useEffect, useRef, useState } from 'react'

interface PackHandoffWebGLProps {
  className?: string
}

const vertexShaderSource = `
  attribute vec2 a_position;
  uniform float u_time;
  uniform float u_index;
  varying float v_index;
  varying vec2 v_local;
  void main() {
    float drift = sin(u_time * 0.8 + u_index * 1.7) * 0.035;
    float travel = mod(u_time * 0.11 + u_index * 0.19, 1.0);
    float x = mix(-0.72, 0.58, travel) + drift;
    float y = (u_index - 1.0) * 0.16 + cos(u_time * 0.65 + u_index) * 0.015;
    vec2 scale = vec2(0.22, 0.12);
    gl_Position = vec4(x + a_position.x * scale.x, y + a_position.y * scale.y, 0.0, 1.0);
    v_index = u_index;
    v_local = a_position;
  }
`

const fragmentShaderSource = `
  precision mediump float;
  varying float v_index;
  varying vec2 v_local;
  void main() {
    vec3 ink = vec3(0.07, 0.08, 0.08);
    vec3 paper = vec3(0.94, 0.88, 0.69);
    vec3 accent = vec3(0.25, 0.49, 0.82);
    float edge = step(0.88, max(abs(v_local.x), abs(v_local.y)));
    vec3 color = mix(paper, accent, step(1.5, v_index));
    gl_FragColor = vec4(mix(color, ink, edge * 0.65), 1.0);
  }
`

function StaticFallback() {
  return (
    <div className="pack-webgl__fallback" role="img" aria-label="Specification documents move into a coding agent">
      <span className="pack-webgl__fallback-stack" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="pack-webgl__fallback-arrow" aria-hidden="true">→</span>
      <span className="pack-webgl__fallback-node" aria-hidden="true">AGENT</span>
    </div>
  )
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function PackHandoffWebGL({ className }: PackHandoffWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobileViewport = window.matchMedia('(max-width: 640px), (pointer: coarse)').matches
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const lowPower = (navigator.hardwareConcurrency || 4) <= 2 || Boolean(connection?.saveData)
    if (reducedMotion || mobileViewport || lowPower) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: true })
    if (!gl) return
    setSupported(true)

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return
    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    const buffer = gl.createBuffer()
    if (!buffer) {
      gl.deleteProgram(program)
      return
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    const time = gl.getUniformLocation(program, 'u_time')
    const index = gl.getUniformLocation(program, 'u_index')
    let frame = 0
    let running = true
    let lastFrame = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio))
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const render = (timestamp: number) => {
      if (!running) return
      frame = window.requestAnimationFrame(render)
      if (timestamp - lastFrame < 50) return
      lastFrame = timestamp
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      for (let documentIndex = 0; documentIndex < 3; documentIndex += 1) {
        gl.uniform1f(time, timestamp / 1000)
        gl.uniform1f(index, documentIndex)
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
      }
    }
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      running = false
      window.cancelAnimationFrame(frame)
      setSupported(false)
    }
    const handleContextRestored = () => setSupported(false)

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)
    frame = window.requestAnimationFrame(render)

    return () => {
      running = false
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    }
  }, [])

  return (
    <div className={`pack-webgl${className ? ` ${className}` : ''}`}>
      <canvas ref={canvasRef} className="pack-webgl__canvas" aria-hidden="true" />
      {!supported && <StaticFallback />}
      <p className="pack-webgl__description">
        Specification documents move from the generated pack toward a coding-agent node, ready for the next build step.
      </p>
      <style>{`
        .pack-webgl { position: relative; min-height: 8rem; overflow: hidden; border: 1px solid rgba(0,0,0,.12); background: var(--workspace-paper, #f6f5f4); }
        .pack-webgl__canvas { display: block; width: 100%; height: 8rem; }
        .pack-webgl__fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 1rem; color: var(--workspace-ink, #151515); }
        .pack-webgl__fallback-stack { display: grid; width: 5rem; gap: .2rem; }
        .pack-webgl__fallback-stack i { display: block; height: 1.1rem; border: 1px solid currentColor; background: var(--workspace-blue-soft, #dfe8f5); transform: translateX(var(--offset, 0)); }
        .pack-webgl__fallback-stack i:nth-child(2) { --offset: .3rem; }
        .pack-webgl__fallback-stack i:nth-child(3) { --offset: .6rem; }
        .pack-webgl__fallback-arrow { font: 700 1.4rem/1 var(--font-geist-mono, monospace); }
        .pack-webgl__fallback-node { border: 1px solid currentColor; padding: .55rem .7rem; font: 700 .65rem/1 var(--font-geist-mono, monospace); }
        .pack-webgl__description { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        @media (max-width: 640px) { .pack-webgl { min-height: 6rem; } .pack-webgl__canvas { height: 6rem; } }
      `}</style>
    </div>
  )
}

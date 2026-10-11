'use client'

import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

// Adapted from React Bits Aurora by David Haz.
// React Bits license: MIT + Commons Clause. Commercial use is permitted when
// the copyright and permission notices are retained; standalone resale or
// redistribution of the component itself is not permitted.
// Source: https://reactbits.dev/backgrounds/aurora

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uAmplitude;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 left = uColorStops[0];
  vec3 middle = uColorStops[1];
  vec3 right = uColorStops[2];
  vec3 ramp = uv.x < 0.5
    ? mix(left, middle, uv.x * 2.0)
    : mix(middle, right, (uv.x - 0.5) * 2.0);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = uv.y * 2.0 - height + 0.2;
  float intensity = 0.6 * height;
  float alpha = smoothstep(0.2 - uBlend * 0.5, 0.2 + uBlend * 0.5, intensity);
  fragColor = vec4(intensity * ramp * alpha, alpha);
}
`

export interface AuthVisualLabels {
  ariaLabel: string
  eyebrow: string
  title: string
  copy: string
  idea: string
  context: string
  agent: string
}

function Aurora() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const container = containerRef.current
    if (!container) return

    let renderer: Renderer
    try {
      renderer = new Renderer({ alpha: true, antialias: true, premultipliedAlpha: true })
    } catch {
      return
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.setAttribute('aria-hidden', 'true')

    const geometry = new Triangle(gl)
    const colors = ['#5b3025', '#a85e3c', '#f4a261'].map((hex) => {
      const color = new Color(hex)
      return [color.r, color.g, color.b]
    })
    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 1.15 },
        uColorStops: { value: colors },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] },
        uBlend: { value: 0.55 },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const width = container.offsetWidth
      const height = container.offsetHeight
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [width, height]
    }

    const update = (time: number) => {
      program.uniforms.uTime.value = time * 0.0001
      renderer.render({ scene: mesh })
      frameId = window.requestAnimationFrame(update)
    }

    let frameId = window.requestAnimationFrame(update)
    window.addEventListener('resize', resize)
    container.appendChild(gl.canvas)
    resize()

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [reducedMotion])

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />
}

export function AuthVisualPanel({ labels }: { labels: AuthVisualLabels }) {
  const reducedMotion = useReducedMotion()
  const floatTransition = reducedMotion
    ? undefined
    : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <section
      aria-label={labels.ariaLabel}
      className="relative h-[168px] overflow-hidden rounded-[24px] border border-[#3e3b33] bg-[#24231f] text-[#f7f6f3] shadow-[0_18px_45px_rgba(36,35,31,0.18)] lg:h-full lg:min-h-0"
    >
      <Aurora />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,162,97,0.2),transparent_40%),linear-gradient(135deg,rgba(17,18,15,0.82),rgba(36,35,31,0.24))]" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between p-5 sm:p-6 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="max-w-[16rem] text-xl font-semibold leading-tight tracking-[-0.05em] text-[#fffdfa] sm:text-2xl lg:max-w-sm lg:text-4xl">{labels.title}</h2>
          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/20 bg-[#11120f]/70 text-lg font-bold tracking-[-0.08em] text-[#fffdfa] shadow-[3px_3px_0_#a85e3c]" aria-hidden="true">b</div>
        </div>

        <div className="relative mx-auto hidden size-[18rem] place-items-center lg:grid" aria-hidden="true">
          <div className="absolute inset-8 rounded-full border border-[#f4a261]/35" />
          <div className="absolute inset-16 rounded-full border border-[#f4a261]/20" />
          <motion.div
            className="grid size-28 place-items-center rounded-[32px] border border-white/20 bg-[#24231f]/85 text-5xl font-semibold tracking-[-0.1em] text-[#fffdfa] shadow-[10px_10px_0_rgba(168,94,60,0.68)] backdrop-blur-sm"
            animate={reducedMotion ? undefined : { y: [0, -8, 0], rotate: [0, 2, 0] }}
            transition={floatTransition}
          >
            b<span className="font-serif font-normal text-[#f4a261]">.</span>
          </motion.div>
          <motion.span className="absolute left-0 top-10 rounded-full border border-white/15 bg-[#11120f]/85 px-3 py-2 font-mono text-[10px] text-[#f7f6f3]" animate={reducedMotion ? undefined : { y: [0, 7, 0] }} transition={{ ...floatTransition, delay: 0.3 }}>PRD</motion.span>
          <motion.span className="absolute right-0 top-24 rounded-full border border-white/15 bg-[#11120f]/85 px-3 py-2 font-mono text-[10px] text-[#f7f6f3]" animate={reducedMotion ? undefined : { y: [0, -6, 0] }} transition={{ ...floatTransition, delay: 0.8 }}>AGENT</motion.span>
          <motion.span className="absolute bottom-8 left-10 rounded-full border border-white/15 bg-[#11120f]/85 px-3 py-2 font-mono text-[10px] text-[#f7f6f3]" animate={reducedMotion ? undefined : { y: [0, 5, 0] }} transition={{ ...floatTransition, delay: 1.1 }}>RULES</motion.span>
        </div>

        <div className="flex justify-end gap-1.5" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-[#f08c68]" />
          <span className="size-1.5 rounded-full bg-[#efbf6f]" />
          <span className="size-1.5 rounded-full bg-[#9bcda9]" />
        </div>
      </div>
    </section>
  )
}

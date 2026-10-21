'use client';

import { useEffect, useRef } from 'react';
import './living-contour.css';

type Point = readonly [number, number];
type Band = {
  p: readonly [Point, Point, Point, Point];
  count: number;
  gap: number;
  tone: 0 | 1;
  phase: number;
};

type Props = {
  /** Parent container must have position: relative and isolation: isolate. */
  className?: string;
  /** Dims the decorative lines while the user focuses on a text input. */
  quiet?: boolean;
};

const BANDS: readonly Band[] = [
  { p: [[-.19, -.1], [.13, .05], [.13, .25], [.27, .52]], count: 9, gap: 8.8, tone: 0, phase: .1 },
  { p: [[-.25, .48], [.21, .51], [-.07, .73], [.31, 1.17]], count: 11, gap: 9, tone: 1, phase: 1.2 },
  { p: [[1.19, -.1], [.88, .08], [.97, .27], [.73, .55]], count: 9, gap: 9.1, tone: 1, phase: 2.8 },
  { p: [[1.22, .46], [.87, .5], [1.05, .72], [.7, 1.17]], count: 12, gap: 8.5, tone: 0, phase: 3.8 },
];

function cubic(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}
function derivative(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
}

export default function LivingContourBackground({ className = '', quiet = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quietRef = useRef(quiet);

  useEffect(() => { quietRef.current = quiet; }, [quiet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !root || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const narrowViewport = window.matchMedia('(max-width: 768px)');
    const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, strength: 0, active: false };
    let width = 1;
    let height = 1;
    let frame = 0;
    let visible = true;
    let lastPaint = 0;
    const started = performance.now();

    const point = (band: Band, t: number, offset: number, elapsed: number) => {
      const p = band.p;
      const x = cubic(p[0][0], p[1][0], p[2][0], p[3][0], t) * width;
      const y = cubic(p[0][1], p[1][1], p[2][1], p[3][1], t) * height;
      const dx = derivative(p[0][0], p[1][0], p[2][0], p[3][0], t) * width;
      const dy = derivative(p[0][1], p[1][1], p[2][1], p[3][1], t) * height;
      const normal = Math.hypot(dx, dy) || 1;
      const drift = reducedMotion.matches ? 0 : Math.sin(t * 8.5 - elapsed * .36 + band.phase + offset * .022) * 4.5;
      let px = x - dy / normal * (offset + drift);
      let py = y + dx / normal * (offset + drift);
      if (pointer.strength > .001 && !reducedMotion.matches && !coarsePointer.matches) {
        const mx = px - pointer.x;
        const my = py - pointer.y;
        const dist = Math.hypot(mx, my);
        const radius = 225;
        if (dist < radius && dist > .01) {
          const influence = Math.pow(1 - dist / radius, 2) * 25 * pointer.strength;
          px += mx / dist * influence;
          py += my / dist * influence;
        }
      }
      return { x: px, y: py };
    };

    const paint = (now: number) => {
      const elapsed = (now - started) / 1000;
      ctx.clearRect(0, 0, width, height);
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * .06;
      pointer.x += (pointer.targetX - pointer.x) * .075;
      pointer.y += (pointer.targetY - pointer.y) * .075;

      for (const band of BANDS) {
        for (let i = 0; i < band.count; i++) {
          const offset = (i - (band.count - 1) / 2) * band.gap;
          const accent = i === 2 || i === band.count - 3;
          const ivory = i % 4 === 0;
          const alpha = (quietRef.current ? .56 : 1) * (accent ? .32 : ivory ? .69 : .17);
          ctx.strokeStyle = ivory
            ? `rgba(255,255,255,${alpha})`
            : band.tone === 0 ? `rgba(174,92,57,${alpha})` : `rgba(202,138,94,${alpha})`;
          ctx.lineWidth = accent ? 1.25 : ivory ? 1.15 : .86;
          ctx.setLineDash(i === band.count - 1 ? [7, 9] : []);
          ctx.beginPath();
          for (let j = 0; j <= 76; j++) {
            const p = point(band, j / 76, offset, elapsed);
            if (j === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      if (pointer.strength > .001 && !reducedMotion.matches && !coarsePointer.matches) {
        const g = ctx.createRadialGradient(pointer.x, pointer.y, 3, pointer.x, pointer.y, 185);
        g.addColorStop(0, `rgba(181,100,62,${.035 * pointer.strength})`);
        g.addColorStop(1, 'rgba(181,100,62,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 185, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion.matches) {
        const particles = [
          { band: BANDS[0], t: .31, speed: .026, size: 5 },
          { band: BANDS[2], t: .74, speed: -.019, size: 4 },
        ];
        for (let i = 0; i < particles.length; i++) {
          const item = particles[i];
          const p = point(item.band, (item.t + elapsed * item.speed + 1) % 1, i === 0 ? 1 : 7, elapsed);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, item.size * 5);
          glow.addColorStop(0, 'rgba(184,105,66,.23)');
          glow.addColorStop(1, 'rgba(184,105,66,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, item.size * 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(174,92,57,.41)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, item.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      if (document.hidden || !visible || reducedMotion.matches) return;
      const maxFPS = (coarsePointer.matches || narrowViewport.matches) ? 30 : 60;
      if (now - lastPaint >= 1000 / maxFPS - .5) {
        paint(now);
        lastPaint = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const bounds = root.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      resize();
      if (!document.hidden && visible && !reducedMotion.matches) frame = requestAnimationFrame(tick);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const bounds = root.getBoundingClientRect();
      if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) {
        pointer.active = false;
        return;
      }
      pointer.targetX = e.clientX - bounds.left;
      pointer.targetY = e.clientY - bounds.top;
      if (!pointer.active) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
      }
      pointer.active = true;
    };
    const onPointerOut = (e: PointerEvent) => { if (!e.relatedTarget) pointer.active = false; };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      restart();
    }, { threshold: .01 });
    const observer = new ResizeObserver(restart);
    observer.observe(root);
    intersection.observe(root);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerout', onPointerOut);
    document.addEventListener('visibilitychange', restart);
    reducedMotion.addEventListener('change', restart);
    restart();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('visibilitychange', restart);
      reducedMotion.removeEventListener('change', restart);
    };
  }, []);

  return (
    <div ref={rootRef} className={`living-contour ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

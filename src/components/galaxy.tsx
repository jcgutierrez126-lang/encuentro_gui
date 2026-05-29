"use client"

import { useEffect, useRef } from "react"

interface GalaxyProps {
  starSpeed?: number
  density?: number
  hueShift?: number
  speed?: number
  glowIntensity?: number
  saturation?: number
  mouseRepulsion?: boolean
  repulsionStrength?: number
  twinkleIntensity?: number
  rotationSpeed?: number
  transparent?: boolean
  className?: string
}

interface Star {
  origX: number
  origY: number
  size: number
  brightness: number
  twinkleOffset: number
  twinkleSpeed: number
}

export default function Galaxy({
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  speed = 1,
  glowIntensity = 0.3,
  saturation = 0,
  mouseRepulsion = false,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  transparent = false,
  className = "",
}: GalaxyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const starsRef = useRef<Star[]>([])
  const rotRef = useRef(0)
  const rafRef = useRef(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    if (!ctx) return

    function buildStars(W: number, H: number) {
      const cx = W / 2
      const cy = H / 2
      const maxR = Math.min(W, H) * 0.48
      const count = Math.floor(300 * density)
      const stars: Star[] = []

      for (let i = 0; i < count; i++) {
        let r: number, angle: number

        if (Math.random() < 0.72) {
          // spiral arm
          const arm = Math.floor(Math.random() * 3)
          r = (Math.random() ** 0.6) * maxR
          const armAngle = (arm * Math.PI * 2) / 3
          const spread = (r / maxR) * Math.PI * 2.5
          angle = armAngle + spread + (Math.random() - 0.5) * 0.7
        } else {
          // halo / bulge
          r = Math.random() ** 1.5 * maxR * 0.5
          angle = Math.random() * Math.PI * 2
        }

        const origX = cx + Math.cos(angle) * r
        const origY = cy + Math.sin(angle) * r

        stars.push({
          origX,
          origY,
          size: Math.random() * 1.6 + 0.25,
          brightness: 0.45 + Math.random() * 0.55,
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.6 + Math.random() * 1.2,
        })
      }
      return stars
    }

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      starsRef.current = buildStars(canvas.offsetWidth, canvas.offsetHeight)
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    let last = performance.now()
    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      timeRef.current += dt * speed
      rotRef.current += rotationSpeed * 0.15 * dt * speed

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      const cx = W / 2
      const cy = H / 2
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      if (transparent) {
        ctx.clearRect(0, 0, W, H)
      } else {
        ctx.fillStyle = "#07111a"
        ctx.fillRect(0, 0, W, H)
      }

      const cosR = Math.cos(rotRef.current)
      const sinR = Math.sin(rotRef.current)
      const h = hueShift
      const s = Math.round(saturation * 100)

      for (const star of starsRef.current) {
        // global rotation around center
        const dx0 = star.origX - cx
        const dy0 = star.origY - cy
        let bx = cx + dx0 * cosR - dy0 * sinR
        let by = cy + dx0 * sinR + dy0 * cosR

        // mouse repulsion
        if (mouseRepulsion) {
          const dx = bx - mx
          const dy = by - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          const radius = 110
          if (dist < radius && dist > 0) {
            const force = ((1 - dist / radius) ** 2) * repulsionStrength * 22
            bx += (dx / dist) * force
            by += (dy / dist) * force
          }
        }

        // twinkle
        const tw = Math.sin(timeRef.current * star.twinkleSpeed + star.twinkleOffset)
        const alpha = Math.max(
          0,
          star.brightness * (1 - twinkleIntensity * 0.5 + twinkleIntensity * 0.5 * tw)
        )
        const lum = 65 + tw * 22
        const sz = star.size * Math.max(0.4, starSpeed)

        ctx.save()
        if (glowIntensity > 0.02) {
          ctx.shadowBlur = sz * 10 * glowIntensity
          ctx.shadowColor = `hsla(${h},${s}%,${lum}%,${alpha * 0.7})`
        }
        ctx.globalAlpha = alpha
        ctx.fillStyle = `hsl(${h},${s}%,${lum}%)`
        ctx.beginPath()
        ctx.arc(bx, by, sz, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener("resize", resize)
    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("mouseleave", onMouseLeave)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [
    starSpeed, density, hueShift, speed, glowIntensity, saturation,
    mouseRepulsion, repulsionStrength, twinkleIntensity, rotationSpeed, transparent,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  )
}

"use client"

import { useEffect, useRef } from "react"

interface BeamsProps {
  beamWidth?: number
  beamHeight?: number
  beamNumber?: number
  lightColor?: string
  speed?: number
  noiseIntensity?: number
  scale?: number
  rotation?: number
  className?: string
}

// Simplex-like smooth noise (1D)
function noise(x: number): number {
  const ix = Math.floor(x)
  const fx = x - ix
  const u = fx * fx * (3 - 2 * fx)
  const a = Math.sin(ix * 127.1 + 311.7) * 43758.5453
  const b = Math.sin((ix + 1) * 127.1 + 311.7) * 43758.5453
  return (a - Math.floor(a)) * (1 - u) + (b - Math.floor(b)) * u
}

export default function Beams({
  beamWidth = 2,
  beamHeight = 15,
  beamNumber = 12,
  lightColor = "#ffffff",
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 0,
  className = "",
}: BeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Parse lightColor to rgba components
    const hex = lightColor.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Each beam gets a random seed offset
    const seeds = Array.from({ length: beamNumber }, (_, i) => i * (1 / beamNumber) + Math.random() * 0.05)

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height
      if (!W || !H) { frameRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, W, H)
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-W / 2, -H / 2)

      const t = timeRef.current * 0.001 * speed
      const beamLen = H * (beamHeight / 10)
      const beamW = beamWidth * scale * 80

      for (let i = 0; i < beamNumber; i++) {
        const seed = seeds[i]
        // Horizontal position: oscillates with noise
        const baseX = (seed + noise(seed * 3 + t * 0.15) * noiseIntensity * 0.12) * W
        // Vertical travel: wraps around
        const travel = ((t * 0.4 + seed * 1.7) % 1.6) - 0.3
        const cy = travel * (H + beamLen) - beamLen / 2

        const wobble = (noise(seed * 7 + t * 0.3) - 0.5) * noiseIntensity * beamW * 1.2
        const x = baseX + wobble

        // Draw beam as a vertical gradient rectangle
        const grad = ctx.createLinearGradient(x, cy - beamLen / 2, x, cy + beamLen / 2)
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`)
        grad.addColorStop(0.2, `rgba(${r},${g},${b},0.55)`)
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.85)`)
        grad.addColorStop(0.8, `rgba(${r},${g},${b},0.55)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

        // Core beam
        ctx.save()
        ctx.globalCompositeOperation = "screen"
        ctx.fillStyle = grad
        ctx.shadowColor = `rgba(${r},${g},${b},0.4)`
        ctx.shadowBlur = beamW * 3
        ctx.fillRect(x - beamW / 2, cy - beamLen / 2, beamW, beamLen)

        // Soft outer glow
        const glowGrad = ctx.createLinearGradient(x, cy - beamLen / 2, x, cy + beamLen / 2)
        glowGrad.addColorStop(0, `rgba(${r},${g},${b},0)`)
        glowGrad.addColorStop(0.5, `rgba(${r},${g},${b},0.15)`)
        glowGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = glowGrad
        ctx.fillRect(x - beamW * 2, cy - beamLen / 2, beamW * 4, beamLen)
        ctx.restore()
      }

      ctx.restore()
      timeRef.current += 16
      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
    }
  }, [beamWidth, beamHeight, beamNumber, lightColor, speed, noiseIntensity, scale, rotation])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  )
}

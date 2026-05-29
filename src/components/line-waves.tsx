"use client"

import { useEffect, useRef } from "react"

interface LineWavesProps {
  lineColor?: string
  backgroundColor?: string
  waveSpeedX?: number
  waveSpeedY?: number
  waveAmpX?: number
  waveAmpY?: number
  xGap?: number
  yGap?: number
  className?: string
}

export default function LineWaves({
  lineColor = "rgba(204,255,0,0.18)",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  className,
}: LineWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

    let raf: number
    let tick = 0
    let cols = 0
    let rows = 0
    let points: { ox: number; oy: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      cols = Math.ceil(canvas.width / xGap) + 2
      rows = Math.ceil(canvas.height / yGap) + 2
      points = []
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          points.push({ ox: i * xGap, oy: j * yGap })
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1

      for (let j = 0; j < rows; j++) {
        ctx.beginPath()
        for (let i = 0; i < cols; i++) {
          const p = points[j * cols + i]
          const x =
            p.ox +
            Math.sin(p.oy * 0.02 + tick * waveSpeedX) * waveAmpX +
            Math.sin(p.ox * 0.015 + tick * waveSpeedY * 0.7) * (waveAmpX * 0.4)
          const y =
            p.oy +
            Math.sin(p.ox * 0.025 + tick * waveSpeedY) * waveAmpY +
            Math.sin(p.oy * 0.018 + tick * waveSpeedX * 0.6) * (waveAmpY * 0.5)

          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      tick++
      raf = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [lineColor, backgroundColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, xGap, yGap])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  )
}

"use client"

import { useEffect, useRef, useState } from "react"

interface TargetCursorProps {
  color?: string
  spinDuration?: number
  hideDefaultCursor?: boolean
}

export default function TargetCursor({
  color = "#2dd4bf",
  spinDuration = 4,
  hideDefaultCursor = true,
}: TargetCursorProps) {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const [isTarget, setIsTarget] = useState(false)
  const [visible, setVisible] = useState(false)
  const rafRef = useRef<number>(0)
  const targetPos = useRef({ x: -200, y: -200 })
  const currentPos = useRef({ x: -200, y: -200 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY }
      if (!visible) setVisible(true)
      const el = document.elementFromPoint(e.clientX, e.clientY)
      setIsTarget(!!el?.closest("[data-target-cursor]"))
    }

    const onLeave = () => setVisible(false)

    const tick = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.13
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.13
      setPos({ x: currentPos.current.x, y: currentPos.current.y })
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove)
    document.documentElement.addEventListener("mouseleave", onLeave)
    rafRef.current = requestAnimationFrame(tick)

    if (hideDefaultCursor) document.body.style.cursor = "none"

    return () => {
      window.removeEventListener("mousemove", onMove)
      document.documentElement.removeEventListener("mouseleave", onLeave)
      cancelAnimationFrame(rafRef.current)
      if (hideDefaultCursor) document.body.style.cursor = ""
    }
  }, [hideDefaultCursor, visible])

  const outerR = isTarget ? 22 : 10
  const crossLen = 7

  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s",
      }}
    >
      <svg
        width={64}
        height={64}
        viewBox="-32 -32 64 64"
        style={{ overflow: "visible" }}
      >
        {/* Spinning dashed outer ring */}
        <circle
          cx={0}
          cy={0}
          r={outerR}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={isTarget ? "4 3" : "3 4"}
          opacity={0.9}
          style={{
            transition: "r 0.25s cubic-bezier(.4,0,.2,1)",
            animation: `ordo-spin ${spinDuration}s linear infinite`,
          }}
        />

        {/* Solid thin ring */}
        <circle
          cx={0}
          cy={0}
          r={isTarget ? 16 : 4}
          fill="none"
          stroke={color}
          strokeWidth={isTarget ? 1 : 1.5}
          opacity={isTarget ? 0.35 : 0.7}
          style={{ transition: "r 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s" }}
        />

        {/* Crosshair lines — only when on target */}
        {isTarget && (
          <>
            <line x1={0} y1={-(outerR + crossLen)} x2={0} y2={-(outerR + 2)} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
            <line x1={0} y1={outerR + 2} x2={0} y2={outerR + crossLen} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
            <line x1={-(outerR + crossLen)} y1={0} x2={-(outerR + 2)} y2={0} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
            <line x1={outerR + 2} y1={0} x2={outerR + crossLen} y2={0} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
          </>
        )}

        {/* Center dot */}
        <circle cx={0} cy={0} r={2} fill={color} opacity={0.95} />
      </svg>

      <style>{`
        @keyframes ordo-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"

interface ShuffleTextProps {
  text: string
  className?: string
  duration?: number
  stagger?: number
  direction?: "up" | "down" | "left" | "right"
}

export default function ShuffleText({
  text,
  className = "",
  duration = 350,
  stagger = 30,
  direction = "up",
}: ShuffleTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const getTransform = (triggered: boolean, isOdd: boolean) => {
    if (triggered) return "translate(0,0)"
    const offset = isOdd ? "120%" : "120%"
    if (direction === "up") return `translateY(${offset})`
    if (direction === "down") return `translateY(-${offset})`
    if (direction === "right") return `translateX(-${offset})`
    return `translateX(${offset})`
  }

  // Split preserving spaces
  const chars = Array.from(text)

  return (
    <p ref={ref} className={`overflow-hidden ${className}`} aria-label={text}>
      {chars.map((char, i) => {
        const isOdd = i % 2 === 1
        const delay = triggered
          ? isOdd
            ? i * stagger
            : chars.length * stagger * 0.7 * 0.5 + i * stagger
          : 0

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              transform: getTransform(triggered, isOdd),
              transition: triggered
                ? `transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`
                : "none",
              willChange: "transform",
            }}
          >
            {char}
          </span>
        )
      })}
    </p>
  )
}

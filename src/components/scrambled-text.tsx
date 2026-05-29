"use client"

import { useEffect, useRef, useCallback } from "react"

const CHARS = ".:"

interface ScrambledTextProps {
  children: string
  radius?: number
  duration?: number
  scrambleChars?: string
  className?: string
}

export default function ScrambledText({
  children,
  radius = 120,
  duration = 800,
  scrambleChars = CHARS,
  className = "",
}: ScrambledTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  // Map from span element → { original char, active timer id, restore timeout }
  const stateRef = useRef<Map<HTMLElement, { timer: ReturnType<typeof setInterval> | null; restore: ReturnType<typeof setTimeout> | null }>>(new Map())

  const scramble = useCallback((el: HTMLElement, original: string, durationMs: number) => {
    const state = stateRef.current.get(el)
    if (state?.timer) clearInterval(state.timer)
    if (state?.restore) clearTimeout(state.restore)

    const start = performance.now()
    const timer = setInterval(() => {
      const progress = (performance.now() - start) / durationMs
      if (progress >= 1) {
        el.textContent = original
        clearInterval(timer)
        stateRef.current.set(el, { timer: null, restore: null })
        return
      }
      el.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
    }, 40)

    const restore = setTimeout(() => {
      clearInterval(timer)
      el.textContent = original
      stateRef.current.set(el, { timer: null, restore: null })
    }, durationMs + 100)

    stateRef.current.set(el, { timer, restore })
  }, [scrambleChars])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Split text into individual char spans
    const text = children
    container.innerHTML = ""
    const spans: HTMLElement[] = []

    for (const char of text) {
      const span = document.createElement("span")
      span.textContent = char
      span.dataset.original = char
      span.style.display = "inline"
      span.style.whiteSpace = "pre"
      container.appendChild(span)
      spans.push(span)
      stateRef.current.set(span, { timer: null, restore: null })
    }

    const handlePointerMove = (e: PointerEvent) => {
      spans.forEach((span) => {
        const original = span.dataset.original ?? span.textContent ?? ""
        if (original === " ") return

        const rect = span.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy)

        if (dist < radius) {
          const proximity = 1 - dist / radius
          const d = duration * proximity
          scramble(span, original, d)
        }
      })
    }

    window.addEventListener("pointermove", handlePointerMove)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      stateRef.current.forEach(({ timer, restore }) => {
        if (timer) clearInterval(timer)
        if (restore) clearTimeout(restore)
      })
      stateRef.current.clear()
    }
  }, [children, radius, duration, scramble])

  return (
    <p ref={containerRef} className={className} aria-label={children} />
  )
}

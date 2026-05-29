"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  border: 0,
}

interface DecryptedTextProps {
  text: string
  speed?: number
  maxIterations?: number
  sequential?: boolean
  revealDirection?: "start" | "end" | "center"
  useOriginalCharsOnly?: boolean
  characters?: string
  className?: string
  parentClassName?: string
  encryptedClassName?: string
  animateOn?: "hover" | "view" | "both"
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isHovering, setIsHovering] = useState(false)
  const [isScrambling, setIsScrambling] = useState(false)
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>())
  const [hasAnimated, setHasAnimated] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    let currentIteration = 0

    const getNextIndex = (revealedSet: Set<number>) => {
      const len = text.length
      switch (revealDirection) {
        case "start": return revealedSet.size
        case "end": return len - 1 - revealedSet.size
        case "center": {
          const mid = Math.floor(len / 2)
          const off = Math.floor(revealedSet.size / 2)
          const next = revealedSet.size % 2 === 0 ? mid + off : mid - off - 1
          if (next >= 0 && next < len && !revealedSet.has(next)) return next
          for (let i = 0; i < len; i++) if (!revealedSet.has(i)) return i
          return 0
        }
        default: return revealedSet.size
      }
    }

    const availableChars = useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((c) => c !== " ")
      : characters.split("")

    const shuffleText = (original: string, revealed: Set<number>) => {
      if (useOriginalCharsOnly) {
        const positions = original.split("").map((char, i) => ({
          char, isSpace: char === " ", index: i, isRevealed: revealed.has(i),
        }))
        const nonSpace = positions.filter((p) => !p.isSpace && !p.isRevealed).map((p) => p.char)
        for (let i = nonSpace.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nonSpace[i], nonSpace[j]] = [nonSpace[j], nonSpace[i]]
        }
        let ci = 0
        return positions.map((p) => {
          if (p.isSpace) return " "
          if (p.isRevealed) return original[p.index]
          return nonSpace[ci++]
        }).join("")
      } else {
        return original.split("").map((char, i) => {
          if (char === " ") return " "
          if (revealed.has(i)) return original[i]
          return availableChars[Math.floor(Math.random() * availableChars.length)]
        }).join("")
      }
    }

    if (isHovering) {
      setIsScrambling(true)
      interval = setInterval(() => {
        setRevealedIndices((prev) => {
          if (sequential) {
            if (prev.size < text.length) {
              const next = getNextIndex(prev)
              const updated = new Set(prev)
              updated.add(next)
              setDisplayText(shuffleText(text, updated))
              return updated
            } else {
              clearInterval(interval)
              setIsScrambling(false)
              return prev
            }
          } else {
            setDisplayText(shuffleText(text, prev))
            currentIteration++
            if (currentIteration >= maxIterations) {
              clearInterval(interval)
              setIsScrambling(false)
              setDisplayText(text)
            }
            return prev
          }
        })
      }, speed)
    } else {
      setDisplayText(text)
      setRevealedIndices(new Set())
      setIsScrambling(false)
    }

    return () => { if (interval) clearInterval(interval) }
  }, [isHovering, text, speed, maxIterations, sequential, revealDirection, characters, useOriginalCharsOnly])

  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "both") return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !hasAnimated) {
            setIsHovering(true)
            setHasAnimated(true)
          }
        })
      },
      { threshold: 0.1 }
    )
    const el = containerRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [animateOn, hasAnimated])

  const hoverProps =
    animateOn === "hover" || animateOn === "both"
      ? { onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false) }
      : {}

  return (
    <motion.span
      ref={containerRef}
      className={parentClassName}
      style={{ display: "inline-block", whiteSpace: "pre-wrap" }}
      {...hoverProps}
    >
      <span style={srOnly}>{displayText}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, i) => {
          const revealed = revealedIndices.has(i) || !isScrambling || !isHovering
          return (
            <span key={i} className={revealed ? className : encryptedClassName}>
              {char}
            </span>
          )
        })}
      </span>
    </motion.span>
  )
}

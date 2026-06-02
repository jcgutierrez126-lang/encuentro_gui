"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const serif = { fontFamily: "'Cormorant Garant', Georgia, serif" }
const HERO  = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=90&fit=crop"

export default function PortalPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col" style={{ backgroundColor: "#080402" }}>

      {/* ── Imagen de fondo ── */}
      <div className="absolute inset-0 z-0">
        <Image src={HERO} alt="" fill className="object-cover object-center" priority quality={90} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(8,4,2,0.82) 0%, rgba(8,4,2,0.55) 40%, rgba(8,4,2,0.9) 100%)" }} />
      </div>

      {/* ── Contenido ── */}
      <div className="relative z-10 flex flex-col min-h-screen px-8 md:px-16 py-10 max-w-xl">

        {/* Logo — solo texto, sin caja */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-black tracking-tight" style={{ color: "rgba(255,240,210,0.7)", ...serif }}>
            El Encuentro
          </p>
          <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: "rgba(240,180,41,0.4)", fontWeight: 500 }}>
            Sistema de gestión
          </p>
        </motion.div>

        {/* Headline central */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-1 flex flex-col justify-center gap-8 py-16"
        >
          <h1 style={{
            ...serif,
            fontSize: "clamp(2.6rem, 6vw, 4.5rem)",
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "rgba(255,240,210,0.97)",
          }}>
            Gestiona tu café<br />
            con <em style={{ fontStyle: "italic", color: "#F0B429" }}>precisión.</em>
          </h1>

          <p style={{ color: "rgba(255,240,210,0.35)", fontWeight: 300, fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "22rem" }}>
            Ventas, inventario, procesos de tostado y finanzas —
            todo en un solo lugar.
          </p>

          {/* Módulos — solo texto elegante */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {["Ventas", "Inventario", "Procesos", "Finanzas"].map((m, i) => (
              <span key={m} className="text-[11px] uppercase tracking-[0.18em] font-medium"
                style={{ color: i === 0 ? "rgba(240,180,41,0.6)" : "rgba(255,240,210,0.22)" }}>
                {m}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div>
            <Link href="/login">
              <button
                className="inline-flex items-center gap-3 text-sm font-bold px-8 py-4 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                  color: "#2D1600",
                  boxShadow: "0 8px 40px rgba(240,180,41,0.25)",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.01em",
                }}>
                Acceder al sistema
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-between flex-wrap gap-2"
        >
          <a href="https://cafeelencuentro.com" target="_blank" rel="noopener noreferrer"
            className="text-[11px] transition-colors hover:text-amber-400"
            style={{ color: "rgba(255,240,210,0.18)", ...serif, fontStyle: "italic" }}>
            cafeelencuentro.com →
          </a>
          <p className="text-[10px]" style={{ color: "rgba(255,240,210,0.1)", ...serif, fontStyle: "italic" }}>
            Café de origen colombiano
          </p>
        </motion.div>
      </div>
    </div>
  )
}

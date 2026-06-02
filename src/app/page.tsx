"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, ShoppingBag, Package, FlaskConical, TrendingDown } from "lucide-react"

const serif = { fontFamily: "'Cormorant Garant', Georgia, serif" }

const HERO_IMG = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=90&fit=crop"

const MODULOS = [
  { icon: ShoppingBag, label: "Ventas"     },
  { icon: Package,     label: "Inventario" },
  { icon: FlaskConical,label: "Procesos"   },
  { icon: TrendingDown,label: "Finanzas"   },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col md:flex-row">

      {/* ── Imagen de fondo — ocupa toda la pantalla ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_IMG}
          alt="El Encuentro"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Overlay oscuro con degradado direccional */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(8,4,2,0.97) 0%, rgba(8,4,2,0.88) 45%, rgba(8,4,2,0.65) 100%)" }} />
        {/* Viñeta inferior */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(8,4,2,0.8) 0%, transparent 40%)" }} />
      </div>

      {/* ── Contenido principal ── */}
      <div className="relative z-10 flex flex-col justify-between w-full min-h-screen px-8 md:px-16 lg:px-24 py-10 md:py-14 max-w-2xl">

        {/* Logo top */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="h-11 w-11 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.2)" }}>
            <Image src="/logo-encuentro.png" alt="El Encuentro" width={44} height={44} className="object-contain" priority />
          </div>
          <div>
            <p className="text-sm font-black leading-none" style={{ color: "rgba(255,240,210,0.9)", ...serif }}>El Encuentro</p>
            <p className="text-[9px] uppercase tracking-[0.2em] mt-0.5" style={{ color: "rgba(240,180,41,0.45)", fontWeight: 500 }}>Café tostado · Colombia</p>
          </div>
        </motion.div>

        {/* Headline central */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col gap-8"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-5"
              style={{ color: "rgba(240,180,41,0.5)" }}>
              Sistema de gestión
            </p>

            <h1 className="leading-none mb-5"
              style={{ ...serif, fontSize: "clamp(3rem,7vw,5.5rem)", fontWeight: 300, color: "rgba(255,240,210,0.96)", letterSpacing: "-0.01em" }}>
              Gestiona tu café<br />
              con{" "}
              <em style={{ fontStyle: "italic", color: "#F0B429" }}>precisión.</em>
            </h1>

            <p className="text-sm leading-loose max-w-sm"
              style={{ color: "rgba(255,240,210,0.35)", fontWeight: 300 }}>
              Ventas, inventario, procesos de tostado y finanzas —
              todo en un solo lugar diseñado para El Encuentro.
            </p>
          </div>

          {/* Módulos */}
          <div className="flex flex-wrap gap-2">
            {MODULOS.map(({ icon: Icon, label }) => (
              <div key={label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                style={{ background: "rgba(255,240,210,0.04)", border: "1px solid rgba(255,240,210,0.07)" }}>
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "rgba(240,180,41,0.5)" }} />
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.35)", fontWeight: 500 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login">
              <button
                className="flex items-center gap-2.5 text-sm font-bold px-8 py-3.5 rounded-xl transition-all"
                style={{
                  background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                  color: "#2D1600",
                  boxShadow: "0 8px 32px rgba(240,180,41,0.28)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
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
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <a href="https://cafeelencuentro.com" target="_blank" rel="noopener noreferrer"
            className="text-[11px] transition-colors"
            style={{ color: "rgba(255,240,210,0.2)", ...serif, fontStyle: "italic" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,180,41,0.5)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,240,210,0.2)")}>
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

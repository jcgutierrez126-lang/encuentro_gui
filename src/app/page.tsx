"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, ShoppingBag, Package, BarChart2, TrendingDown } from "lucide-react"

const Beams = dynamic(() => import("@/components/beams"), { ssr: false })

const serif = { fontFamily: "'Cormorant Garant', Georgia, serif" }

const MODULOS = [
  { icon: ShoppingBag, label: "Ventas"     },
  { icon: Package,     label: "Inventario" },
  { icon: BarChart2,   label: "Procesos"   },
  { icon: TrendingDown,label: "Finanzas"   },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "#080402" }}
    >
      {/* Beams de fondo — muy sutiles */}
      <div className="absolute inset-0 z-0">
        <Beams
          beamWidth={1.5}
          beamHeight={20}
          beamNumber={8}
          lightColor="#C88A1A"
          speed={1.0}
          noiseIntensity={1.4}
          scale={0.14}
          rotation={0}
        />
        <div className="absolute inset-0" style={{ background: "rgba(8,4,2,0.62)" }} />
      </div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-xs w-full"
      >
        {/* Logo */}
        <div
          className="h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center mb-7"
          style={{
            background: "rgba(240,180,41,0.07)",
            border: "1px solid rgba(240,180,41,0.18)",
            boxShadow: "0 0 60px rgba(240,180,41,0.12)",
          }}
        >
          <Image
            src="/logo-encuentro.png"
            alt="El Encuentro"
            width={64}
            height={64}
            className="object-contain"
            style={{ filter: "drop-shadow(0 4px 16px rgba(240,180,41,0.4))" }}
            priority
          />
        </div>

        {/* Nombre — serif editorial */}
        <h1
          className="leading-none mb-1.5"
          style={{ ...serif, fontSize: "2rem", fontWeight: 300, color: "rgba(255,240,210,0.93)", letterSpacing: "-0.01em" }}
        >
          El Encuentro
        </h1>
        <p
          className="text-[10px] uppercase tracking-[0.28em] mb-10"
          style={{ color: "rgba(240,180,41,0.45)", fontWeight: 500 }}
        >
          Sistema de gestión
        </p>

        {/* Módulos */}
        <div className="grid grid-cols-4 gap-2 w-full mb-10">
          {MODULOS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 py-3.5 rounded-xl"
              style={{
                background: "rgba(255,240,210,0.03)",
                border: "1px solid rgba(255,240,210,0.06)",
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "rgba(240,180,41,0.45)" }} />
              <span
                className="text-[9px] uppercase tracking-wider"
                style={{ color: "rgba(255,240,210,0.28)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Botón acceder */}
        <Link href="/login" className="w-full">
          <button
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all"
            style={{
              background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
              color: "#2D1600",
              boxShadow: "0 8px 32px rgba(240,180,41,0.22)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Acceder al sistema
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>

        {/* Link al catálogo */}
        <a
          href="https://cafeelencuentro.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 text-[11px] transition-colors"
          style={{ color: "rgba(255,240,210,0.16)", ...serif, fontStyle: "italic" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,180,41,0.45)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,240,210,0.16)")}
        >
          cafeelencuentro.com →
        </a>
      </motion.div>

      {/* Footer */}
      <p
        className="absolute bottom-6 text-[10px] z-10"
        style={{ color: "rgba(255,240,210,0.08)", ...serif, fontStyle: "italic" }}
      >
        Café de origen colombiano
      </p>
    </div>
  )
}

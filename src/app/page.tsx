"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, BarChart2, ShoppingBag, Package, TrendingUp } from "lucide-react"

const Beams = dynamic(() => import("@/components/beams"), { ssr: false })

const MODULOS = [
  { icon: ShoppingBag, label: "Ventas" },
  { icon: Package,     label: "Inventario" },
  { icon: BarChart2,   label: "Reportes" },
  { icon: TrendingUp,  label: "Finanzas" },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "#0D0806" }}
    >
      {/* Beams de fondo */}
      <div className="absolute inset-0 z-0">
        <Beams
          beamWidth={2}
          beamHeight={18}
          beamNumber={10}
          lightColor="#C88A1A"
          speed={1.4}
          noiseIntensity={1.6}
          scale={0.18}
          rotation={0}
        />
        {/* Oscurecer levemente para que el contenido sea legible */}
        <div className="absolute inset-0" style={{ background: "rgba(13,8,6,0.55)" }} />
      </div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        {/* Logo */}
        <div
          className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center mb-6"
          style={{
            background: "rgba(240,180,41,0.1)",
            border: "1px solid rgba(240,180,41,0.22)",
            boxShadow: "0 0 32px rgba(240,180,41,0.15)",
          }}
        >
          <Image
            src="/logo-encuentro.png"
            alt="El Encuentro"
            width={52}
            height={52}
            className="object-contain"
            style={{ filter: "drop-shadow(0 2px 12px rgba(240,180,41,0.4))" }}
            priority
          />
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: "rgba(255,240,210,0.93)" }}>
          El Encuentro
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] mb-10" style={{ color: "rgba(240,180,41,0.5)" }}>
          Sistema de gestión
        </p>

        {/* Módulos */}
        <div className="grid grid-cols-4 gap-2 w-full mb-10">
          {MODULOS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-xl py-3"
              style={{
                background: "rgba(255,240,210,0.04)",
                border: "1px solid rgba(255,240,210,0.07)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: "rgba(240,180,41,0.5)" }} />
              <span className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.3)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/login" className="w-full">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all"
            style={{
              background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
              color: "#3D1F00",
              boxShadow: "0 4px 24px rgba(240,180,41,0.28)",
            }}
          >
            Acceder al sistema
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>

        <a
          href="https://cafeelencuentro.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 text-[11px] transition-colors"
          style={{ color: "rgba(255,240,210,0.18)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,180,41,0.45)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,240,210,0.18)")}
        >
          cafeelencuentro.com →
        </a>
      </motion.div>

      <p className="absolute bottom-6 text-[10px] z-10" style={{ color: "rgba(255,240,210,0.1)" }}>
        El Encuentro · Café de origen colombiano
      </p>
    </div>
  )
}

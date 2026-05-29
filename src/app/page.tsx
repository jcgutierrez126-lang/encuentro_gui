"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Coffee, BarChart2, Users, ShoppingBag, TrendingUp, ArrowRight, Package } from "lucide-react"
import TextType from "@/components/TextType"

const Silk = dynamic(() => import("@/components/silk"), { ssr: false })

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full">

      {/* Fondo oscuro cálido */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, width: "100vw", height: "100vh", backgroundColor: "#100A04" }}>
        <Silk speed={0.5} scale={1} color="#4A2A08" noiseIntensity={1.5} rotation={15} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(16,10,4,0.72) 0%, rgba(25,13,4,0.58) 100%)" }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>

        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 md:px-14">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.2)" }}>
              <Image src="/logo-encuentro.png" alt="El Encuentro" width={32} height={32}
                className="object-contain scale-110" style={{ filter: "drop-shadow(0 0 4px rgba(240,180,41,0.3))" }} />
            </div>
            <span className="font-bold text-sm tracking-wide" style={{ color: "rgba(255,240,210,0.9)" }}>
              El Encuentro
              <span className="ml-2 text-[10px] font-normal uppercase tracking-[0.18em]"
                style={{ color: "rgba(240,180,41,0.45)" }}>café tostado</span>
            </span>
          </div>
          <Link href="/login">
            <Button size="sm" className="text-xs font-semibold px-5 rounded-xl" style={{
              background: "rgba(240,180,41,0.12)",
              border: "1px solid rgba(240,180,41,0.3)",
              color: "rgba(255,240,210,0.85)",
            }}>
              Acceder
            </Button>
          </Link>
        </nav>

        {/* Hero */}
        <section className="px-6 md:px-14 pt-16 md:pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-[10px] uppercase tracking-[0.22em] font-semibold"
              style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)", color: "rgba(240,180,41,0.65)" }}>
              <Coffee className="h-2.5 w-2.5" />
              Café de origen · Colombia
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-tight leading-[1.02] mb-6"
              style={{ color: "rgba(255,240,210,0.95)" }}>
              Cada taza<br />
              <span style={{ color: "#F0B429" }}>cuenta</span>
              {" "}
              <span style={{ color: "rgba(255,240,210,0.28)" }}>una historia.</span>
            </h1>

            <p className="text-base md:text-lg leading-relaxed mb-8 max-w-md" style={{ color: "rgba(255,240,210,0.42)" }}>
              <TextType
                as="span"
                text={[
                  "Gestión de ventas de café tostado.",
                  "Pedidos, clientes y entregas.",
                  "Trazabilidad desde el origen.",
                  "Finanzas claras en tiempo real.",
                  "Tu marca de café, siempre en orden.",
                ]}
                typingSpeed={50}
                deletingSpeed={28}
                pauseDuration={2000}
                showCursor
                cursorCharacter="_"
                cursorClassName="opacity-40"
                loop
              />
            </p>

            <Link href="/login">
              <Button size="lg" className="font-bold gap-2.5 px-7 py-6 text-sm rounded-xl" style={{
                background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                border: "none",
                color: "#3D1F00",
                boxShadow: "0 8px 32px rgba(240,180,41,0.3), 0 2px 8px rgba(0,0,0,0.4)",
              }}>
                Entrar a la plataforma
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Divider decorativo */}
        <div className="mx-6 md:mx-14 h-px mb-12"
          style={{ background: "linear-gradient(90deg, transparent, rgba(240,180,41,0.18), transparent)" }} />

        {/* Bento grid */}
        <section className="px-6 md:px-14 pb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-3"
          >
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Card grande — Ventas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="md:col-span-2 rounded-2xl p-7 flex flex-col gap-5"
                style={{ background: "rgba(240,180,41,0.06)", border: "1px solid rgba(240,180,41,0.14)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.2)" }}>
                      <ShoppingBag className="h-5 w-5" style={{ color: "#F0B429" }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(240,180,41,0.1)", color: "rgba(240,180,41,0.6)", border: "1px solid rgba(240,180,41,0.15)" }}>
                      Core
                    </span>
                  </div>
                  <span className="text-5xl font-black select-none" style={{ color: "rgba(240,180,41,0.05)" }}>01</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "rgba(255,240,210,0.93)" }}>
                    Ventas y pedidos de café
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,240,210,0.38)" }}>
                    Registra cada venta con fecha, cliente, tipo de café, kilos, precio y cuenta destino.
                    Consulta el histórico por período y por referencia de tostado.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Tostado oscuro",   desc: "kilo · precio · cliente" },
                      { label: "Molido especial",   desc: "referencias y presentaciones" },
                      { label: "Exportación",       desc: "valor neto en COP / USD" },
                    ].map(f => (
                      <div key={f.label} className="rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(240,180,41,0.06)", border: "1px solid rgba(240,180,41,0.1)" }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(240,180,41,0.6)" }}>{f.label}</p>
                        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,240,210,0.3)" }}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Clientes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.58 }}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "rgba(255,240,210,0.03)", border: "1px solid rgba(255,240,210,0.07)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,240,210,0.05)", border: "1px solid rgba(255,240,210,0.09)" }}>
                    <Users className="h-4 w-4" style={{ color: "rgba(255,240,210,0.45)" }} />
                  </div>
                  <span className="text-3xl font-black select-none" style={{ color: "rgba(255,240,210,0.04)" }}>02</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "rgba(255,240,210,0.88)" }}>Clientes y proveedores</h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,240,210,0.33)" }}>
                    Directorio de compradores, cooperativas y tostadoras. Historial de compras por cliente.
                  </p>
                  <div className="space-y-1.5">
                    {["Tiendas especializadas", "Exportadores directos", "Distribuidores nacionales", "Ventas al consumidor"].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: "#F0B429", opacity: 0.5 }} />
                        <span className="text-[11px]" style={{ color: "rgba(255,240,210,0.33)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Row 2 — 4 cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Package,    num: "03", title: "Inventario tostado",  desc: "Stock por referencia, presentación y fecha de tostado.",    tags: ["250g", "500g", "1kg", "A granel"],        delay: 0.66 },
                { icon: BarChart2,  num: "04", title: "Reportes de ventas",  desc: "Histórico mensual, comparativa y tendencias por tipo.",      tags: ["Por cliente", "Por mes", "Por tipo"],     delay: 0.74 },
                { icon: TrendingUp, num: "05", title: "Finanzas",            desc: "Ingresos, egresos, cuentas y saldo real en tiempo real.",    tags: ["COP", "Transferencias", "Cuentas"],       delay: 0.82 },
                { icon: Coffee,     num: "06", title: "Trazabilidad",        desc: "Del café verde al tostado: finca de origen y proceso.",      tags: ["Washed", "Natural", "Honey"],             delay: 0.90 },
              ].map(({ icon: Icon, num, title, desc, tags, delay }) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay }}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "rgba(255,240,210,0.03)", border: "1px solid rgba(255,240,210,0.07)" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(255,240,210,0.05)", border: "1px solid rgba(255,240,210,0.08)" }}>
                      <Icon className="h-4 w-4" style={{ color: "rgba(255,240,210,0.42)" }} />
                    </div>
                    <span className="text-2xl font-black select-none" style={{ color: "rgba(255,240,210,0.04)" }}>{num}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold mb-1.5" style={{ color: "rgba(255,240,210,0.85)" }}>{title}</h3>
                    <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "rgba(255,240,210,0.3)" }}>{desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md"
                          style={{ background: "rgba(240,180,41,0.08)", color: "rgba(240,180,41,0.5)", border: "1px solid rgba(240,180,41,0.12)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-10 text-[11px]" style={{ color: "rgba(255,240,210,0.1)" }}>
          El Encuentro · Café de origen colombiano &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}

"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Coffee, Leaf, Star, MessageCircle, Instagram, ChevronDown } from "lucide-react"

const PRODUCTOS = [
  {
    nombre: "Tostado Oscuro",
    presentaciones: ["250 g", "450 g", "2.5 kg"],
    tipo: "grano",
    descripcion: "Cuerpo intenso, notas de chocolate amargo y caramelo. Perfecto para espresso.",
    proceso: "Natural",
    origen: "Colombia",
    img: null,
  },
  {
    nombre: "Tostado Medio",
    presentaciones: ["250 g", "450 g"],
    tipo: "molido",
    descripcion: "Balance perfecto entre acidez y dulzura. Notas de fruta madura y miel.",
    proceso: "Washed",
    origen: "Colombia",
    img: null,
  },
  {
    nombre: "Especialidad",
    presentaciones: ["250 g", "450 g", "2.5 kg"],
    tipo: "grano",
    descripcion: "Lotes seleccionados con puntaje SCA ≥ 82. Perfil complejo, taza limpia y memorable.",
    proceso: "Honey",
    origen: "Colombia",
    img: null,
  },
  {
    nombre: "Molido Filtro",
    presentaciones: ["250 g", "450 g"],
    tipo: "molido",
    descripcion: "Molido especial para cafetera de filtro, chemex y V60. Extracción perfecta.",
    proceso: "Washed",
    origen: "Colombia",
    img: null,
  },
]

const VALORES = [
  { icon: MapPin, titulo: "Origen directo", desc: "Trabajamos con productores colombianos de confianza, pagando precios justos." },
  { icon: Coffee, titulo: "Tostado artesanal", desc: "Lotes pequeños tostados con precisión para preservar cada nota del café." },
  { icon: Leaf, titulo: "Sostenibilidad", desc: "Prácticas responsables desde el campo hasta tu taza." },
]

const WA = "https://wa.me/573000000000"
const IG = "https://instagram.com/cafeelencuentro"

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay },
  }
}

export default function CatalogoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0603", color: "rgba(255,240,210,0.88)" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5"
        style={{ background: "rgba(10,6,3,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,240,210,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden"
            style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)" }}>
            <Image src="/logo-encuentro.png" alt="El Encuentro" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <p className="font-black text-sm leading-none" style={{ color: "rgba(255,240,210,0.92)" }}>El Encuentro</p>
            <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(240,180,41,0.45)" }}>café tostado</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Café", href: "#cafe" },
            { label: "Nosotros", href: "#nosotros" },
            { label: "Contacto", href: "#contacto" },
          ].map(l => (
            <a key={l.href} href={l.href}
              className="text-sm transition-colors"
              style={{ color: "rgba(255,240,210,0.5)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,180,41,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,240,210,0.5)")}>
              {l.label}
            </a>
          ))}
        </div>

        <a href="https://contabilidad.cafeelencuentro.com" target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold px-4 py-2 rounded-xl transition-all"
          style={{
            background: "rgba(240,180,41,0.1)",
            border: "1px solid rgba(240,180,41,0.25)",
            color: "rgba(240,180,41,0.8)",
          }}>
          Sistema interno →
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        {/* Café image background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 z-10"
            style={{ background: "linear-gradient(to bottom, rgba(10,6,3,0.6) 0%, rgba(10,6,3,0.4) 50%, rgba(10,6,3,0.85) 100%)" }} />
          {/* Placeholder: imagen de café */}
          <div className="w-full h-full" style={{ background: "radial-gradient(ellipse at center, rgba(240,180,41,0.08) 0%, rgba(10,6,3,0) 70%)" }} />
        </div>

        <motion.div {...fade(0)} className="relative z-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-[10px] uppercase tracking-[0.25em] font-semibold"
            style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)", color: "rgba(240,180,41,0.7)" }}>
            <MapPin className="h-2.5 w-2.5" />
            Café de origen colombiano
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-8"
            style={{ color: "rgba(255,240,210,0.95)" }}>
            Del grano<br />
            <span style={{ color: "#F0B429" }}>a tu</span>{" "}
            <span style={{ color: "rgba(255,240,210,0.3)" }}>taza.</span>
          </h1>

          <p className="text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: "rgba(255,240,210,0.45)" }}>
            Café tostado artesanalmente en pequeños lotes. Seleccionamos los mejores granos
            de origen colombiano para llevarte una experiencia única en cada taza.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#cafe"
              className="flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                color: "#3D1F00",
                boxShadow: "0 8px 32px rgba(240,180,41,0.3)",
              }}>
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-xl"
              style={{
                background: "rgba(255,240,210,0.06)",
                border: "1px solid rgba(255,240,210,0.12)",
                color: "rgba(255,240,210,0.75)",
              }}>
              <MessageCircle className="h-4 w-4" />
              Pedir ahora
            </a>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}>
          <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,240,210,0.2)" }}>Explorar</p>
          <ChevronDown className="h-4 w-4" style={{ color: "rgba(255,240,210,0.2)" }} />
        </motion.div>
      </section>

      {/* ── Valores ── */}
      <section className="px-6 md:px-16 py-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VALORES.map(({ icon: Icon, titulo, desc }, i) => (
            <motion.div key={titulo} {...fade(i * 0.1)}
              className="rounded-2xl p-6 flex flex-col gap-3"
              style={{ background: "rgba(255,240,210,0.03)", border: "1px solid rgba(255,240,210,0.06)" }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.18)" }}>
                <Icon className="h-5 w-5" style={{ color: "#F0B429" }} />
              </div>
              <p className="font-bold text-sm" style={{ color: "rgba(255,240,210,0.9)" }}>{titulo}</p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,240,210,0.38)" }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px max-w-5xl mx-auto px-6 md:px-16"
        style={{ background: "linear-gradient(90deg, transparent, rgba(240,180,41,0.15), transparent)" }} />

      {/* ── Catálogo de productos ── */}
      <section id="cafe" className="px-6 md:px-16 py-20 max-w-5xl mx-auto">
        <motion.div {...fade(0)} className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2"
            style={{ color: "rgba(240,180,41,0.55)" }}>Nuestros cafés</p>
          <h2 className="text-3xl md:text-4xl font-black" style={{ color: "rgba(255,240,210,0.92)" }}>
            Encuentra tu favorito
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRODUCTOS.map((p, i) => (
            <motion.div key={p.nombre} {...fade(i * 0.08)}
              className="group rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(255,240,210,0.03)",
                border: "1px solid rgba(255,240,210,0.07)",
              }}>
              {/* Imagen del producto */}
              <div className="h-48 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(240,180,41,0.08) 0%, rgba(10,6,3,0) 100%)" }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-2xl overflow-hidden opacity-30"
                    style={{ background: "rgba(240,180,41,0.1)" }}>
                    <Image src="/logo-encuentro.png" alt={p.nombre} width={96} height={96} className="object-contain p-2" />
                  </div>
                </div>
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{ background: "rgba(240,180,41,0.15)", color: "rgba(240,180,41,0.8)", border: "1px solid rgba(240,180,41,0.2)" }}>
                    {p.proceso}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,240,210,0.08)", color: "rgba(255,240,210,0.5)", border: "1px solid rgba(255,240,210,0.1)" }}>
                    {p.tipo === "grano" ? "En grano" : "Molido"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <h3 className="font-black text-base mb-1" style={{ color: "rgba(255,240,210,0.92)" }}>{p.nombre}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,240,210,0.38)" }}>{p.descripcion}</p>
                </div>

                {/* Presentaciones */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {p.presentaciones.map(pr => (
                    <span key={pr} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: "rgba(240,180,41,0.08)", color: "rgba(240,180,41,0.6)", border: "1px solid rgba(240,180,41,0.12)" }}>
                      {pr}
                    </span>
                  ))}
                </div>

                <a href={WA} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl mt-1 transition-all"
                  style={{
                    background: "rgba(240,180,41,0.08)",
                    border: "1px solid rgba(240,180,41,0.15)",
                    color: "rgba(240,180,41,0.75)",
                  }}>
                  <MessageCircle className="h-3.5 w-3.5" />
                  Pedir este café
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Nosotros ── */}
      <section id="nosotros" className="px-6 md:px-16 py-20 max-w-5xl mx-auto">
        <div className="rounded-3xl p-8 md:p-14 text-center"
          style={{ background: "rgba(240,180,41,0.04)", border: "1px solid rgba(240,180,41,0.1)" }}>
          <motion.div {...fade(0)}>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-[10px] uppercase tracking-[0.22em] font-semibold"
              style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)", color: "rgba(240,180,41,0.6)" }}>
              <Star className="h-2.5 w-2.5" />
              Nuestra historia
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,240,210,0.92)" }}>
              Cada taza es un{" "}
              <span style={{ color: "#F0B429" }}>encuentro</span>{" "}
              con Colombia.
            </h2>
            <p className="text-sm md:text-base leading-relaxed max-w-lg mx-auto"
              style={{ color: "rgba(255,240,210,0.4)" }}>
              Nacimos de la pasión por el café colombiano. Trabajamos directamente
              con productores, seleccionamos cada lote con cuidado y tostamos artesanalmente
              para que llegue a ti con el mejor perfil posible. Sin intermediarios. Sin compromisos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA contacto ── */}
      <section id="contacto" className="px-6 md:px-16 py-20 max-w-5xl mx-auto text-center">
        <motion.div {...fade(0)}>
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-3" style={{ color: "rgba(240,180,41,0.5)" }}>
            ¿Quieres pedir?
          </p>
          <h2 className="text-2xl md:text-3xl font-black mb-8" style={{ color: "rgba(255,240,210,0.9)" }}>
            Escríbenos directamente
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-bold px-8 py-3.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "#fff",
                boxShadow: "0 4px 24px rgba(37,211,102,0.25)",
              }}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a href={IG} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-semibold px-8 py-3.5 rounded-xl"
              style={{
                background: "rgba(255,240,210,0.06)",
                border: "1px solid rgba(255,240,210,0.12)",
                color: "rgba(255,240,210,0.7)",
              }}>
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-6 md:px-16 py-8" style={{ borderColor: "rgba(255,240,210,0.06)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg overflow-hidden">
              <Image src="/logo-encuentro.png" alt="El Encuentro" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-xs font-bold" style={{ color: "rgba(255,240,210,0.4)" }}>El Encuentro · Café de Colombia</span>
          </div>
          <a href="https://contabilidad.cafeelencuentro.com"
            className="text-[10px] transition-colors"
            style={{ color: "rgba(255,240,210,0.15)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,180,41,0.4)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,240,210,0.15)")}>
            Sistema de gestión interno →
          </a>
        </div>
      </footer>
    </div>
  )
}

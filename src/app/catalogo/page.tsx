"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, MessageCircle, Instagram, ChevronDown } from "lucide-react"

/* ── Constantes ─────────────────────────────────────────────────────────── */

const WA = "https://wa.me/573000000000"
const IG  = "https://instagram.com/cafeelencuentro"

// Imagen temporal de referencia — reemplazar por fotos propias
const IMG_GRANOS = "https://static.wixstatic.com/media/d45c6a_e1a67dd6fce14ac78022eaf955bd3b91~mv2.png/v1/fill/w_498,h_498,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/d45c6a_e1a67dd6fce14ac78022eaf955bd3b91~mv2.png"

const PRODUCTOS = [
  {
    id: 1,
    nombre: "Tostado Oscuro",
    tipo: "En Grano",
    proceso: "Natural",
    descripcion: "Cuerpo intenso. Notas de chocolate amargo, caramelo y especias.",
    presentaciones: ["250 g", "450 g", "2.5 kg"],
    img: IMG_GRANOS,
  },
  {
    id: 2,
    nombre: "Tostado Medio",
    tipo: "Molido",
    proceso: "Washed",
    descripcion: "Balance perfecto. Acidez suave, dulzura de miel y fruta madura.",
    presentaciones: ["250 g", "450 g"],
    img: IMG_GRANOS,
  },
  {
    id: 3,
    nombre: "Especialidad",
    tipo: "En Grano",
    proceso: "Honey",
    descripcion: "Lotes seleccionados SCA ≥ 82. Perfil complejo, taza limpia y memorable.",
    presentaciones: ["250 g", "450 g", "2.5 kg"],
    img: IMG_GRANOS,
  },
  {
    id: 4,
    nombre: "Filtro & Cold Brew",
    tipo: "Molido grueso",
    proceso: "Washed",
    descripcion: "Molido especial para filtro, chemex, V60 o cold brew de 24 horas.",
    presentaciones: ["250 g", "450 g"],
    img: IMG_GRANOS,
  },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fade(delay = 0, y = 24) {
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, delay },
  }
}

/* ── Componentes ─────────────────────────────────────────────────────────── */

function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16"
      style={{
        height: 72,
        background: "rgba(10,6,3,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,240,210,0.05)",
      }}
    >
      {/* Logo */}
      <a href="#" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div
          className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.22)" }}
        >
          <Image src="/logo-encuentro.png" alt="El Encuentro" width={36} height={36} className="object-contain" priority />
        </div>
        <span className="font-black text-sm tracking-tight" style={{ color: "rgba(255,240,210,0.9)" }}>
          El Encuentro
        </span>
      </a>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(255,240,210,0.4)" }}>
        {["#cafe", "#nosotros", "#contacto"].map((href, i) => (
          <a key={href} href={href}
            className="hover:text-amber-400 transition-colors"
            style={{ color: "rgba(255,240,210,0.4)" }}
          >
            {["Café", "Nosotros", "Contacto"][i]}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <a href={WA} target="_blank" rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
            color: "#3D1F00",
          }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Pedir ahora
        </a>
        <a href="https://contabilidad.cafeelencuentro.com" target="_blank" rel="noopener noreferrer"
          className="text-[11px] px-3 py-1.5 rounded-lg"
          style={{ color: "rgba(255,240,210,0.25)", border: "1px solid rgba(255,240,210,0.08)" }}
        >
          Acceso interno
        </a>
      </div>
    </nav>
  )
}

/* ── Página ──────────────────────────────────────────────────────────────── */

export default function CatalogoPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#0A0603", color: "rgba(255,240,210,0.88)" }}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-end pb-20 md:pb-32">

        {/* Imagen de fondo */}
        <div className="absolute inset-0">
          <Image
            src={IMG_GRANOS}
            alt="Granos de café El Encuentro"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Gradientes sobre la imagen */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,6,3,0.55) 0%, rgba(10,6,3,0.2) 40%, rgba(10,6,3,0.85) 80%, rgba(10,6,3,1) 100%)" }}
          />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(10,6,3,0.6) 0%, transparent 60%)" }}
          />
        </div>

        {/* Contenido del hero */}
        <div className="relative z-10 px-6 md:px-16 max-w-3xl">
          <motion.div {...fade(0.1)}>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
              style={{
                background: "rgba(240,180,41,0.12)",
                border: "1px solid rgba(240,180,41,0.25)",
                color: "rgba(240,180,41,0.75)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}>
              <MapPin className="h-2.5 w-2.5" />
              Café de origen — Colombia
            </div>
          </motion.div>

          <motion.h1 {...fade(0.2)}
            className="font-black leading-none tracking-tight mb-6"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)", color: "rgba(255,240,210,0.97)" }}
          >
            Del grano<br />
            a tu <span style={{ color: "#F0B429" }}>taza.</span>
          </motion.h1>

          <motion.p {...fade(0.3)}
            className="text-base md:text-lg leading-relaxed mb-10 max-w-md"
            style={{ color: "rgba(255,240,210,0.5)" }}
          >
            Café tostado artesanalmente en pequeños lotes. Seleccionamos los mejores granos
            colombianos para una experiencia única en cada taza.
          </motion.p>

          <motion.div {...fade(0.4)} className="flex flex-wrap gap-4">
            <a href="#cafe"
              className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                color: "#3D1F00",
                boxShadow: "0 8px 32px rgba(240,180,41,0.3)",
              }}
            >
              Ver productos <ArrowRight className="h-4 w-4" />
            </a>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-xl"
              style={{
                background: "rgba(255,240,210,0.06)",
                border: "1px solid rgba(255,240,210,0.12)",
                color: "rgba(255,240,210,0.75)",
              }}
            >
              <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
            </a>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 right-8 z-10 flex flex-col items-center gap-1.5"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,240,210,0.2)" }}>scroll</span>
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "rgba(255,240,210,0.2)" }} />
        </motion.div>
      </section>

      {/* ══ INTRO STRIP ═══════════════════════════════════════════════════ */}
      <section className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl"
          style={{ background: "rgba(255,240,210,0.06)" }}>
          {[
            { num: "100%", label: "Origen colombiano" },
            { num: "SCA+82", label: "Calidad especialidad" },
            { num: "24h", label: "Entrega directa" },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col items-center justify-center py-8 px-4 text-center"
              style={{ background: "#0A0603" }}>
              <p className="text-2xl md:text-3xl font-black tabular-nums mb-1" style={{ color: "#F0B429" }}>{num}</p>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.35)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PRODUCTOS ═════════════════════════════════════════════════════ */}
      <section id="cafe" className="px-6 md:px-16 py-16 max-w-6xl mx-auto">
        <motion.div {...fade(0)} className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: "rgba(240,180,41,0.55)" }}>
            Nuestros cafés
          </p>
          <h2 className="text-3xl md:text-5xl font-black leading-none" style={{ color: "rgba(255,240,210,0.93)" }}>
            Encuentra el tuyo
          </h2>
        </motion.div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRODUCTOS.map((p, i) => (
            <motion.div key={p.id} {...fade(i * 0.08)}
              className="group relative rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "rgba(255,240,210,0.02)", border: "1px solid rgba(255,240,210,0.07)" }}
            >
              {/* Imagen */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={p.img}
                  alt={p.nombre}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, rgba(10,6,3,0.1) 0%, rgba(10,6,3,0.7) 100%)" }}
                />
                {/* Badge proceso */}
                <div className="absolute top-4 left-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(240,180,41,0.18)", color: "rgba(240,180,41,0.9)", border: "1px solid rgba(240,180,41,0.25)" }}>
                    {p.proceso}
                  </span>
                </div>
                {/* Nombre sobre imagen */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-black" style={{ color: "rgba(255,240,210,0.95)" }}>{p.nombre}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,240,210,0.5)" }}>{p.tipo}</p>
                </div>
              </div>

              {/* Descripción + presentaciones */}
              <div className="p-5 flex flex-col gap-4 flex-1">
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,240,210,0.4)" }}>
                  {p.descripcion}
                </p>

                <div className="flex flex-wrap gap-2">
                  {p.presentaciones.map(pr => (
                    <span key={pr} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: "rgba(240,180,41,0.08)", color: "rgba(240,180,41,0.65)", border: "1px solid rgba(240,180,41,0.14)" }}>
                      {pr}
                    </span>
                  ))}
                </div>

                <a href={WA} target="_blank" rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl transition-all"
                  style={{
                    background: "rgba(240,180,41,0.07)",
                    border: "1px solid rgba(240,180,41,0.15)",
                    color: "rgba(240,180,41,0.75)",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)"
                    e.currentTarget.style.color = "#3D1F00"
                    e.currentTarget.style.border = "1px solid transparent"
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(240,180,41,0.07)"
                    e.currentTarget.style.color = "rgba(240,180,41,0.75)"
                    e.currentTarget.style.border = "1px solid rgba(240,180,41,0.15)"
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Pedir este café
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ HISTORIA ══════════════════════════════════════════════════════ */}
      <section id="nosotros" className="px-6 md:px-16 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">

          {/* Imagen */}
          <motion.div {...fade(0)} className="relative h-80 md:h-[500px] rounded-2xl overflow-hidden">
            <Image
              src={IMG_GRANOS}
              alt="Café El Encuentro — Origen"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(240,180,41,0.1) 0%, rgba(10,6,3,0.4) 100%)" }}
            />
          </motion.div>

          {/* Texto */}
          <motion.div {...fade(0.15)} className="flex flex-col gap-6 md:pl-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-3" style={{ color: "rgba(240,180,41,0.55)" }}>
                Nuestra historia
              </p>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4" style={{ color: "rgba(255,240,210,0.93)" }}>
                Cada taza es un<br />
                <span style={{ color: "#F0B429" }}>encuentro</span><br />
                con Colombia.
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,240,210,0.4)" }}>
                Nacimos de la pasión por el café colombiano de altura. Trabajamos directamente
                con productores de confianza, seleccionamos cada lote con cuidado y lo tostamos
                artesanalmente en pequeños lotes para que llegue a ti con el mejor perfil posible.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Origen directo", desc: "Sin intermediarios, precio justo al productor" },
                { label: "Lotes pequeños", desc: "Control total del tostado en cada proceso" },
                { label: "Trazabilidad", desc: "Sabes de qué finca viene tu café" },
                { label: "Fresco siempre", desc: "Tostado justo antes de entregar" },
              ].map(({ label, desc }) => (
                <div key={label} className="rounded-xl p-3"
                  style={{ background: "rgba(255,240,210,0.03)", border: "1px solid rgba(255,240,210,0.06)" }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "rgba(255,240,210,0.82)" }}>{label}</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,240,210,0.33)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA FINAL ═════════════════════════════════════════════════════ */}
      <section id="contacto" className="px-6 md:px-16 py-20">
        <motion.div {...fade(0)}
          className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative flex flex-col items-center justify-center py-20 text-center"
          style={{ background: "rgba(240,180,41,0.05)", border: "1px solid rgba(240,180,41,0.1)" }}
        >
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold mb-4" style={{ color: "rgba(240,180,41,0.55)" }}>
            Hablemos
          </p>
          <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight" style={{ color: "rgba(255,240,210,0.93)" }}>
            ¿Listo para tu<br />próximo café?
          </h2>
          <p className="text-sm mb-10 max-w-md" style={{ color: "rgba(255,240,210,0.38)" }}>
            Escríbenos por WhatsApp y te asesoramos para encontrar el café perfecto para ti.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-bold px-8 py-4 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "#fff",
                boxShadow: "0 8px 32px rgba(37,211,102,0.25)",
              }}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a href={IG} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-semibold px-8 py-4 rounded-xl"
              style={{
                background: "rgba(255,240,210,0.06)",
                border: "1px solid rgba(255,240,210,0.12)",
                color: "rgba(255,240,210,0.7)",
              }}>
              <Instagram className="h-4 w-4" />
              @cafeelencuentro
            </a>
          </div>
        </motion.div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="px-6 md:px-16 py-8 border-t" style={{ borderColor: "rgba(255,240,210,0.05)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg overflow-hidden">
              <Image src="/logo-encuentro.png" alt="El Encuentro" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-xs font-bold" style={{ color: "rgba(255,240,210,0.35)" }}>
              El Encuentro · Café tostado · Colombia
            </span>
          </div>
          <a href="https://contabilidad.cafeelencuentro.com"
            className="text-[10px] transition-colors hover:text-amber-400"
            style={{ color: "rgba(255,240,210,0.15)" }}>
            Acceso sistema interno →
          </a>
        </div>
      </footer>
    </div>
  )
}

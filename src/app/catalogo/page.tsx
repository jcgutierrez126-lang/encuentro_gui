"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, MapPin, MessageCircle, Instagram } from "lucide-react"

/* ── Config ──────────────────────────────────────────────────────────────── */

const WA = "https://wa.me/573000000000"
const IG = "https://www.instagram.com/cafe.el.encuentro"

// Imágenes Unsplash — reemplazar por las propias
const IMGS = {
  hero:       "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=90&fit=crop",
  tostado:    "/tueste.jpeg",
  empaque:    "/presentacion_empaque.jpeg",
  tueste2:    "/tueste2.jpeg",
  origen:     "/redes_cuatro.jpeg",
}

const PRODUCTOS = [
  { nombre: "Tostado Medio",  subtitulo: "Filtro · V60",     proceso: "Washed",   tipo: "Grano / Molido", img: IMGS.tostado,  desc: "Balance perfecto. Acidez brillante, dulzura de panela y fruta madura." },
  { nombre: "Especialidad",   subtitulo: "SCA 84 pts",       proceso: "Honey",    tipo: "En grano",       img: IMGS.empaque,  desc: "Lotes seleccionados con puntaje SCA 84. Perfil complejo, taza limpia y memorable." },
  { nombre: "Cold Brew",      subtitulo: "Molienda gruesa",  proceso: "Washed",   tipo: "Molido",         img: IMGS.tueste2,  desc: "Molido especial para cold brew 24 h o cafetera de filtro lento." },
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const serif = { fontFamily: "'Cormorant Garant', Georgia, serif" }

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] },
  }
}

/* ── Navbar ──────────────────────────────────────────────────────────────── */

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-14"
      style={{ height: 68, background: "rgba(8,4,2,0.82)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,240,210,0.04)" }}>

      <a href="#" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
        <Image
          src="/logo-encuentro.png"
          alt="El Encuentro"
          width={40}
          height={40}
          className="object-contain"
          style={{ mixBlendMode: "luminosity", opacity: 0.85 }}
          priority
        />
        <span className="text-sm font-black tracking-tight" style={{ color: "rgba(255,240,210,0.88)", ...serif }}>
          El Encuentro
        </span>
      </a>

      <div className="hidden md:flex items-center gap-10">
        {[["#cafe","Café"],["#origen","Origen"],["#contacto","Contacto"]].map(([href,label]) => (
          <a key={href} href={href} className="text-xs uppercase tracking-[0.18em] transition-colors"
            style={{ color: "rgba(255,240,210,0.35)", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(240,180,41,0.75)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,240,210,0.35)")}>
            {label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <a href={WA} target="_blank" rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg"
          style={{ background: "linear-gradient(135deg,#F0B429,#C88A1A)", color: "#2D1600" }}>
          Pedir
        </a>
        <a href="https://contabilidad.cafeelencuentro.com" target="_blank" rel="noopener noreferrer"
          className="text-[10px] px-3 py-1.5 rounded-lg"
          style={{ color: "rgba(255,240,210,0.18)", border: "1px solid rgba(255,240,210,0.06)" }}>
          Sistema
        </a>
      </div>
    </nav>
  )
}

/* ── Hero paralax ────────────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start","end start"] })
  const imgY = useTransform(scrollYProgress, [0,1], ["0%","20%"])

  return (
    <section ref={ref} className="relative h-screen flex items-end overflow-hidden">
      {/* Imagen con parallax */}
      <motion.div className="absolute inset-0" style={{ y: imgY }}>
        <Image src={IMGS.hero} alt="Café El Encuentro" fill className="object-cover object-top" priority quality={90} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(8,4,2,0.3) 0%,rgba(8,4,2,0.15) 30%,rgba(8,4,2,0.85) 75%,rgba(8,4,2,1) 100%)" }} />
      </motion.div>

      {/* Copy */}
      <div className="relative z-10 px-6 md:px-14 pb-20 md:pb-28 w-full max-w-5xl">
        <motion.p {...fadeUp(0.1)}
          className="inline-flex items-center gap-2 mb-6 text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: "rgba(240,180,41,0.65)" }}>
          <MapPin className="h-2.5 w-2.5" /> Café de origen — Colombia
        </motion.p>

        <motion.h1 {...fadeUp(0.2)}
          className="mb-6 leading-none"
          style={{ ...serif, fontSize: "clamp(3.8rem,10vw,8.5rem)", fontWeight: 300, color: "rgba(255,240,210,0.97)", letterSpacing: "-0.01em" }}>
          Del grano<br />
          a tu{" "}
          <em style={{ color: "#F0B429", fontStyle: "italic" }}>taza.</em>
        </motion.h1>

        <motion.p {...fadeUp(0.3)}
          className="text-base md:text-lg leading-relaxed mb-10 max-w-md"
          style={{ color: "rgba(255,240,210,0.42)", fontWeight: 300 }}>
          Tostado artesanal en lotes pequeños. Seleccionamos los mejores granos
          colombianos para una experiencia que no olvidarás.
        </motion.p>

        <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-4">
          <a href="#cafe"
            className="inline-flex items-center gap-2.5 font-bold px-7 py-3.5 rounded-xl text-sm"
            style={{ background: "linear-gradient(135deg,#F0B429,#B87A14)", color: "#2D1600", boxShadow: "0 8px 40px rgba(240,180,41,0.35)" }}>
            Ver catálogo <ArrowRight className="h-4 w-4" />
          </a>
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 font-medium px-7 py-3.5 rounded-xl text-sm"
            style={{ background: "rgba(255,240,210,0.07)", border: "1px solid rgba(255,240,210,0.12)", color: "rgba(255,240,210,0.72)" }}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Strip números ───────────────────────────────────────────────────────── */

function Strip() {
  return (
    <div className="border-y" style={{ borderColor: "rgba(255,240,210,0.06)" }}>
      <div className="max-w-5xl mx-auto px-6 md:px-14 grid grid-cols-3 divide-x"
        style={{ borderColor: "rgba(255,240,210,0.06)" }}>
        {[["100%","Origen directo"],["SCA +82","Calidad especialidad"],["Lote a lote","Tostado artesanal"]].map(([n,l]) => (
          <div key={l} className="flex flex-col items-center justify-center py-10 gap-1.5 text-center">
            <p className="font-black text-2xl md:text-3xl" style={{ ...serif, color: "#F0B429", fontWeight: 700 }}>{n}</p>
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,240,210,0.3)" }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Productos ───────────────────────────────────────────────────────────── */

function Productos() {
  return (
    <section id="cafe" className="py-24 px-6 md:px-14 max-w-5xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-14">
        <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-3" style={{ color: "rgba(240,180,41,0.5)" }}>
          Nuestros cafés
        </p>
        <h2 className="leading-none" style={{ ...serif, fontSize: "clamp(2.2rem,5vw,4rem)", fontWeight: 300, color: "rgba(255,240,210,0.93)" }}>
          Encuentra tu<br /><em style={{ fontStyle: "italic", color: "#F0B429" }}>favorito</em>
        </h2>
      </motion.div>

      <div className="space-y-4">
        {PRODUCTOS.map((p, i) => (
          <motion.div key={p.nombre} {...fadeUp(i * 0.07)}
            className="group flex flex-col md:flex-row rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,240,210,0.06)", background: "rgba(255,240,210,0.02)" }}>

            {/* Imagen — crece igual que el panel de texto */}
            <div className="relative h-56 md:h-auto md:flex-1 overflow-hidden" style={{ minHeight: 220 }}>
              <Image src={p.img} alt={p.nombre} fill
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 65vw" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right,rgba(8,4,2,0) 40%,rgba(8,4,2,0.6) 100%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(8,4,2,0) 50%,rgba(8,4,2,0.7) 100%)" }} />

              {/* Info sobre imagen */}
              <div className="absolute bottom-5 left-5 md:hidden">
                <h3 className="text-xl font-black" style={{ ...serif, color: "rgba(255,240,210,0.95)" }}>{p.nombre}</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(240,180,41,0.7)" }}>{p.subtitulo}</p>
              </div>
            </div>

            {/* Texto */}
            <div className="p-6 md:p-8 flex flex-col justify-between md:min-w-[280px] md:max-w-xs">
              <div>
                <div className="hidden md:block mb-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(240,180,41,0.1)", color: "rgba(240,180,41,0.7)", border: "1px solid rgba(240,180,41,0.18)" }}>
                    {p.proceso}
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-1 hidden md:block" style={{ ...serif, color: "rgba(255,240,210,0.93)", fontWeight: 600 }}>{p.nombre}</h3>
                <p className="text-xs mb-3 hidden md:block" style={{ color: "rgba(240,180,41,0.6)", fontWeight: 500 }}>{p.subtitulo}</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,240,210,0.38)", fontWeight: 300 }}>{p.desc}</p>
              </div>
              <div className="mt-6">
                <span className="text-[10px] uppercase tracking-wider block mb-4" style={{ color: "rgba(255,240,210,0.3)" }}>{p.tipo}</span>
                <a href={WA} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3 rounded-xl w-full transition-all duration-300"
                  style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.15)", color: "rgba(240,180,41,0.7)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#F0B429,#C88A1A)"; e.currentTarget.style.color = "#2D1600"; e.currentTarget.style.borderColor = "transparent" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(240,180,41,0.08)"; e.currentTarget.style.color = "rgba(240,180,41,0.7)"; e.currentTarget.style.borderColor = "rgba(240,180,41,0.15)" }}>
                  <MessageCircle className="h-3.5 w-3.5" /> Pedir este café
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ── Origen / Historia ───────────────────────────────────────────────────── */

function Origen() {
  return (
    <section id="origen" className="py-24">
      <div className="max-w-5xl mx-auto px-6 md:px-14 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        <motion.div {...fadeUp(0)} className="relative h-[500px] rounded-2xl overflow-hidden">
          <Image src={IMGS.origen} alt="Origen del café — Andes colombianos" fill className="object-cover object-center" sizes="(max-width:768px) 100vw, 50vw" />
          <div className="absolute inset-0 rounded-2xl" style={{ background: "linear-gradient(135deg,rgba(240,180,41,0.08),rgba(8,4,2,0.5))" }} />
          {/* Quote sobre imagen */}
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-2xl leading-tight" style={{ ...serif, color: "rgba(255,240,210,0.9)", fontWeight: 300, fontStyle: "italic" }}>
              "Cada taza es un encuentro con Colombia."
            </p>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="flex flex-col gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-4" style={{ color: "rgba(240,180,41,0.5)" }}>Nuestra historia</p>
            <h2 className="leading-none mb-5" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 300, color: "rgba(255,240,210,0.93)" }}>
              Del campo<br />
              a tu <em style={{ fontStyle: "italic", color: "#F0B429" }}>mesa.</em>
            </h2>
            <p className="text-sm leading-loose" style={{ color: "rgba(255,240,210,0.38)", fontWeight: 300 }}>
              Nacimos de la pasión por el café colombiano de altura. Trabajamos directamente
              con productores, seleccionamos cada lote con cuidado y tostamos en pequeños lotes
              para preservar lo mejor de cada grano.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { n: "01", t: "Origen directo",    d: "Sin intermediarios. Precio justo al productor." },
              { n: "02", t: "Tostado artesanal",  d: "Lotes pequeños con control total del perfil." },
              { n: "03", t: "Fresco siempre",     d: "Tostado justo antes de cada entrega." },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex gap-5 items-start">
                <span className="text-[11px] font-bold tabular-nums mt-0.5 flex-shrink-0" style={{ color: "rgba(240,180,41,0.45)", ...serif }}>{n}</span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "rgba(255,240,210,0.82)" }}>{t}</p>
                  <p className="text-xs" style={{ color: "rgba(255,240,210,0.35)", fontWeight: 300 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── CTA final ───────────────────────────────────────────────────────────── */

function CtaFinal() {
  return (
    <section id="contacto" className="py-24 px-6 md:px-14">
      <motion.div {...fadeUp(0)}
        className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden flex flex-col items-center justify-center py-24 px-6 text-center"
        style={{ border: "1px solid rgba(255,240,210,0.06)" }}>

        {/* Imagen de fondo tenue */}
        <div className="absolute inset-0">
          <Image src={IMGS.granos} alt="" fill className="object-cover object-center opacity-15" />
          <div className="absolute inset-0" style={{ background: "rgba(8,4,2,0.75)" }} />
        </div>

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-5" style={{ color: "rgba(240,180,41,0.5)" }}>
            Hablemos
          </p>
          <h2 className="mb-4 leading-none" style={{ ...serif, fontSize: "clamp(2.5rem,6vw,5rem)", fontWeight: 300, color: "rgba(255,240,210,0.95)" }}>
            ¿Listo para tu<br />
            <em style={{ color: "#F0B429", fontStyle: "italic" }}>próximo café?</em>
          </h2>
          <p className="text-sm mb-12 max-w-sm mx-auto" style={{ color: "rgba(255,240,210,0.35)", fontWeight: 300 }}>
            Escríbenos y te ayudamos a encontrar el café perfecto para ti o tu negocio.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 font-bold text-sm px-8 py-4 rounded-xl"
              style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", boxShadow: "0 8px 32px rgba(37,211,102,0.25)" }}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href={IG} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 font-medium text-sm px-8 py-4 rounded-xl"
              style={{ background: "rgba(255,240,210,0.06)", border: "1px solid rgba(255,240,210,0.1)", color: "rgba(255,240,210,0.65)" }}>
              <Instagram className="h-4 w-4" /> @cafe.el.encuentro
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t px-6 md:px-14 py-8" style={{ borderColor: "rgba(255,240,210,0.05)" }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-encuentro.png" alt="El Encuentro" width={24} height={24}
            className="object-contain" style={{ mixBlendMode: "luminosity", opacity: 0.45 }} />
          <span className="text-xs font-semibold" style={{ color: "rgba(255,240,210,0.3)", ...serif }}>
            El Encuentro · Café de Colombia
          </span>
        </div>
        <a href="https://contabilidad.cafeelencuentro.com"
          className="text-[10px] hover:text-amber-400 transition-colors"
          style={{ color: "rgba(255,240,210,0.12)" }}>
          Sistema interno →
        </a>
      </div>
    </footer>
  )
}

/* ── Export ──────────────────────────────────────────────────────────────── */

export default function CatalogoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080402" }}>
      <Navbar />
      <Hero />
      <Strip />
      <Productos />
      <Origen />
      <CtaFinal />
      <Footer />
    </div>
  )
}

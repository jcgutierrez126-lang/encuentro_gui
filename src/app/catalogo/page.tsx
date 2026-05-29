"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { MapPin, Instagram, MessageCircle, Coffee, Leaf, Award } from "lucide-react"

const PRODUCTOS = [
  {
    nombre: "250 g · En Grano",
    desc: "Café tostado entero. Ideal para moler en casa y disfrutar el aroma fresco.",
    tipo: "grano",
    badge: "Más popular",
  },
  {
    nombre: "250 g · Molido",
    desc: "Molido mediano, perfecto para cafetera de filtro, prensa francesa o moka.",
    tipo: "molido",
    badge: null,
  },
  {
    nombre: "450 g · En Grano",
    desc: "Presentación familiar. Grano entero para baristas y amantes del café en casa.",
    tipo: "grano",
    badge: null,
  },
  {
    nombre: "450 g · Molido",
    desc: "Molido listo para usar. Sin aditivos, sin mezclas. Solo café de origen.",
    tipo: "molido",
    badge: null,
  },
  {
    nombre: "2.5 kg · En Grano",
    desc: "Para cafeterías, restaurantes y hogares con alto consumo. A granel premium.",
    tipo: "grano",
    badge: "Restaurantes",
  },
  {
    nombre: "2.5 kg · Molido",
    desc: "Volumen profesional, calidad artesanal. Entrega directa a tu negocio.",
    tipo: "molido",
    badge: null,
  },
]

const CALIDADES = [
  {
    nombre: "Pergamino Seco",
    desc: "Proceso húmedo tradicional. Notas de caramelo, fruta madura y cuerpo balanceado.",
    icon: Coffee,
  },
  {
    nombre: "Especialidad",
    desc: "Lotes seleccionados con puntaje SCA ≥ 80. Perfil complejo y taza limpia.",
    icon: Award,
  },
]

function fade(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, delay },
  }
}

export default function CatalogoPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0D0806", color: "rgba(255,240,210,0.88)" }}>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-14 border-b" style={{ borderColor: "rgba(255,240,210,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)" }}>
            <Image src="/logo-encuentro.png" alt="El Encuentro" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="font-black text-sm leading-tight" style={{ color: "rgba(255,240,210,0.92)" }}>El Encuentro</p>
            <p className="text-[9px] uppercase tracking-[0.18em]" style={{ color: "rgba(240,180,41,0.45)" }}>café tostado · colombia</p>
          </div>
        </div>
        <a
          href="https://wa.me/573000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
          style={{
            background: "rgba(37,211,102,0.12)",
            border: "1px solid rgba(37,211,102,0.22)",
            color: "rgba(37,211,102,0.85)",
          }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Pedir por WhatsApp
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 md:px-14 pt-20 pb-16 flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-5xl mx-auto">
        <motion.div {...fade(0)} className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)", color: "rgba(240,180,41,0.65)" }}>
            <MapPin className="h-2.5 w-2.5" />
            Origen Colombia
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-[1.05] mb-5"
            style={{ color: "rgba(255,240,210,0.95)" }}>
            Café de altura,<br />
            <span style={{ color: "#F0B429" }}>tostado</span>
            {" "}
            <span style={{ color: "rgba(255,240,210,0.28)" }}>con amor.</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-md mb-8" style={{ color: "rgba(255,240,210,0.4)" }}>
            Del campo colombiano directo a tu taza. Seleccionamos los mejores granos, los tostamos en pequeños lotes
            y los entregamos frescos en las presentaciones que necesitas.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#productos"
              className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                color: "#3D1F00",
                boxShadow: "0 4px 20px rgba(240,180,41,0.25)",
              }}>
              Ver catálogo
            </a>
            <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl"
              style={{
                background: "rgba(255,240,210,0.05)",
                border: "1px solid rgba(255,240,210,0.1)",
                color: "rgba(255,240,210,0.75)",
              }}>
              <MessageCircle className="h-4 w-4" />
              Contactar
            </a>
          </div>
        </motion.div>

        {/* Logo grande */}
        <motion.div {...fade(0.15)} className="flex-shrink-0">
          <div className="h-52 w-52 md:h-64 md:w-64 rounded-3xl overflow-hidden flex items-center justify-center"
            style={{
              background: "rgba(240,180,41,0.06)",
              border: "1px solid rgba(240,180,41,0.14)",
              boxShadow: "0 16px 60px rgba(240,180,41,0.1)",
            }}>
            <Image src="/logo-encuentro.png" alt="El Encuentro" width={200} height={200}
              className="object-contain p-6"
              style={{ filter: "drop-shadow(0 4px 20px rgba(240,180,41,0.4))" }} />
          </div>
        </motion.div>
      </section>

      {/* ── Divider ── */}
      <div className="mx-6 md:mx-14 h-px mb-16 max-w-5xl mx-auto"
        style={{ background: "linear-gradient(90deg, transparent, rgba(240,180,41,0.15), transparent)" }} />

      {/* ── Calidades ── */}
      <section className="px-6 md:px-14 mb-16 max-w-5xl mx-auto">
        <motion.div {...fade(0)}>
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-4"
            style={{ color: "rgba(240,180,41,0.5)" }}>
            Nuestros cafés
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CALIDADES.map(({ nombre, desc, icon: Icon }, i) => (
            <motion.div key={nombre} {...fade(i * 0.1)}
              className="rounded-2xl p-5 flex gap-4"
              style={{ background: "rgba(240,180,41,0.05)", border: "1px solid rgba(240,180,41,0.12)" }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.18)" }}>
                <Icon className="h-5 w-5" style={{ color: "#F0B429" }} />
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: "rgba(255,240,210,0.9)" }}>{nombre}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,240,210,0.38)" }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Productos ── */}
      <section id="productos" className="px-6 md:px-14 mb-20 max-w-5xl mx-auto">
        <motion.div {...fade(0)} className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-1"
            style={{ color: "rgba(240,180,41,0.5)" }}>
            Presentaciones
          </p>
          <h2 className="text-2xl font-black" style={{ color: "rgba(255,240,210,0.92)" }}>
            Encuentra la tuya
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {PRODUCTOS.map((p, i) => (
            <motion.div key={p.nombre} {...fade(i * 0.07)}
              className="rounded-2xl p-5 flex flex-col gap-3 relative"
              style={{
                background: "rgba(255,240,210,0.03)",
                border: `1px solid ${p.tipo === 'grano' ? 'rgba(240,180,41,0.12)' : 'rgba(255,240,210,0.07)'}`,
              }}>
              {p.badge && (
                <span className="absolute top-3 right-3 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(240,180,41,0.15)", color: "rgba(240,180,41,0.7)", border: "1px solid rgba(240,180,41,0.2)" }}>
                  {p.badge}
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: p.tipo === 'grano' ? "rgba(240,180,41,0.1)" : "rgba(255,240,210,0.05)",
                    border: `1px solid ${p.tipo === 'grano' ? 'rgba(240,180,41,0.18)' : 'rgba(255,240,210,0.08)'}`,
                  }}>
                  {p.tipo === 'grano'
                    ? <Leaf className="h-3.5 w-3.5" style={{ color: "rgba(240,180,41,0.6)" }} />
                    : <Coffee className="h-3.5 w-3.5" style={{ color: "rgba(255,240,210,0.35)" }} />
                  }
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: p.tipo === 'grano' ? "rgba(240,180,41,0.55)" : "rgba(255,240,210,0.3)" }}>
                  {p.tipo === 'grano' ? 'En grano' : 'Molido'}
                </span>
              </div>
              <div>
                <p className="font-bold text-sm mb-1.5" style={{ color: "rgba(255,240,210,0.88)" }}>{p.nombre}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,240,210,0.32)" }}>{p.desc}</p>
              </div>
              <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer"
                className="mt-auto text-xs font-semibold py-2 rounded-lg text-center transition-all"
                style={{
                  background: "rgba(240,180,41,0.08)",
                  border: "1px solid rgba(240,180,41,0.15)",
                  color: "rgba(240,180,41,0.7)",
                }}>
                Pedir este
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Historia ── */}
      <section className="px-6 md:px-14 mb-20 max-w-5xl mx-auto">
        <div className="rounded-3xl p-8 md:p-12 text-center"
          style={{ background: "rgba(240,180,41,0.05)", border: "1px solid rgba(240,180,41,0.1)" }}>
          <motion.div {...fade(0)}>
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-4"
              style={{ color: "rgba(240,180,41,0.5)" }}>
              Nuestra historia
            </p>
            <h2 className="text-2xl md:text-3xl font-black mb-5 max-w-xl mx-auto"
              style={{ color: "rgba(255,240,210,0.92)" }}>
              Del campo colombiano<br />
              <span style={{ color: "#F0B429" }}>directo a tu mesa.</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-lg mx-auto"
              style={{ color: "rgba(255,240,210,0.38)" }}>
              El Encuentro nació de la pasión por el café colombiano de altura. Trabajamos directamente con
              productores de confianza, seleccionamos cada lote con cuidado y lo tostamos artesanalmente
              para que llegues a ti con el mejor sabor posible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA WhatsApp ── */}
      <section className="px-6 md:px-14 mb-20 max-w-5xl mx-auto text-center">
        <motion.div {...fade(0)}>
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-3"
            style={{ color: "rgba(240,180,41,0.5)" }}>
            ¿Listo para pedir?
          </p>
          <h2 className="text-2xl font-black mb-6" style={{ color: "rgba(255,240,210,0.9)" }}>
            Escríbenos por WhatsApp
          </h2>
          <a
            href="https://wa.me/573000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-sm font-bold px-8 py-3.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              color: "#fff",
              boxShadow: "0 4px 24px rgba(37,211,102,0.25)",
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Hablar con nosotros
          </a>
          <p className="mt-4 text-xs" style={{ color: "rgba(255,240,210,0.2)" }}>
            También en Instagram
            <a href="https://instagram.com/cafeelencuentro" target="_blank" rel="noopener noreferrer"
              className="ml-1.5 inline-flex items-center gap-1"
              style={{ color: "rgba(240,180,41,0.45)" }}>
              <Instagram className="h-3 w-3" /> @cafeelencuentro
            </a>
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-6 py-8 text-center" style={{ borderColor: "rgba(255,240,210,0.06)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-lg overflow-hidden">
            <Image src="/logo-encuentro.png" alt="El Encuentro" width={24} height={24} className="object-contain" />
          </div>
          <span className="text-xs font-bold" style={{ color: "rgba(255,240,210,0.5)" }}>El Encuentro</span>
        </div>
        <p className="text-[10px]" style={{ color: "rgba(255,240,210,0.15)" }}>
          Café de origen colombiano · Tostado artesanalmente
        </p>
        <a href="https://contabilidad.cafeelencuentro.com" className="mt-3 block text-[10px]"
          style={{ color: "rgba(255,240,210,0.1)" }}>
          Acceso sistema interno →
        </a>
      </footer>

    </div>
  )
}

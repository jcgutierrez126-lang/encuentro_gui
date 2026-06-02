"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowRight } from "lucide-react"
import { saveAuth } from "@/lib/auth"

const Beams = dynamic(() => import("@/components/beams"), { ssr: false })

const serif = { fontFamily: "'Cormorant Garant', Georgia, serif" }

const ROLES = [
  { id: "administrador", label: "Administrador" },
  { id: "asesor",        label: "Asesor" },
]

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000")

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState("administrador")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = e.currentTarget
    const username = (form.elements.namedItem("username") as HTMLInputElement).value
    const password = (form.elements.namedItem("password") as HTMLInputElement).value
    try {
      const res = await fetch(`${BASE}/api/v1/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail ?? data.non_field_errors?.[0] ?? "Credenciales inválidas.")
        return
      }
      saveAuth(data.access, {
        id: data.user_id,
        username,
        email: data.email ?? "",
        role: (data.role_name ?? role) as "administrador" | "asesor",
        is_superuser: data.is_admin ?? false,
        avatar_url: data.avatar_url || data.image || undefined,
      })
      router.push("/resumen")
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: "rgba(255,240,210,0.04)",
    border: "1px solid rgba(255,240,210,0.08)",
    color: "rgba(255,240,210,0.85)",
  }

  return (
    <div
      className="min-h-screen w-full flex overflow-hidden relative"
      style={{ backgroundColor: "#080402" }}
    >
      {/* Beams — solo lado derecho */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Beams beamWidth={1.5} beamHeight={18} beamNumber={7} lightColor="#C88A1A"
          speed={1.0} noiseIntensity={1.4} scale={0.13} rotation={0} />
        <div className="absolute inset-0" style={{ background: "rgba(8,4,2,0.65)" }} />
      </div>

      {/* ── Panel izquierdo — branding ── */}
      <div className="hidden md:flex md:w-[52%] flex-col justify-between p-14 lg:p-20 relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden"
            style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.18)" }}>
            <Image src="/logo-encuentro.png" alt="El Encuentro" width={36} height={36} className="object-contain" />
          </div>
          <span className="text-sm font-black" style={{ color: "rgba(255,240,210,0.85)", ...serif }}>El Encuentro</span>
        </div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-6"
            style={{ color: "rgba(240,180,41,0.45)" }}>
            Sistema de gestión
          </p>

          <h2 className="leading-[1.0] mb-6"
            style={{ ...serif, fontSize: "clamp(2.8rem,5vw,4.5rem)", fontWeight: 300, color: "rgba(255,240,210,0.94)" }}>
            Gestiona tu café<br />
            con{" "}
            <em style={{ fontStyle: "italic", color: "#F0B429" }}>precisión.</em>
          </h2>

          <p className="text-sm leading-loose max-w-xs"
            style={{ color: "rgba(255,240,210,0.32)", fontWeight: 300 }}>
            Ventas, inventario, procesos de tostado, clientes y finanzas —
            todo en un solo lugar diseñado para El Encuentro.
          </p>
        </motion.div>

        {/* Footer izquierdo */}
        <p className="text-[10px]" style={{ color: "rgba(255,240,210,0.1)", ...serif, fontStyle: "italic" }}>
          Café de origen colombiano
        </p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-[340px]"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-10 md:hidden">
            <div className="h-9 w-9 rounded-xl overflow-hidden"
              style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.2)" }}>
              <Image src="/logo-encuentro.png" alt="El Encuentro" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "rgba(255,240,210,0.9)", ...serif }}>El Encuentro</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(240,180,41,0.4)" }}>Sistema</p>
            </div>
          </div>

          {/* Título formulario */}
          <h3 className="mb-1 leading-none" style={{ ...serif, fontSize: "1.9rem", fontWeight: 300, color: "rgba(255,240,210,0.93)" }}>
            Bienvenido
          </h3>
          <p className="text-xs mb-8" style={{ color: "rgba(255,240,210,0.28)", fontWeight: 300 }}>
            Ingresa para acceder al sistema de gestión.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rol */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,240,210,0.3)", fontWeight: 500 }}>
                Rol
              </Label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none"
                style={{ ...inputStyle }}>
                {ROLES.map(r => (
                  <option key={r.id} value={r.id} style={{ background: "#150A04" }}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Usuario */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,240,210,0.3)", fontWeight: 500 }}>
                Usuario
              </Label>
              <Input name="username" type="text" placeholder="tu-usuario" required autoComplete="username"
                className="py-2.5 rounded-xl focus-visible:ring-0 placeholder:opacity-20"
                style={{ ...inputStyle }} />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,240,210,0.3)", fontWeight: 500 }}>
                Contraseña
              </Label>
              <Input name="password" type="password" required autoComplete="current-password"
                className="py-2.5 rounded-xl focus-visible:ring-0"
                style={{ ...inputStyle }} />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "rgba(252,165,165,0.9)" }}>
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Botón */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-40 mt-2"
              style={{
                background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                color: "#2D1600",
                boxShadow: loading ? "none" : "0 6px 24px rgba(240,180,41,0.22)",
              }}>
              {loading ? "Ingresando…" : <><span>Ingresar</span><ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </form>

          {/* Link catálogo */}
          <p className="mt-8 text-center text-[10px]" style={{ color: "rgba(255,240,210,0.15)", ...serif, fontStyle: "italic" }}>
            <a href="https://cafeelencuentro.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors">
              cafeelencuentro.com →
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

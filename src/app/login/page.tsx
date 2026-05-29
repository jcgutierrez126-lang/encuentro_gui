"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Coffee, Sparkles, ArrowRight } from "lucide-react"
import { saveAuth } from "@/lib/auth"

const Silk = dynamic(() => import("@/components/silk"), { ssr: false })

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
      if (!res.ok) { setError(data.detail ?? data.non_field_errors?.[0] ?? "Credenciales inválidas."); return }
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ backgroundColor: "#100A04" }}>

      {/* Silk warm */}
      <div className="absolute inset-0">
        <Silk speed={0.55} scale={1} color="#4A2A08" noiseIntensity={1.6} rotation={20} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(16,10,4,0.68) 0%, rgba(22,12,4,0.55) 100%)" }} />
      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* Panel izquierdo — branding */}
        <div className="hidden md:flex md:w-[55%] flex-col justify-between p-12 lg:p-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.22)" }}>
              <Image src="/logo-encuentro.png" alt="El Encuentro" width={36} height={36}
                className="object-contain scale-110"
                style={{ filter: "drop-shadow(0 0 6px rgba(240,180,41,0.35))" }}
              />
            </div>
            <div>
              <p className="font-black text-base leading-tight" style={{ color: "rgba(255,240,210,0.92)" }}>El Encuentro</p>
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(240,180,41,0.45)" }}>café tostado</p>
            </div>
          </div>

          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            {/* Línea decorativa */}
            <div className="flex items-center gap-3 mb-7">
              <div className="h-px w-8" style={{ background: "#F0B429", opacity: 0.5 }} />
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold"
                style={{ color: "rgba(240,180,41,0.5)" }}>origen colombiano</span>
            </div>

            {/* Logo grande centrado en el hero */}
            <div className="flex justify-start mb-8">
              <div className="relative h-28 w-28 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.15)" }}>
                <Image src="/logo-encuentro.png" alt="El Encuentro" width={96} height={96}
                  className="object-contain"
                  style={{ filter: "drop-shadow(0 4px 16px rgba(240,180,41,0.4))" }}
                />
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl xl:text-[52px] font-black leading-[1.05] mb-5"
              style={{ color: "rgba(255,240,210,0.95)" }}>
              Del grano a<br />
              la taza,<br />
              <span style={{ color: "#F0B429" }}>con propósito.</span>
            </h2>

            <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{ color: "rgba(255,240,210,0.37)" }}>
              Plataforma interna de gestión para El Encuentro. Ventas, clientes, inventario y finanzas en un solo lugar.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { icon: Coffee,     text: "Gestión de ventas de café tostado" },
                { icon: Sparkles,   text: "Trazabilidad desde el origen hasta el cliente" },
                { icon: ArrowRight, text: "Finanzas y cuentas siempre en orden" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.18)" }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: "rgba(240,180,41,0.55)" }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,240,210,0.37)" }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <p className="text-[11px] italic" style={{ color: "rgba(255,240,210,0.09)" }}>
            El Encuentro · Café de Colombia
          </p>
        </div>

        {/* Panel derecho — formulario */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="w-full max-w-sm rounded-2xl p-8 shadow-2xl"
            style={{
              background: "rgba(255,240,210,0.04)",
              border: "1px solid rgba(255,240,210,0.09)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
            }}
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.22)" }}>
                <Image src="/logo-encuentro.png" alt="El Encuentro" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <p className="font-black text-sm leading-tight" style={{ color: "rgba(255,240,210,0.9)" }}>El Encuentro</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(240,180,41,0.45)" }}>café tostado</p>
              </div>
            </div>

            <h3 className="text-2xl font-black mb-1" style={{ color: "rgba(255,240,210,0.93)" }}>Bienvenido</h3>
            <p className="text-sm mb-8" style={{ color: "rgba(255,240,210,0.33)" }}>
              Ingresa para acceder a la plataforma.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.33)" }}>Rol</Label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none"
                  style={{
                    background: "rgba(255,240,210,0.05)",
                    border: "1px solid rgba(255,240,210,0.09)",
                    color: "rgba(255,240,210,0.75)",
                  }}
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id} style={{ background: "#1A0A04" }}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.33)" }}>Usuario</Label>
                <Input
                  name="username"
                  type="text"
                  placeholder="tu-usuario"
                  required
                  className="py-2.5 rounded-xl focus-visible:ring-0 placeholder:opacity-30"
                  style={{
                    background: "rgba(255,240,210,0.05)",
                    border: "1px solid rgba(255,240,210,0.09)",
                    color: "rgba(255,240,210,0.85)",
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.33)" }}>Contraseña</Label>
                <Input
                  name="password"
                  type="password"
                  required
                  className="py-2.5 rounded-xl focus-visible:ring-0"
                  style={{
                    background: "rgba(255,240,210,0.05)",
                    border: "1px solid rgba(255,240,210,0.09)",
                    color: "rgba(255,240,210,0.85)",
                  }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(252,165,165,0.9)" }}>
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-xl px-4 py-3 text-sm font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                  border: "none",
                  color: "#3D1F00",
                  boxShadow: loading ? "none" : "0 4px 24px rgba(240,180,41,0.28)",
                }}
              >
                {loading ? "Iniciando sesión..." : <><span>Iniciar sesión</span> <ArrowRight className="h-3.5 w-3.5" /></>}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

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

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: "#0D0806" }}
    >
      {/* Beams de fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Beams
          beamWidth={1.5}
          beamHeight={16}
          beamNumber={8}
          lightColor="#C88A1A"
          speed={1.2}
          noiseIntensity={1.5}
          scale={0.15}
          rotation={0}
        />
        <div className="absolute inset-0" style={{ background: "rgba(13,8,6,0.6)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[340px] backdrop-blur-sm"
      >
        {/* Logo + nombre */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center mb-4"
            style={{
              background: "rgba(240,180,41,0.08)",
              border: "1px solid rgba(240,180,41,0.18)",
            }}
          >
            <Image
              src="/logo-encuentro.png"
              alt="El Encuentro"
              width={46}
              height={46}
              className="object-contain"
              style={{ filter: "drop-shadow(0 2px 8px rgba(240,180,41,0.3))" }}
              priority
            />
          </div>
          <p className="text-base font-black" style={{ color: "rgba(255,240,210,0.9)" }}>
            El Encuentro
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-0.5" style={{ color: "rgba(240,180,41,0.4)" }}>
            Sistema de gestión
          </p>
        </div>

        {/* Formulario */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,240,210,0.04)",
            border: "1px solid rgba(255,240,210,0.08)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.3)" }}>
                Rol
              </Label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none"
                style={{
                  background: "rgba(255,240,210,0.04)",
                  border: "1px solid rgba(255,240,210,0.08)",
                  color: "rgba(255,240,210,0.7)",
                }}
              >
                {ROLES.map(r => (
                  <option key={r.id} value={r.id} style={{ background: "#1A0A04" }}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.3)" }}>
                Usuario
              </Label>
              <Input
                name="username"
                type="text"
                placeholder="tu-usuario"
                required
                autoComplete="username"
                className="py-2.5 rounded-lg focus-visible:ring-0 placeholder:opacity-20"
                style={{
                  background: "rgba(255,240,210,0.04)",
                  border: "1px solid rgba(255,240,210,0.08)",
                  color: "rgba(255,240,210,0.85)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,240,210,0.3)" }}>
                Contraseña
              </Label>
              <Input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="py-2.5 rounded-lg focus-visible:ring-0"
                style={{
                  background: "rgba(255,240,210,0.04)",
                  border: "1px solid rgba(255,240,210,0.08)",
                  color: "rgba(255,240,210,0.85)",
                }}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "rgba(252,165,165,0.9)",
                }}
              >
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold mt-1 transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
                color: "#3D1F00",
                boxShadow: loading ? "none" : "0 4px 16px rgba(240,180,41,0.2)",
              }}
            >
              {loading ? "Ingresando…" : <><span>Ingresar</span><ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

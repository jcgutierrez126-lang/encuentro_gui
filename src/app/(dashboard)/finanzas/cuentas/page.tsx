"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Pencil, Trash2, Building2, Wallet, CreditCard, Briefcase, TrendingUp, DollarSign } from "lucide-react"

// ── Setup ──────────────────────────────────────────────────────────────────────
const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

async function apiFetch(path: string, opts: RequestInit = {}) {
  const { getToken } = await import("@/lib/auth")
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return null
  return res.json()
}

function cop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—"
  const num = Number(n)
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(num)
}

// ── Types ──────────────────────────────────────────────────────────────────────
type TipoCuenta = "bancaria" | "efectivo" | "prestamo" | "agencia" | "dividendos" | "inversion"

interface Cuenta {
  id: number
  nombre: string
  tipo: TipoCuenta
  saldo_inicial: string
  numero_cuenta: string | null
  banco: string | null
}

// ── Constantes ─────────────────────────────────────────────────────────────────
const TIPOS: [TipoCuenta, string][] = [
  ["bancaria",   "Bancaria"],
  ["efectivo",   "Efectivo"],
  ["prestamo",   "Préstamo"],
  ["agencia",    "Agencia / Cooperativa"],
  ["dividendos", "Dividendos"],
  ["inversion",  "Inversión / CDT"],
]

const TIPO_BADGE: Record<string, string> = {
  bancaria:   "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  efectivo:   "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  prestamo:   "bg-red-500/20 text-red-300 border border-red-500/30",
  agencia:    "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  dividendos: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  inversion:  "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  bancaria:   <Building2 className="h-4 w-4" />,
  efectivo:   <Wallet className="h-4 w-4" />,
  prestamo:   <CreditCard className="h-4 w-4" />,
  agencia:    <Briefcase className="h-4 w-4" />,
  dividendos: <DollarSign className="h-4 w-4" />,
  inversion:  <TrendingUp className="h-4 w-4" />,
}

// ── Form ───────────────────────────────────────────────────────────────────────
interface FormData {
  nombre: string
  tipo: TipoCuenta
  saldo_inicial: string
  numero_cuenta: string
  banco: string
}

const EMPTY: FormData = {
  nombre:        "",
  tipo:          "bancaria",
  saldo_inicial: "0",
  numero_cuenta: "",
  banco:         "",
}

function cuentaToForm(c: Cuenta): FormData {
  return {
    nombre:        c.nombre,
    tipo:          c.tipo,
    saldo_inicial: c.saldo_inicial ?? "0",
    numero_cuenta: c.numero_cuenta ?? "",
    banco:         c.banco ?? "",
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function ModalCuenta({
  cuenta,
  onGuardado,
  onCerrar,
  onEliminar,
}: {
  cuenta: Cuenta | null
  onGuardado: () => void
  onCerrar: () => void
  onEliminar?: () => void
}) {
  const esEdicion = cuenta !== null
  const [form, setForm]     = useState<FormData>(cuenta ? cuentaToForm(cuenta) : EMPTY)
  const [guardando, setGuardando]   = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (k: keyof FormData) =>
    (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: ev.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre.trim() || !form.tipo) {
      setError("Nombre y tipo son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload = {
        nombre:        form.nombre.trim(),
        tipo:          form.tipo,
        saldo_inicial: form.saldo_inicial || "0",
        numero_cuenta: form.numero_cuenta || null,
        banco:         form.banco || null,
      }
      if (esEdicion && cuenta) {
        await apiFetch(`/api/v1/finanzas/cuentas/${cuenta.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch("/api/v1/finanzas/cuentas/", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!cuenta) return
    setEliminando(true)
    try {
      await apiFetch(`/api/v1/finanzas/cuentas/${cuenta.id}/`, { method: "DELETE" })
      onEliminar?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar")
      setEliminando(false)
      setConfirmarEliminar(false)
    }
  }

  const field = "flex flex-col gap-1"
  const lbl   = "text-xs font-medium text-muted-foreground"
  const inp   = "bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-[rgba(255,240,210,0.88)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-[rgba(255,240,210,0.88)]">
            {esEdicion ? "Editar cuenta" : "Nueva cuenta"}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </p>
          )}

          <div className={field}>
            <label className={lbl}>Nombre *</label>
            <input value={form.nombre} onChange={set("nombre")}
              placeholder="Ej: Bancolombia ahorros" className={inp} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Tipo *</label>
              <select value={form.tipo} onChange={set("tipo")} className={inp} required>
                {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={lbl}>Saldo inicial ($)</label>
              <input type="number" step="any" value={form.saldo_inicial} onChange={set("saldo_inicial")}
                className={inp} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Número de cuenta</label>
              <input value={form.numero_cuenta} onChange={set("numero_cuenta")}
                className={inp} placeholder="02945202842" />
            </div>
            <div className={field}>
              <label className={lbl}>Banco / Entidad</label>
              <input value={form.banco} onChange={set("banco")}
                className={inp} placeholder="Bancolombia" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {esEdicion && !confirmarEliminar && (
              <button type="button" onClick={() => setConfirmarEliminar(true)}
                className="text-sm px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            )}
            {confirmarEliminar && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">¿Confirmar?</span>
                <button type="button" onClick={eliminar} disabled={eliminando}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1 transition-colors">
                  {eliminando && <Loader2 className="h-3 w-3 animate-spin" />}
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmarEliminar(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                  Cancelar
                </button>
              </div>
            )}
            {!confirmarEliminar && (
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={onCerrar}
                  className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
                  className="text-sm px-5 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2">
                  {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────
export default function CuentasPage() {
  const [cuentas, setCuentas]           = useState<Cuenta[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cuentaEditar, setCuentaEditar] = useState<Cuenta | null>(null)

  const cargar = () => {
    setLoading(true)
    apiFetch("/api/v1/finanzas/cuentas/")
      .then(data => setCuentas(Array.isArray(data) ? data : (data?.results ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function abrirNueva()          { setCuentaEditar(null); setModalAbierto(true) }
  function abrirEditar(c: Cuenta){ setCuentaEditar(c);    setModalAbierto(true) }
  function cerrarModal()         { setModalAbierto(false); setCuentaEditar(null) }

  const totalSaldo = cuentas.reduce((s, c) => s + Number(c.saldo_inicial ?? 0), 0)

  return (
    <div className="space-y-5" style={{ color: "rgba(255,240,210,0.88)" }}>
      {modalAbierto && (
        <ModalCuenta
          cuenta={cuentaEditar}
          onGuardado={() => { cerrarModal(); cargar() }}
          onCerrar={cerrarModal}
          onEliminar={() => { cerrarModal(); cargar() }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestión de cuentas bancarias, efectivo e inversiones.
          </p>
        </div>
        <button
          onClick={abrirNueva}
          style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium shrink-0">
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </button>
      </div>

      {/* KPI */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total saldo inicial
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#F0B429" }}>
            {cop(totalSaldo)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{cuentas.length} cuentas</p>
      </div>

      {/* Grid de cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cuentas.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          Sin cuentas registradas.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.map(c => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-[#F0B429]/40 transition-colors group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`p-2 rounded-lg ${TIPO_BADGE[c.tipo] ?? "bg-muted text-muted-foreground"}`}>
                    {TIPO_ICON[c.tipo]}
                  </span>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{c.nombre}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIPO_BADGE[c.tipo] ?? "bg-muted text-muted-foreground"}`}>
                      {TIPOS.find(t => t[0] === c.tipo)?.[1] ?? c.tipo}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => abrirEditar(c)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Saldo */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Saldo inicial</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: "#F0B429" }}>
                  {cop(c.saldo_inicial)}
                </p>
              </div>

              {/* Detalles */}
              {(c.numero_cuenta || c.banco) && (
                <div className="flex flex-col gap-1 pt-1 border-t border-border">
                  {c.numero_cuenta && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">N° cuenta</span>
                      <span className="text-xs tabular-nums font-mono text-muted-foreground">{c.numero_cuenta}</span>
                    </div>
                  )}
                  {c.banco && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Banco</span>
                      <span className="text-xs font-medium">{c.banco}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, AlertCircle, Plus, X, FlaskConical,
  CheckCircle2, ChevronDown, Trash2,
} from "lucide-react"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

function cop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(Number(n))
}

function fmt(n: string | number | null | undefined, decimals = 2) {
  if (n == null || n === "") return "—"
  return Number(n).toLocaleString("es-CO", { maximumFractionDigits: decimals })
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || String(res.status))
  }
  if (res.status === 204) return null
  return res.json()
}

// ─── Types ───────────────────────────────────────────────────────────────────

type TipoLinea = "trilla" | "tueste" | "molienda" | "malla" | "bolsa"

interface LineaProceso {
  tipo: TipoLinea
  kilos_entrada: number | string
  kilos_salida: number | string | null
  kilos_merma: number | string | null
  porcentaje_merma: number | string | null
  precio_unitario: number | string
  valor_total: number | string
}

interface LoteProceso {
  id: number
  fecha: string
  calidad_nombre: string
  proveedor_nombre: string
  estado: "borrador" | "completado"
  total_costo: string | number
  lineas: LineaProceso[]
}

interface SelectOption { id: number; nombre: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<TipoLinea, string> = {
  trilla: "Trilla",
  tueste: "Tueste",
  molienda: "Molienda",
  malla: "Malla",
  bolsa: "Bolsa",
}

const TIPO_ABBR: Record<TipoLinea, string> = {
  trilla: "Tri",
  tueste: "Tue",
  molienda: "Mol",
  malla: "Mal",
  bolsa: "Bol",
}

const TIPOS_ORDEN: TipoLinea[] = ["trilla", "tueste", "molienda", "malla", "bolsa"]

const TIPO_COLORS: Record<TipoLinea, string> = {
  trilla:   "bg-amber-400/15 text-amber-300 border-amber-400/25",
  tueste:   "bg-orange-400/15 text-orange-300 border-orange-400/25",
  molienda: "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
  malla:    "bg-lime-400/15 text-lime-300 border-lime-400/25",
  bolsa:    "bg-sky-400/15 text-sky-300 border-sky-400/25",
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-black tabular-nums leading-none" style={{ color: "#F0B429" }}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function TipoChip({ tipo }: { tipo: string }) {
  const t = tipo as TipoLinea
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${TIPO_COLORS[t] ?? "bg-zinc-700/30 text-zinc-300 border-zinc-600/30"}`}>
      {TIPO_ABBR[t] ?? tipo}
    </span>
  )
}

function EstadoBadge({ estado }: { estado: "borrador" | "completado" }) {
  if (estado === "completado") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Completado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-400/10 text-amber-400 border border-amber-400/20">
      Borrador
    </span>
  )
}

// ─── Empty line factory ───────────────────────────────────────────────────────

function emptyLinea(): LineaForm {
  return {
    tipo: "trilla",
    kilos_entrada: "",
    kilos_salida: "",
    precio_unitario: "",
    valor_total: "",
  }
}

interface LineaForm {
  tipo: TipoLinea
  kilos_entrada: string | number
  kilos_salida: string | number
  precio_unitario: string | number
  valor_total: string | number
}

// ─── Modal Nuevo Lote ─────────────────────────────────────────────────────────

interface ModalProps {
  calidades: SelectOption[]
  proveedores: SelectOption[]
  cuentas: SelectOption[]
  onClose: () => void
  onSaved: () => void
}

function ModalNuevoLote({ calidades, proveedores, cuentas, onClose, onSaved }: ModalProps) {
  const hoy = new Date().toISOString().split("T")[0]
  const [fecha, setFecha] = useState(hoy)
  const [calidad, setCalidad] = useState("")
  const [proveedor, setProveedor] = useState("")
  const [cuenta, setCuenta] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [lineas, setLineas] = useState<LineaForm[]>([emptyLinea()])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function recalcLinea(lineas: LineaForm[], idx: number): LineaForm[] {
    const updated = [...lineas]
    const l = { ...updated[idx] }
    const ki = Number(l.kilos_entrada) || 0
    const pu = Number(l.precio_unitario) || 0
    l.valor_total = ki * pu
    updated[idx] = l
    return updated
  }

  function handleLineaChange(idx: number, field: keyof LineaForm, val: string) {
    const next = [...lineas]
    next[idx] = { ...next[idx], [field]: val }
    if (field === "kilos_entrada" || field === "precio_unitario") {
      setLineas(recalcLinea(next, idx))
    } else {
      setLineas(next)
    }
  }

  function addLinea() { setLineas(prev => [...prev, emptyLinea()]) }
  function removeLinea(idx: number) { setLineas(prev => prev.filter((_, i) => i !== idx)) }

  const totalLote = lineas.reduce((acc, l) => acc + (Number(l.valor_total) || 0), 0)

  async function handleSave() {
    setErr(null)
    if (!fecha || !calidad || !proveedor || !cuenta) {
      setErr("Fecha, calidad, tostadora y cuenta son obligatorios.")
      return
    }
    if (lineas.length === 0) {
      setErr("Agrega al menos una línea de proceso.")
      return
    }
    for (const l of lineas) {
      if (!l.kilos_entrada || Number(l.kilos_entrada) <= 0) {
        setErr("Todos los pasos deben tener kilos de entrada válidos.")
        return
      }
    }
    setSaving(true)
    try {
      const body = {
        fecha,
        calidad: Number(calidad),
        proveedor: Number(proveedor),
        cuenta: cuenta ? Number(cuenta) : null,
        observaciones,
        lineas: lineas.map(l => ({
          tipo: l.tipo,
          kilos_entrada: Number(l.kilos_entrada),
          kilos_salida: l.kilos_salida !== "" ? Number(l.kilos_salida) : null,
          kilos_merma: null,
          precio_unitario: Number(l.precio_unitario),
          valor_sin_iva: (Number(l.kilos_entrada) || 0) * (Number(l.precio_unitario) || 0),
          iva: 0,
          valor_total: Number(l.valor_total) || 0,
        })),
      }
      await apiFetch("/api/v1/cafe/lotes-proceso/", {
        method: "POST",
        body: JSON.stringify(body),
      })
      onSaved()
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm text-[rgba(255,240,210,0.88)] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-400/40"
  const labelCls = "block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border shadow-2xl"
        style={{ background: "#0D0806" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.22)" }}>
              <FlaskConical className="h-4 w-4" style={{ color: "#F0B429" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "rgba(255,240,210,0.92)" }}>Nuevo lote de proceso</p>
              <p className="text-[11px] text-muted-foreground">Tostadora · El Encuentro</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Calidad</label>
              <div className="relative">
                <select value={calidad} onChange={e => setCalidad(e.target.value)} className={inputCls + " appearance-none pr-8"}>
                  <option value="">Seleccionar...</option>
                  {calidades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tostadora / Proveedor</label>
              <div className="relative">
                <select value={proveedor} onChange={e => setProveedor(e.target.value)} className={inputCls + " appearance-none pr-8"}>
                  <option value="">Seleccionar...</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Cuenta *</label>
              <div className="relative">
                <select value={cuenta} onChange={e => setCuenta(e.target.value)} className={inputCls + " appearance-none pr-8"} required>
                  <option value="">Seleccionar cuenta…</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas opcionales..."
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Líneas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pasos de proceso
              </p>
              <button
                onClick={addLinea}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: "rgba(240,180,41,0.10)",
                  border: "1px solid rgba(240,180,41,0.22)",
                  color: "#F0B429",
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar paso
              </button>
            </div>

            {lineas.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6 border border-dashed border-border rounded-xl">
                Sin pasos. Agrega al menos uno.
              </p>
            )}

            <div className="space-y-3">
              {lineas.map((linea, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border p-4 space-y-3"
                  style={{ background: "rgba(255,240,210,0.02)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Paso {idx + 1}
                    </span>
                    {lineas.length > 1 && (
                      <button
                        onClick={() => removeLinea(idx)}
                        className="rounded-md p-1 hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className={labelCls}>Tipo</label>
                      <div className="relative">
                        <select
                          value={linea.tipo}
                          onChange={e => handleLineaChange(idx, "tipo", e.target.value)}
                          className={inputCls + " appearance-none pr-7 text-xs"}
                        >
                          {TIPOS_ORDEN.map(t => (
                            <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Kilos entrada</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.kilos_entrada}
                        onChange={e => handleLineaChange(idx, "kilos_entrada", e.target.value)}
                        placeholder="0.00"
                        className={inputCls + " text-xs"}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Kilos salida</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={linea.kilos_salida}
                        onChange={e => handleLineaChange(idx, "kilos_salida", e.target.value)}
                        placeholder="Opcional"
                        className={inputCls + " text-xs"}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Precio/kg</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={linea.precio_unitario}
                        onChange={e => handleLineaChange(idx, "precio_unitario", e.target.value)}
                        placeholder="0"
                        className={inputCls + " text-xs"}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      Total paso = kilos_entrada × precio/kg
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: "#F0B429" }}>
                      {cop(Number(linea.valor_total) || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {lineas.length > 0 && (
              <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "rgba(240,180,41,0.06)", border: "1px solid rgba(240,180,41,0.14)" }}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total del lote</span>
                <span className="text-lg font-black tabular-nums" style={{ color: "#F0B429" }}>
                  {cop(totalLote)}
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {err && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{err}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-[rgba(255,240,210,0.7)] hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #F0B429, #C88A1A)",
                color: "#3D1F00",
              }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar lote
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProcesosPage() {
  const [lotes, setLotes] = useState<LoteProceso[]>([])
  const [calidades, setCalidades] = useState<SelectOption[]>([])
  const [proveedores, setProveedores] = useState<SelectOption[]>([])
  const [cuentas, setCuentas] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [completando, setCompletando] = useState<number | null>(null)

  const fetchLotes = useCallback(async () => {
    try {
      const data = await apiFetch("/api/v1/cafe/lotes-proceso/")
      setLotes(Array.isArray(data) ? data : (data.results ?? []))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error")
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch("/api/v1/cafe/lotes-proceso/"),
      apiFetch("/api/v1/cafe/calidades/"),
      apiFetch("/api/v1/finanzas/proveedores/"),
      apiFetch("/api/v1/finanzas/cuentas/"),
    ])
      .then(([l, c, p, cu]) => {
        setLotes(Array.isArray(l) ? l : (l.results ?? []))
        setCalidades(Array.isArray(c) ? c : (c.results ?? []))
        setProveedores(Array.isArray(p) ? p : (p.results ?? []))
        setCuentas(Array.isArray(cu) ? cu : (cu.results ?? []))
      })
      .catch(e => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false))
  }, [])

  async function completar(id: number) {
    setCompletando(id)
    try {
      await apiFetch(`/api/v1/cafe/lotes-proceso/${id}/completar/`, { method: "POST" })
      await fetchLotes()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al completar")
    } finally {
      setCompletando(null)
    }
  }

  // KPIs
  const totalLotes = lotes.length
  const totalCostos = lotes.reduce((acc, l) => acc + Number(l.total_costo ?? 0), 0)
  const completados = lotes.filter(l => l.estado === "completado").length

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 mt-4">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm text-destructive">Error al cargar datos: {error}</p>
    </div>
  )

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <FlaskConical className="h-6 w-6" style={{ color: "#F0B429" }} />
              <span style={{ color: "rgba(255,240,210,0.92)" }}>Procesos · Tostadora</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Lotes enviados a la tostadora — trilla, tueste, molienda, malla y bolsa
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all self-start sm:self-auto"
            style={{
              background: "linear-gradient(135deg, #F0B429, #C88A1A)",
              color: "#3D1F00",
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo lote
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard
            label="Total lotes"
            value={String(totalLotes)}
            sub="lotes registrados"
          />
          <KpiCard
            label="Total costos"
            value={cop(totalCostos)}
            sub="suma de todos los lotes"
          />
          <KpiCard
            label="Completados"
            value={String(completados)}
            sub={`${totalLotes - completados} en borrador`}
          />
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {lotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <FlaskConical className="h-8 w-8 opacity-30" />
              <p className="text-sm">Sin lotes registrados</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                style={{
                  background: "rgba(240,180,41,0.10)",
                  border: "1px solid rgba(240,180,41,0.22)",
                  color: "#F0B429",
                }}
              >
                Crear primer lote
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Calidad</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tostadora</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pasos</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total costo</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lotes.map(lote => (
                    <tr key={lote.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 tabular-nums text-xs" style={{ color: "rgba(255,240,210,0.6)" }}>
                        {lote.fecha}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: "rgba(255,240,210,0.85)" }}>
                          {lote.calidad_nombre || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {lote.proveedor_nombre || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lote.lineas?.length > 0 ? (
                            lote.lineas.map((l, i) => (
                              <TipoChip key={i} tipo={l.tipo} />
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin pasos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-xs" style={{ color: "#F0B429" }}>
                        {cop(lote.total_costo)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <EstadoBadge estado={lote.estado} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lote.estado === "borrador" ? (
                          <button
                            onClick={() => completar(lote.id)}
                            disabled={completando === lote.id}
                            className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            style={{
                              background: "rgba(52,211,153,0.10)",
                              border: "1px solid rgba(52,211,153,0.20)",
                              color: "rgb(52,211,153)",
                            }}
                          >
                            {completando === lote.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <CheckCircle2 className="h-3 w-3" />
                            }
                            Completar
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ModalNuevoLote
          calidades={calidades}
          proveedores={proveedores}
          cuentas={cuentas}
          onClose={() => setShowModal(false)}
          onSaved={fetchLotes}
        />
      )}
    </>
  )
}

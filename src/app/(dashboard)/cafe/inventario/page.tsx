"use client"

import { useEffect, useState } from "react"
import { Loader2, X, Plus, Package, AlertCircle } from "lucide-react"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

function cop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function kg(n: string | number | null | undefined) {
  if (n == null) return "—"
  return `${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg`
}

async function apiFetch(path: string) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

async function apiPost(path: string, body: unknown) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${res.status}`)
  }
  return res.json()
}

interface StockItem {
  calidad_id: number
  calidad_nombre: string
  tipo_cafe: "grano" | "molido"
  kilos_entradas: string
  kilos_salidas: string
  stock_actual: string
}

interface Movimiento {
  id: number
  fecha: string
  tipo: "entrada" | "salida"
  calidad_nombre: string
  tipo_cafe: "grano" | "molido"
  kilos: string
  observaciones: string | null
  lote_proceso: number | null
  venta: number | null
}

interface Calidad {
  id: number
  nombre: string
}

interface FormAjuste {
  tipo: "entrada" | "salida"
  calidad: string
  tipo_cafe: "grano" | "molido"
  kilos: string
  observaciones: string
}

const HOY = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: FormAjuste = {
  tipo: "entrada",
  calidad: "",
  tipo_cafe: "grano",
  kilos: "",
  observaciones: "",
}

interface FormAjusteConFecha extends FormAjuste {
  fecha: string
}

function origenLabel(mov: Movimiento) {
  if (mov.lote_proceso) return `Lote #${mov.lote_proceso}`
  if (mov.venta) return `Venta #${mov.venta}`
  return "Manual"
}

/* ─── Modal ajuste ─── */
function ModalAjuste({
  calidades,
  onGuardado,
  onCerrar,
}: {
  calidades: Calidad[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormAjusteConFecha>({ ...EMPTY_FORM, fecha: HOY })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (k: keyof FormAjuste) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.calidad || !form.kilos) {
      setError("Calidad y kilos son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/api/v1/cafe/inventario/", {
        fecha: form.fecha,
        tipo: form.tipo,
        calidad: Number(form.calidad),
        tipo_cafe: form.tipo_cafe,
        kilos: Number(form.kilos),
        observaciones: form.observaciones || null,
      })
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const field = "flex flex-col gap-1"
  const lbl = "text-xs font-medium text-muted-foreground"
  const inp =
    "text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold" style={{ color: "rgba(255,240,210,0.92)" }}>Ajuste manual de inventario</h2>
          <button onClick={onCerrar} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className={field}>
            <label className={lbl}>Fecha *</label>
            <input type="date" value={(form as FormAjusteConFecha).fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inp} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Tipo *</label>
              <select value={form.tipo} onChange={set("tipo")} className={inp}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div className={field}>
              <label className={lbl}>Tipo café *</label>
              <select value={form.tipo_cafe} onChange={set("tipo_cafe")} className={inp}>
                <option value="grano">Grano</option>
                <option value="molido">Molido</option>
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={lbl}>Calidad *</label>
            <select value={form.calidad} onChange={set("calidad")} className={inp} required>
              <option value="">Seleccionar…</option>
              {calidades.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className={field}>
            <label className={lbl}>Kilos *</label>
            <input
              type="number"
              step="any"
              min="0"
              value={form.kilos}
              onChange={set("kilos")}
              className={inp}
              placeholder="0"
              required
            />
          </div>

          <div className={field}>
            <label className={lbl}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={set("observaciones")}
              rows={2}
              className={`${inp} resize-none`}
              placeholder="Motivo del ajuste (opcional)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-sm px-5 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
            >
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Stock card ─── */
function StockCard({ item }: { item: StockItem }) {
  const entradas = Number(item.kilos_entradas)
  const salidas = Number(item.kilos_salidas)
  const stock = Number(item.stock_actual)
  const total = entradas || 1
  const pctEntradas = Math.min(100, Math.round((entradas / total) * 100))
  const pctSalidas = Math.min(100, Math.round((salidas / total) * 100))
  const stockColor = stock < 0 ? "#f87171" : stock === 0 ? "rgba(255,240,210,0.4)" : "#F0B429"

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: "rgba(255,240,210,0.92)" }}>
            {item.calidad_nombre}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{item.tipo_cafe}</p>
        </div>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(240,180,41,0.08)",
            border: "1px solid rgba(240,180,41,0.15)",
          }}
        >
          <Package className="h-4 w-4" style={{ color: "rgba(240,180,41,0.6)" }} />
        </div>
      </div>

      <div>
        <p
          className="text-3xl font-black tabular-nums leading-none"
          style={{ color: stockColor }}
        >
          {Number(item.stock_actual).toLocaleString("es-CO", { maximumFractionDigits: 1 })}
          <span className="text-base font-semibold ml-1" style={{ color: stockColor + "99" }}>kg</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">disponibles</p>
      </div>

      {/* Barra entradas */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Entradas</span>
          <span className="tabular-nums">{kg(item.kilos_entradas)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pctEntradas}%`,
              background: "linear-gradient(90deg, #F0B429, #C88A1A)",
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Salidas</span>
          <span className="tabular-nums">{kg(item.kilos_salidas)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pctSalidas}%`,
              background: "linear-gradient(90deg, rgba(248,113,113,0.7), rgba(220,38,38,0.7))",
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Página ─── */
export default function InventarioPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [calidades, setCalidades] = useState<Calidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState(false)

  function cargar() {
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch("/api/v1/cafe/inventario/stock/"),
      apiFetch("/api/v1/cafe/inventario/?page_size=50"),
      apiFetch("/api/v1/cafe/calidades/"),
    ])
      .then(([s, m, c]) => {
        setStock(Array.isArray(s) ? s : (s?.results ?? []))
        setMovimientos(Array.isArray(m) ? m : (m?.results ?? []))
        setCalidades(Array.isArray(c) ? c : (c?.results ?? []))
      })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 mt-4">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm text-destructive">Error al cargar inventario: {error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {modal && (
        <ModalAjuste
          calidades={calidades}
          onGuardado={() => { cargar(); setModal(false) }}
          onCerrar={() => setModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Stock actual de café en grano y molido por calidad — entradas, salidas y movimientos.
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium"
          style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
        >
          <Plus className="h-4 w-4" />
          Ajuste manual
        </button>
      </div>

      {/* Cards de stock */}
      {stock.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-16 gap-3">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(240,180,41,0.08)", border: "1px solid rgba(240,180,41,0.15)" }}
          >
            <Package className="h-6 w-6" style={{ color: "rgba(240,180,41,0.5)" }} />
          </div>
          <p className="text-sm text-muted-foreground">Sin stock registrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stock.map(item => (
            <StockCard key={`${item.calidad_id}-${item.tipo_cafe}`} item={item} />
          ))}
        </div>
      )}

      {/* Tabla movimientos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Movimientos recientes
        </p>
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Calidad</th>
                  <th className="px-4 py-3 text-left">Tipo café</th>
                  <th className="px-4 py-3 text-right">Kilos</th>
                  <th className="px-4 py-3 text-left">Origen</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      Sin movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movimientos.map(mov => (
                    <tr key={mov.id} className="border-b border-border hover:bg-muted/20 text-sm last:border-0">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{mov.fecha}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                            mov.tipo === "entrada"
                              ? "bg-emerald-400/10 text-emerald-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "rgba(255,240,210,0.85)" }}>
                        {mov.calidad_nombre}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{mov.tipo_cafe}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: "#F0B429" }}>
                        {kg(mov.kilos)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {origenLabel(mov)}
                        {mov.observaciones && (
                          <span className="ml-1 text-muted-foreground/60">— {mov.observaciones}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

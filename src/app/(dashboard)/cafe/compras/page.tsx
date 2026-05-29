"use client"

import { useEffect, useState, useMemo } from "react"
import { Loader2, X, Plus, Package, TrendingDown, CheckCircle, AlertCircle } from "lucide-react"
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

function today() {
  return new Date().toISOString().slice(0, 10)
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

interface Compra {
  id: number
  fecha: string
  calidad_nombre: string
  kilos: string
  precio_carga: string
  valor_total: string
  pagado: boolean
  proveedor_nombre: string | null
}

interface Calidad {
  id: number
  nombre: string
}

interface Proveedor {
  id: number
  nombre: string
}

interface Cuenta {
  id: number
  nombre: string
}

interface FormCompra {
  fecha: string
  calidad: string
  kilos: string
  precio_carga: string
  valor_total: string
  proveedor: string
  cuenta: string
  pagado: boolean
  observaciones: string
}

const EMPTY_FORM: FormCompra = {
  fecha: today(),
  calidad: "",
  kilos: "",
  precio_carga: "",
  valor_total: "",
  proveedor: "",
  cuenta: "",
  pagado: false,
  observaciones: "",
}

/* ─── KPI Card ─── */
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent ? "rgba(240,180,41,0.12)" : "rgba(255,240,210,0.05)",
          border: `1px solid ${accent ? "rgba(240,180,41,0.22)" : "rgba(255,240,210,0.08)"}`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color: accent ? "#F0B429" : "rgba(255,240,210,0.45)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p
          className="text-xl font-black tabular-nums leading-none"
          style={{ color: accent ? "#F0B429" : "rgba(255,240,210,0.92)" }}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Modal nueva compra ─── */
function ModalCompra({
  calidades,
  proveedores,
  cuentas,
  onGuardado,
  onCerrar,
}: {
  calidades: Calidad[]
  proveedores: Proveedor[]
  cuentas: Cuenta[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormCompra>(EMPTY_FORM)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (k: keyof FormCompra) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  function recalcTotal(kilos: string, precio: string) {
    const k = parseFloat(kilos)
    const p = parseFloat(precio)
    if (!isNaN(k) && !isNaN(p) && p > 0) {
      return String(Math.round((k / 125) * p))
    }
    return ""
  }

  function handleKilos(e: React.ChangeEvent<HTMLInputElement>) {
    const kilos = e.target.value
    setForm(f => ({
      ...f,
      kilos,
      valor_total: recalcTotal(kilos, f.precio_carga),
    }))
  }

  function handlePrecio(e: React.ChangeEvent<HTMLInputElement>) {
    const precio_carga = e.target.value
    setForm(f => ({
      ...f,
      precio_carga,
      valor_total: recalcTotal(f.kilos, precio_carga),
    }))
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.calidad || !form.kilos || !form.precio_carga || !form.cuenta) {
      setError("Calidad, kilos, precio/carga y cuenta son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await apiPost("/api/v1/cafe/compras-materia/", {
        fecha: form.fecha,
        calidad: Number(form.calidad),
        kilos: form.kilos,
        precio_carga: form.precio_carga,
        valor_total: form.valor_total || recalcTotal(form.kilos, form.precio_carga),
        proveedor: form.proveedor ? Number(form.proveedor) : null,
        cuenta: Number(form.cuenta),
        pagado: form.pagado,
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
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold" style={{ color: "rgba(255,240,210,0.92)" }}>
            Nueva compra de materia prima
          </h2>
          <button onClick={onCerrar} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set("fecha")} className={inp} required />
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={field}>
              <label className={lbl}>Kilos *</label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.kilos}
                onChange={handleKilos}
                className={inp}
                placeholder="0"
                required
              />
            </div>
            <div className={field}>
              <label className={lbl}>Precio / carga *</label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.precio_carga}
                onChange={handlePrecio}
                className={inp}
                placeholder="125 kg"
                required
              />
            </div>
            <div className={field}>
              <label className={lbl}>Valor total</label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.valor_total}
                onChange={set("valor_total")}
                className={inp}
                placeholder="Auto"
              />
            </div>
          </div>

          {form.kilos && form.precio_carga && (
            <p className="text-xs text-muted-foreground -mt-2">
              Auto-calculado: {cop(recalcTotal(form.kilos, form.precio_carga))}
              <span className="ml-1 text-muted-foreground/60">(kilos / 125 × precio/carga)</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Proveedor</label>
              <select value={form.proveedor} onChange={set("proveedor")} className={inp}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className={field}>
              <label className={lbl}>Cuenta *</label>
              <select value={form.cuenta} onChange={set("cuenta")} className={inp} required>
                <option value="">Seleccionar…</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={lbl}>Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={set("observaciones")}
              rows={2}
              className={`${inp} resize-none`}
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pagado}
              onChange={e => setForm(f => ({ ...f, pagado: e.target.checked }))}
              className="h-4 w-4 rounded accent-amber-400"
            />
            <span className="text-sm" style={{ color: "rgba(255,240,210,0.8)" }}>Marcar como pagado</span>
          </label>

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
              Registrar compra
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Página ─── */
export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [calidades, setCalidades] = useState<Calidad[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState(false)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      apiFetch("/api/v1/cafe/compras-materia/"),
      apiFetch("/api/v1/cafe/calidades/"),
      apiFetch("/api/v1/finanzas/proveedores/"),
      apiFetch("/api/v1/finanzas/cuentas/"),
    ])
      .then(([c, cal, prov, ctas]) => {
        setCompras(c.results ?? c)
        setCalidades(cal)
        setProveedores(prov.results ?? prov)
        setCuentas(ctas.results ?? ctas)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const kpis = useMemo(() => {
    const totalKg = compras.reduce((s, c) => s + Number(c.kilos), 0)
    const totalCop = compras.reduce((s, c) => s + Number(c.valor_total), 0)
    const pendientes = compras.filter(c => !c.pagado).length
    return { totalKg, totalCop, pendientes }
  }, [compras])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 mt-4">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm text-destructive">Error al cargar compras: {error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {modal && (
        <ModalCompra
          calidades={calidades}
          proveedores={proveedores}
          cuentas={cuentas}
          onGuardado={() => { cargar(); setModal(false) }}
          onCerrar={() => setModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Compras de Materia Prima</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registro de compras de café pergamino seco por calidad, proveedor y estado de pago.
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium"
          style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
        >
          <Plus className="h-4 w-4" />
          Nueva compra
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Total comprado"
          value={kg(kpis.totalKg)}
          sub={`${compras.length} compras registradas`}
          icon={Package}
          accent
        />
        <KpiCard
          label="Total invertido"
          value={cop(kpis.totalCop)}
          sub="suma de todas las compras"
          icon={TrendingDown}
        />
        <KpiCard
          label="Pendientes de pago"
          value={String(kpis.pendientes)}
          sub="compras sin pagar"
          icon={kpis.pendientes > 0 ? AlertCircle : CheckCircle}
        />
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Calidad</th>
                <th className="px-4 py-3 text-right">Kilos</th>
                <th className="px-4 py-3 text-right">Precio/carga</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-muted-foreground">
                    Sin compras registradas.
                  </td>
                </tr>
              ) : (
                compras.map(compra => (
                  <tr key={compra.id} className="border-b border-border hover:bg-muted/20 text-sm last:border-0">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{compra.fecha}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "rgba(255,240,210,0.85)" }}>
                      {compra.calidad_nombre}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums" style={{ color: "#F0B429" }}>
                      {kg(compra.kilos)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {cop(compra.precio_carga)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: "rgba(255,240,210,0.92)" }}>
                      {cop(compra.valor_total)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {compra.proveedor_nombre ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                          compra.pagado
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-amber-400/10 text-amber-400"
                        }`}
                      >
                        {compra.pagado ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

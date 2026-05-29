"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Loader2, X, ScanLine, Trash2, Search } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts"
import {
  api,
  type VentaCafe, type Cuenta, type TipoCafeVenta,
  type VentaPorPeriodo, type VentaPorTipo, type FacturaCafeucol,
} from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

type Vista = "semana" | "mes" | "año"
type ProveedorIA = "claude" | "gpt"

function ToggleIA({ value, onChange }: { value: ProveedorIA; onChange: (v: ProveedorIA) => void }) {
  const isGpt = value === "gpt"
  return (
    <div className="flex items-center gap-1.5 text-xs select-none whitespace-nowrap">
      <span className={isGpt ? "font-semibold" : "text-muted-foreground"}>GPT</span>
      <button
        type="button"
        onClick={() => onChange(isGpt ? "claude" : "gpt")}
        className="relative w-8 h-4 rounded-full bg-muted border border-border transition-colors focus:outline-none"
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-primary transition-transform ${!isGpt ? "translate-x-4" : "translate-x-0"}`} />
      </button>
      <span className={!isGpt ? "font-semibold" : "text-muted-foreground"}>Claude</span>
    </div>
  )
}

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function cop(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}

const BAR_COLORS = [
  "#f59e0b", "#f97316", "#a8a29e", "#ef4444", "#22c55e",
  "#3b82f6", "#a855f7", "#06b6d4", "#84cc16", "#6366f1",
]

function CopTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  )
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/[^a-z0-9 ]/g, "")
}

function matchTipoCafe(descripcion: string, tipos: TipoCafeVenta[]): TipoCafeVenta | undefined {
  const d = norm(descripcion)
  return tipos.find(t => {
    const n = norm(t.nombre)
    return d.includes(n) || n.includes(d)
  })
}

// â"€â"€â"€ Import Modal (CAFEUCOL invoice) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface ImportRow {
  descripcion: string
  tipo_cafe_id: string
  kilos: string
  precio_kilo: string
  cargas: string
  factor: string
  retefuente: string
}

function ImportCafeModal({
  factura,
  tipos,
  onConfirm,
  onCerrar,
}: {
  factura: FacturaCafeucol
  tipos: TipoCafeVenta[]
  onConfirm: (rows: ImportRow[], fecha: string, comprador: string, cuentaId: number) => Promise<void>
  onCerrar: () => void
}) {
  const [fecha, setFecha] = useState(factura.fecha)
  const [comprador, setComprador] = useState(factura.comprador ?? "")
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cuentaId, setCuentaId] = useState("")
  const [rows, setRows] = useState<ImportRow[]>(() =>
    factura.items.map(item => ({
      descripcion: item.descripcion,
      tipo_cafe_id: matchTipoCafe(item.descripcion, tipos)?.id.toString() ?? "",
      kilos: item.kilos.toString(),
      precio_kilo: item.precio_kilo.toString(),
      cargas: item.kilos > 0 ? (item.kilos / 125).toFixed(4) : "0",
      factor: "1",
      retefuente: (factura.retenciones ?? 0).toString(),
    }))
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { api.finanzas.cuentas.list().then(setCuentas) }, [])

  const setRow = (i: number, field: keyof ImportRow, value: string) =>
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      const updated = { ...r, [field]: value }
      if (field === "kilos") updated.cargas = Number(value) > 0 ? (Number(value) / 125).toFixed(4) : "0"
      return updated
    }))

  const kilosBuenos = (row: ImportRow) => {
    const k = Number(row.kilos) || 0
    const f = Number(row.factor) || 1
    return k * f
  }

  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const handleConfirm = async () => {
    if (!cuentaId) { setError("Selecciona la cuenta destino"); return }
    if (!comprador.trim()) { setError("El comprador es requerido"); return }
    const invalid = rows.find(r => !r.tipo_cafe_id || !r.kilos || !r.precio_kilo)
    if (invalid) { setError(`Falta tipo o valores en "${invalid.descripcion}"`); return }
    setGuardando(true); setError(null)
    try {
      await onConfirm(rows, fecha, comprador, Number(cuentaId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al importar")
      setGuardando(false)
    }
  }

  const s = {
    input: "text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full",
    label: "text-xs font-medium text-muted-foreground",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-5xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-amber-400" />
              Importar factura CAFEUCOL
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {factura.factura && <span className="mr-3">Factura: <strong>{factura.factura}</strong></span>}
              Revisa y ajusta los datos antes de crear las ventas
            </p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 flex-1">

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className={s.label}>Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={s.input} />
            </div>
            <div className="space-y-1">
              <label className={s.label}>Comprador *</label>
              <input value={comprador} onChange={e => setComprador(e.target.value)} className={s.input} />
            </div>
            <div className="space-y-1">
              <label className={s.label}>Cuenta destino *</label>
              <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className={s.input}>
                <option value="">Seleccionar…</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Artículo</th>
                  <th className="px-3 py-2 text-left">Tipo café</th>
                  <th className="px-3 py-2 text-right">Kilos</th>
                  <th className="px-3 py-2 text-right">Factor calidad</th>
                  <th className="px-3 py-2 text-right">Kilos buenos</th>
                  <th className="px-3 py-2 text-right">Precio/kg</th>
                  <th className="px-3 py-2 text-right">Cargas</th>
                  <th className="px-3 py-2 text-right">Retefuente</th>
                  <th className="px-3 py-2 text-right">Valor bruto</th>
                  <th className="px-3 py-2 text-right">Valor neto</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => {
                  const bruto = (Number(row.kilos) || 0) * (Number(row.precio_kilo) || 0)
                  const neto = bruto - (Number(row.retefuente) || 0)
                  return (
                    <tr key={i} className="hover:bg-muted/10">
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{row.descripcion}</td>
                      <td className="px-3 py-2">
                        <select
                          value={row.tipo_cafe_id}
                          onChange={e => setRow(i, "tipo_cafe_id", e.target.value)}
                          className={`${s.input} min-w-[120px] ${!row.tipo_cafe_id ? "border-destructive" : ""}`}
                        >
                          <option value="">Seleccionar…</option>
                          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="any" min="0" value={row.kilos}
                          onChange={e => setRow(i, "kilos", e.target.value)}
                          className={`${s.input} text-right w-28`} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" min="0" max="1" value={row.factor}
                          onChange={e => setRow(i, "factor", e.target.value)}
                          className={`${s.input} text-right w-20`} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold text-green-400">
                        {kilosBuenos(row).toLocaleString("es-CO", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="any" min="0" value={row.precio_kilo}
                          onChange={e => setRow(i, "precio_kilo", e.target.value)}
                          className={`${s.input} text-right w-32`} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">
                        {Number(row.cargas).toLocaleString("es-CO", { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="any" min="0" value={row.retefuente}
                          onChange={e => setRow(i, "retefuente", e.target.value)}
                          className={`${s.input} text-right w-32`} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs">{cop(bruto)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold text-amber-400">{cop(neto)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive p-1 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-center text-sm font-semibold border-t border-border pt-3">
            <span className="text-muted-foreground">
              {rows.length} línea{rows.length !== 1 ? "s" : ""} · {rows.reduce((s, r) => s + (Number(r.kilos) || 0), 0).toLocaleString("es-CO")} kg
            </span>
            <div className="flex gap-6">
              <span className="text-muted-foreground text-xs">
                Bruto: {cop(rows.reduce((s, r) => s + (Number(r.kilos) || 0) * (Number(r.precio_kilo) || 0), 0))}
              </span>
              <span>
                Neto: {cop(rows.reduce((s, r) => {
                  const bruto = (Number(r.kilos) || 0) * (Number(r.precio_kilo) || 0)
                  return s + bruto - (Number(r.retefuente) || 0)
                }, 0))}
              </span>
            </div>
          </div>

          {error && <p className="text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <button onClick={onCerrar} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={guardando || rows.length === 0}
            className="text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Crear {rows.length} venta{rows.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  )
}

// â"€â"€â"€ Manual form â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface FormData {
  fecha: string
  tipo_cafe: string
  kilos: string
  cargas: string
  factor: string
  precio_kilo: string
  comprador: string
  cuenta_destino: string
  retefuente: string
}

function FormVentaCafe({
  cuentas,
  tipos,
  onGuardado,
  onCerrar,
}: {
  cuentas: Cuenta[]
  tipos: TipoCafeVenta[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>({
    fecha: new Date().toISOString().slice(0, 10),
    tipo_cafe: tipos[0]?.id.toString() ?? "",
    kilos: "",
    cargas: "0",
    factor: "1",
    precio_kilo: "",
    comprador: "",
    cuenta_destino: "",
    retefuente: "0",
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value
    setForm(f => {
      const updated = { ...f, [k]: value }
      if (k === "kilos") updated.cargas = Number(value) > 0 ? (Number(value) / 125).toFixed(4) : "0"
      return updated
    })
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.tipo_cafe || !form.kilos || !form.precio_kilo || !form.comprador || !form.cuenta_destino) {
      setError("Fecha, tipo, kilos, precio, comprador y cuenta son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.ventasCafe.create({
        fecha: form.fecha,
        tipo_cafe: Number(form.tipo_cafe),
        kilos: form.kilos,
        cargas: form.cargas || undefined,
        factor: form.factor || "1",
        precio_kilo: form.precio_kilo,
        comprador: form.comprador,
        cuenta_destino: Number(form.cuenta_destino),
        retefuente: form.retefuente || "0",
      })
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const field = "flex flex-col gap-1"
  const label = "text-xs font-medium text-muted-foreground"
  const input = "text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nueva venta de café</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set("fecha")} className={input} required />
            </div>
            <div className={field}>
              <label className={label}>Tipo de café *</label>
              <select value={form.tipo_cafe} onChange={set("tipo_cafe")} className={input} required>
                {tipos.length === 0 && <option value="">Cargando...</option>}
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Kilos *</label>
              <input type="number" step="any" min="0" value={form.kilos} onChange={set("kilos")} className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Factor de calidad</label>
              <input type="number" step="0.01" min="0" max="1" value={form.factor} onChange={set("factor")} className={input} placeholder="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Kilos buenos (kilos × factor)</label>
              <input readOnly
                value={form.kilos && form.factor ? (Number(form.kilos) * Number(form.factor)).toLocaleString("es-CO", { maximumFractionDigits: 2 }) : ""}
                className={`${input} bg-green-950/30 text-green-400 cursor-not-allowed font-semibold`}
                placeholder="Se calcula automáticamente" />
            </div>
            <div className={field}>
              <label className={label}>Cargas (÷ 125)</label>
              <input readOnly value={form.kilos ? (Number(form.kilos) / 125).toLocaleString("es-CO", { maximumFractionDigits: 4 }) : ""}
                className={`${input} bg-muted/50 text-muted-foreground cursor-not-allowed`}
                placeholder="Se calcula automáticamente" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Precio por kilo *</label>
              <input type="number" step="any" min="0" value={form.precio_kilo} onChange={set("precio_kilo")} className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Retefuente</label>
              <input type="number" step="any" min="0" value={form.retefuente} onChange={set("retefuente")} className={input} placeholder="0" />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Comprador *</label>
            <input value={form.comprador} onChange={set("comprador")} className={input} placeholder="Nombre del comprador" required />
          </div>

          <div className={field}>
            <label className={label}>Cuenta destino *</label>
            <select value={form.cuenta_destino} onChange={set("cuenta_destino")} className={input} required>
              <option value="">Seleccionar…</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar}
              className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={guardando}
              className="text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2">
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// â"€â"€â"€ Main Page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function VentasCafePage() {
  const [ventas, setVentas] = useState<VentaCafe[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [tipos, setTipos] = useState<TipoCafeVenta[]>([])
  const [dataTiempo, setDataTiempo] = useState<VentaPorPeriodo[]>([])
  const [dataTipo, setDataTipo] = useState<VentaPorTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [vista, setVista] = useState<Vista>("mes")
  const [query, setQuery] = useState("")

  const [parsando, setParsando] = useState(false)
  const [facturaData, setFacturaData] = useState<FacturaCafeucol | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [proveedorIA, setProveedorIA] = useState<ProveedorIA>("gpt")
  const [lineaTipo, setLineaTipo] = useState("")
  const [ultimas, setUltimas] = useState(30)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 50

  const dateParams = () => {
    const p: Record<string, string> = {}
    if (desde) p.fecha_desde = desde
    if (hasta) p.fecha_hasta = hasta
    return p
  }

  const cargar = (pg = pagina) => {
    setLoading(true)
    const dParams = dateParams()
    const listParams = { ...dParams, page: String(pg) }
    Promise.all([
      api.produccion.ventasCafe.list(listParams),
      api.finanzas.cuentas.list(),
      api.produccion.ventasCafe.porTipo(dParams),
    ]).then(([v, c, tipos]) => {
      setVentas(v.results)
      setTotal(v.count)
      setCuentas(c)
      setDataTipo(tipos)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    api.produccion.tiposCafe.list().then(setTipos)
    cargar(1)
  }, [])

  useEffect(() => {
    api.produccion.ventasCafe.porPeriodo(vista, dateParams()).then(setDataTiempo)
  }, [vista, desde, hasta])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setParsando(true)
    try {
      const data = await api.produccion.ventasCafe.parseFactura(file, proveedorIA)
      setFacturaData(data)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al procesar la imagen")
    } finally {
      setParsando(false)
    }
  }

  const handleImportConfirm = async (rows: ImportRow[], fecha: string, comprador: string, cuentaId: number) => {
    const items = rows.map(r => {
      const valor_total = Math.round(Number(r.kilos) * Number(r.precio_kilo) * 100) / 100
      const retefuente = Number(r.retefuente) || 0
      return {
        fecha,
        tipo_cafe: Number(r.tipo_cafe_id),
        kilos: r.kilos,
        cargas: r.cargas,
        factor: r.factor || "1",
        precio_kilo: r.precio_kilo,
        comprador,
        cuenta_destino: cuentaId,
        valor_total: String(valor_total),
        retefuente: String(retefuente),
        deduccion: "0",
        valor_neto: String(valor_total - retefuente),
      }
    })
    await api.produccion.ventasCafe.bulkCreate(items)
    setFacturaData(null)
    setPagina(1)
    cargar(1)
  }

  const totalKilos = ventas.reduce((s, v) => s + Number(v.kilos), 0)
  const totalNeto = ventas.reduce((s, v) => s + Number(v.valor_neto), 0)
  const precioPromedio = totalKilos > 0 ? totalNeto / totalKilos : 0

  const tiempoDisplay = dataTiempo.map(d => ({
    periodo: d.periodo.includes("-") ? d.periodo.slice(d.periodo.indexOf("-") + 1) : d.periodo,
    valor: d.valor,
  }))
  const tipoDisplay = dataTipo.map((d, i) => ({ ...d, name: d.nombre, color: BAR_COLORS[i % BAR_COLORS.length] }))
  const barHeight = Math.max(120, tipoDisplay.length * 32)

  const ventasFiltradas = lineaTipo
    ? [...ventas].filter(v => v.tipo_cafe_nombre === lineaTipo)
    : [...ventas]
  const lineDisplay = ventasFiltradas
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(ultimas === 0 ? 0 : -ultimas)
    .map((v, i) => ({
      n: i + 1,
      valor: Number(v.valor_neto),
      fecha: v.fecha,
      fechaCorta: v.fecha.slice(5).replace("-", "/"),
      tipo: v.tipo_cafe_nombre ?? "",
    }))

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormVentaCafe
          cuentas={cuentas}
          tipos={tipos}
          onGuardado={() => { setPagina(1); cargar(1); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      {facturaData && (
        <ImportCafeModal
          factura={facturaData}
          tipos={tipos}
          onConfirm={handleImportConfirm}
          onCerrar={() => setFacturaData(null)}
        />
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ventas de café</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Pergamino, pasilla, corriente y otros tipos. El valor neto descuenta retefuente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleIA value={proveedorIA} onChange={setProveedorIA} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsando}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted font-medium disabled:opacity-60"
          >
            {parsando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ScanLine className="h-4 w-4 text-amber-400" />}
            {parsando ? "Procesando…" : "Importar CAFEUCOL"}
          </button>
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            <Plus className="h-4 w-4" />
            Nueva venta
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor neto total</p>
          <p className="text-xl font-bold tabular-nums mt-1 text-amber-700">{cop(totalNeto)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total kilos</p>
          <p className="text-xl font-bold tabular-nums mt-1">{totalKilos.toLocaleString("es-CO")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Precio promedio / kg</p>
          <p className="text-xl font-bold tabular-nums mt-1">{cop(precioPromedio)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Número de ventas</p>
          <p className="text-xl font-bold tabular-nums mt-1">{total}</p>
        </div>
      </div>

      {/* Charts */}
      {(tiempoDisplay.length > 0 || tipoDisplay.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor vendido</p>
              <div className="flex rounded-lg border border-border overflow-hidden text-[11px]">
                {(["semana", "mes", "año"] as Vista[]).map(v => (
                  <button key={v} onClick={() => setVista(v)}
                    className={`px-2.5 py-1 capitalize transition-colors ${vista === v ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tiempoDisplay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} width={40} />
                <Tooltip content={<CopTooltip />} />
                <Bar dataKey="valor" name="Valor neto" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Distribución por tipo</p>
            <ResponsiveContainer width="100%" height={barHeight}>
              <BarChart data={tipoDisplay} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip content={<CopTooltip />} />
                <Bar dataKey="valor" name="Valor neto" radius={[0, 3, 3, 0]}>
                  {tipoDisplay.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* Evolución por venta */}
      {ventas.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Evolución del valor neto por venta
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={ultimas}
                onChange={e => setUltimas(Number(e.target.value))}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background focus:outline-none"
              >
                <option value={15}>Últimas 15</option>
                <option value={30}>Últimas 30</option>
                <option value={50}>Últimas 50</option>
                <option value={0}>Todas</option>
              </select>
              <select
                value={lineaTipo}
                onChange={e => setLineaTipo(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background focus:outline-none"
              >
                <option value="">Todos los tipos</option>
                {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={lineDisplay} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="fechaCorta"
                tick={{ fontSize: 9 }}
                angle={-40}
                textAnchor="end"
                interval="preserveStartEnd"
                height={40}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} width={52} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-0.5">
                      <p className="font-medium">{d.fecha}</p>
                      <p className="text-muted-foreground">{d.tipo}</p>
                      <p className="text-amber-400 font-semibold">{cop(d.valor)}</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#fbbf24" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Buscar por tipo o comprador…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <button onClick={() => { setPagina(1); cargar(1) }}
          className="text-sm px-4 py-1.5 rounded-md border border-border hover:bg-muted">Filtrar</button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Tipo</th>
                <th className="px-3 py-2.5 text-right">Kilos</th>
                <th className="px-3 py-2.5 text-right">Cargas</th>
                <th className="px-3 py-2.5 text-right">Precio/kg</th>
                <th className="px-3 py-2.5 text-right">Valor neto</th>
                <th className="px-3 py-2.5 text-left">Comprador</th>
                <th className="px-3 py-2.5 text-left">Cuenta destino</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                  Sin ventas registradas.
                </td></tr>
              ) : ventas.filter(v => {
                  const q = query.toLowerCase()
                  return !q || (v.tipo_cafe_nombre ?? "").toLowerCase().includes(q) || v.comprador.toLowerCase().includes(q)
                }).map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{v.fecha}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
                      {v.tipo_cafe_nombre}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(v.kilos).toLocaleString("es-CO")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{v.cargas ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(v.precio_kilo)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(v.valor_neto)}</td>
                  <td className="px-3 py-2">{v.comprador}</td>
                  <td className="px-3 py-2 text-muted-foreground">{v.cuenta_destino_nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Paginacion pagina={pagina} total={total} pageSize={PAGE_SIZE} onChange={p => { setPagina(p); cargar(p) }} />
    </div>
  )
}

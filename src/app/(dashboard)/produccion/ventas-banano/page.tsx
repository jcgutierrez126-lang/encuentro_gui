"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Loader2, X, ScanLine, Trash2, Search } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts"
import {
  api,
  type VentaBanano, type TipoBanano, type VentaPorPeriodo, type VentaPorTipo,
  type FacturaComsab, type Cuenta, type Lote,
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
  "#22c55e", "#3b82f6", "#eab308", "#f97316", "#a855f7",
  "#06b6d4", "#ef4444", "#84cc16", "#f59e0b", "#6366f1",
  "#ec4899", "#14b8a6", "#8b5cf6", "#fb923c", "#4ade80",
  "#60a5fa", "#facc15", "#f87171", "#c084fc", "#34d399",
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

// â"€â"€â"€ Normalise + fuzzy matching â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/[^a-z0-9 ]/g, "")
}

// OCR common misreads from COMSAB invoices
const OCR_CORRECTIONS: [RegExp, string][] = [
  [/\bbarton\b/g, "harton"],
]

function normOcr(s: string) {
  let n = norm(s)
  for (const [re, rep] of OCR_CORRECTIONS) n = n.replace(re, rep)
  return n
}

function matchTipo(descripcion: string, tipos: TipoBanano[]): TipoBanano | undefined {
  const d = normOcr(descripcion)
  const matches = tipos.filter(t => {
    const n = norm(t.nombre)
    return d.includes(n) || n.includes(d)
  })
  if (!matches.length) return undefined
  return matches.reduce((best, t) => t.nombre.length > best.nombre.length ? t : best)
}

function matchLote(descripcion: string, lotes: Lote[], tipoMateria?: "cafe" | "banano"): Lote | undefined {
  const d = norm(descripcion)
  const matches = lotes.filter(l => {
    const n = norm(l.nombre)
    const a = l.abreviatura ? norm(l.abreviatura) : ""
    return d.includes(n) || n.includes(d) || (a && d.includes(a))
  })
  if (!matches.length) return undefined
  // Prefiere el lote cuyo tipo_materia coincide con el contexto
  if (tipoMateria) {
    const typed = matches.filter(l => l.tipo_materia === tipoMateria)
    if (typed.length) return typed.reduce((best, l) => l.nombre.length > best.nombre.length ? l : best)
  }
  return matches.reduce((best, l) => l.nombre.length > best.nombre.length ? l : best)
}

// â"€â"€â"€ Import Modal (COMSAB invoice) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface ImportRow {
  descripcion: string
  tipo_platano_id: string
  lote_id: string
  kilos: string
  precio_kilo: string
}

interface EgresoDeduccion {
  nombre: string
  valor: number
  proveedorId: number | null
  facturadoA: string
}

function ImportModal({
  factura,
  tipos,
  lotes,
  onConfirm,
  onCerrar,
}: {
  factura: FacturaComsab
  tipos: TipoBanano[]
  lotes: Lote[]
  onConfirm: (rows: ImportRow[], fecha: string, cuentaId: number, proveedorId: number | null, egresos: EgresoDeduccion[] | null) => Promise<void>
  onCerrar: () => void
}) {
  const [fecha, setFecha] = useState(factura.fecha)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cuentaId, setCuentaId] = useState("")

  // Pre-select lote por finca en todas las filas
  // Limpia prefijos tipo "1 - " o "1 — " que puede traer el OCR
  const fincaNombre = factura.finca?.replace(/^\d+\s*[-—]\s*/, "").trim() ?? null
  const loteInicial = fincaNombre ? matchLote(fincaNombre, lotes, 'banano') : undefined

  const [rows, setRows] = useState<ImportRow[]>(() =>
    factura.items.map(item => ({
      descripcion: item.descripcion,
      tipo_platano_id: matchTipo(item.descripcion, tipos)?.id.toString() ?? "",
      lote_id: loteInicial?.id.toString() ?? matchLote(item.descripcion, lotes, 'banano')?.id.toString() ?? "",
      kilos: item.kilos.toString(),
      precio_kilo: item.precio_kilo.toString(),
    }))
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Proveedor de la venta (COMSAB) y de egresos
  const tieneDeducciones = (factura.deducciones?.length ?? 0) > 0
  const [crearEgresos, setCrearEgresos] = useState(tieneDeducciones)
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string; cedula_nit: string }[]>([])
  const [ventaProveedorId, setVentaProveedorId] = useState("")
  const [egresoProveedorId, setEgresoProveedorId] = useState("")
  const [egresoFacuradoA, setEgresoFacuradoA] = useState("Natalia Gutierrez")

  useEffect(() => {
    api.finanzas.cuentas.list().then(cs => {
      setCuentas(cs)
      const digitos = (s: string | null | undefined) => s?.replace(/\D/g, "") ?? ""
      const numFactura = digitos(factura.numero_cuenta)
      const match =
        (numFactura ? cs.find(c => digitos(c.numero_cuenta) === numFactura) : undefined) ??
        cs.find(c => norm(c.nombre).includes("natalia"))
      if (match) setCuentaId(match.id.toString())
    })
    api.finanzas.proveedores.list({ page: "1", page_size: "500" }).then(r => {
      setProveedores(r.results)
      const comsab = r.results.find(p =>
        p.cedula_nit?.replace(/[-. ]/g, "") === "8002297351" ||
        p.cedula_nit?.replace(/[-. ]/g, "") === "800229735" ||
        norm(p.nombre).includes("comsab") ||
        norm(p.nombre).includes("agromultiactiva") ||
        norm(p.nombre).includes("san bartolo")
      )
      if (comsab) {
        setVentaProveedorId(comsab.id.toString())
        setEgresoProveedorId(comsab.id.toString())
      }
    })
  }, [])

  const setRow = (i: number, field: keyof ImportRow, value: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i))

  const totalBruto = rows.reduce((s, r) => s + (Number(r.kilos) || 0) * (Number(r.precio_kilo) || 0), 0)

  const handleConfirm = async () => {
    if (!cuentaId) { setError("Selecciona la cuenta destino"); return }
    const invalid = rows.find(r => !r.tipo_platano_id || !r.kilos || !r.precio_kilo)
    if (invalid) { setError(`Falta tipo o valores en "${invalid.descripcion}"`); return }
    setGuardando(true)
    setError(null)
    try {
      const egresos: EgresoDeduccion[] | null = (crearEgresos && factura.deducciones?.length)
        ? factura.deducciones.map(d => ({
            nombre: d.concepto,
            valor: Math.abs(d.valor),
            proveedorId: egresoProveedorId ? Number(egresoProveedorId) : null,
            facturadoA: egresoFacuradoA,
          }))
        : null
      await onConfirm(rows, fecha, Number(cuentaId), ventaProveedorId ? Number(ventaProveedorId) : null, egresos)
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

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-[#ccff00]" />
              Importar factura COMSAB
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Revisa y ajusta los datos antes de crear las ventas</p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 flex-1">

          {/* Meta */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className={s.label}>Fecha liquidación *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={s.input} />
            </div>
            <div className="space-y-1">
              <label className={s.label}>Proveedor / Cooperativa</label>
              <select value={ventaProveedorId} onChange={e => setVentaProveedorId(e.target.value)} className={s.input}>
                <option value="">— Sin proveedor —</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={s.label}>Cuenta destino *</label>
              <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className={s.input}>
                <option value="">Seleccionar cuenta…</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Descripción factura</th>
                  <th className="px-3 py-2 text-left">Tipo de banano</th>
                  <th className="px-3 py-2 text-left">Lote</th>
                  <th className="px-3 py-2 text-right">Kilos</th>
                  <th className="px-3 py-2 text-right">Precio/kg</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => {
                  const total = (Number(row.kilos) || 0) * (Number(row.precio_kilo) || 0)
                  return (
                    <tr key={i} className="hover:bg-muted/10">
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{row.descripcion}</td>
                      <td className="px-3 py-2">
                        <select
                          value={row.tipo_platano_id}
                          onChange={e => setRow(i, "tipo_platano_id", e.target.value)}
                          className={`${s.input} min-w-[130px] ${!row.tipo_platano_id ? "border-destructive" : ""}`}
                        >
                          <option value="">Seleccionar…</option>
                          {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.lote_id}
                          onChange={e => setRow(i, "lote_id", e.target.value)}
                          className={`${s.input} min-w-[110px]`}
                        >
                          <option value="">— Sin lote —</option>
                          {lotes.map(l => <option key={l.id} value={l.id}>{l.abreviatura ?? l.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" step="any" min="0"
                          value={row.kilos}
                          onChange={e => setRow(i, "kilos", e.target.value)}
                          className={`${s.input} text-right w-28 min-w-[7rem]`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" step="any" min="0"
                          value={row.precio_kilo}
                          onChange={e => setRow(i, "precio_kilo", e.target.value)}
                          className={`${s.input} text-right w-32`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-xs">{cop(total)}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeRow(i)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Deducciones + egresos */}
          {factura.deducciones?.length > 0 && (
            <div className="rounded-lg bg-muted/20 border border-border px-4 py-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deducciones</p>
              {factura.deducciones.map((d, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.concepto}</span>
                  <span className="text-red-400 tabular-nums">âˆ'{cop(d.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1.5 border-t border-border font-semibold">
                <span>Total a pagar</span>
                <span className="tabular-nums">{cop(factura.total_a_pagar ?? 0)}</span>
              </div>

              {/* Toggle crear egresos */}
              <div className="border-t border-border pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={crearEgresos} onChange={e => setCrearEgresos(e.target.checked)}
                    className="h-4 w-4 rounded" />
                  <span className="text-xs font-medium">Registrar deducciones como egresos</span>
                </label>

                {crearEgresos && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className={s.label}>Proveedor</label>
                      <select value={egresoProveedorId} onChange={e => setEgresoProveedorId(e.target.value)} className={s.input}>
                        <option value="">— Sin proveedor —</option>
                        {proveedores.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={s.label}>Facturado a</label>
                      <input value={egresoFacuradoA} onChange={e => setEgresoFacuradoA(e.target.value)} className={s.input} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Totals row */}
          <div className="flex justify-between items-center text-sm font-semibold border-t border-border pt-3">
            <span className="text-muted-foreground">{rows.length} líneas · {rows.reduce((s, r) => s + (Number(r.kilos) || 0), 0).toLocaleString("es-CO")} kg</span>
            <span>Total bruto: {cop(totalBruto)}</span>
          </div>

          {error && <p className="text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
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
  tipo_platano: string
  lote_id: string
  kilos: string
  precio_kilo: string
  cuenta_destino: string
}

function FormVentaBanano({
  tipos,
  cuentas,
  lotes,
  onGuardado,
  onCerrar,
}: {
  tipos: TipoBanano[]
  cuentas: Cuenta[]
  lotes: Lote[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>({
    fecha: new Date().toISOString().slice(0, 10),
    tipo_platano: tipos[0]?.id.toString() ?? "",
    lote_id: "",
    kilos: "",
    precio_kilo: "",
    cuenta_destino: cuentas[0]?.id.toString() ?? "",
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valorTotal = form.kilos && form.precio_kilo
    ? Math.round(Number(form.kilos) * Number(form.precio_kilo) * 100) / 100
    : null

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.tipo_platano || !form.kilos || !form.precio_kilo || !form.cuenta_destino) {
      setError("Todos los campos obligatorios deben estar completos.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.ventasBanano.create({
        fecha: form.fecha,
        tipo_platano: Number(form.tipo_platano),
        lote: form.lote_id ? Number(form.lote_id) : null,
        kilos: form.kilos,
        precio_kilo: form.precio_kilo,
        valor_total: valorTotal !== null ? String(valorTotal) : undefined,
        cuenta_destino: Number(form.cuenta_destino),
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nueva venta de banano</h2>
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
              <label className={label}>Tipo *</label>
              <select value={form.tipo_platano} onChange={set("tipo_platano")} className={input} required>
                {tipos.length === 0 && <option value="">Cargando...</option>}
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className={field}>
            <label className={label}>Lote</label>
            <select value={form.lote_id} onChange={set("lote_id")} className={input}>
              <option value="">— Sin lote —</option>
              {lotes.map(l => <option key={l.id} value={l.id}>{l.abreviatura ? `${l.abreviatura} — ${l.nombre}` : l.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Kilos *</label>
              <input type="number" step="any" min="0" value={form.kilos} onChange={set("kilos")} className={input} placeholder="0" required />
            </div>
            <div className={field}>
              <label className={label}>Precio por kilo *</label>
              <input type="number" step="any" min="0" value={form.precio_kilo} onChange={set("precio_kilo")} className={input} placeholder="0" required />
            </div>
          </div>
          <div className={field}>
            <label className={label}>Cuenta destino *</label>
            <select value={form.cuenta_destino} onChange={set("cuenta_destino")} className={input} required>
              <option value="">Seleccionar cuenta…</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className={field}>
            <label className={label}>Valor total (calculado)</label>
            <input readOnly value={valorTotal !== null ? valorTotal.toLocaleString("es-CO") : ""}
              className={`${input} bg-muted/50 text-muted-foreground cursor-not-allowed`}
              placeholder="Se calcula automáticamente" />
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

export default function VentasBananoPage() {
  const [ventas, setVentas] = useState<VentaBanano[]>([])
  const [tipos, setTipos] = useState<TipoBanano[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [dataTiempo, setDataTiempo] = useState<VentaPorPeriodo[]>([])
  const [dataTipo, setDataTipo] = useState<VentaPorTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [query, setQuery] = useState("")
  const [vista, setVista] = useState<Vista>("mes")

  // Import state
  const [parsando, setParsando] = useState(false)
  const [facturaData, setFacturaData] = useState<FacturaComsab | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [proveedorIA, setProveedorIA] = useState<ProveedorIA>("gpt")
  const [ultimas, setUltimas] = useState(30)
  const [tiposFiltro, setTiposFiltro] = useState<Set<string>>(new Set())
  const [filtroAbierto, setFiltroAbierto] = useState(false)
  const filtroRef = useRef<HTMLDivElement>(null)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalValorAll, setTotalValorAll] = useState(0)
  const [totalKilosAll, setTotalKilosAll] = useState(0)
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
      api.produccion.ventasBanano.list(listParams),
      api.produccion.ventasBanano.porTipo(dParams),
    ]).then(([r, tipos]) => {
      setVentas(r.results)
      setTotal(r.count)
      setTotalValorAll(r.total_valor ?? 0)
      setTotalKilosAll(r.total_kilos ?? 0)
      setDataTipo(tipos)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    Promise.all([
      api.produccion.tiposBanano.list(),
      api.finanzas.cuentas.list(),
      api.produccion.lotes.list(),
    ]).then(([t, c, l]) => { setTipos(t); setCuentas(c); setLotes(l) })
    cargar(1)
  }, [])

  useEffect(() => {
    api.produccion.ventasBanano.porPeriodo(vista, dateParams()).then(setDataTiempo)
  }, [vista, desde, hasta])

  useEffect(() => {
    function cerrar(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) setFiltroAbierto(false)
    }
    document.addEventListener("mousedown", cerrar)
    return () => document.removeEventListener("mousedown", cerrar)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setParsando(true)
    try {
      const data = await api.produccion.ventasBanano.parseFactura(file, proveedorIA)
      setFacturaData(data)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al procesar la imagen")
    } finally {
      setParsando(false)
    }
  }

  const handleImportConfirm = async (rows: ImportRow[], fecha: string, cuentaId: number, proveedorId: number | null, egresos: EgresoDeduccion[] | null) => {
    const items = rows.map(r => ({
      fecha,
      tipo_platano: Number(r.tipo_platano_id),
      lote: r.lote_id ? Number(r.lote_id) : null,
      kilos: r.kilos,
      precio_kilo: r.precio_kilo,
      valor_total: String(Math.round(Number(r.kilos) * Number(r.precio_kilo) * 100) / 100),
      cuenta_destino: cuentaId,
      proveedor: proveedorId,
      facturado_a: "Cooperativa Agromultiactiva San Bartolo",
    }))
    await api.produccion.ventasBanano.bulkCreate(items)

    if (egresos?.length) {
      await Promise.all(egresos.map(eg =>
        api.finanzas.egresos.create({
          fecha,
          nombre: eg.nombre,
          valor: String(eg.valor),
          cuenta: cuentaId,
          estado: "pagada",
          categoria: "comsab",
          proveedor: eg.proveedorId ?? undefined,
          nit_proveedor_destino: "800229735-1",
          facturado_a: eg.facturadoA || undefined,
          cantidad: "0",
          descripcion: "",
          unidad: "",
        } as Parameters<typeof api.finanzas.egresos.create>[0])
      ))
    }

    setFacturaData(null)
    setPagina(1)
    cargar(1)
  }

  const totalKilos = totalKilosAll
  const totalValor = totalValorAll
  const precioPromedio = totalKilos > 0 ? totalValor / totalKilos : 0

  const tiempoDisplay = dataTiempo.map(d => ({
    periodo: d.periodo.includes("-") ? d.periodo.slice(d.periodo.indexOf("-") + 1) : d.periodo,
    valor: d.valor,
  }))
  const tipoDisplay = dataTipo.map((d, i) => ({ ...d, name: d.nombre, color: BAR_COLORS[i % BAR_COLORS.length] }))
  const barHeight = Math.max(180, tipoDisplay.length * 26)

  // Pivot: una fila por fecha, una columna por tipo de banano
  const ventasOrdenadas = [...ventas].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const tiposEnVentas = [...new Set(ventasOrdenadas.map(v => v.tipo_nombre ?? ""))].filter(Boolean).sort()
  const tiposVisibles = tiposFiltro.size === 0 ? tiposEnVentas : tiposEnVentas.filter(t => tiposFiltro.has(t))
  const fechasUnicas = [...new Set(ventasOrdenadas.map(v => v.fecha))]
  const fechasSliced = ultimas === 0 ? fechasUnicas : fechasUnicas.slice(-ultimas)

  const lineDisplay = fechasSliced.map(fecha => {
    const punto: Record<string, number | string> = {
      fecha,
      fechaCorta: fecha.slice(5).replace("-", "/"),
    }
    tiposEnVentas.forEach(tipo => {
      const venta = ventasOrdenadas.find(v => v.fecha === fecha && v.tipo_nombre === tipo)
      if (venta) punto[tipo] = Number(venta.valor_total)
    })
    return punto
  })

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormVentaBanano
          tipos={tipos}
          cuentas={cuentas}
          lotes={lotes}
          onGuardado={() => { setPagina(1); cargar(1); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      {facturaData && (
        <ImportModal
          factura={facturaData}
          tipos={tipos}
          lotes={lotes}
          onConfirm={handleImportConfirm}
          onCerrar={() => setFacturaData(null)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ventas de banano</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registro de ventas por tipo. El valor total = kilos × precio/kg.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ToggleIA value={proveedorIA} onChange={setProveedorIA} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsando}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted font-medium disabled:opacity-60"
          >
            {parsando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ScanLine className="h-4 w-4 text-[#ccff00]" />}
            {parsando ? "Procesando…" : "Importar COMSAB"}
          </button>
          <button onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            <Plus className="h-4 w-4" />
            Nueva venta
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor total</p>
          <p className="text-xl font-bold tabular-nums mt-1 text-yellow-700">{cop(totalValor)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total kilos</p>
          <p className="text-xl font-bold tabular-nums mt-1">{totalKilos.toLocaleString("es-CO")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Precio promedio / kg</p>
          <p className="text-xl font-bold tabular-nums mt-1">{cop(precioPromedio)}</p>
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
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} width={44} />
                <Tooltip content={<CopTooltip />} />
                <Bar dataKey="valor" name="Valor" fill="#eab308" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Distribución por tipo</p>
            <ResponsiveContainer width="100%" height={barHeight}>
              <BarChart data={tipoDisplay} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={148} />
                <Tooltip content={<CopTooltip />} />
                <Bar dataKey="valor" name="Valor" radius={[0, 3, 3, 0]}>
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
              Evolución del valor por venta
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por tipo */}
              <div ref={filtroRef} className="relative">
                <button
                  onClick={() => setFiltroAbierto(v => !v)}
                  className="text-xs border border-border rounded-md px-2.5 py-1 bg-background flex items-center gap-1.5 hover:bg-muted"
                >
                  {tiposFiltro.size === 0 ? "Todos los tipos" : `${tiposFiltro.size} tipo${tiposFiltro.size > 1 ? "s" : ""}`}
                  <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {filtroAbierto && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[180px] max-h-64 overflow-y-auto space-y-0.5">
                    <button
                      onClick={() => setTiposFiltro(new Set())}
                      className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      Todos
                    </button>
                    {tiposEnVentas.map((tipo, i) => {
                      const sel = tiposFiltro.has(tipo)
                      return (
                        <label key={tipo} className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-muted cursor-pointer">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => {
                              setTiposFiltro(prev => {
                                const next = new Set(prev)
                                sel ? next.delete(tipo) : next.add(tipo)
                                return next
                              })
                            }}
                            className="h-3 w-3 accent-primary"
                          />
                          {tipo}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
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
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
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
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e3).toFixed(0)}k`} width={52} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const fecha = payload[0]?.payload?.fecha
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-0.5">
                      <p className="font-medium mb-1">{fecha}</p>
                      {payload.map((p, i) => (
                        <p key={i} style={{ color: p.stroke as string }}>
                          {p.name}: {cop(p.value as number)}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              {tiposVisibles.map((tipo) => {
                const colorIdx = tiposEnVentas.indexOf(tipo)
                const color = BAR_COLORS[colorIdx % BAR_COLORS.length]
                return (
                <Line
                  key={tipo}
                  type="monotone"
                  dataKey={tipo}
                  name={tipo}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Buscar por tipo o proveedor…" value={query}
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
                <th className="px-3 py-2.5 text-right">Precio/kg</th>
                <th className="px-3 py-2.5 text-right">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                  Sin ventas registradas.
                </td></tr>
              ) : ventas.filter(v => {
                  const q = query.toLowerCase()
                  return !q || (v.tipo_nombre ?? "").toLowerCase().includes(q) || (v.proveedor_nombre ?? "").toLowerCase().includes(q)
                }).map(v => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{v.fecha}</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-yellow-100 text-yellow-800">
                      {v.tipo_nombre}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(v.kilos).toLocaleString("es-CO")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(v.precio_kilo)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(v.valor_total)}</td>
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

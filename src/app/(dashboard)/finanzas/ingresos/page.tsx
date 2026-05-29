"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Search } from "lucide-react"
import { api, type Ingreso, type Cuenta } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

interface FormData {
  fecha: string
  descripcion: string
  valor: string
  cuenta_destino: string
  origen: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: "",
  valor: "",
  cuenta_destino: "",
  origen: "",
}

function FormIngreso({
  cuentas,
  onGuardado,
  onCerrar,
}: {
  cuentas: Cuenta[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.descripcion || !form.valor || !form.cuenta_destino || !form.origen) {
      setError("Fecha, descripción, valor, cuenta destino y origen son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.finanzas.ingresos.create({
        fecha: form.fecha,
        descripcion: form.descripcion,
        valor: form.valor,
        cuenta_destino: Number(form.cuenta_destino),
        origen: form.origen,
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nuevo ingreso</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set("fecha")} className={input} required />
            </div>
            <div className={field}>
              <label className={label}>Valor * ($)</label>
              <input type="number" step="any" value={form.valor} onChange={set("valor")} className={input} required placeholder="0" />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Descripción *</label>
            <input value={form.descripcion} onChange={set("descripcion")} placeholder="Ej: Venta café pergamino" className={input} required />
          </div>

          <div className={field}>
            <label className={label}>Origen *</label>
            <input value={form.origen} onChange={set("origen")} placeholder="Ej: Venta café, dividendos…" className={input} required />
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

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalValor, setTotalValor] = useState("0")
  const PAGE_SIZE = 50

  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [query, setQuery] = useState("")

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (desde) params.fecha_desde = desde
    if (hasta) params.fecha_hasta = hasta

    Promise.all([
      api.finanzas.ingresos.list(params),
      api.finanzas.cuentas.list(),
    ]).then(([i, c]) => {
      setIngresos(i.results)
      setTotal(i.count)
      setTotalValor(String(i.total_valor ?? "0"))
      setCuentas(c)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1) }, [])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormIngreso
          cuentas={cuentas}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Ingresos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Entradas de dinero adicionales a ventas: anticipos, préstamos recibidos, dividendos. Las ventas de café y banano se registran en Producción.</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nuevo ingreso
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total ingresos (filtro activo)</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5 text-green-700">{fmt(totalValor)}</p>
        </div>
        <p className="text-xs text-muted-foreground">{total} registros</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Buscar por descripción u origen…" value={query}
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
                <th className="px-3 py-2.5 text-left">Descripción</th>
                <th className="px-3 py-2.5 text-left">Origen</th>
                <th className="px-3 py-2.5 text-left">Cuenta destino</th>
                <th className="px-3 py-2.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : ingresos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-muted-foreground">
                  Sin ingresos registrados.
                </td></tr>
              ) : ingresos.filter(i => {
                  const q = query.toLowerCase()
                  return !q || i.descripcion.toLowerCase().includes(q) || (i.origen ?? "").toLowerCase().includes(q) || (i.cuenta_destino_nombre ?? "").toLowerCase().includes(q)
                }).map(i => (
                <tr key={i.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{i.fecha}</td>
                  <td className="px-3 py-2 font-medium max-w-[220px] truncate">{i.descripcion}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.origen}</td>
                  <td className="px-3 py-2">{i.cuenta_destino_nombre}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-green-700">{fmt(i.valor)}</td>
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

"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, ArrowRight } from "lucide-react"
import { api, type Transaccion, type Cuenta } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

interface FormData {
  fecha: string
  descripcion: string
  valor: string
  cuenta_origen: string
  cuenta_destino: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: "",
  valor: "",
  cuenta_origen: "",
  cuenta_destino: "",
}

function FormTransaccion({
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
    if (!form.fecha || !form.descripcion || !form.valor || !form.cuenta_origen || !form.cuenta_destino) {
      setError("Todos los campos son obligatorios.")
      return
    }
    if (form.cuenta_origen === form.cuenta_destino) {
      setError("La cuenta origen y destino no pueden ser la misma.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.finanzas.transacciones.create({
        fecha: form.fecha,
        descripcion: form.descripcion,
        valor: form.valor,
        cuenta_origen: Number(form.cuenta_origen),
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nueva transacción</h2>
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
            <input value={form.descripcion} onChange={set("descripcion")} placeholder="Ej: Traslado a cuenta nómina" className={input} required />
          </div>

          <div className={field}>
            <label className={label}>Cuenta origen *</label>
            <select value={form.cuenta_origen} onChange={set("cuenta_origen")} className={input} required>
              <option value="">Seleccionar…</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
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

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalValor, setTotalValor] = useState("0")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const PAGE_SIZE = 50

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (desde) params.fecha_desde = desde
    if (hasta) params.fecha_hasta = hasta
    Promise.all([
      api.finanzas.transacciones.list(params),
      api.finanzas.cuentas.list(),
    ]).then(([t, c]) => {
      setTransacciones(t.results)
      setTotal(t.count)
      setTotalValor(String(t.total_valor ?? "0"))
      setCuentas(c)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1) }, [])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormTransaccion
          cuentas={cuentas}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Transacciones</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Traslados internos entre cuentas. Incluye Pago Vale (Bancolombia → Agencia) y cualquier movimiento entre fondos de la finca.</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva transacción
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total transacciones (filtro activo)</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">{fmt(totalValor)}</p>
        </div>
        <p className="text-xs text-muted-foreground">{total} registros</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
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
                <th className="px-3 py-2.5 text-left">Movimiento</th>
                <th className="px-3 py-2.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : transacciones.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                  Sin transacciones registradas.
                </td></tr>
              ) : transacciones.map(t => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{t.fecha}</td>
                  <td className="px-3 py-2 font-medium max-w-[200px] truncate">{t.descripcion}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span>{t.cuenta_origen_nombre}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      <span>{t.cuenta_destino_nombre}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(t.valor)}</td>
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

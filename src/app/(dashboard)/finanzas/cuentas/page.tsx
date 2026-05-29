"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import { api, type Cuenta, type TipoCuenta, type ResumenCuenta } from "@/lib/api"

const TIPOS: [TipoCuenta, string][] = [
  ["bancaria", "Bancaria"],
  ["efectivo", "Efectivo"],
  ["prestamo", "Préstamo"],
  ["agencia", "Agencia"],
  ["dividendos", "Dividendos"],
]

function fmt(n: string | number | null | undefined) {
  if (n === null || n === undefined) return "—"
  const num = Number(n)
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(num)
}

interface FormData {
  nombre: string
  tipo: TipoCuenta
  saldo: string
  numero_cuenta: string
  banco: string
  descripcion: string
  activa: boolean
}

const EMPTY: FormData = {
  nombre: "",
  tipo: "bancaria",
  saldo: "",
  numero_cuenta: "",
  banco: "",
  descripcion: "",
  activa: true,
}

function FormCuenta({ onGuardado, onCerrar }: { onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre || !form.tipo) {
      setError("Nombre y tipo son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.finanzas.cuentas.create({
        nombre: form.nombre,
        tipo: form.tipo,
        saldo: form.saldo || "0",
        numero_cuenta: form.numero_cuenta || undefined,
        banco: form.banco || undefined,
        descripcion: form.descripcion || undefined,
        activa: form.activa,
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
          <h2 className="font-semibold">Nueva cuenta</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className={field}>
            <label className={label}>Nombre *</label>
            <input value={form.nombre} onChange={set("nombre")} placeholder="Ej: Bancolombia ahorros" className={input} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Tipo *</label>
              <select value={form.tipo} onChange={set("tipo")} className={input} required>
                {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={label}>Saldo inicial ($)</label>
              <input type="number" step="any" value={form.saldo} onChange={set("saldo")} className={input} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Número de cuenta</label>
              <input value={form.numero_cuenta} onChange={set("numero_cuenta")} className={input} placeholder="Ej: 02945202842" />
            </div>
            <div className={field}>
              <label className={label}>Banco / Entidad</label>
              <input value={form.banco} onChange={set("banco")} className={input} placeholder="Ej: Bancolombia" />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Descripción</label>
            <textarea value={form.descripcion} onChange={set("descripcion")} rows={2}
              className={`${input} resize-none`} placeholder="Opcional" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activa"
              checked={form.activa}
              onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="activa" className={label}>Cuenta activa</label>
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

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [saldosReales, setSaldosReales] = useState<Record<string, ResumenCuenta>>({})
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      api.finanzas.cuentas.list(),
      api.finanzas.resumen(),
    ]).then(([cs, resumen]) => {
      setCuentas(cs)
      const map: Record<string, ResumenCuenta> = {}
      for (const rc of resumen.cuentas) map[rc.nombre] = rc
      setSaldosReales(map)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const totalSaldo = Object.values(saldosReales).reduce((s, rc) => s + Number(rc.saldo), 0)

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormCuenta
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Saldo = saldo inicial + ingresos (café + banano + otros) − egresos ± transferencias.
          </p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{cuentas.length} cuentas</p>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saldo total real</p>
          <p className="text-lg font-bold">{fmt(totalSaldo)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Tipo</th>
                <th className="px-3 py-2.5 text-right">Saldo real</th>
                <th className="px-3 py-2.5 text-right">Ingresos</th>
                <th className="px-3 py-2.5 text-right">Egresos</th>
                <th className="px-3 py-2.5 text-right">Transferencias</th>
                <th className="px-3 py-2.5 text-center">Activa</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : cuentas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  Sin cuentas registradas.
                </td></tr>
              ) : cuentas.map(c => {
                const rc = saldosReales[c.nombre]
                const totalIngresos = rc
                  ? Number(rc.ingresos) + Number(rc.pagos)
                  : 0
                const traslados = rc ? Number(rc.from) - Number(rc.to) : 0
                const partes = rc && Number(rc.ingresos) ? [`Ingresos ${fmt(rc.ingresos)}`] : []
                return (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30 text-sm">
                    <td className="px-3 py-2">
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">inicial: {fmt(c.saldo)}</p>
                    </td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{c.tipo.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">
                      {rc ? fmt(rc.saldo) : fmt(c.saldo)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {totalIngresos ? (
                        <>
                          <p className="text-emerald-600 font-medium">{fmt(totalIngresos)}</p>
                          {partes.length > 0 && (
                            <p className="text-[10px] text-muted-foreground/70">{partes.join(" · ")}</p>
                          )}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-600">
                      {rc && Number(rc.egresos) ? fmt(rc.egresos) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {traslados !== 0 ? (
                        <span className={traslados > 0 ? "text-blue-500" : "text-zinc-500"}>
                          {traslados > 0 ? "+" : ""}{fmt(traslados)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.activa ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                        {c.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

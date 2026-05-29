"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import { api, type Observacion } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

interface FormData {
  fecha: string
  observacion: string
  origen: "manual" | "control_semanal"
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  observacion: "",
  origen: "manual",
}

function FormObservacion({ onGuardado, onCerrar }: { onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.observacion.trim()) {
      setError("Fecha y observación son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.observaciones.create({
        fecha: form.fecha,
        observacion: form.observacion,
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
          <h2 className="font-semibold">Nueva observación</h2>
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
              <label className={label}>Origen</label>
              <select value={form.origen} onChange={set("origen")} className={input}>
                <option value="manual">Manual</option>
                <option value="control_semanal">Control Semanal</option>
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={label}>Texto *</label>
            <textarea value={form.observacion} onChange={set("observacion")} rows={5}
              className={`${input} resize-none`}
              placeholder="Escribe tu observación aquí…"
              required
            />
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

const ORIGEN_LABELS: Record<string, string> = {
  manual: "Manual",
  control_semanal: "Control Semanal",
}

const ORIGEN_COLORS: Record<string, string> = {
  manual: "bg-muted text-muted-foreground",
  control_semanal: "bg-blue-100 text-blue-800",
}

export default function ObservacionesPage() {
  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [filtroOrigen, setFiltroOrigen] = useState("")
  const PAGE_SIZE = 50

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (filtroOrigen) params.origen = filtroOrigen
    api.produccion.observaciones.list(params)
      .then(r => { setObservaciones(r.results); setTotal(r.count) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1) }, [filtroOrigen])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormObservacion
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Observaciones</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Notas y observaciones de producción</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva observación
        </button>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">{total} registros</p>
        <select
          value={filtroOrigen}
          onChange={e => { setFiltroOrigen(e.target.value); setPagina(1) }}
          className="text-xs border border-border rounded-md px-2 py-1 bg-background"
        >
          <option value="">Todos los orígenes</option>
          <option value="manual">Manual</option>
          <option value="control_semanal">Control Semanal</option>
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Origen</th>
                <th className="px-3 py-2.5 text-left">Texto</th>
                <th className="px-3 py-2.5 text-left">Creada</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : observaciones.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                  Sin observaciones registradas.
                </td></tr>
              ) : observaciones.map(o => (
                <tr key={o.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums whitespace-nowrap">{o.fecha}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ORIGEN_COLORS[o.origen] ?? "bg-muted text-muted-foreground"}`}>
                      {ORIGEN_LABELS[o.origen] ?? o.origen}
                    </span>
                    {o.semana_ref && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{o.semana_ref}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[440px]">
                    <span title={o.observacion}>
                      {o.observacion.length > 80 ? o.observacion.slice(0, 80) + "…" : o.observacion}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString("es-CO")}
                  </td>
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

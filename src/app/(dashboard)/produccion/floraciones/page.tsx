"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X } from "lucide-react"
import { api, type Floracion, type Lote } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

const CALIDADES: [string, string][] = [
  ["buena", "Buena"],
  ["regular", "Regular"],
  ["muy_buena", "Muy buena"],
  ["excelente", "Excelente"],
]

function badgeCalidad(c: string) {
  const map: Record<string, string> = {
    buena: "bg-blue-100 text-blue-800",
    regular: "bg-yellow-100 text-yellow-800",
    muy_buena: "bg-green-100 text-green-800",
    excelente: "bg-emerald-200 text-emerald-900",
  }
  return map[c] ?? "bg-muted text-muted-foreground"
}

interface FormData {
  fecha: string
  lote: string
  calidad: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  lote: "",
  calidad: "buena",
}

function FormFloracion({ lotes, onGuardado, onCerrar }: { lotes: Lote[]; onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.lote || !form.calidad) {
      setError("Fecha, lote y calidad son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.floraciones.create({
        fecha: form.fecha,
        lote: Number(form.lote),
        calidad: form.calidad as never,
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
          <h2 className="font-semibold">Nueva floración</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className={field}>
            <label className={label}>Fecha *</label>
            <input type="date" value={form.fecha} onChange={set("fecha")} className={input} required />
          </div>

          <div className={field}>
            <label className={label}>Lote *</label>
            <select value={form.lote} onChange={set("lote")} className={input} required>
              <option value="">Seleccionar…</option>
              {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>

          <div className={field}>
            <label className={label}>Calidad *</label>
            <select value={form.calidad} onChange={set("calidad")} className={input} required>
              {CALIDADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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

export default function FloracionesPage() {
  const [floraciones, setFloraciones] = useState<Floracion[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      api.produccion.floraciones.list(),
      api.produccion.lotes.list(),
    ]).then(([f, l]) => {
      setFloraciones(f.results)
      setLotes(l)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormFloracion
          lotes={lotes}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Floraciones</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registro de floraciones por lote</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva floración
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Lote</th>
                <th className="px-3 py-2.5 text-left">Calidad</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : floraciones.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-12 text-sm text-muted-foreground">
                  Sin floraciones registradas.
                </td></tr>
              ) : floraciones.map(f => (
                <tr key={f.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{f.fecha}</td>
                  <td className="px-3 py-2 font-medium">{f.lote_nombre}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeCalidad(f.calidad)}`}>
                      {f.calidad.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, ChevronDown, ChevronRight } from "lucide-react"
import { api, type MezclaAbono, type Lote } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

interface FertilizanteRow {
  fertilizante: string
  bultos: string
  precio_bulto: string
}

const FERT_EMPTY: FertilizanteRow = { fertilizante: "", bultos: "", precio_bulto: "" }

interface FormData {
  fecha: string
  formula: string
  lote: string
}

const FORM_EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  formula: "",
  lote: "",
}

function FormMezclaAbono({ lotes, onGuardado, onCerrar }: { lotes: Lote[]; onGuardado: () => void; onCerrar: () => void }) {
  const [form, setForm] = useState<FormData>(FORM_EMPTY)
  const [fertilizantes, setFertilizantes] = useState<FertilizanteRow[]>([{ ...FERT_EMPTY }])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const setFert = (i: number, k: keyof FertilizanteRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFertilizantes(rows => rows.map((r, idx) => idx === i ? { ...r, [k]: e.target.value } : r))

  const agregarFert = () => setFertilizantes(rows => [...rows, { ...FERT_EMPTY }])

  const quitarFert = (i: number) => {
    if (fertilizantes.length === 1) return
    setFertilizantes(rows => rows.filter((_, idx) => idx !== i))
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.formula) {
      setError("Fecha y fórmula son obligatorios.")
      return
    }
    for (const f of fertilizantes) {
      if (!f.fertilizante || !f.bultos || !f.precio_bulto) {
        setError("Todos los fertilizantes deben tener nombre, bultos y precio.")
        return
      }
    }
    setGuardando(true)
    setError(null)
    try {
      await api.produccion.mezclasAbono.create({
        fecha: form.fecha,
        formula: form.formula,
        lote: form.lote ? Number(form.lote) : undefined,
        fertilizantes: fertilizantes.map(f => ({
          fertilizante: f.fertilizante,
          bultos: Number(f.bultos),
          precio_bulto: f.precio_bulto,
        })) as never,
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nueva mezcla de abono</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-5">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cabecera</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={field}>
                <label className={label}>Fecha *</label>
                <input type="date" value={form.fecha} onChange={set("fecha")} className={input} required />
              </div>
              <div className={field}>
                <label className={label}>Fórmula *</label>
                <input value={form.formula} onChange={set("formula")} className={input} placeholder="Ej: 10-20-20" required />
              </div>
            </div>
            <div className={`${field} mt-3`}>
              <label className={label}>Lote</label>
              <select value={form.lote} onChange={set("lote")} className={input}>
                <option value="">Sin lote</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fertilizantes</p>
              <button type="button" onClick={agregarFert}
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-md border border-border hover:bg-muted">
                <Plus className="h-3 w-3" />
                Agregar fertilizante
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_120px_32px] gap-2 text-xs text-muted-foreground font-medium px-1">
                <span>Fertilizante</span>
                <span>Bultos</span>
                <span>Precio/bulto</span>
                <span />
              </div>
              {fertilizantes.map((fert, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_120px_32px] gap-2 items-center">
                  <input
                    value={fert.fertilizante}
                    onChange={setFert(i, "fertilizante")}
                    className={input}
                    placeholder="Nombre"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fert.bultos}
                    onChange={setFert(i, "bultos")}
                    className={input}
                    placeholder="0"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={fert.precio_bulto}
                    onChange={setFert(i, "precio_bulto")}
                    className={input}
                    placeholder="0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => quitarFert(i)}
                    disabled={fertilizantes.length === 1}
                    className="flex items-center justify-center h-8 w-8 rounded-md border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
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

export default function MezclasAbonoPage() {
  const [mezclas, setMezclas] = useState<MezclaAbono[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState<number | null>(null)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      api.produccion.mezclasAbono.list(),
      api.produccion.lotes.list(),
    ]).then(([m, l]) => {
      setMezclas(m.results)
      setLotes(l)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const toggleExpand = (id: number) => setExpandido(prev => prev === id ? null : id)

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormMezclaAbono
          lotes={lotes}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Mezclas de abono</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registro de mezclas y fertilizantes</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nueva mezcla
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 w-8" />
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Fórmula</th>
                <th className="px-3 py-2.5 text-left">Lote</th>
                <th className="px-3 py-2.5 text-right">Costo total</th>
                <th className="px-3 py-2.5 text-right">Fertilizantes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : mezclas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  Sin mezclas registradas.
                </td></tr>
              ) : mezclas.map(m => (
                <>
                  <tr
                    key={m.id}
                    className="border-b border-border hover:bg-muted/30 text-sm cursor-pointer"
                    onClick={() => toggleExpand(m.id)}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {expandido === m.id
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{m.fecha}</td>
                    <td className="px-3 py-2 font-medium">{m.formula}</td>
                    <td className="px-3 py-2">{m.lote_nombre ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(m.costo_total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{m.fertilizantes.length}</td>
                  </tr>
                  {expandido === m.id && (
                    <tr key={`${m.id}-detail`} className="border-b border-border bg-muted/20">
                      <td colSpan={6} className="px-6 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-1 pr-4">Fertilizante</th>
                              <th className="text-right py-1 pr-4">Bultos</th>
                              <th className="text-right py-1 pr-4">Precio/bulto</th>
                              <th className="text-right py-1">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.fertilizantes.map(f => (
                              <tr key={f.id} className="border-t border-border/50">
                                <td className="py-1.5 pr-4 font-medium">{f.fertilizante}</td>
                                <td className="py-1.5 pr-4 text-right tabular-nums">{f.bultos}</td>
                                <td className="py-1.5 pr-4 text-right tabular-nums">{fmt(f.precio_bulto)}</td>
                                <td className="py-1.5 text-right tabular-nums font-semibold">{fmt(f.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

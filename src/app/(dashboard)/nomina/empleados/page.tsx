"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Search } from "lucide-react"
import { api, type Empleado } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

interface FormData {
  nombre_completo: string
  cedula: string
  jornal: string
  salario_mensual: string
  salario_semanal: string
  eps: string
  pension: string
  arl: string
  caja_compensacion: string
  activo: boolean
}

const EMPTY: FormData = {
  nombre_completo: "",
  cedula: "",
  jornal: "",
  salario_mensual: "",
  salario_semanal: "",
  eps: "",
  pension: "",
  arl: "",
  caja_compensacion: "",
  activo: true,
}

function FormEmpleado({
  inicial,
  onGuardado,
  onCerrar,
}: {
  inicial?: Empleado
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>(
    inicial
      ? {
          nombre_completo: inicial.nombre_completo,
          cedula: inicial.cedula,
          jornal: inicial.jornal,
          salario_mensual: inicial.salario_mensual ?? "",
          salario_semanal: inicial.salario_semanal ?? "",
          eps: inicial.eps,
          pension: inicial.pension,
          arl: inicial.arl,
          caja_compensacion: inicial.caja_compensacion,
          activo: inicial.activo,
        }
      : EMPTY
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (k: keyof Omit<FormData, "activo">) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre_completo || !form.cedula || !form.jornal) {
      setError("Nombre, cédula y jornal son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload: Partial<Empleado> = {
        nombre_completo: form.nombre_completo,
        cedula: form.cedula,
        jornal: form.jornal,
        salario_mensual: form.salario_mensual || null,
        salario_semanal: form.salario_semanal || null,
        eps: form.eps,
        pension: form.pension,
        arl: form.arl,
        caja_compensacion: form.caja_compensacion,
        activo: form.activo,
      }
      if (inicial) {
        await api.nomina.empleados.update(inicial.id, payload)
      } else {
        await api.nomina.empleados.create(payload)
      }
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const field = "flex flex-col gap-1"
  const label = "text-xs font-medium text-muted-foreground"
  const input =
    "text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">{inicial ? "Editar empleado" : "Nuevo empleado"}</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className={`${field}`}>
            <label className={label}>Nombre completo *</label>
            <input
              value={form.nombre_completo}
              onChange={set("nombre_completo")}
              placeholder="Ej: Juan Pérez García"
              className={input}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Cédula *</label>
              <input value={form.cedula} onChange={set("cedula")} placeholder="12345678" className={input} required />
            </div>
            <div className={field}>
              <label className={label}>Jornal * ($)</label>
              <input type="number" step="any" value={form.jornal} onChange={set("jornal")} placeholder="0" className={input} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Salario mensual ($)</label>
              <input type="number" step="any" value={form.salario_mensual} onChange={set("salario_mensual")} placeholder="0" className={input} />
            </div>
            <div className={field}>
              <label className={label}>Salario semanal ($)</label>
              <input type="number" step="any" value={form.salario_semanal} onChange={set("salario_semanal")} placeholder="0" className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>EPS</label>
              <input value={form.eps} onChange={set("eps")} placeholder="Ej: Sura" className={input} />
            </div>
            <div className={field}>
              <label className={label}>Pensión</label>
              <input value={form.pension} onChange={set("pension")} placeholder="Ej: Protección" className={input} />
            </div>
            <div className={field}>
              <label className={label}>ARL</label>
              <input value={form.arl} onChange={set("arl")} placeholder="Ej: Positiva" className={input} />
            </div>
            <div className={field}>
              <label className={label}>Caja compensación</label>
              <input value={form.caja_compensacion} onChange={set("caja_compensacion")} placeholder="Ej: Comfama" className={input} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Activo
          </label>

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

const PAGE_SIZE = 50

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Empleado | null>(null)
  const [soloActivos, setSoloActivos] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState("")

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (soloActivos) params.activo = "true"
    api.nomina.empleados.list(params)
      .then(r => { setEmpleados(r.results); setTotal(r.count) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1); setPagina(1) }, [soloActivos])

  const q = query.toLowerCase()
  const visibles = q
    ? empleados.filter(e =>
        e.nombre_completo.toLowerCase().includes(q) ||
        (e.cedula ?? "").toLowerCase().includes(q)
      )
    : empleados

  return (
    <div className="space-y-5">
      {(mostrarForm || editando) && (
        <FormEmpleado
          inicial={editando ?? undefined}
          onGuardado={() => { cargar(pagina); setMostrarForm(false); setEditando(null) }}
          onCerrar={() => { setMostrarForm(false); setEditando(null) }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestión de personal de la finca</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Solo activos
        </label>
        <p className="ml-auto text-xs text-muted-foreground">{visibles.length} de {total} empleados</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Cédula</th>
                <th className="px-3 py-2.5 text-right">Jornal</th>
                <th className="px-3 py-2.5 text-right">Sal. mensual</th>
                <th className="px-3 py-2.5 text-left">EPS</th>
                <th className="px-3 py-2.5 text-left">Pensión</th>
                <th className="px-3 py-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : visibles.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  Sin empleados registrados.
                </td></tr>
              ) : visibles.map((e) => (
                <tr key={e.id}
                  className="border-b border-border hover:bg-muted/30 text-sm cursor-pointer"
                  onClick={() => setEditando(e)}>
                  <td className="px-3 py-2 font-medium">{e.nombre_completo}</td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{e.cedula}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(e.jornal)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(e.salario_mensual)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.eps || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.pension || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${e.activo ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
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

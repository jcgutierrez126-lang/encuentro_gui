"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, ChevronDown, ChevronRight } from "lucide-react"
import { api, type PrestamoEmpleado, type AbonoPrestamo, type Empleado } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

/* ─── Modal abono ─── */
function ModalAbono({
  prestamoId,
  onGuardado,
  onCerrar,
}: {
  prestamoId: number
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [valor, setValor] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!fecha || !valor) {
      setError("Fecha y valor son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.nomina.prestamos.abonar(prestamoId, { fecha, valor })
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const label = "text-xs font-medium text-muted-foreground"
  const input =
    "text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Registrar abono</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <div className="flex flex-col gap-1">
            <label className={label}>Fecha *</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={input} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label}>Valor * ($)</label>
            <input type="number" step="any" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0" className={input} required />
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

/* ─── Panel de abonos expandido ─── */
function PanelAbonos({
  prestamo,
  onAbonoGuardado,
}: {
  prestamo: PrestamoEmpleado
  onAbonoGuardado: () => void
}) {
  const [abonos, setAbonos] = useState<AbonoPrestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false)

  const cargarAbonos = () => {
    setLoading(true)
    api.nomina.prestamos.abonos(prestamo.id).then(setAbonos).finally(() => setLoading(false))
  }

  useEffect(() => { cargarAbonos() }, [prestamo.id])

  return (
    <>
      {mostrarModalAbono && (
        <ModalAbono
          prestamoId={prestamo.id}
          onGuardado={() => {
            setMostrarModalAbono(false)
            cargarAbonos()
            onAbonoGuardado()
          }}
          onCerrar={() => setMostrarModalAbono(false)}
        />
      )}
      <tr className="bg-muted/20">
        <td colSpan={6} className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Abonos del préstamo
              </p>
              <button
                onClick={() => setMostrarModalAbono(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                <Plus className="h-3 w-3" />
                Registrar abono
              </button>
            </div>

            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : abonos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin abonos registrados.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pb-1.5 font-medium">Fecha</th>
                    <th className="text-right pb-1.5 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {abonos.map((a) => (
                    <tr key={a.id} className="border-t border-border/50">
                      <td className="py-1.5 tabular-nums text-muted-foreground">{a.fecha}</td>
                      <td className="py-1.5 tabular-nums text-right font-medium">{fmt(a.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}

/* ─── Formulario préstamo ─── */
interface FormPrestamo {
  empleado: string
  fecha: string
  monto: string
  descripcion: string
}

const EMPTY_PRESTAMO: FormPrestamo = {
  empleado: "",
  fecha: new Date().toISOString().slice(0, 10),
  monto: "",
  descripcion: "",
}

function FormPrestamo({
  empleados,
  onGuardado,
  onCerrar,
}: {
  empleados: Empleado[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormPrestamo>(EMPTY_PRESTAMO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (k: keyof FormPrestamo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.empleado || !form.fecha || !form.monto) {
      setError("Empleado, fecha y monto son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.nomina.prestamos.create({
        empleado: Number(form.empleado),
        fecha: form.fecha,
        monto: form.monto,
        descripcion: form.descripcion || undefined,
      } as Partial<PrestamoEmpleado>)
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nuevo préstamo</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className={field}>
            <label className={label}>Empleado *</label>
            <select value={form.empleado} onChange={set("empleado")} className={input} required>
              <option value="">Seleccionar…</option>
              {empleados.filter((e) => e.activo).map((e) => (
                <option key={e.id} value={e.id}>{e.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set("fecha")} className={input} required />
            </div>
            <div className={field}>
              <label className={label}>Monto * ($)</label>
              <input type="number" step="any" value={form.monto} onChange={set("monto")} placeholder="0" className={input} required />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Descripción</label>
            <textarea value={form.descripcion} onChange={set("descripcion")} rows={2}
              className={`${input} resize-none`} placeholder="Opcional" />
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

/* ─── Página ─── */
export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<PrestamoEmpleado[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState<number | null>(null)

  const cargar = () => {
    setLoading(true)
    Promise.all([
      api.nomina.prestamos.list(),
      api.nomina.empleados.list(),
    ]).then(([p, e]) => {
      setPrestamos(p.results)
      setEmpleados(e.results)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const toggleFila = (id: number) => setExpandido((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormPrestamo
          empleados={empleados}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Préstamos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Préstamos a empleados y seguimiento de abonos</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nuevo préstamo
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 w-6"></th>
                <th className="px-3 py-2.5 text-left">Empleado</th>
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-right">Monto</th>
                <th className="px-3 py-2.5 text-right">Saldo</th>
                <th className="px-3 py-2.5 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : prestamos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  Sin préstamos registrados.
                </td></tr>
              ) : prestamos.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className="border-b border-border hover:bg-muted/30 text-sm cursor-pointer"
                    onClick={() => toggleFila(p.id)}
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {expandido === p.id
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />}
                    </td>
                    <td className="px-3 py-2 font-medium">{p.empleado_nombre}</td>
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{p.fecha}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(p.monto)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${Number(p.saldo) > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {fmt(p.saldo)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{p.descripcion || "—"}</td>
                  </tr>
                  {expandido === p.id && (
                    <PanelAbonos
                      key={`abonos-${p.id}`}
                      prestamo={p}
                      onAbonoGuardado={cargar}
                    />
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

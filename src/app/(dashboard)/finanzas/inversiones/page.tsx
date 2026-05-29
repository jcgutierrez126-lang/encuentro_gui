"use client"

import { useEffect, useState } from "react"
import { Plus, X, Loader2, TrendingUp, CheckCircle, Clock, Landmark } from "lucide-react"
import { api, type InversionCDT, type Cuenta } from "@/lib/api"

function cop(n: string | number | null | undefined) {
  if (n === null || n === undefined || n === "") return "—"
  const v = Number(n)
  if (isNaN(v)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v)
}

function pct(n: string | number | null | undefined) {
  if (n === null || n === undefined) return "—"
  return `${Number(n).toFixed(2)}%`
}

function diasRestantes(fechaVenc: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVenc + "T00:00:00")
  return Math.ceil((venc.getTime() - hoy.getTime()) / 86400000)
}

// ─── Formulario nuevo CDT ────────────────────────────────────────────────────

function FormCDT({
  cuentas,
  initial,
  onGuardado,
  onCerrar,
}: {
  cuentas: Cuenta[]
  initial?: InversionCDT
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState({
    entidad: initial?.entidad ?? "",
    monto: initial?.monto ?? "",
    tasa_ea: initial?.tasa_ea ?? "",
    fecha_inicio: initial?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
    fecha_vencimiento: initial?.fecha_vencimiento ?? "",
    cuenta_origen: initial?.cuenta_origen?.toString() ?? "",
    observaciones: initial?.observaciones ?? "",
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // Cálculo en vivo del rendimiento proyectado
  const rendProyectado = (() => {
    const m = Number(form.monto)
    const t = Number(form.tasa_ea) / 100
    if (!m || !t || !form.fecha_inicio || !form.fecha_vencimiento) return null
    const dias = Math.ceil((new Date(form.fecha_vencimiento + "T00:00:00").getTime() - new Date(form.fecha_inicio + "T00:00:00").getTime()) / 86400000)
    if (dias <= 0) return null
    return Math.round(m * ((1 + t) ** (dias / 365) - 1))
  })()

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.entidad || !form.monto || !form.tasa_ea || !form.fecha_inicio || !form.fecha_vencimiento || !form.cuenta_origen) {
      setError("Completa todos los campos obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload = {
        entidad: form.entidad,
        monto: form.monto,
        tasa_ea: form.tasa_ea,
        fecha_inicio: form.fecha_inicio,
        fecha_vencimiento: form.fecha_vencimiento,
        cuenta_origen: Number(form.cuenta_origen),
        observaciones: form.observaciones || null,
      }
      if (initial) {
        await api.finanzas.cdts.update(initial.id, payload)
      } else {
        await api.finanzas.cdts.create(payload)
      }
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const inp = "text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full"
  const lbl = "text-xs font-medium text-muted-foreground"
  const fld = "flex flex-col gap-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-500" />
            {initial ? "Editar CDT" : "Nuevo CDT"}
          </h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

          <div className={fld}>
            <label className={lbl}>Entidad bancaria *</label>
            <input value={form.entidad} onChange={set("entidad")} className={inp} placeholder="Bancolombia, Banco Agrario…" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={fld}>
              <label className={lbl}>Monto invertido *</label>
              <input type="number" step="any" min="0" value={form.monto} onChange={set("monto")} className={inp} placeholder="0" required />
            </div>
            <div className={fld}>
              <label className={lbl}>Tasa E.A. (%) *</label>
              <input type="number" step="0.01" min="0" max="100" value={form.tasa_ea} onChange={set("tasa_ea")} className={inp} placeholder="11.50" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={fld}>
              <label className={lbl}>Fecha inicio *</label>
              <input type="date" value={form.fecha_inicio} onChange={set("fecha_inicio")} className={inp} required />
            </div>
            <div className={fld}>
              <label className={lbl}>Fecha vencimiento *</label>
              <input type="date" value={form.fecha_vencimiento} onChange={set("fecha_vencimiento")} className={inp} required />
            </div>
          </div>

          <div className={fld}>
            <label className={lbl}>Cuenta origen *</label>
            <select value={form.cuenta_origen} onChange={set("cuenta_origen")} className={inp} required>
              <option value="">Seleccionar cuenta…</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {rendProyectado !== null && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3">
              <p className="text-xs text-blue-400 font-medium mb-1">Rendimiento proyectado</p>
              <p className="text-xl font-bold text-blue-400">{cop(rendProyectado)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total a recibir: {cop(Number(form.monto) + rendProyectado)}
              </p>
            </div>
          )}

          <div className={fld}>
            <label className={lbl}>Observaciones</label>
            <textarea value={form.observaciones ?? ""} onChange={set("observaciones")} className={`${inp} resize-none`} rows={2} placeholder="Número de CDT, condiciones especiales…" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={guardando} className="text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2">
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {initial ? "Guardar cambios" : "Crear CDT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal liquidar ──────────────────────────────────────────────────────────

function ModalLiquidar({
  cdt,
  onLiquidado,
  onCerrar,
}: {
  cdt: InversionCDT
  onLiquidado: () => void
  onCerrar: () => void
}) {
  const [rendimiento, setRendimiento] = useState(cdt.rendimiento_proyectado)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function liquidar() {
    setGuardando(true)
    setError(null)
    try {
      await api.finanzas.cdts.liquidar(cdt.id, {
        rendimiento_real: Number(rendimiento),
        fecha_liquidacion: fecha,
      })
      onLiquidado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error")
      setGuardando(false)
    }
  }

  const total = Number(cdt.monto) + Number(rendimiento)
  const inp = "text-sm border border-border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Liquidar CDT</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium text-foreground">{cdt.entidad}</span></p>
            <p>Capital: {cop(cdt.monto)}</p>
            <p>Rendimiento proyectado: {cop(cdt.rendimiento_proyectado)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Rendimiento real recibido</label>
            <input type="number" step="any" value={rendimiento ?? ""} onChange={e => setRendimiento(e.target.value)} className={inp} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Fecha liquidación</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} />
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <p className="text-xs text-emerald-400 font-medium">Total a ingresar</p>
            <p className="text-xl font-bold text-emerald-400">{cop(total)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Se crearán 2 ingresos (capital + rendimiento) en {cdt.cuenta_origen_nombre}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onCerrar} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancelar</button>
            <button onClick={liquidar} disabled={guardando} className="text-sm px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-semibold disabled:opacity-50 flex items-center gap-2">
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Liquidar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function InversionesPage() {
  const [cdts, setCdts] = useState<InversionCDT[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<InversionCDT | null>(null)
  const [liquidando, setLiquidando] = useState<InversionCDT | null>(null)
  const [filtro, setFiltro] = useState<"todos" | "activo" | "liquidado">("activo")

  const cargar = () => {
    setLoading(true)
    api.finanzas.cdts.list(filtro !== "todos" ? { estado: filtro } : {})
      .then(setCdts)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.finanzas.cuentas.list().then(setCuentas)
  }, [])

  useEffect(() => { cargar() }, [filtro])

  const activos = cdts.filter(c => c.estado === "activo")
  const totalInvertido = activos.reduce((s, c) => s + Number(c.monto), 0)
  const totalProyectado = activos.reduce((s, c) => s + Number(c.rendimiento_proyectado), 0)

  return (
    <div className="space-y-6">
      {(mostrarForm || editando) && (
        <FormCDT
          cuentas={cuentas}
          initial={editando ?? undefined}
          onGuardado={() => { setMostrarForm(false); setEditando(null); cargar() }}
          onCerrar={() => { setMostrarForm(false); setEditando(null) }}
        />
      )}

      {liquidando && (
        <ModalLiquidar
          cdt={liquidando}
          onLiquidado={() => { setLiquidando(null); cargar() }}
          onCerrar={() => setLiquidando(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inversiones CDT</h1>
          <p className="text-sm text-muted-foreground">Certificados de depósito a término</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          <Plus className="h-4 w-4" />
          Nuevo CDT
        </button>
      </div>

      {/* KPIs activos */}
      {activos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium">CDTs activos</p>
            <p className="text-2xl font-bold mt-1">{activos.length}</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs text-blue-400 font-medium">Capital invertido</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{cop(totalInvertido)}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs text-emerald-400 font-medium">Rendimiento proyectado</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{cop(totalProyectado)}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2">
        {(["activo", "todos", "liquidado"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filtro === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "activo" ? "Activos" : f === "liquidado" ? "Liquidados" : "Todos"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : cdts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Landmark className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No hay CDTs registrados</p>
          <button onClick={() => setMostrarForm(true)} className="mt-3 text-xs underline text-primary">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cdts.map(cdt => {
            const dias = diasRestantes(cdt.fecha_vencimiento)
            const vencido = cdt.estado === "activo" && dias < 0
            const urgente = cdt.estado === "activo" && dias >= 0 && dias <= 7

            return (
              <div key={cdt.id} className={`rounded-xl border bg-card p-4 ${
                vencido ? "border-red-500/40 bg-red-500/5" :
                urgente ? "border-amber-500/40 bg-amber-500/5" :
                cdt.estado === "liquidado" ? "border-border opacity-70" :
                "border-border"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${
                      cdt.estado === "liquidado" ? "bg-muted" :
                      vencido ? "bg-red-500/15" : "bg-blue-500/10"
                    }`}>
                      {cdt.estado === "liquidado"
                        ? <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        : vencido
                          ? <Clock className="h-5 w-5 text-red-500" />
                          : <TrendingUp className="h-5 w-5 text-blue-500" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cdt.entidad}</p>
                      <p className="text-xs text-muted-foreground">{cdt.cuenta_origen_nombre}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cdt.estado === "activo" && (
                      <>
                        <button
                          onClick={() => setEditando(cdt)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setLiquidando(cdt)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                        >
                          Liquidar
                        </button>
                      </>
                    )}
                    {cdt.estado === "liquidado" && (
                      <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">Liquidado</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital</p>
                    <p className="font-semibold tabular-nums">{cop(cdt.monto)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tasa E.A.</p>
                    <p className="font-semibold">{pct(cdt.tasa_ea)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {cdt.estado === "liquidado" ? "Rendimiento real" : "Rendimiento proyectado"}
                    </p>
                    <p className={`font-semibold tabular-nums ${cdt.estado !== "liquidado" ? "text-emerald-500" : ""}`}>
                      {cop(cdt.estado === "liquidado" ? cdt.rendimiento_real : cdt.rendimiento_proyectado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {cdt.estado === "liquidado" ? "Liquidado el" : vencido ? "Venció el" : "Vence en"}
                    </p>
                    <p className={`font-semibold ${vencido ? "text-red-500" : urgente ? "text-amber-500" : ""}`}>
                      {cdt.estado === "liquidado"
                        ? cdt.fecha_liquidacion
                        : vencido
                          ? `${Math.abs(dias)} días atrás`
                          : dias === 0 ? "Hoy" : `${dias} días`
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{cdt.fecha_inicio} → {cdt.fecha_vencimiento}</span>
                  <span>{cdt.plazo_dias} días</span>
                  {cdt.observaciones && <span className="truncate max-w-xs">{cdt.observaciones}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

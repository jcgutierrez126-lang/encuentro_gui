"use client"

import { useEffect, useRef, useState } from "react"
import { ShieldCheck, Loader2, AlertCircle, CheckCircle, ChevronDown, X } from "lucide-react"
import { api } from "@/lib/api"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

function cop(n: number | null | undefined) {
  if (n === null || n === undefined) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)
}

interface RegistroSemanalIA {
  trabajador: string
  kilos: number | null
  jornales: number | null
  valor: number | null
}

interface DatosSemanalIA {
  semana: { fecha_inicio: string | null; fecha_fin: string | null }
  registros: RegistroSemanalIA[]
  observaciones: string | null
}

interface FilaComparacion {
  nombre: string
  empleado_key: string
  planilla_valor: number
  sistema_valor: number
  diferencia: number
  ok: boolean
}

export default function DigitalizadorPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<"idle" | "leyendo" | "comparando" | "listo" | "error">("idle")
  const [semanas, setSemanas] = useState<{ semana_ref: string; fecha_min: string }[]>([])
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>("")
  const [datosIA, setDatosIA] = useState<DatosSemanalIA | null>(null)
  const [filas, setFilas] = useState<FilaComparacion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Todos los trabajadores del sistema para la semana seleccionada (para selección manual)
  const [sistemaNombres, setSistemaNombres] = useState<Record<string, number>>({})
  // Mapeos manuales: índice de fila → clave del sistema
  const [manuales, setManuales] = useState<Record<number, string>>({})
  // Todos los empleados activos (para el selector de edición)
  const [empleadosActivos, setEmpleadosActivos] = useState<string[]>([])

  useEffect(() => {
    const token = getToken()
    fetch(`${BASE}/api/v1/nomina/empleados-activos/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setEmpleadosActivos((d.empleados as { nombre_completo: string }[]).map(e => e.nombre_completo)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.nomina.controlSemanal.semanas().then(data => {
      setSemanas(data)
      if (data.length > 0) setSemanaSeleccionada(data[0].semana_ref)
    })
  }, [])

  async function handleImagen(file: File) {
    setPreview(URL.createObjectURL(file))
    setEstado("leyendo")
    setError(null)
    const form = new FormData()
    form.append("imagen", file)
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/leer-planilla/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      const json = await res.json()
      const d: DatosSemanalIA = json.datos
      setDatosIA(d)
      setEstado("comparando")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setEstado("error")
    }
  }

  function scoreNombre(a: string, b: string): number {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z\s]/g, "").trim()
    const ta = new Set(norm(a).split(/\s+/).filter(Boolean))
    const tb = new Set(norm(b).split(/\s+/).filter(Boolean))
    if (!ta.size || !tb.size) return 0
    let coinciden = 0
    ta.forEach(t => { if (tb.has(t)) coinciden++ })
    return coinciden / Math.max(ta.size, tb.size)
  }

  function mejorMatch(nombreIA: string, porNombre: Record<string, number>): string {
    let mejor = "", mejorScore = 0
    for (const k of Object.keys(porNombre)) {
      const s = scoreNombre(nombreIA, k)
      if (s > mejorScore) { mejorScore = s; mejor = k }
    }
    return mejorScore >= 0.4 ? mejor : ""
  }

  function buildFilas(
    registrosIA: RegistroSemanalIA[],
    porNombre: Record<string, number>,
    overrides: Record<number, string>,
  ): FilaComparacion[] {
    return registrosIA.map((r, idx) => {
      const keyMatch = overrides[idx] !== undefined
        ? overrides[idx]
        : mejorMatch(r.trabajador, porNombre)
      const sistemaValor = keyMatch ? (porNombre[keyMatch] ?? 0) : 0
      const planillaValor = Number(r.valor ?? 0)
      const diferencia = planillaValor - sistemaValor
      return {
        nombre: r.trabajador,
        empleado_key: keyMatch,
        planilla_valor: planillaValor,
        sistema_valor: sistemaValor,
        diferencia,
        ok: Math.abs(diferencia) < 1000,
      }
    })
  }

  async function comparar() {
    if (!datosIA || !semanaSeleccionada) return
    setEstado("leyendo")
    try {
      const registrosSistema = await api.nomina.controlSemanal.porSemana(semanaSeleccionada)

      const porNombre: Record<string, number> = {}
      for (const r of registrosSistema) {
        const key = r.empleado_nombre.toLowerCase().trim()
        porNombre[key] = (porNombre[key] ?? 0) + Number(r.valor ?? 0)
      }

      setSistemaNombres(porNombre)
      const nuevasManuales: Record<number, string> = {}
      setManuales(nuevasManuales)
      setFilas(buildFilas(datosIA.registros, porNombre, nuevasManuales))
      setEstado("listo")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setEstado("error")
    }
  }

  function asignarEmpleado(idx: number, key: string) {
    const nuevasManuales = { ...manuales, [idx]: key }
    setManuales(nuevasManuales)
    if (datosIA) setFilas(buildFilas(datosIA.registros, sistemaNombres, nuevasManuales))
  }

  const reset = () => {
    setEstado("idle")
    setDatosIA(null)
    setFilas([])
    setPreview(null)
    setError(null)
    setManuales({})
    setSistemaNombres({})
  }

  const totalOk  = filas.filter(f => f.ok).length
  const totalMal = filas.filter(f => !f.ok).length
  // Para el selector: empleados activos primero, luego los del sistema que no estén ya
  const opcionesSelector = empleadosActivos.length
    ? empleadosActivos
    : Object.keys(sistemaNombres).sort()

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verificador Semanal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sube la foto de la planilla semanal para comparar los totales contra los registros diarios guardados
        </p>
      </div>

      {/* Estado idle — subir foto */}
      {estado === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
        >
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Subir foto de la planilla semanal</p>
          <p className="text-sm text-muted-foreground mt-1">
            La planilla física de resumen semanal — la IA extrae los totales por trabajador
          </p>
          <input
            ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => e.target.files?.[0] && handleImagen(e.target.files[0])}
          />
        </div>
      )}

      {/* Leyendo */}
      {estado === "leyendo" && (
        <div className="border border-border rounded-xl p-10 flex flex-col items-center gap-4">
          {preview && <img src={preview} alt="planilla" className="max-h-40 rounded-lg object-contain" />}
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Procesando planilla…</p>
        </div>
      )}

      {/* Error */}
      {estado === "error" && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5 flex gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-destructive">Error al leer la planilla</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{error}</p>
            <button onClick={reset} className="mt-3 text-xs underline">Intentar de nuevo</button>
          </div>
        </div>
      )}

      {/* Seleccionar semana para comparar */}
      {estado === "comparando" && datosIA && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">Planilla leída — {datosIA.registros.length} trabajadores</p>
              <p className="text-xs text-muted-foreground">
                {datosIA.semana.fecha_inicio ?? ""} → {datosIA.semana.fecha_fin ?? ""}
              </p>
            </div>
            <button onClick={reset} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                ¿Con qué semana del sistema comparar?
              </p>
              {semanas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay semanas guardadas en el sistema. Primero sube las planillas diarias en Control Semanal.
                </p>
              ) : (
                <div className="relative inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 w-full sm:w-auto">
                  <select
                    value={semanaSeleccionada}
                    onChange={e => setSemanaSeleccionada(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-medium focus:outline-none appearance-none pr-5 cursor-pointer"
                  >
                    {semanas.map(s => (
                      <option key={s.semana_ref} value={s.semana_ref}>{s.semana_ref}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </div>

            {semanas.length > 0 && (
              <button
                onClick={comparar}
                disabled={!semanaSeleccionada}
                className="text-sm px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
              >
                Comparar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resultados */}
      {estado === "listo" && filas.length > 0 && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400">{totalOk} coinciden</span>
            </div>
            {totalMal > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-destructive">{totalMal} con diferencia</span>
              </div>
            )}
            <button onClick={reset} className="ml-auto text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted">
              Nueva verificación
            </button>
          </div>

          {/* Tabla comparación */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Trabajador (planilla)</th>
                    <th className="px-3 py-2.5 text-left">Empleado sistema</th>
                    <th className="px-3 py-2.5 text-right">Planilla</th>
                    <th className="px-3 py-2.5 text-right">Sistema</th>
                    <th className="px-3 py-2.5 text-right">Diferencia</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border text-sm ${!f.ok ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}
                    >
                      <td className="px-4 py-2 font-medium">{f.nombre}</td>
                      <td className="px-3 py-2">
                        {/* Si no encontró empleado o se quiere cambiar, mostrar selector */}
                        {f.empleado_key ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground capitalize">{f.empleado_key}</span>
                            <button
                              onClick={() => asignarEmpleado(i, "")}
                              className="text-[10px] text-muted-foreground hover:text-destructive underline"
                            >
                              cambiar
                            </button>
                          </div>
                        ) : (
                          <select
                            value=""
                            onChange={e => { if (e.target.value) asignarEmpleado(i, e.target.value) }}
                            className="text-xs border border-destructive rounded-md px-2 py-1 bg-background w-full max-w-[200px]"
                          >
                            <option value="">— Seleccionar empleado —</option>
                            {opcionesSelector.map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{cop(f.planilla_valor)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{cop(f.sistema_valor)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-medium ${
                        f.ok ? "text-muted-foreground" : "text-destructive"
                      }`}>
                        {f.diferencia !== 0
                          ? (f.diferencia > 0 ? "+" : "") + cop(f.diferencia)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {f.ok
                          ? <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          : <AlertCircle className="h-4 w-4 text-destructive mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {datosIA?.observaciones && (
              <div className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
                <span className="font-medium">Observaciones:</span> {datosIA.observaciones}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  AlertCircle, Camera, CheckCircle, ChevronDown,
  Download, Info, Loader2, Pencil, Plus, Printer, Trash2, X,
} from "lucide-react"
import Link from "next/link"
import {
  api, type ControlSemanal, type Empleado, type Lote,
  type TipoLabor, type TipoCobro,
} from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import * as XLSX from "xlsx"

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const TIPOS_COBRO = ["jornal", "kilos", "contrato", "nomina"]
const MESES_ES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
]

const COBRO_LETRA: Record<string, string> = {
  kilos: "K", jornal: "J", contrato: "C", nomina: "N",
}

const BADGE: Record<string, string> = {
  kilos:    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  jornal:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  contrato: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  nomina:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
}

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

type ProveedorIA = "claude" | "gpt"
function ToggleIA({ value, onChange }: { value: ProveedorIA; onChange: (v: ProveedorIA) => void }) {
  const isGpt = value === "gpt"
  return (
    <div className="flex items-center gap-1.5 text-xs select-none whitespace-nowrap">
      <span className={!isGpt ? "font-semibold" : "text-muted-foreground"}>Claude</span>
      <button
        type="button"
        onClick={() => onChange(isGpt ? "claude" : "gpt")}
        className="relative w-8 h-4 rounded-full bg-muted border border-border transition-colors focus:outline-none"
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-primary transition-transform ${isGpt ? "translate-x-4" : "translate-x-0"}`} />
      </button>
      <span className={isGpt ? "font-semibold" : "text-muted-foreground"}>GPT</span>
    </div>
  )
}

function semanaRefDesdeFecha(fechaStr: string): string {
  if (!fechaStr) return ""
  const d = new Date(fechaStr + "T12:00:00")
  const dow = d.getDay()
  const diffLunes = dow === 0 ? -6 : 1 - dow
  const lunes = new Date(d); lunes.setDate(d.getDate() + diffLunes)
  const sabado = new Date(lunes); sabado.setDate(lunes.getDate() + 5)
  const mes = MESES_ES[lunes.getMonth()]
  if (lunes.getMonth() === sabado.getMonth()) {
    return `Semana del ${lunes.getDate()} al ${sabado.getDate()} de ${mes} de ${lunes.getFullYear()}`
  }
  return `Semana del ${lunes.getDate()} de ${mes} al ${sabado.getDate()} de ${MESES_ES[sabado.getMonth()]} de ${lunes.getFullYear()}`
}

function cop(n: string | number | null | undefined) {
  if (n === null || n === undefined || n === "") return "—"
  const v = Number(n)
  if (isNaN(v)) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v)
}

function fmtFecha(s: string | null | undefined) {
  if (!s) return ""
  const [, m, d] = s.split("-")
  return `${d}/${m}`
}

function calcValor(r: RegistroDiarioIA, vj: number | null): number | null {
  if (r.tipo_cobro === "kilos" || r.tipo_cobro === "contrato") {
    const precio = r.precio_unidad ?? r.valor ?? vj
    if (precio == null) return null
    const cant = r.cantidad ?? 1
    return Math.round(cant * precio)
  }
  if (r.tipo_cobro === "nomina") return r.valor
  // jornal: tarifa diaria, ×0.5 si es media jornada de sábado
  const base = r.valor ?? (vj != null ? vj : null)
  if (base == null) return null
  return r.media_jornada ? Math.round(base * 0.5) : base
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

function resolverEmpleado(nombre: string, empleados: Empleado[]): { emp: Empleado | null; exacto: boolean } {
  if (!nombre) return { emp: null, exacto: false }
  const n = norm(nombre)
  const exacto = empleados.find(e => norm(e.nombre_completo) === n)
  if (exacto) return { emp: exacto, exacto: true }
  const tokens = n.split(/\s+/)
  const fuzzy = empleados.find(e => {
    const en = norm(e.nombre_completo)
    return tokens.every(t => en.includes(t)) || norm(e.nombre_completo).split(/\s+/).every(t => n.includes(t))
  })
  return { emp: fuzzy ?? null, exacto: !!fuzzy }
}

/* ─── Interfaces ─── */

interface RegistroDiarioIA {
  nombre: string
  dia?: string | null
  fecha?: string | null
  lote?: string | null
  labor: string
  cantidad: number | null
  tipo_cobro: string
  valor: number | null
  precio_unidad?: number | null
  media_jornada?: boolean | null
}

interface DatosIA {
  fecha_inicio?: string | null
  fecha?: string | null
  semana_ref?: string | null
  valor_jornal?: number | null
  registros: RegistroDiarioIA[]
  observaciones?: string | null
}

interface GrupoTrabajador {
  nombre: string
  registros: ControlSemanal[]
  total: number
}

/* ─── RecuerdoCalculos ─── */
function RecuerdoCalculos() {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <Info className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-sm font-medium">Referencia de cálculos — Planilla Semanal</span>
        <ChevronDown className={`h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div className="px-4 py-4 space-y-3 text-xs border-t border-border bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <p className="font-semibold text-amber-600 uppercase tracking-wide text-[10px]">K — Kilos</p>
              <p className="text-muted-foreground"><span className="font-mono bg-muted px-1 rounded">Valor = Cantidad × Precio/kilo</span></p>
              <p className="text-muted-foreground">Ej: 73 kg × $6.000 = <strong>$438.000</strong></p>
              <p className="text-[10px] text-muted-foreground/70">Se anota la cantidad de kilos recogidos cada día en la columna Cant.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <p className="font-semibold text-blue-600 uppercase tracking-wide text-[10px]">J — Jornal</p>
              <p className="text-muted-foreground"><span className="font-mono bg-muted px-1 rounded">Valor = Días trabajados × Jornal</span></p>
              <p className="text-muted-foreground">Ej: 5 días × $40.000 = <strong>$200.000</strong></p>
              <p className="text-[10px] text-muted-foreground/70">Cada día marcado en la planilla cuenta como 1 jornal completo.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <p className="font-semibold text-purple-600 uppercase tracking-wide text-[10px]">J + ½ Sábado</p>
              <p className="text-muted-foreground"><span className="font-mono bg-muted px-1 rounded">Valor sábado = Jornal × 0.5</span></p>
              <p className="text-muted-foreground">Ej: $40.000 × 0.5 = <strong>$20.000</strong></p>
              <p className="text-[10px] text-muted-foreground/70">La columna <strong>1/2</strong> está al final del bloque Sábado (después de Cant.). Si está marcada, el sábado vale medio jornal.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <p className="font-semibold text-blue-600 uppercase tracking-wide text-[10px]">C — Contrato</p>
              <p className="text-muted-foreground"><span className="font-mono bg-muted px-1 rounded">Valor = Cantidad × Precio/unidad</span></p>
              <p className="text-muted-foreground">Igual que K. Ej: guadañó 7 jornales × $130.000 = <strong>$910.000</strong></p>
              <p className="text-[10px] text-muted-foreground/70">Sirve para matas embolsadas, jornales de contrato, etc.</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              <p className="font-semibold text-purple-600 uppercase tracking-wide text-[10px]">N — Nómina</p>
              <p className="text-muted-foreground"><span className="font-mono bg-muted px-1 rounded">Valor = Monto fijo por semana</span></p>
              <p className="text-muted-foreground">El valor se escribe directamente en la columna <strong>Valor</strong>.</p>
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
            <strong>Columnas Sábado (orden físico):</strong> Labor · Lote · Cant. · 1/2
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── KpiCard ─── */
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

/* ─── FormManual ─── */
const HOY = new Date().toISOString().slice(0, 10)

function FormManual({
  empleados, tiposLabor, lotes, onGuardado, onCrearEmpleado,
}: {
  empleados: Empleado[]
  tiposLabor: TipoLabor[]
  lotes: Lote[]
  onGuardado: (semanaRef: string) => void
  onCrearEmpleado?: (nombre: string) => Promise<Empleado | null>
}) {
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: "", fecha: HOY, dia: "", labor: "", lote: "",
    cantidad: "", tipo_cobro: "jornal", valor: "",
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function handleFecha(e: React.ChangeEvent<HTMLInputElement>) {
    let fecha = e.target.value
    const d = new Date(fecha + "T12:00:00")
    if (d.getDay() === 0) { // domingo → avanzar a lunes
      d.setDate(d.getDate() + 1)
      fecha = d.toISOString().slice(0, 10)
    }
    const dias = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    setForm(f => ({ ...f, fecha, dia: dias[d.getDay()] ?? "" }))
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre.trim() || !form.labor.trim()) {
      setError("Nombre y labor son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const semanaRef = semanaRefDesdeFecha(form.fecha)
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/guardar-planilla/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          semana_ref: semanaRef,
          fecha_inicio: form.fecha,
          registros: [{
            nombre: form.nombre.trim(),
            dia: form.dia,
            fecha: form.fecha,
            lote: form.lote.trim(),
            labor: form.labor.trim(),
            cantidad: form.cantidad ? Number(form.cantidad) : null,
            tipo_cobro: form.tipo_cobro,
            valor: form.valor ? Number(form.valor) : null,
          }],
        }),
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      setForm({ nombre: "", fecha: form.fecha, dia: form.dia, labor: "", lote: "", cantidad: "", tipo_cobro: "jornal", valor: "" })
      setAbierto(false)
      onGuardado(semanaRef)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const inp = "text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full"
  const lbl = "text-xs font-medium text-muted-foreground"

  if (!abierto) return (
    <button
      onClick={() => setAbierto(true)}
      className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
    >
      <Plus className="h-4 w-4" />
      Registro manual
    </button>
  )

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <p className="font-semibold text-sm">Nuevo registro manual</p>
        <button onClick={() => setAbierto(false)}><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={guardar} className="p-4 space-y-3">
        {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className={lbl}>Trabajador *</label>
            <EmpleadoCombobox
              empleados={empleados.filter(e => e.activo)}
              value={form.nombre}
              onChange={v => setForm(f => ({ ...f, nombre: v }))}
              byName
              onCrear={onCrearEmpleado}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Fecha *</label>
            <input type="date" value={form.fecha} onChange={handleFecha} className={inp} required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className={lbl}>Día</label>
            <select value={form.dia} onChange={set("dia")} className={inp}>
              <option value="">— auto —</option>
              {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className={lbl}>Labor *</label>
            <select value={form.labor} onChange={set("labor")} className={inp} required>
              <option value="">Seleccionar labor…</option>
              {tiposLabor.map(t => (
                <option key={t.id} value={t.abreviatura ?? t.nombre}>
                  {t.abreviatura ? `${t.abreviatura} — ${t.nombre}` : t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Lote</label>
            <select value={form.lote} onChange={set("lote")} className={inp}>
              <option value="">— ninguno —</option>
              {lotes.map(l => (
                <option key={l.id} value={l.abreviatura ?? l.nombre}>
                  {l.abreviatura ? `${l.abreviatura} — ${l.nombre}` : l.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className={lbl}>Cobro</label>
            <select value={form.tipo_cobro} onChange={set("tipo_cobro")} className={inp}>
              {TIPOS_COBRO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Cantidad</label>
            <input type="number" min="0" step="0.01" value={form.cantidad} onChange={set("cantidad")} className={inp} placeholder="Kilos / —" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Valor</label>
            <input type="number" min="0" step="1" value={form.valor} onChange={set("valor")} className={inp} placeholder="$" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setAbierto(false)}
            className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={guardando}
            className="text-sm px-5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2">
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── PanelFoto ─── */

function PanelFoto({
  onGuardado,
  onRevisando,
  empleados,
  tiposLabor,
  lotes,
  fechaFallback,
  onCrearEmpleado,
}: {
  onGuardado: (semanaRef: string) => void
  onRevisando: (v: boolean) => void
  empleados: Empleado[]
  tiposLabor: TipoLabor[]
  lotes: Lote[]
  fechaFallback?: string
  onCrearEmpleado?: (nombre: string) => Promise<Empleado | null>
}) {
  const inputFotoRef = useRef<HTMLInputElement>(null)
  type Estado = "idle" | "leyendo" | "revisando" | "guardando" | "listo" | "error"
  const [estado, setEstado] = useState<Estado>("idle")
  const [datos, setDatos] = useState<DatosIA | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [proveedorIA, setProveedorIA] = useState<ProveedorIA>("claude")

  const [editRows, setEditRows] = useState<RegistroDiarioIA[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editBuf, setEditBuf] = useState<RegistroDiarioIA | null>(null)
  const [renamingWorker, setRenamingWorker] = useState<string | null>(null)
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [resultadoGuardado, setResultadoGuardado] = useState<{ creados: number; errores: { fila: number; nombre: string; motivo: string }[] } | null>(null)

  const laborOptions = tiposLabor.map((t): React.JSX.Element => (
    <option key={t.id} value={t.abreviatura ?? t.nombre}>
      {t.abreviatura ? `${t.abreviatura} — ${t.nombre}` : t.nombre}
    </option>
  ))
  const loteOptions = lotes.map((l): React.JSX.Element => (
    <option key={l.id} value={l.abreviatura ?? l.nombre}>
      {l.abreviatura ? `${l.abreviatura} — ${l.nombre}` : l.nombre}
    </option>
  ))

  function renameWorker(nombreAnterior: string, nombreNuevo: string) {
    setEditRows((rows: RegistroDiarioIA[]) => rows.map((r: RegistroDiarioIA) => r.nombre === nombreAnterior ? { ...r, nombre: nombreNuevo } : r))
    setRenamingWorker(null)
  }

  useEffect(() => {
    if (!datos) return
    setFechaInicio(datos.fecha_inicio ?? datos.fecha ?? "")
    setEditRows(datos.registros.map((r: RegistroDiarioIA) => {
      const laborKey = norm(r.labor ?? "")
      const loteKey = norm(r.lote ?? "")
      const foundLabor = tiposLabor.find(t =>
        norm(t.abreviatura ?? "") === laborKey || norm(t.nombre) === laborKey
      )
      const foundLote = lotes.find(l =>
        norm(l.abreviatura ?? "") === loteKey || norm(l.nombre) === loteKey
      )
      const cant = r.cantidad ?? ((r.tipo_cobro === "kilos" || r.tipo_cobro === "contrato") ? 1 : null)
      // Para K y C: la IA pone el precio unitario en valor → lo guardamos en precio_unidad
      const precio_unidad: number | null =
        (r.tipo_cobro === "kilos" || r.tipo_cobro === "contrato") ? (r.valor ?? null) : null
      return {
        ...r,
        cantidad: cant,
        labor: foundLabor?.abreviatura ?? r.labor ?? "",
        lote: foundLote ? (foundLote.abreviatura ?? r.lote) : r.lote,
        precio_unidad,
      }
    }))
  }, [datos, tiposLabor, lotes])

  const DIA_OFFSET: Record<string, number> = {
    "Lunes": 0, "Martes": 1, "Miércoles": 2, "Jueves": 3, "Viernes": 4, "Sábado": 5,
  }

  function cambiarFechaInicio(nuevaFecha: string) {
    if (!nuevaFecha) return
    // Ajustar siempre al lunes de esa semana (día 0=Dom → lunes anterior, 1=Lun → mismo)
    const d = new Date(nuevaFecha + "T00:00:00")
    const dow = d.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb
    const daysToMonday = dow === 0 ? -6 : 1 - dow
    d.setDate(d.getDate() + daysToMonday)
    const lunes = d.toISOString().split("T")[0]
    setFechaInicio(lunes)
    setEditRows((rows: RegistroDiarioIA[]) => rows.map((r: RegistroDiarioIA) => {
      const offset = r.dia ? (DIA_OFFSET[r.dia] ?? null) : null
      if (offset == null) return r
      const fd = new Date(lunes + "T00:00:00")
      fd.setDate(fd.getDate() + offset)
      return { ...r, fecha: fd.toISOString().split("T")[0] }
    }))
  }

  function cambiarEstado(s: Estado) {
    setEstado(s)
    onRevisando(s === "revisando")
  }

  async function handleImagen(file: File) {
    setPreview(URL.createObjectURL(file))
    cambiarEstado("leyendo")
    setError(null)
    const formData = new FormData()
    formData.append("imagen", file)
    formData.append("proveedor_ia", proveedorIA)
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/leer-planilla-diaria/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      const json = await res.json()
      if (!json.datos?.registros?.length) {
        setError("__formato_incorrecto__")
        cambiarEstado("error")
        return
      }
      setDatos(json.datos)
      cambiarEstado("revisando")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      cambiarEstado("error")
    }
  }

  async function guardar() {
    if (!datos) return
    cambiarEstado("guardando")
    const fechaHeader = datos.fecha_inicio || datos.fecha || fechaFallback || ""
    const semanaRef = datos.semana_ref || semanaRefDesdeFecha(fechaHeader) || fechaHeader
    try {
      const token = getToken()
      const res = await fetch(`${BASE}/api/v1/nomina/guardar-planilla/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          semana_ref: semanaRef,
          fecha_inicio: fechaHeader,
          valor_jornal: datos.valor_jornal ?? null,
          registros: editRows.map(r => ({
            nombre: r.nombre,
            dia: r.dia || "",
            fecha: r.fecha || fechaHeader,
            lote: r.lote || "",
            labor: r.labor,
            cantidad: r.cantidad,
            tipo_cobro: r.tipo_cobro,
            valor: calcValor(r, datos.valor_jornal ?? null),
            precio_unidad: (r.tipo_cobro === "kilos" || r.tipo_cobro === "contrato") ? (r.precio_unidad ?? r.valor ?? null) : null,
            media_jornada: r.media_jornada ?? false,
          })),
        }),
      })
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
      const json = await res.json()
      setResultadoGuardado({ creados: json.creados ?? 0, errores: json.errores ?? [] })
      cambiarEstado("listo")
      onGuardado(semanaRef)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      cambiarEstado("error")
    }
  }

  function reset() {
    setDatos(null); setPreview(null); setError(null)
    setEditRows([]); setEditingIdx(null); setEditBuf(null)
    setResultadoGuardado(null)
    cambiarEstado("idle")
  }

  function startEdit(i: number) {
    setEditingIdx(i)
    setEditBuf({ ...editRows[i] })
  }

  function commitEdit(i: number) {
    if (!editBuf) return
    setEditRows(rows => rows.map((r, idx) => idx === i ? { ...editBuf } : r))
    setEditingIdx(null); setEditBuf(null)
  }

  const inp2 = "text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"

  if (estado === "idle") return (
    <div className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-sm text-muted-foreground flex-1">Subir planilla</p>
        <ToggleIA value={proveedorIA} onChange={setProveedorIA} />
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => inputFotoRef.current?.click()}
          className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          <Camera className="h-4 w-4" />
          Subir foto / galería
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">Selecciona una foto de la planilla desde la galería o toma una nueva</p>
      <input
        ref={inputFotoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleImagen(e.target.files[0])}
      />
    </div>
  )

  if (estado === "leyendo") return (
    <div className="border border-border rounded-xl p-7 flex flex-col items-center gap-3">
      {preview && <img src={preview} alt="planilla" className="max-h-36 rounded shadow object-contain" />}
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Leyendo planilla…</p>
    </div>
  )

  if (estado === "error") return (
    <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-5 flex gap-3">
      <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
      <div>
        {error === "__formato_incorrecto__" ? (
          <>
            <p className="font-semibold text-sm text-destructive">Planilla no reconocida</p>
            <p className="text-xs text-muted-foreground mt-1">
              Esta imagen no corresponde al formato actual de la planilla.
              Descarga e imprime la nueva planilla antes de registrar.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Link href="/planilla" target="_blank" className="text-xs underline text-primary">
                Descargar nueva planilla →
              </Link>
              <button onClick={reset} className="text-xs underline text-muted-foreground">Intentar de nuevo</button>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold text-sm text-destructive">Error al leer la planilla</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{error}</p>
            <button onClick={reset} className="mt-3 text-xs underline">Intentar de nuevo</button>
          </>
        )}
      </div>
    </div>
  )

  if (estado === "listo") return (
    <div className="border border-green-500/30 bg-green-500/5 rounded-xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <CheckCircle className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {resultadoGuardado?.creados ?? 0} registros guardados correctamente
          </p>
          {resultadoGuardado && resultadoGuardado.errores.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              ⚠ {resultadoGuardado.errores.length} filas no pudieron guardarse (ver detalle abajo)
            </p>
          )}
          <button onClick={reset} className="mt-1 text-xs underline text-muted-foreground">Subir otra planilla</button>
        </div>
      </div>
      {resultadoGuardado && resultadoGuardado.errores.length > 0 && (
        <div className="border border-amber-300/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg overflow-hidden">
          <p className="px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 border-b border-amber-300/30">
            Filas omitidas — revisar y agregar manualmente:
          </p>
          <div className="divide-y divide-amber-200/30 max-h-48 overflow-y-auto">
            {resultadoGuardado.errores.map((e, i) => (
              <div key={i} className="px-3 py-1.5 text-xs">
                <span className="font-medium">{e.nombre || `Fila ${e.fila}`}</span>
                <span className="text-amber-700 dark:text-amber-400 ml-2">{e.motivo}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (estado === "guardando") return (
    <div className="border border-border rounded-xl p-5 flex items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-sm">Guardando registros…</p>
    </div>
  )

  /* ── revisando ── */

  const vj = datos?.valor_jornal ?? null

  // Group rows by worker preserving order
  const workerOrder: string[] = []
  const rowsByWorker: Record<string, number[]> = {}
  editRows.forEach((r, i) => {
    if (!rowsByWorker[r.nombre]) {
      rowsByWorker[r.nombre] = []
      workerOrder.push(r.nombre)
    }
    rowsByWorker[r.nombre].push(i)
  })

  const totalGeneral = editRows.reduce((s, r) => s + (calcValor(r, vj) ?? 0), 0)

  // Validación pre-guardado: filas con labor o lote no reconocidos
  function laborValida(labor: string) {
    if (!labor) return false
    const n = norm(labor)
    return tiposLabor.some(t => norm(t.abreviatura ?? "") === n || norm(t.nombre) === n)
  }
  function loteValido(lote: string | null | undefined) {
    if (!lote) return true // lote vacío es permitido
    const n = norm(lote)
    return lotes.some(l => norm(l.abreviatura ?? "") === n || norm(l.nombre) === n)
  }
  const filasInvalidas = editRows.filter(r => !laborValida(r.labor) || !loteValido(r.lote))
  const hayInvalidos = filasInvalidas.length > 0

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border">
        <div>
          <p className="font-semibold text-sm">Revisar antes de guardar</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-muted-foreground">Lunes:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => cambiarFechaInicio(e.target.value)}
              className="text-xs border border-border rounded px-1.5 py-0.5 bg-background"
            />
            <span className="text-xs text-muted-foreground">
              · {editRows.length} registros{vj != null && ` · jornal/kilo: ${cop(vj)}`}
            </span>
          </div>
          {hayInvalidos && (
            <p className="text-xs text-destructive mt-1 font-medium">
              ⛔ {filasInvalidas.length} fila{filasInvalidas.length > 1 ? "s" : ""} con labor o lote no reconocido — corrige antes de guardar
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tabular-nums">{cop(totalGeneral)}</span>
          <button onClick={reset}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-border hover:bg-muted">
            <X className="h-3 w-3" /> Cancelar
          </button>
          <button onClick={guardar} disabled={hayInvalidos}
            className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            title={hayInvalidos ? "Corrige las filas marcadas en rojo antes de guardar" : undefined}>
            Guardar {editRows.length} registros
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-[10px] text-muted-foreground uppercase tracking-wide">
              <th className="px-3 py-2 text-left">Trabajador</th>
              <th className="px-3 py-2 text-left">Día / Fecha</th>
              <th className="px-2 py-2 text-left w-20">Labor</th>
              <th className="px-2 py-2 text-left w-20">Lote</th>
              <th className="px-2 py-2 text-right w-24">Cant.</th>
              <th className="px-3 py-2 text-center">Cobro</th>
              <th className="px-3 py-2 text-right">Valor calc.</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {workerOrder.map(nombre => {
              const indices = rowsByWorker[nombre]
              const workerTotal = indices.reduce((s, i) => s + (calcValor(editRows[i], vj) ?? 0), 0)
              const { exacto } = resolverEmpleado(nombre, empleados)

              return (
                <React.Fragment key={nombre}>
                  <tr className="bg-muted/25 border-y border-border/70">
                    <td colSpan={6} className="px-3 py-1.5">
                      <span className="font-semibold">{nombre}</span>
                      {!exacto && renamingWorker !== nombre && (
                        <>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            ⚠ nombre no reconocido
                          </span>
                          <button
                            onClick={() => setRenamingWorker(nombre)}
                            className="ml-2 text-[10px] underline text-primary"
                          >
                            Cambiar empleado
                          </button>
                        </>
                      )}
                      {renamingWorker === nombre && (
                        <span className="ml-2 inline-flex items-center gap-1.5 min-w-[220px]">
                          <EmpleadoCombobox
                            empleados={empleados.filter(emp => emp.activo)}
                            value=""
                            onChange={v => { renameWorker(nombre, v); setRenamingWorker(null) }}
                            byName
                            autoOpen
                            className="flex-1"
                            onCrear={onCrearEmpleado}
                          />
                          <button onClick={() => setRenamingWorker(null)} className="text-[10px] text-muted-foreground underline shrink-0">
                            Cancelar
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold tabular-nums">{cop(workerTotal)}</td>
                    <td />
                  </tr>

                  {indices.map(i => {
                    const r = editRows[i]
                    const isEditing = editingIdx === i
                    const activeR = isEditing && editBuf ? editBuf : r
                    const v = calcValor(activeR, vj)
                    const cobroKey = r.tipo_cobro.toLowerCase()
                    const { exacto: empExacto } = resolverEmpleado(r.nombre, empleados)

                    if (isEditing && editBuf) {
                      return (
                        <tr key={`re-${i}`} className="border-b border-border/50 bg-primary/5">
                          <td className="px-2 py-1" style={{ minWidth: 160 }}>
                            <EmpleadoCombobox
                              empleados={empleados.filter(e => e.activo)}
                              value={editBuf.nombre}
                              onChange={v => setEditBuf(b => ({ ...b!, nombre: v }))}
                              byName
                              onCrear={onCrearEmpleado}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <select value={editBuf.dia ?? ""} onChange={e => setEditBuf(b => ({ ...b!, dia: e.target.value }))} className={inp2}>
                                <option value="">—</option>
                                {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                              {(editBuf.dia === "Sábado" || !editBuf.dia) && (
                                <label className="flex items-center gap-0.5 text-[10px] text-muted-foreground cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={!!editBuf.media_jornada}
                                    onChange={e => setEditBuf(b => ({ ...b!, media_jornada: e.target.checked }))}
                                    className="h-3 w-3 accent-purple-600"
                                  />
                                  ½
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <select value={editBuf.labor} onChange={e => setEditBuf(b => ({ ...b!, labor: e.target.value }))} className={inp2} style={{ minWidth: 90, maxWidth: 110 }}>
                              <option value="">— Labor —</option>
                              {tiposLabor.map(t => (
                                <option key={t.id} value={t.abreviatura ?? t.nombre}>{t.abreviatura ? `${t.abreviatura} — ${t.nombre}` : t.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <select value={editBuf.lote ?? ""} onChange={e => setEditBuf(b => ({ ...b!, lote: e.target.value || null }))} className={inp2} style={{ minWidth: 90, maxWidth: 110 }}>
                              <option value="">— Lote —</option>
                              {lotes.map(l => (
                                <option key={l.id} value={l.abreviatura ?? l.nombre}>{l.abreviatura ? `${l.abreviatura} — ${l.nombre}` : l.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number" min="0" step="0.01"
                              value={editBuf.cantidad ?? ""}
                              onChange={e => setEditBuf(b => ({ ...b!, cantidad: e.target.value ? Number(e.target.value) : null }))}
                              className={inp2}
                              style={{ width: 85 }}
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <select
                              value={editBuf.tipo_cobro}
                              onChange={e => {
                                const tc = e.target.value
                                setEditBuf(b => ({
                                  ...b!,
                                  tipo_cobro: tc,
                                  precio_unidad: tc === "kilos" ? (b!.valor ?? null) : null,
                                }))
                              }}
                              className={inp2}
                            >
                              {TIPOS_COBRO.map(t => <option key={t} value={t}>{COBRO_LETRA[t] ?? t} – {t}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex flex-col gap-0.5">
                              <input
                                type="number" min="0" step="1"
                                value={editBuf.valor ?? ""}
                                onChange={e => {
                                  const val = e.target.value ? Number(e.target.value) : null
                                  setEditBuf(b => ({
                                    ...b!,
                                    valor: val,
                                    precio_unidad: b!.tipo_cobro === "kilos" ? val : null,
                                  }))
                                }}
                                className={inp2}
                                style={{ width: 80 }}
                                placeholder={editBuf.tipo_cobro === "kilos" ? "precio/u" : "valor día"}
                              />
                              {v != null && (
                                <span className="text-[10px] text-primary font-bold tabular-nums">
                                  = {cop(v)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex gap-1">
                              <button onClick={() => commitEdit(i)} className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded">✓</button>
                              <button onClick={() => { setEditingIdx(null); setEditBuf(null) }} className="text-[10px] px-1.5 py-0.5 border border-border rounded hover:bg-muted">✗</button>
                              <button
                                onClick={() => {
                                  setEditRows(rows => rows.filter((_, idx) => idx !== i))
                                  setEditingIdx(null)
                                  setEditBuf(null)
                                }}
                                className="text-[10px] px-1.5 py-0.5 border border-destructive/50 text-destructive rounded hover:bg-destructive/10"
                                title="Eliminar fila"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr key={`rn-${i}`} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-3 py-1.5 pl-6 text-muted-foreground">{r.nombre}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {r.dia ?? "—"}{r.fecha ? ` ${fmtFecha(r.fecha)}` : ""}
                          {r.media_jornada && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold">½</span>}
                        </td>
                        <td className={`px-3 py-1.5 ${!laborValida(r.labor) ? "bg-destructive/10 text-destructive font-semibold" : ""}`}>
                          {r.labor}{!laborValida(r.labor) && " ⚠"}
                        </td>
                        <td className={`px-3 py-1.5 ${r.lote && !loteValido(r.lote) ? "bg-destructive/10 text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {r.lote || "—"}{r.lote && !loteValido(r.lote) && " ⚠"}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{r.cantidad ?? "—"}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${BADGE[cobroKey] ?? "bg-muted text-muted-foreground"}`}>
                            {COBRO_LETRA[cobroKey] ?? cobroKey}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {v != null ? cop(v) : "—"}
                        </td>
                        <td className="px-3 py-1.5">
                          <button onClick={() => startEdit(i)} className="p-0.5 text-muted-foreground hover:bg-muted rounded">
                            <Pencil className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {datos?.observaciones && (
        <p className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <span className="font-medium">Obs:</span> {datos.observaciones}
        </p>
      )}
    </div>
  )
}

/* ─── EmpleadoCombobox ─── */

function EmpleadoCombobox({
  empleados,
  value,
  onChange,
  byName = false,
  autoOpen = false,
  className = "",
  onCrear,
}: {
  empleados: Empleado[]
  value: string
  onChange: (v: string) => void
  byName?: boolean
  autoOpen?: boolean
  className?: string
  onCrear?: (nombre: string) => Promise<Empleado | null>
}) {
  const [open, setOpen] = useState(autoOpen)
  const [query, setQuery] = useState("")
  const [creando, setCreando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtrados = query
    ? empleados.filter(e => norm(e.nombre_completo).includes(norm(query)))
    : empleados

  const selected = byName
    ? empleados.find(e => norm(e.nombre_completo) === norm(value))
    : empleados.find(e => String(e.id) === value)

  const queryTrimmed = query.trim()
  const hayMatchExacto = queryTrimmed ? filtrados.some(e => norm(e.nombre_completo) === norm(queryTrimmed)) : false
  const mostrarCrear = !!onCrear && !!queryTrimmed && !hayMatchExacto

  useEffect(() => {
    function handle(ev: MouseEvent) {
      if (ref.current && !ref.current.contains(ev.target as Node)) {
        setOpen(false); setQuery("")
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  function select(e: Empleado) {
    onChange(byName ? e.nombre_completo : String(e.id))
    setOpen(false)
    setQuery("")
  }

  async function crearYSeleccionar() {
    if (!onCrear || !queryTrimmed) return
    setCreando(true)
    try {
      const emp = await onCrear(queryTrimmed)
      if (emp) {
        onChange(byName ? emp.nombre_completo : String(emp.id))
        setOpen(false)
        setQuery("")
      }
    } finally {
      setCreando(false)
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring text-left"
      >
        <span className={selected ? "" : "text-amber-600 dark:text-amber-400"}>
          {selected?.nombre_completo ?? (value ? `${value} ⚠` : "— Seleccionar empleado —")}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={ev => setQuery(ev.target.value)}
              placeholder={onCrear ? "Buscar o escribir nombre…" : "Buscar empleado..."}
              className="w-full text-sm px-2.5 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtrados.length === 0 && !mostrarCrear ? (
              <p className="text-xs text-muted-foreground px-3 py-2">Sin resultados</p>
            ) : filtrados.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => select(e)}
                className={`w-full text-left text-sm px-3 py-2 hover:bg-accent transition-colors ${
                  selected?.id === e.id ? "bg-accent font-medium" : ""
                }`}
              >
                {e.nombre_completo}
              </button>
            ))}
            {mostrarCrear && (
              <button
                type="button"
                onClick={crearYSeleccionar}
                disabled={creando}
                className="w-full text-left text-sm px-3 py-2 hover:bg-accent transition-colors text-primary border-t border-border flex items-center gap-1.5 disabled:opacity-60"
              >
                {creando
                  ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  : <Plus className="h-3 w-3 shrink-0" />}
                {creando ? "Creando…" : `Crear "${queryTrimmed}"`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── EditRegistroModal ─── */

function EditRegistroModal({
  registro,
  empleados,
  tiposLabor,
  tiposCobro,
  lotes,
  onGuardado,
  onEliminado,
  onCerrar,
}: {
  registro: ControlSemanal
  empleados: Empleado[]
  tiposLabor: TipoLabor[]
  tiposCobro: TipoCobro[]
  lotes: Lote[]
  onGuardado: () => void
  onEliminado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState({
    empleado: String(registro.empleado),
    fecha: registro.fecha ?? "",
    dia: registro.dia ?? "",
    tipo_labor: String(registro.tipo_labor),
    tipo_cobro: String(registro.tipo_cobro),
    lote: registro.lote ? String(registro.lote) : "",
    kilos: registro.kilos ?? "",
    jornales: registro.jornales ?? "",
    valor: registro.valor,
    observaciones: registro.observaciones ?? "",
  })
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function eliminar() {
    if (!confirm("¿Eliminar este registro?")) return
    setEliminando(true)
    try {
      await api.nomina.controlSemanal.delete(registro.id)
      onEliminado()
    } catch {
      setError("Error al eliminar")
      setEliminando(false)
    }
  }

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await api.nomina.controlSemanal.update(registro.id, {
        empleado: Number(form.empleado),
        fecha: form.fecha || undefined,
        dia: form.dia || undefined,
        tipo_labor: Number(form.tipo_labor),
        tipo_cobro: Number(form.tipo_cobro),
        lote: form.lote ? Number(form.lote) : null,
        kilos: form.kilos !== "" ? String(form.kilos) : null,
        jornales: form.jornales !== "" ? String(form.jornales) : null,
        valor: form.valor,
        observaciones: form.observaciones || null,
      })
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  const inp = "text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full"
  const lbl = "text-xs font-medium text-muted-foreground"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm">Editar registro</h2>
            <p className="text-xs text-muted-foreground">{registro.semana_ref} · {fmtFecha(registro.fecha)}</p>
          </div>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-3">
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

          <div className="flex flex-col gap-1">
            <label className={lbl}>Trabajador</label>
            <EmpleadoCombobox
              empleados={empleados}
              value={form.empleado}
              onChange={v => setForm(f => ({ ...f, empleado: v }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lbl}>Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                  let fecha = ev.target.value
                  const d = new Date(fecha + "T12:00:00")
                  if (d.getDay() === 0) { d.setDate(d.getDate() + 1); fecha = d.toISOString().slice(0, 10) }
                  const diasMap = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
                  setForm((f: typeof form) => ({ ...f, fecha, dia: diasMap[d.getDay()] ?? f.dia }))
                }}
                className={inp}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Día</label>
              <select value={form.dia} onChange={set("dia")} className={inp}>
                <option value="">—</option>
                {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lbl}>Labor</label>
              <select value={form.tipo_labor} onChange={set("tipo_labor")} className={inp}>
                {tiposLabor.map(t => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Lote</label>
              <select value={form.lote} onChange={set("lote")} className={inp}>
                <option value="">— ninguno —</option>
                {lotes.map(l => <option key={l.id} value={String(l.id)}>{l.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={lbl}>Cobro</label>
              <select value={form.tipo_cobro} onChange={set("tipo_cobro")} className={inp}>
                {tiposCobro.map(t => (
                  <option key={t.id} value={String(t.id)}>
                    {COBRO_LETRA[t.nombre.toLowerCase()] ?? t.nombre} – {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Kilos</label>
              <input type="number" min="0" step="0.01" value={form.kilos} onChange={set("kilos")} className={inp} placeholder="—" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={lbl}>Jornales</label>
              <input type="number" min="0" step="0.5" value={form.jornales} onChange={set("jornales")} className={inp} placeholder="—" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={lbl}>Valor $</label>
            <input type="number" min="0" step="1" value={form.valor} onChange={set("valor")} className={inp} required />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={eliminar} disabled={eliminando}
              className="text-sm px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50 flex items-center gap-1.5">
              {eliminando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Eliminar
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onCerrar}
                className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">Cancelar</button>
              <button type="submit" disabled={guardando}
                className="text-sm px-5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2">
                {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── BorrarSemanaModal ─── */

function BorrarSemanaModal({
  semanaRef,
  totalRegistros,
  onConfirmado,
  onCerrar,
}: {
  semanaRef: string
  totalRegistros: number
  onConfirmado: () => void
  onCerrar: () => void
}) {
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [aceptado, setAceptado] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ejecutarBorrado() {
    setBorrando(true)
    setError(null)
    try {
      const result = await api.nomina.controlSemanal.borrarSemana(semanaRef)
      onConfirmado()
      void result
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al borrar")
      setBorrando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-destructive/40 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <h2 className="font-bold text-sm text-destructive">Eliminar semana completa</h2>
          </div>
          <button onClick={onCerrar} disabled={borrando}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Semana info */}
          <div className="rounded-lg bg-destructive/8 border border-destructive/20 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Semana a eliminar</p>
            <p className="text-sm font-medium">{semanaRef}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-destructive">{totalRegistros} registros</span> serán eliminados permanentemente
            </p>
          </div>

          {/* Paso 1 */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Esta acción eliminará <strong className="text-foreground">todos los registros</strong> de la semana seleccionada de la base de datos.</p>
                <p className="text-destructive font-medium">⚠ Esta operación es irreversible. Los datos no podrán recuperarse.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={aceptado}
                  onChange={e => setAceptado(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-destructive"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Entiendo que esta acción eliminará permanentemente <strong>{totalRegistros} registros</strong> y no puede deshacerse.
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={onCerrar} className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">
                  Cancelar
                </button>
                <button
                  onClick={() => setPaso(2)}
                  disabled={!aceptado}
                  className="text-sm px-4 py-1.5 rounded-lg bg-destructive/80 text-white hover:bg-destructive disabled:opacity-40 font-semibold"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Para confirmar, estás a punto de eliminar los registros de:</p>
                <p className="font-semibold text-foreground px-3 py-2 bg-muted rounded-lg text-xs">{semanaRef}</p>
                <p>Esto también eliminará el egreso de nómina asociado a esta semana si fue creado automáticamente.</p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setPaso(1)} className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">
                  ← Atrás
                </button>
                <button
                  onClick={() => setPaso(3)}
                  className="text-sm px-4 py-1.5 rounded-lg bg-destructive/80 text-white hover:bg-destructive font-semibold"
                >
                  Sí, continuar →
                </button>
              </div>
            </div>
          )}

          {/* Paso 3 */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Escribe <strong className="text-foreground font-mono">ELIMINAR</strong> para confirmar definitivamente:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  autoFocus
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-destructive font-mono tracking-widest"
                />
              </div>
              {error && <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setPaso(2)} disabled={borrando} className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted">
                  ← Atrás
                </button>
                <button
                  onClick={ejecutarBorrado}
                  disabled={confirmText !== "ELIMINAR" || borrando}
                  className="text-sm px-5 py-1.5 rounded-lg bg-destructive text-white hover:bg-destructive/90 font-bold disabled:opacity-40 flex items-center gap-2"
                >
                  {borrando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {borrando ? "Eliminando…" : `Eliminar ${totalRegistros} registros`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-border">
          {[1, 2, 3].map(p => (
            <div key={p} className={`h-1.5 rounded-full transition-all ${p === paso ? "w-8 bg-destructive" : p < paso ? "w-4 bg-destructive/40" : "w-4 bg-muted"}`} />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">Paso {paso} de 3</span>
        </div>
      </div>
    </div>
  )
}

/* ─── ChartLabores ─── */

function ChartLabores({ registros }: { registros: ControlSemanal[] }) {
  if (registros.length === 0) return null

  const byCobro: Record<string, number> = {}
  const byLabor: Record<string, number> = {}

  for (const r of registros) {
    const cobro = r.tipo_cobro_nombre?.toLowerCase() ?? "otros"
    byCobro[cobro] = (byCobro[cobro] || 0) + Number(r.valor ?? 0)

    const labor = r.tipo_labor_nombre ?? "otros"
    byLabor[labor] = (byLabor[labor] || 0) + Number(r.valor ?? 0)
  }

  const cobroItems = Object.entries(byCobro).sort((a, b) => b[1] - a[1])
  const laborItems = Object.entries(byLabor).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const cobroMax = Math.max(...cobroItems.map(([, v]) => v), 1)
  const laborMax = Math.max(...laborItems.map(([, v]) => v), 1)

  function Bar({ label, value, max, cls }: { label: string; value: number; max: number; cls: string }) {
    const pct = Math.max(2, Math.round((value / max) * 100))
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-32 text-right truncate text-muted-foreground text-[11px]">{label}</span>
        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-24 tabular-nums text-[11px]">{cop(value)}</span>
      </div>
    )
  }

  const cobroCls: Record<string, string> = {
    kilos: "bg-amber-400",
    jornal: "bg-green-500",
    contrato: "bg-blue-500",
    nomina: "bg-purple-500",
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por tipo de cobro</p>
        {cobroItems.map(([k, v]) => (
          <Bar key={k} label={k} value={v} max={cobroMax} cls={cobroCls[k] ?? "bg-primary"} />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por labor (top 8)</p>
        {laborItems.map(([k, v]) => (
          <Bar key={k} label={k} value={v} max={laborMax} cls="bg-primary" />
        ))}
      </div>
    </div>
  )
}

/* ─── Página principal ─── */

export default function ControlSemanalPage() {
  const [semanas, setSemanas] = useState<{ semana_ref: string; fecha_min: string }[]>([])
  const [semanaActual, setSemanaActual] = useState<string>("")
  const [registros, setRegistros] = useState<ControlSemanal[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [tiposLabor, setTiposLabor] = useState<TipoLabor[]>([])
  const [tiposCobro, setTiposCobro] = useState<TipoCobro[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingReg, setLoadingReg] = useState(false)
  const [isRevisando, setIsRevisando] = useState(false)
  const [editando, setEditando] = useState<ControlSemanal | null>(null)
  const [borrandoSemana, setBorrandoSemana] = useState(false)
  const [renamingSemana, setRenamingSemana] = useState(false)
  const [renameInput, setRenameInput] = useState("")
  const [renameGuardando, setRenameGuardando] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const usuario = getUser()
  const esAdmin = usuario?.role === "administrador" || usuario?.is_superuser === true

  function cargarSemanas(seleccionar?: string) {
    return api.nomina.controlSemanal.semanas().then(data => {
      setSemanas(data)
      const sel = seleccionar ?? data[0]?.semana_ref ?? ""
      setSemanaActual(sel)
    })
  }

  useEffect(() => {
    Promise.all([
      cargarSemanas(),
      api.nomina.empleados.list({ page_size: "1000" }).then(r => setEmpleados(r.results)),
      api.nomina.tiposLabor.list().then(r => setTiposLabor(r)),
      api.nomina.tiposCobro.list().then(r => setTiposCobro(r)),
      api.produccion.lotes.list().then(r => setLotes(r)),
    ]).finally(() => setLoadingInit(false))
  }, [])

  useEffect(() => {
    if (!semanaActual) return
    setLoadingReg(true)
    api.nomina.controlSemanal.porSemana(semanaActual)
      .then(data => setRegistros(data))
      .finally(() => setLoadingReg(false))
  }, [semanaActual])

  function handleGuardado(semanaRef: string) {
    cargarSemanas(semanaRef)
  }

  async function handleCrearEmpleado(nombre: string): Promise<Empleado | null> {
    try {
      const emp = await api.nomina.empleados.create({ nombre_completo: nombre })
      setEmpleados(prev => [...prev, emp].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo)))
      return emp
    } catch {
      return null
    }
  }

  function iniciarRenombrar() {
    setRenameInput(semanaActual)
    setRenamingSemana(true)
    setTimeout(() => renameInputRef.current?.focus(), 30)
  }

  async function confirmarRenombrar() {
    const nuevo = renameInput.trim()
    if (!nuevo || nuevo === semanaActual) { setRenamingSemana(false); return }
    setRenameGuardando(true)
    try {
      await api.nomina.controlSemanal.renombrarSemana(semanaActual, nuevo)
      setSemanas(prev => prev.map(s => s.semana_ref === semanaActual ? { ...s, semana_ref: nuevo } : s))
      setSemanaActual(nuevo)
      setRenamingSemana(false)
    } catch {
      // silently cancel on error
    } finally {
      setRenameGuardando(false)
    }
  }

  // Agrupación por trabajador
  const byName: Record<string, ControlSemanal[]> = {}
  for (const r of registros) {
    if (!byName[r.empleado_nombre]) byName[r.empleado_nombre] = []
    byName[r.empleado_nombre].push(r)
  }
  const grupos: GrupoTrabajador[] = Object.keys(byName)
    .sort()
    .map(nombre => {
      const regs = byName[nombre].slice().sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""))
      const total = regs.reduce((s, r) => s + Number(r.valor ?? 0), 0)
      return { nombre, registros: regs, total }
    })

  const totalPagado   = registros.reduce((s, r) => s + Number(r.valor ?? 0), 0)
  const totalKilos    = registros.reduce((s, r) => s + Number(r.kilos ?? 0), 0)
  const totalJornales = registros.reduce((s, r) => s + Number(r.jornales ?? 0), 0)
  const numTrabajadores = Object.keys(byName).length

  function descargarExcel() {
    const filas = registros.map(r => ({
      "Semana":     r.semana_ref,
      "Trabajador": r.empleado_nombre,
      "Día":        r.dia ?? "",
      "Fecha":      r.fecha ?? "",
      "Labor":      r.tipo_labor_nombre,
      "Lote":       r.lote_nombre || "",
      "Kilos":      r.kilos ?? "",
      "Jornales":   r.jornales ?? "",
      "Tipo cobro": r.tipo_cobro_nombre,
      "$/J-K":      r.costo_unidad ?? "",
      "Valor total": r.valor,
    }))
    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Control Semanal")
    XLSX.writeFile(wb, `control-semanal-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loadingInit) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-5">
      {borrandoSemana && semanaActual && (
        <BorrarSemanaModal
          semanaRef={semanaActual}
          totalRegistros={registros.length}
          onConfirmado={() => {
            setBorrandoSemana(false)
            setRegistros([])
            cargarSemanas()
          }}
          onCerrar={() => setBorrandoSemana(false)}
        />
      )}

      {editando && (
        <EditRegistroModal
          registro={editando}
          empleados={empleados}
          tiposLabor={tiposLabor}
          tiposCobro={tiposCobro}
          lotes={lotes}
          onGuardado={() => {
            setEditando(null)
            api.nomina.controlSemanal.porSemana(semanaActual).then(setRegistros)
          }}
          onEliminado={() => {
            setEditando(null)
            api.nomina.controlSemanal.porSemana(semanaActual).then(setRegistros)
          }}
          onCerrar={() => setEditando(null)}
        />
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Control Semanal</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Sube la planilla semanal y consulta el acumulado por semana</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center self-start sm:self-auto">
          <Link href="/planilla" target="_blank"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <Printer className="h-4 w-4" />
            Planilla semanal
          </Link>
          <button
            onClick={descargarExcel}
            disabled={registros.length === 0}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Referencia de cálculos */}
      <RecuerdoCalculos />

      {/* Subida de foto + formulario manual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={isRevisando ? "lg:col-span-2" : ""}>
          <PanelFoto
            onGuardado={handleGuardado}
            onRevisando={setIsRevisando}
            empleados={empleados}
            tiposLabor={tiposLabor}
            lotes={lotes}
            fechaFallback={semanaActual}
            onCrearEmpleado={handleCrearEmpleado}
          />
        </div>
        {!isRevisando && (
          <FormManual empleados={empleados} tiposLabor={tiposLabor} lotes={lotes} onGuardado={handleGuardado} onCrearEmpleado={handleCrearEmpleado} />
        )}
      </div>

      {/* Selector de semana + KPIs */}
      <div className="flex flex-wrap items-center gap-3">
        {renamingSemana ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-card px-3 py-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Semana:</span>
            <input
              ref={renameInputRef}
              type="text"
              value={renameInput}
              onChange={e => setRenameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmarRenombrar(); if (e.key === "Escape") setRenamingSemana(false) }}
              className="text-sm font-semibold bg-transparent focus:outline-none min-w-0 w-64"
            />
            <button
              onClick={confirmarRenombrar}
              disabled={renameGuardando || !renameInput.trim()}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1"
            >
              {renameGuardando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
              Guardar
            </button>
            <button onClick={() => setRenamingSemana(false)} className="text-[11px] text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Semana:</span>
            <select
              value={semanaActual}
              onChange={e => setSemanaActual(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none appearance-none pr-5 cursor-pointer"
            >
              {semanas.length === 0
                ? <option value="">Sin semanas aún</option>
                : semanas.map(s => (
                    <option key={s.semana_ref} value={s.semana_ref}>{s.semana_ref}</option>
                  ))
              }
            </select>
            <ChevronDown className="absolute right-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        )}
        {!renamingSemana && semanaActual && (
          <button
            onClick={iniciarRenombrar}
            title="Renombrar semana"
            className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {esAdmin && semanaActual && registros.length > 0 && !renamingSemana && (
          <button
            onClick={() => setBorrandoSemana(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar semana
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total pagado" value={loadingReg ? "…" : cop(totalPagado)} sub={`${registros.length} registros`} />
        <KpiCard label="Trabajadores" value={loadingReg ? "…" : (numTrabajadores > 0 ? String(numTrabajadores) : "—")} sub="en la semana" />
        <KpiCard
          label="Kilos"
          value={loadingReg ? "…" : (totalKilos > 0 ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(totalKilos) : "—")}
          sub="recolectados"
        />
        <KpiCard
          label="Jornales"
          value={loadingReg ? "…" : (totalJornales > 0 ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(totalJornales) : "—")}
          sub="días trabajados"
        />
      </div>

      {/* Tabla semanal */}
      <div className="rounded-xl border border-border overflow-hidden">
        {loadingReg ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Trabajador / Día</th>
                    <th className="px-3 py-2.5 text-left">Fecha</th>
                    <th className="px-2 py-2.5 text-left w-20">Labor</th>
                    <th className="px-2 py-2.5 text-left w-20">Lote</th>
                    <th className="px-2 py-2.5 text-right w-24">Kilos</th>
                    <th className="px-2 py-2.5 text-right w-24">Jornales</th>
                    <th className="px-3 py-2.5 text-center">Cobro</th>
                    <th className="px-3 py-2.5 text-right">$/J-K</th>
                    <th className="px-3 py-2.5 text-right">Valor total</th>
                    <th className="px-3 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {grupos.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        Sin registros para esta semana.
                      </td>
                    </tr>
                  ) : grupos.map(g => (
                    <React.Fragment key={g.nombre}>
                      <tr className="bg-muted/25 border-y border-border/70">
                        <td colSpan={8} className="px-4 py-2 font-semibold text-sm">{g.nombre}</td>
                        <td className="px-3 py-2 text-right font-bold text-sm tabular-nums">{cop(g.total)}</td>
                        <td />
                      </tr>
                      {g.registros.map(r => {
                        const cobroKey = r.tipo_cobro_nombre?.toLowerCase() ?? ""
                        const costoU = Number(r.costo_unidad ?? 0)
                        return (
                          <tr key={r.id} className="border-b border-border/40 hover:bg-muted/15 text-sm">
                            <td className="px-4 py-1.5 pl-8 text-muted-foreground text-xs">{r.dia ?? "—"}</td>
                            <td className="px-3 py-1.5 text-muted-foreground text-xs tabular-nums">{fmtFecha(r.fecha)}</td>
                            <td className="px-3 py-1.5 text-sm">{r.tipo_labor_nombre}</td>
                            <td className="px-3 py-1.5 text-muted-foreground text-sm">{r.lote_nombre || "—"}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm">
                              {r.kilos ? `${Number(r.kilos).toLocaleString("es-CO")} kg` : "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm">
                              {r.jornales ? Number(r.jornales).toLocaleString("es-CO") : "—"}
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${BADGE[cobroKey] ?? "bg-muted text-muted-foreground"}`}>
                                {COBRO_LETRA[cobroKey] ?? r.tipo_cobro_nombre}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm text-muted-foreground">
                              {costoU > 0 ? cop(costoU) : "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-sm">{cop(r.valor)}</td>
                            <td className="px-3 py-1.5">
                              <button
                                onClick={() => setEditando(r)}
                                className="p-1 text-muted-foreground hover:bg-muted rounded"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {registros.length} registros · {numTrabajadores} trabajadores
              </p>
              <p className="text-sm font-bold tabular-nums">{cop(totalPagado)}</p>
            </div>
          </>
        )}
      </div>

      {/* Gráfica de labores */}
      {!loadingReg && registros.length > 0 && (
        <ChartLabores registros={registros} />
      )}
    </div>
  )
}

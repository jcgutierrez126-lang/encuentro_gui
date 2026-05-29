"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Search, Pencil, Trash2 } from "lucide-react"
import { api, type Egreso, type Cuenta, type Proveedor } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

// ── Categorías encuentro ──────────────────────────────────────────────────────
const CATEGORIAS: [string, string][] = [
  ["tostadora", "Tostadora"],
  ["empaque", "Empaque"],
  ["transporte", "Transporte"],
  ["insumos", "Insumos"],
  ["marketing", "Marketing"],
  ["servicios", "Servicios"],
  ["nomina", "Nómina"],
  ["impuestos", "Impuestos"],
  ["mantenimiento", "Mantenimiento"],
  ["activos_fijos", "Activos Fijos"],
  ["capacitaciones", "Capacitaciones"],
  ["varios", "Varios"],
]

const ESTADOS: [string, string][] = [
  ["pagada", "Pagada"],
  ["pendiente", "Pendiente"],
  ["parcial", "Parcial"],
]

const CAT_BADGE: Record<string, string> = {
  tostadora:     "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  empaque:       "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  transporte:    "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  insumos:       "bg-green-500/20 text-green-300 border border-green-500/30",
  marketing:     "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  servicios:     "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  nomina:        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  impuestos:     "bg-red-500/20 text-red-300 border border-red-500/30",
  mantenimiento: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  activos_fijos: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30",
  capacitaciones:"bg-sky-500/20 text-sky-300 border border-sky-500/30",
  varios:        "bg-gray-500/20 text-gray-300 border border-gray-500/30",
}

function cop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function badgeEstado(e: string) {
  const map: Record<string, string> = {
    pagada:   "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    pendiente:"bg-red-500/20 text-red-300 border border-red-500/30",
    parcial:  "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  }
  return map[e] ?? "bg-muted text-muted-foreground"
}

// ── Form types ────────────────────────────────────────────────────────────────
interface FormData {
  fecha: string
  nombre: string
  descripcion: string
  valor: string
  categoria: string
  cuenta: string
  proveedor: string
  estado: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10),
  nombre: "",
  descripcion: "",
  valor: "",
  categoria: "varios",
  cuenta: "",
  proveedor: "",
  estado: "pagada",
}

function egresoToForm(e: Egreso): FormData {
  return {
    fecha:       e.fecha,
    nombre:      e.nombre,
    descripcion: e.descripcion ?? "",
    valor:       e.valor,
    categoria:   e.categoria,
    cuenta:      String(e.cuenta),
    proveedor:   e.proveedor ? String(e.proveedor) : "",
    estado:      e.estado,
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function ModalEgreso({
  egreso,
  cuentas,
  proveedores,
  onGuardado,
  onCerrar,
  onEliminar,
}: {
  egreso: Egreso | null
  cuentas: Cuenta[]
  proveedores: Proveedor[]
  onGuardado: () => void
  onCerrar: () => void
  onEliminar?: () => void
}) {
  const esEdicion = egreso !== null
  const [form, setForm] = useState<FormData>(egreso ? egresoToForm(egreso) : EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.fecha || !form.nombre || !form.valor || !form.cuenta || !form.categoria) {
      setError("Fecha, nombre, valor, cuenta y categoría son obligatorios.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload = {
        fecha:       form.fecha,
        nombre:      form.nombre,
        descripcion: form.descripcion || undefined,
        valor:       form.valor,
        cuenta:      Number(form.cuenta),
        categoria:   form.categoria,
        proveedor:   form.proveedor ? Number(form.proveedor) : null,
        estado:      form.estado as never,
      }
      if (esEdicion && egreso) {
        await api.finanzas.egresos.update(egreso.id, payload)
      } else {
        await api.finanzas.egresos.create(payload)
      }
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!egreso) return
    setEliminando(true)
    try {
      await api.finanzas.egresos.delete(egreso.id)
      onEliminar?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar")
      setEliminando(false)
      setConfirmarEliminar(false)
    }
  }

  const field = "flex flex-col gap-1"
  const lbl   = "text-xs font-medium text-muted-foreground"
  const inp   = "text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-[#F0B429] text-[rgba(255,240,210,0.88)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-[rgba(255,240,210,0.88)]">
            {esEdicion ? "Editar egreso" : "Nuevo egreso"}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Fecha *</label>
              <input type="date" value={form.fecha} onChange={set("fecha")} className={inp} required />
            </div>
            <div className={field}>
              <label className={lbl}>Estado</label>
              <select value={form.estado} onChange={set("estado")} className={inp}>
                {ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={lbl}>Nombre / Concepto *</label>
            <input value={form.nombre} onChange={set("nombre")} placeholder="Ej: Bolsas kraft 250g" className={inp} required />
          </div>

          <div className={field}>
            <label className={lbl}>Descripción</label>
            <textarea value={form.descripcion} onChange={set("descripcion")} rows={2}
              className={`${inp} resize-none`} placeholder="Opcional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Valor * ($)</label>
              <input type="number" step="any" value={form.valor} onChange={set("valor")}
                className={inp} required placeholder="0" />
            </div>
            <div className={field}>
              <label className={lbl}>Categoría *</label>
              <select value={form.categoria} onChange={set("categoria")} className={inp} required>
                {CATEGORIAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Cuenta *</label>
              <select value={form.cuenta} onChange={set("cuenta")} className={inp} required>
                <option value="">Seleccionar…</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={lbl}>Proveedor</label>
              <select value={form.proveedor} onChange={set("proveedor")} className={inp}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {esEdicion && !confirmarEliminar && (
              <button type="button" onClick={() => setConfirmarEliminar(true)}
                className="text-sm px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            )}
            {confirmarEliminar && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">¿Confirmar?</span>
                <button type="button" onClick={eliminar} disabled={eliminando}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
                  {eliminando && <Loader2 className="h-3 w-3 animate-spin" />}
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmarEliminar(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
                  Cancelar
                </button>
              </div>
            )}
            {!confirmarEliminar && (
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={onCerrar}
                  className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
                  className="text-sm px-5 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2">
                  {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function EgresosPage() {
  const [egresos, setEgresos]       = useState<Egreso[]>([])
  const [cuentas, setCuentas]       = useState<Cuenta[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [egresoEditar, setEgresoEditar] = useState<Egreso | null>(null)
  const [pagina, setPagina]         = useState(1)
  const [total, setTotal]           = useState(0)
  const [totalMes, setTotalMes]     = useState(0)
  const [totalAcum, setTotalAcum]   = useState(0)
  const PAGE_SIZE = 50

  // Filtros
  const [mes, setMes]           = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"))
  const [anio, setAnio]         = useState(() => String(new Date().getFullYear()))
  const [categoria, setCategoria] = useState("")
  const [query, setQuery]       = useState("")

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (mes && anio) {
      const desde = `${anio}-${mes}-01`
      const lastDay = new Date(Number(anio), Number(mes), 0).getDate()
      const hasta = `${anio}-${mes}-${String(lastDay).padStart(2, "0")}`
      params.fecha_desde = desde
      params.fecha_hasta = hasta
    }
    if (categoria) params.categoria = categoria

    const paramsAcum: Record<string, string> = { page: "1", page_size: "1" }
    if (anio) paramsAcum.fecha_desde = `${anio}-01-01`

    Promise.all([
      api.finanzas.egresos.list(params),
      api.finanzas.egresos.list(paramsAcum),
      api.finanzas.cuentas.list(),
      api.finanzas.proveedores.list({ page: "1", page_size: "200" }),
    ]).then(([e, eAcum, c, p]) => {
      setEgresos(e.results)
      setTotal(e.count)
      setTotalMes(e.total_valor ?? 0)
      setTotalAcum(eAcum.total_valor ?? 0)
      setCuentas(c)
      setProveedores(p.results)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = egresos.filter(e => {
    const q = query.toLowerCase()
    return !q || e.nombre.toLowerCase().includes(q) || (e.proveedor_nombre ?? "").toLowerCase().includes(q)
  })

  const MESES = [
    ["01","Enero"],["02","Febrero"],["03","Marzo"],["04","Abril"],
    ["05","Mayo"],["06","Junio"],["07","Julio"],["08","Agosto"],
    ["09","Septiembre"],["10","Octubre"],["11","Noviembre"],["12","Diciembre"],
  ]
  const ANIOS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  function abrirNuevo() { setEgresoEditar(null); setModalAbierto(true) }
  function abrirEditar(e: Egreso) { setEgresoEditar(e); setModalAbierto(true) }
  function cerrarModal() { setModalAbierto(false); setEgresoEditar(null) }

  return (
    <div className="space-y-5" style={{ color: "rgba(255,240,210,0.88)" }}>
      {modalAbierto && (
        <ModalEgreso
          egreso={egresoEditar}
          cuentas={cuentas}
          proveedores={proveedores}
          onGuardado={() => { cerrarModal(); cargar(1) }}
          onCerrar={cerrarModal}
          onEliminar={() => { cerrarModal(); cargar(1) }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Egresos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gastos operacionales: tostadora, empaque, transporte, insumos y más.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo egreso
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total mes ({MESES.find(m => m[0] === mes)?.[1] ?? mes})
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#F0B429" }}>
            {cop(totalMes)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total acumulado {anio}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#F0B429" }}>
            {cop(totalAcum)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar nombre o proveedor…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="text-sm border border-border rounded-lg pl-8 pr-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-[#F0B429] w-52"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">Mes</label>
          <select value={mes} onChange={e => setMes(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
            {MESES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">Año</label>
          <select value={anio} onChange={e => setAnio(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
            {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">Categoría</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
            <option value="">Todas</option>
            {CATEGORIAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setPagina(1); cargar(1) }}
          style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
          className="text-sm px-4 py-2 rounded-lg font-medium">
          Filtrar
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Categoría</th>
                <th className="px-3 py-2.5 text-left">Proveedor</th>
                <th className="px-3 py-2.5 text-right">Valor</th>
                <th className="px-3 py-2.5 text-left">Cuenta</th>
                <th className="px-3 py-2.5 text-center">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    Sin egresos registrados.
                  </td>
                </tr>
              ) : filtrados.map(e => (
                <tr key={e.id} className="hover:bg-muted/15 text-sm">
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">{e.fecha}</td>
                  <td className="px-3 py-2.5 font-medium max-w-[180px] truncate">{e.nombre}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CAT_BADGE[e.categoria] ?? "bg-muted text-muted-foreground"}`}>
                      {CATEGORIAS.find(c => c[0] === e.categoria)?.[1] ?? e.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[140px] truncate">
                    {e.proveedor_nombre ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold" style={{ color: "#F0B429" }}>
                    {cop(e.valor)}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{e.cuenta_nombre}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => abrirEditar(e)}
                      className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Paginacion
        pagina={pagina}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={p => { setPagina(p); cargar(p) }}
      />
    </div>
  )
}

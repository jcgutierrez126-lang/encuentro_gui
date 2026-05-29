"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, ChevronDown, Search } from "lucide-react"
import { api, type Egreso, type Cuenta, type Proveedor } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

const CATEGORIAS = [
  ["fertilizantes", "Fertilizantes"], ["herbicidas", "Herbicidas"],
  ["nomina", "Nómina"], ["seguridad_social", "Seg. Social"],
  ["transporte", "Transporte"], ["viaticos", "Viáticos"],
  ["acueducto", "Acueducto"], ["epm", "EPM"], ["comsab", "Comsab"],
  ["mantenimientos", "Mantenimientos"], ["varios", "Varios"],
  ["beneficio", "Beneficio"], ["guadana", "Guadaña"],
  ["construcciones", "Construcciones"], ["impuestos", "Impuestos"],
  ["animales", "Animales"], ["siembra", "Siembra"],
  ["herramientas", "Herramientas"], ["broca", "Broca"], ["roya", "Roya"],
  ["moto", "Moto"], ["prestamo_empleados", "Préstamo empleados"],
  ["activos_fijos", "Activos fijos"],
  ["banano", "Banano"], ["compra_finca", "Compra finca"],
  ["capacitaciones", "Capacitaciones"],
]

const ESTADOS = [["pagada", "Pagada"], ["pendiente", "Pendiente"], ["parcial", "Parcial"]]

function fmt(n: string | null | undefined) {
  if (!n) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function badgeEstado(e: string) {
  const map: Record<string, string> = {
    pagada: "bg-green-100 text-green-800",
    pendiente: "bg-red-100 text-red-800",
    parcial: "bg-yellow-100 text-yellow-800",
  }
  return map[e] ?? "bg-muted text-muted-foreground"
}

/* ─── Formulario ─── */
interface FormData {
  fecha: string; nombre: string; descripcion: string
  cantidad: string; unidad: string; valor: string
  cuenta: string; categoria: string; proveedor: string
  nit_proveedor_destino: string; facturado_a: string; estado: string
}

const EMPTY: FormData = {
  fecha: new Date().toISOString().slice(0, 10), nombre: "", descripcion: "",
  cantidad: "", unidad: "", valor: "", cuenta: "", categoria: "varios",
  proveedor: "", nit_proveedor_destino: "", facturado_a: "", estado: "pagada",
}

function FormEgreso({
  cuentas, proveedores, onGuardado, onCerrar,
}: {
  cuentas: Cuenta[]; proveedores: Proveedor[]
  onGuardado: () => void; onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      await api.finanzas.egresos.create({
        fecha: form.fecha, nombre: form.nombre, descripcion: form.descripcion || undefined,
        cantidad: form.cantidad || undefined, unidad: form.unidad || undefined,
        valor: form.valor, cuenta: Number(form.cuenta), categoria: form.categoria,
        proveedor: form.proveedor ? Number(form.proveedor) : null,
        nit_proveedor_destino: form.nit_proveedor_destino || undefined,
        facturado_a: form.facturado_a || undefined,
        estado: form.estado as never,
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nuevo egreso</h2>
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
              <label className={label}>Estado</label>
              <select value={form.estado} onChange={set("estado")} className={input}>
                {ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={label}>Nombre / Concepto *</label>
            <input value={form.nombre} onChange={set("nombre")} placeholder="Ej: Pago abono Embajador" className={input} required />
          </div>

          <div className={field}>
            <label className={label}>Descripción</label>
            <textarea value={form.descripcion} onChange={set("descripcion")} rows={2}
              className={`${input} resize-none`} placeholder="Opcional" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={field}>
              <label className={label}>Cantidad</label>
              <input type="number" step="any" value={form.cantidad} onChange={set("cantidad")} className={input} placeholder="0" />
            </div>
            <div className={field}>
              <label className={label}>Unidad</label>
              <input value={form.unidad} onChange={set("unidad")} className={input} placeholder="kg, und…" />
            </div>
            <div className={field}>
              <label className={label}>Valor * ($)</label>
              <input type="number" step="any" value={form.valor} onChange={set("valor")} className={input} required placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Cuenta *</label>
              <select value={form.cuenta} onChange={set("cuenta")} className={input} required>
                <option value="">Seleccionar…</option>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={label}>Categoría *</label>
              <select value={form.categoria} onChange={set("categoria")} className={input} required>
                {CATEGORIAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Proveedor</label>
              <select value={form.proveedor} onChange={set("proveedor")} className={input}>
                <option value="">Sin proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={label}>NIT / Destino</label>
              <input value={form.nit_proveedor_destino} onChange={set("nit_proveedor_destino")} className={input} placeholder="NIT del proveedor" />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Facturado a</label>
            <input value={form.facturado_a} onChange={set("facturado_a")} className={input} placeholder="Nombre en la factura" />
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
export default function EgresosPage() {
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalValor, setTotalValor] = useState("0")
  const PAGE_SIZE = 50

  // Filtros
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [categoria, setCategoria] = useState("")
  const [estado, setEstado] = useState("")
  const [query, setQuery] = useState("")

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (desde) params.fecha_desde = desde
    if (hasta) params.fecha_hasta = hasta
    if (categoria) params.categoria = categoria
    if (estado) params.estado = estado

    Promise.all([
      api.finanzas.egresos.list(params),
      api.finanzas.cuentas.list(),
      api.finanzas.proveedores.list(),
    ]).then(([e, c, p]) => {
      setEgresos(e.results)
      setTotal(e.count)
      setTotalValor(String(e.total_valor ?? "0"))
      setCuentas(c)
      setProveedores(p.results)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1) }, [])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormEgreso
          cuentas={cuentas}
          proveedores={proveedores}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Egresos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gastos de la finca: nómina, insumos, servicios y más. Cada egreso descuenta del saldo de la cuenta asociada.</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nuevo egreso
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total egresos (filtro activo)</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">{fmt(totalValor)}</p>
        </div>
        <p className="text-xs text-muted-foreground">{total} registros</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Buscar por nombre o proveedor…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Categoría</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background">
            <option value="">Todas</option>
            {CATEGORIAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1.5 bg-background">
            <option value="">Todos</option>
            {ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button onClick={() => { setPagina(1); cargar(1) }}
          className="text-sm px-4 py-1.5 rounded-md border border-border hover:bg-muted">Filtrar</button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Categoría</th>
                <th className="px-3 py-2.5 text-left">Cuenta</th>
                <th className="px-3 py-2.5 text-left">Proveedor</th>
                <th className="px-3 py-2.5 text-right">Valor</th>
                <th className="px-3 py-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : egresos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  Sin egresos registrados.
                </td></tr>
              ) : egresos.filter(e => {
                  const q = query.toLowerCase()
                  return !q || e.nombre.toLowerCase().includes(q) || (e.proveedor_nombre ?? "").toLowerCase().includes(q) || (e.cuenta_nombre ?? "").toLowerCase().includes(q)
                }).map(e => (
                <tr key={e.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{e.fecha}</td>
                  <td className="px-3 py-2 font-medium max-w-[200px] truncate">{e.nombre}</td>
                  <td className="px-3 py-2 capitalize">{e.categoria.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{e.cuenta_nombre}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.proveedor_nombre ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmt(e.valor)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeEstado(e.estado)}`}>
                      {e.estado.charAt(0).toUpperCase() + e.estado.slice(1)}
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

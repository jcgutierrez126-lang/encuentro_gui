"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Plus, X, CheckCircle2, Clock, ShoppingBag, Trash2, CreditCard,
} from "lucide-react"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

function cop(n: number | string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Venta {
  id: number
  fecha: string
  cliente: number | null
  cliente_nombre: string | null
  vendedor: number | null
  vendedor_nombre: string | null
  cuenta: number | null
  cuenta_nombre: string | null
  pagado: boolean
  notas: string
  total: string
  lineas: LineaVenta[]
}

interface LineaVenta {
  id?: number
  producto: number
  calidad: number
  cantidad: number
  precio_unitario: number
}

interface Producto {
  id: number
  nombre: string
  tipo: string
  kilos: number
  precio_sugerido: number
}

interface Calidad {
  id: number
  nombre: string
}

interface Vendedor {
  id: number
  nombre: string
}

interface Cliente {
  id: number
  nombre: string
}

interface Cuenta {
  id: number
  nombre: string
}

interface LineaForm {
  key: number
  producto: string
  calidad: string
  cantidad: string
  precio_unitario: string
}

const BTN_PRIMARY: React.CSSProperties = {
  background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
  color: "#3D1F00",
}

// ── Modal Nueva Venta ──────────────────────────────────────────────────────

function ModalNuevaVenta({
  productos,
  calidades,
  vendedores,
  clientes,
  cuentas,
  onClose,
  onSaved,
}: {
  productos: Producto[]
  calidades: Calidad[]
  vendedores: Vendedor[]
  clientes: Cliente[]
  cuentas: Cuenta[]
  onClose: () => void
  onSaved: () => void
}) {
  const [fecha, setFecha] = useState(today())
  const [cliente, setCliente] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [cuenta, setCuenta] = useState("")
  const [pagado, setPagado] = useState(false)
  const [notas, setNotas] = useState("")
  const [lineas, setLineas] = useState<LineaForm[]>([
    { key: 0, producto: "", calidad: "", cantidad: "1", precio_unitario: "" },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [nextKey, setNextKey] = useState(1)

  function addLinea() {
    setLineas((prev) => [
      ...prev,
      { key: nextKey, producto: "", calidad: "", cantidad: "1", precio_unitario: "" },
    ])
    setNextKey((k) => k + 1)
  }

  function removeLinea(key: number) {
    setLineas((prev) => prev.filter((l) => l.key !== key))
  }

  function updateLinea(key: number, field: keyof LineaForm, value: string) {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const updated = { ...l, [field]: value }
        if (field === "producto") {
          const prod = productos.find((p) => String(p.id) === value)
          if (prod) updated.precio_unitario = String(prod.precio_sugerido)
        }
        return updated
      })
    )
  }

  const total = lineas.reduce((acc, l) => {
    const qty = parseFloat(l.cantidad) || 0
    const price = parseFloat(l.precio_unitario) || 0
    return acc + qty * price
  }, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!cuenta) { setError("Debe seleccionar una cuenta."); return }
    if (lineas.length === 0) { setError("Agregue al menos una línea."); return }
    for (const l of lineas) {
      if (!l.producto || !l.calidad) { setError("Complete producto y calidad en todas las líneas."); return }
    }
    setSaving(true)
    try {
      await apiFetch(`${BASE}/api/v1/cafe/ventas/`, {
        method: "POST",
        body: JSON.stringify({
          fecha,
          cliente: cliente ? Number(cliente) : null,
          vendedor: vendedor ? Number(vendedor) : null,
          cuenta: Number(cuenta),
          pagado,
          notas,
          lineas: lineas.map((l) => ({
            producto: Number(l.producto),
            calidad: Number(l.calidad),
            cantidad: parseFloat(l.cantidad),
            precio_unitario: parseFloat(l.precio_unitario),
          })),
        }),
      })
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Nueva venta</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Row fecha / cuenta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Cuenta <span className="text-destructive">*</span>
              </label>
              <select
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Seleccionar cuenta —</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row cliente / vendedor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <select
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Sin cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Vendedor</label>
              <select
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Sin vendedor —</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas + pagado */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Observaciones opcionales..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={pagado}
              onChange={(e) => setPagado(e.target.checked)}
              className="accent-amber-500 h-4 w-4"
            />
            <span className="text-sm">Marcar como pagado</span>
          </label>

          {/* Líneas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Líneas</span>
              <button
                type="button"
                onClick={addLinea}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar línea
              </button>
            </div>

            {lineas.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sin líneas. Haga clic en &ldquo;Agregar línea&rdquo;.
              </p>
            )}

            <div className="space-y-2">
              {lineas.map((linea) => {
                const subtotal =
                  (parseFloat(linea.cantidad) || 0) * (parseFloat(linea.precio_unitario) || 0)
                return (
                  <div
                    key={linea.key}
                    className="grid grid-cols-[1fr_1fr_80px_100px_auto] gap-2 items-end bg-muted/30 rounded-xl p-3"
                  >
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Producto</label>
                      <select
                        value={linea.producto}
                        onChange={(e) => updateLinea(linea.key, "producto", e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">— Producto —</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Calidad</label>
                      <select
                        value={linea.calidad}
                        onChange={(e) => updateLinea(linea.key, "calidad", e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">— Calidad —</option>
                        {calidades.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Cant.</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={linea.cantidad}
                        onChange={(e) => updateLinea(linea.key, "cantidad", e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">
                        Precio unit.{subtotal > 0 && (
                          <span className="ml-1 text-amber-500">{cop(subtotal)}</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={linea.precio_unitario}
                        onChange={(e) => updateLinea(linea.key, "precio_unitario", e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLinea(linea.key)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            {lineas.length > 0 && (
              <div className="flex justify-end pt-1">
                <span className="text-sm font-semibold">
                  Total:{" "}
                  <span style={{ color: "#F0B429" }}>{cop(total)}</span>
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={BTN_PRIMARY}
              className="px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [calidades, setCalidades] = useState<Calidad[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [marking, setMarking] = useState<number | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [v, p, cal, vend, cli, ctas] = await Promise.all([
        apiFetch(`${BASE}/api/v1/cafe/ventas/`),
        apiFetch(`${BASE}/api/v1/cafe/productos/`),
        apiFetch(`${BASE}/api/v1/cafe/calidades/`),
        apiFetch(`${BASE}/api/v1/cafe/vendedores/`),
        apiFetch(`${BASE}/api/v1/cafe/clientes/`),
        apiFetch(`${BASE}/api/v1/finanzas/cuentas/`),
      ])
      setVentas(Array.isArray(v) ? v : (v.results ?? []))
      setProductos(Array.isArray(p) ? p : (p.results ?? []))
      setCalidades(Array.isArray(cal) ? cal : (cal.results ?? []))
      setVendedores(Array.isArray(vend) ? vend : (vend.results ?? []))
      setClientes(Array.isArray(cli) ? cli : (cli.results ?? []))
      setCuentas(Array.isArray(ctas) ? ctas : (ctas.results ?? []))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function marcarPagado(id: number) {
    setMarking(id)
    try {
      await apiFetch(`${BASE}/api/v1/cafe/ventas/${id}/marcar-pagado/`, { method: "POST" })
      setVentas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, pagado: true } : v))
      )
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al marcar pagado")
    } finally {
      setMarking(null)
    }
  }

  // KPIs
  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  const pendientes = ventas.filter((v) => !v.pagado).length
  const nVentas = ventas.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registro de ventas por producto, cliente y vendedor.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={BTN_PRIMARY}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" /> Nueva venta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total en COP</p>
          <p className="text-xl font-bold" style={{ color: "#F0B429" }}>{cop(totalVentas)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendientes de pago</p>
          <p className="text-xl font-bold">
            {pendientes > 0 ? (
              <span className="text-amber-500">{pendientes}</span>
            ) : (
              <span className="text-emerald-500">0</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">N° de ventas</p>
          <p className="text-xl font-bold">{nVentas}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={loadAll} className="text-xs underline text-muted-foreground">
              Reintentar
            </button>
          </div>
        ) : ventas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No hay ventas registradas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Vendedor</th>
                <th className="px-4 py-3 text-center font-medium">Productos</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
                <th className="px-4 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{venta.fecha}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {venta.cliente_nombre ?? <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {venta.vendedor_nombre ?? <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-semibold">
                      {venta.lineas?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: "#F0B429" }}>
                    {cop(venta.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {venta.pagado ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500">
                        <CheckCircle2 className="h-3 w-3" /> Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500">
                        <Clock className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!venta.pagado && (
                      <button
                        onClick={() => marcarPagado(venta.id)}
                        disabled={marking === venta.id}
                        title="Marcar como pagado"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {marking === venta.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5" />
                        )}
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ModalNuevaVenta
          productos={productos}
          calidades={calidades}
          vendedores={vendedores}
          clientes={clientes}
          cuentas={cuentas}
          onClose={() => setShowModal(false)}
          onSaved={loadAll}
        />
      )}
    </div>
  )
}

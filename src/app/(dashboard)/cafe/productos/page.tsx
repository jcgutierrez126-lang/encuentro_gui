"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, X, Package, Pencil } from "lucide-react"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

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
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return null
  return res.json()
}

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
  color: "#3D1F00",
}

// ── Types ──────────────────────────────────────────────────────────────────

type TipoProducto = "grano" | "molido"

interface Producto {
  id: number
  nombre: string
  tipo: TipoProducto
  presentacion: string
  kilos: number
  precio_sugerido: number | null
  activo: boolean
}

interface ProductoForm {
  nombre: string
  tipo: TipoProducto
  presentacion: string
  kilos: string
  precio_sugerido: string
  activo: boolean
}

const EMPTY: ProductoForm = {
  nombre: "",
  tipo: "grano",
  presentacion: "",
  kilos: "",
  precio_sugerido: "",
  activo: true,
}

function toForm(p: Producto): ProductoForm {
  return {
    nombre: p.nombre,
    tipo: p.tipo,
    presentacion: p.presentacion,
    kilos: String(p.kilos),
    precio_sugerido: p.precio_sugerido !== null ? String(p.precio_sugerido) : "",
    activo: p.activo,
  }
}

function formatPrecio(n: number | null) {
  if (n === null) return <span className="opacity-40 italic">—</span>
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n)
}

// ── Modal ──────────────────────────────────────────────────────────────────

function ModalProducto({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Producto
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<ProductoForm>(initial ? toForm(initial) : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function setField<K extends keyof ProductoForm>(key: K, value: ProductoForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    if (!form.kilos || isNaN(parseFloat(form.kilos))) { setError("Kilos debe ser un número válido."); return }

    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      presentacion: form.presentacion.trim(),
      kilos: parseFloat(form.kilos),
      precio_sugerido: form.precio_sugerido ? parseFloat(form.precio_sugerido) : null,
      activo: form.activo,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await apiFetch(`/api/v1/cafe/productos/${initial!.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch(`/api/v1/cafe/productos/`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              required
              autoFocus
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej: Café Especial 250g"
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Tipo <span className="text-destructive">*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e) => setField("tipo", e.target.value as TipoProducto)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="grano">Grano</option>
              <option value="molido">Molido</option>
            </select>
          </div>

          {/* Presentación + Kilos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Presentación</label>
              <input
                type="text"
                value={form.presentacion}
                onChange={(e) => setField("presentacion", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: 250g, 2.5kg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Kilos/unidad <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.kilos}
                onChange={(e) => setField("kilos", e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0.25"
              />
            </div>
          </div>

          {/* Precio sugerido */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Precio sugerido (COP)
              <span className="ml-1 opacity-50 font-normal">opcional</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={form.precio_sugerido}
              onChange={(e) => setField("precio_sugerido", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="25000"
            />
          </div>

          {/* Activo */}
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setField("activo", e.target.checked)}
              className="accent-amber-500 h-4 w-4"
            />
            <span className="text-sm">Producto activo</span>
          </label>

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
              style={BTN}
              className="px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Producto | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/api/v1/cafe/productos/")
      setProductos(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(undefined)
    setShowModal(true)
  }

  function openEdit(p: Producto) {
    setEditing(p)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(undefined)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Presentaciones de café disponibles para la venta.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={BTN}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
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
            <button onClick={load} className="text-xs underline text-muted-foreground">
              Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No hay productos registrados</p>
            <button
              onClick={openCreate}
              style={BTN}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left font-medium">Nombre</th>
                <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">Presentación</th>
                <th className="px-4 py-2.5 text-right font-medium">Kilos/unidad</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio sugerido</th>
                <th className="px-4 py-2.5 text-center font-medium">Estado</th>
                <th className="px-4 py-2.5 text-center font-medium">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-muted/15 text-sm transition-colors">
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3">
                    {p.tipo === "grano" ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(240,180,41,0.15)",
                          color: "#F0B429",
                          border: "1px solid rgba(240,180,41,0.3)",
                        }}
                      >
                        Grano
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(255,240,210,0.1)",
                          color: "rgba(255,240,210,0.75)",
                          border: "1px solid rgba(255,240,210,0.2)",
                        }}
                      >
                        Molido
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.presentacion || <span className="opacity-40 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {p.kilos} kg
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatPrecio(p.precio_sugerido)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.activo ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEdit(p)}
                      title="Editar producto"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ModalProducto
          initial={editing}
          onClose={closeModal}
          onSaved={load}
        />
      )}
    </div>
  )
}

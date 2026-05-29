"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, X, Users, Search, Pencil } from "lucide-react"
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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

const BTN_PRIMARY: React.CSSProperties = {
  background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)",
  color: "#3D1F00",
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Cliente {
  id: number
  nombre: string
  identificacion: string
  telefono: string
  email: string
  requiere_factura_electronica: boolean
  notas: string
  activo: boolean
}

interface ClienteForm {
  nombre: string
  identificacion: string
  telefono: string
  email: string
  requiere_factura_electronica: boolean
  notas: string
  activo: boolean
}

const EMPTY_FORM: ClienteForm = {
  nombre: "",
  identificacion: "",
  telefono: "",
  email: "",
  requiere_factura_electronica: false,
  notas: "",
  activo: true,
}

// ── Modal Crear/Editar Cliente ─────────────────────────────────────────────

function ModalCliente({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Cliente
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<ClienteForm>(
    initial
      ? {
          nombre: initial.nombre,
          identificacion: initial.identificacion,
          telefono: initial.telefono,
          email: initial.email,
          requiere_factura_electronica: initial.requiere_factura_electronica,
          notas: initial.notas,
          activo: initial.activo,
        }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function setField<K extends keyof ClienteForm>(key: K, value: ClienteForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    setSaving(true)
    try {
      if (isEdit) {
        await apiFetch(`${BASE}/api/v1/cafe/clientes/${initial!.id}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch(`${BASE}/api/v1/cafe/clientes/`, {
          method: "POST",
          body: JSON.stringify(form),
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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
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
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Nombre completo o razón social"
            />
          </div>

          {/* Identificación + teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Identificación</label>
              <input
                type="text"
                value={form.identificacion}
                onChange={(e) => setField("identificacion", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="CC / NIT"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+57 300 000 0000"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setField("notas", e.target.value)}
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Información adicional..."
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.requiere_factura_electronica}
                onChange={(e) => setField("requiere_factura_electronica", e.target.checked)}
                className="accent-amber-500 h-4 w-4"
              />
              <span className="text-sm">Requiere factura electrónica</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setField("activo", e.target.checked)}
                className="accent-amber-500 h-4 w-4"
              />
              <span className="text-sm">Cliente activo</span>
            </label>
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
              {isEdit ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | undefined>(undefined)

  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`${BASE}/api/v1/cafe/clientes/`)
      setClientes(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadClientes() }, [loadClientes])

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.identificacion.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(undefined)
    setShowModal(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Directorio de compradores y clientes con factura electrónica.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={BTN_PRIMARY}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" /> Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o identificación..."
          className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
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
            <button onClick={loadClientes} className="text-xs underline text-muted-foreground">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {search ? "Sin resultados para esa búsqueda" : "No hay clientes registrados"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Identificación</th>
                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-center font-medium">Factura Electrónica</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
                <th className="px-4 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {c.identificacion || <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.telefono || <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.email || <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.requiere_factura_electronica ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(240,180,41,0.18)",
                          color: "#F0B429",
                          border: "1px solid rgba(240,180,41,0.35)",
                        }}
                      >
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.activo ? (
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
                      onClick={() => openEdit(c)}
                      title="Editar cliente"
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

      {/* Contador resultados */}
      {!loading && !error && search && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <ModalCliente
          initial={editing}
          onClose={closeModal}
          onSaved={loadClientes}
        />
      )}
    </div>
  )
}

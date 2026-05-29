"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, X, Coffee, Pencil } from "lucide-react"
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

interface Calidad {
  id: number
  nombre: string
  descripcion: string
  activo: boolean
}

interface CalidadForm {
  nombre: string
  descripcion: string
  activo: boolean
}

const EMPTY: CalidadForm = { nombre: "", descripcion: "", activo: true }

// ── Modal ──────────────────────────────────────────────────────────────────

function ModalCalidad({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Calidad
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<CalidadForm>(
    initial
      ? { nombre: initial.nombre, descripcion: initial.descripcion, activo: initial.activo }
      : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function setField<K extends keyof CalidadForm>(key: K, value: CalidadForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    setSaving(true)
    try {
      if (isEdit) {
        await apiFetch(`/api/v1/cafe/calidades/${initial!.id}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch(`/api/v1/cafe/calidades/`, {
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
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">
            {isEdit ? "Editar calidad" : "Nueva calidad"}
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
              placeholder="Ej: Pergamino Seco, Especialidad"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Características, proceso, perfil de taza..."
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
            <span className="text-sm">Calidad activa</span>
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
              {isEdit ? "Guardar cambios" : "Crear calidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CalidadesPage() {
  const [calidades, setCalidades] = useState<Calidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Calidad | undefined>(undefined)
  const [toggling, setToggling] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/api/v1/cafe/calidades/")
      setCalidades(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar calidades")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActivo(c: Calidad) {
    setToggling(c.id)
    try {
      await apiFetch(`/api/v1/cafe/calidades/${c.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !c.activo }),
      })
      await load()
    } catch {
      // silently ignore
    } finally {
      setToggling(null)
    }
  }

  function openCreate() {
    setEditing(undefined)
    setShowModal(true)
  }

  function openEdit(c: Calidad) {
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
          <h1 className="text-2xl font-bold tracking-tight">Calidades de Café</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Define los tipos de calidad utilizados en compras y procesos.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={BTN}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" /> Nueva calidad
        </button>
      </div>

      {/* Cards */}
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
      ) : calidades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-xl border border-border bg-card">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <Coffee className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No hay calidades registradas</p>
          <button
            onClick={openCreate}
            style={BTN}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Crear la primera
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {calidades.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card px-5 py-4 flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: c.activo
                        ? "rgba(240,180,41,0.15)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Coffee
                      className="h-4 w-4"
                      style={{ color: c.activo ? "#F0B429" : "rgba(255,240,210,0.3)" }}
                    />
                  </div>
                  <p className="text-sm font-semibold truncate">{c.nombre}</p>
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                  style={
                    c.activo
                      ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,240,210,0.4)" }
                  }
                >
                  {c.activo ? "Activa" : "Inactiva"}
                </span>
              </div>

              {/* Descripción */}
              {c.descripcion ? (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {c.descripcion}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground opacity-40 italic">Sin descripción</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={() => openEdit(c)}
                  title="Editar"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
                <button
                  onClick={() => toggleActivo(c)}
                  disabled={toggling === c.id}
                  title={c.activo ? "Desactivar" : "Activar"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {toggling === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : c.activo ? (
                    "Desactivar"
                  ) : (
                    "Activar"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalCalidad
          initial={editing}
          onClose={closeModal}
          onSaved={load}
        />
      )}
    </div>
  )
}

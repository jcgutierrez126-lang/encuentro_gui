"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, X, UserCircle2, Pencil } from "lucide-react"
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

interface Vendedor {
  id: number
  nombre: string
  activo: boolean
}

interface VendedorForm {
  nombre: string
  activo: boolean
}

const EMPTY: VendedorForm = { nombre: "", activo: true }

// ── Modal ──────────────────────────────────────────────────────────────────

function ModalVendedor({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Vendedor
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<VendedorForm>(
    initial ? { nombre: initial.nombre, activo: initial.activo } : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function setField<K extends keyof VendedorForm>(key: K, value: VendedorForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return }
    setSaving(true)
    try {
      if (isEdit) {
        await apiFetch(`/api/v1/cafe/vendedores/${initial!.id}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch(`/api/v1/cafe/vendedores/`, {
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
            {isEdit ? "Editar vendedor" : "Nuevo vendedor"}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
              placeholder="Nombre completo del vendedor"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setField("activo", e.target.checked)}
              className="accent-amber-500 h-4 w-4"
            />
            <span className="text-sm">Vendedor activo</span>
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
              {isEdit ? "Guardar cambios" : "Crear vendedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Vendedor | undefined>(undefined)
  const [toggling, setToggling] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/api/v1/cafe/vendedores/")
      setVendedores(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar vendedores")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActivo(v: Vendedor) {
    setToggling(v.id)
    try {
      await apiFetch(`/api/v1/cafe/vendedores/${v.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !v.activo }),
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

  function openEdit(v: Vendedor) {
    setEditing(v)
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
          <h1 className="text-2xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestiona los vendedores asociados a las ventas de café.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={BTN}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" /> Nuevo vendedor
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
      ) : vendedores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-xl border border-border bg-card">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <UserCircle2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No hay vendedores registrados</p>
          <button
            onClick={openCreate}
            style={BTN}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendedores.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    background: v.activo
                      ? "rgba(240,180,41,0.15)"
                      : "rgba(255,255,255,0.05)",
                    color: v.activo ? "#F0B429" : "rgba(255,240,210,0.35)",
                  }}
                >
                  {v.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{v.nombre}</p>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5"
                    style={
                      v.activo
                        ? { background: "rgba(16,185,129,0.12)", color: "#10b981" }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,240,210,0.4)" }
                    }
                  >
                    {v.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(v)}
                  title="Editar"
                  className="h-8 w-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleActivo(v)}
                  disabled={toggling === v.id}
                  title={v.activo ? "Desactivar" : "Activar"}
                  className="h-8 px-2.5 rounded-lg flex items-center justify-center border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {toggling === v.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : v.activo ? (
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
        <ModalVendedor
          initial={editing}
          onClose={closeModal}
          onSaved={load}
        />
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken, isAdmin, getUser } from "@/lib/auth"
import { Loader2, Plus, X, Pencil, Trash2, ShieldCheck, User } from "lucide-react"

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

const ROLES = ["administrador", "asesor"] as const
type Role = (typeof ROLES)[number]

interface OrdoUser {
  id: number
  username: string
  email: string
  role: Role
  is_superuser: boolean
  is_active: boolean
  date_joined?: string
}

interface UserForm {
  username: string
  email: string
  password: string
  role: Role
  is_active: boolean
}

const EMPTY_FORM: UserForm = {
  username: "", email: "", password: "", role: "asesor", is_active: true,
}

function ModalUsuario({
  initial,
  onClose,
  onSaved,
}: {
  initial?: OrdoUser
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<UserForm>(
    initial
      ? { username: initial.username, email: initial.email, password: "", role: initial.role, is_active: initial.is_active }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function setField<K extends keyof UserForm>(k: K, v: UserForm[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.username.trim()) { setError("El usuario es requerido"); return }
    if (!isEdit && !form.password) { setError("La contraseña es requerida"); return }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        is_active: form.is_active,
      }
      if (form.password) body.password = form.password
      if (isEdit) {
        await apiFetch(`/api/v1/users/${initial!.id}/user-patch/`, { method: "PATCH", body: JSON.stringify(body) })
      } else {
        await apiFetch("/api/v1/users/settings/create/", { method: "POST", body: JSON.stringify(body) })
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">{isEdit ? "Editar usuario" : "Nuevo usuario"}</h2>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Usuario *</label>
              <input type="text" value={form.username} onChange={e => setField("username", e.target.value)} required className={inp} placeholder="nombre_usuario" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rol</label>
              <select value={form.role} onChange={e => setField("role", e.target.value as Role)} className={inp}>
                <option value="administrador">Administrador</option>
                <option value="asesor">Asesor</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input type="email" value={form.email} onChange={e => setField("email", e.target.value)} className={inp} placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
            </label>
            <input type="password" value={form.password} onChange={e => setField("password", e.target.value)} className={inp} placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input type="checkbox" checked={form.is_active} onChange={e => setField("is_active", e.target.checked)} className="accent-amber-500 h-4 w-4" />
            <span className="text-sm">Usuario activo</span>
          </label>
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={saving} style={BTN} className="px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const me = getUser()
  const admin = isAdmin(me)

  const [users, setUsers] = useState<OrdoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<OrdoUser | undefined>()
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch("/api/v1/users/settings/list/")
      setUsers(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este usuario?")) return
    setDeleting(id)
    try {
      await apiFetch(`/api/v1/users/${id}/user-delete/`, { method: "DELETE" })
      await load()
    } catch {
      // silently ignore
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gestión de usuarios del sistema</p>
      </div>

      {/* Usuarios */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm">Usuarios</p>
          </div>
          {admin && (
            <button
              onClick={() => { setEditing(undefined); setShowModal(true) }}
              style={BTN}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo usuario
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <div className="px-5 py-4 text-sm text-destructive">{error}</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Sin usuarios registrados</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-[11px] text-muted-foreground uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left">Usuario</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5 text-center">Rol</th>
                <th className="px-4 py-2.5 text-center">Estado</th>
                {admin && <th className="px-4 py-2.5 w-16" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/15 text-sm">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      {u.is_superuser && <ShieldCheck className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email || "—"}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      u.role === "administrador"
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      u.is_active ? "bg-emerald-400/10 text-emerald-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {admin && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => { setEditing(u); setShowModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {!u.is_superuser && (
                          <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            {deleting === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ModalUsuario
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(undefined) }}
          onSaved={load}
        />
      )}
    </div>
  )
}

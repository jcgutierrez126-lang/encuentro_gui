"use client"

import { useEffect, useState } from "react"
import { api, OrdoUser, TipoBanano, TipoCafeVenta, TipoLabor, TipoCobro, VariedadLote, CiudadMaestro } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserPlus, Trash2, Pencil, Check, X, ShieldCheck, RefreshCw, Plus,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const PAGE_SIZE = 5

function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  return {
    page: safePage,
    setPage,
    pageItems,
    totalPages,
    goLast: () => setPage(Math.max(1, Math.ceil((items.length + 1) / PAGE_SIZE))),
  }
}

function Pager({ page, totalPages, total, onChange }: {
  page: number; totalPages: number; total: number; onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  return (
    <div className="flex items-center justify-between px-5 py-2 border-t border-border bg-muted/10">
      <span className="text-xs text-muted-foreground">{from}–{to} de {total}</span>
      <div className="flex items-center gap-0.5">
        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs px-1.5 tabular-nums">{page} / {totalPages}</span>
        <Button size="icon" variant="ghost" className="h-6 w-6" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

const ROLES = ["administrador", "asesor"] as const
type Role = (typeof ROLES)[number]

const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  asesor:        "Asesor",
}

const ROLE_COLORS: Record<Role, string> = {
  administrador: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  asesor:        "bg-blue-500/20   text-blue-300   border-blue-500/40",
}

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role as Role] ?? "bg-zinc-500/20 text-zinc-300 border-zinc-500/40"
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {ROLE_LABELS[role as Role] ?? role}
    </span>
  )
}

function RoleChips({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            value === r
              ? ROLE_COLORS[r] + " ring-2 ring-offset-1 ring-offset-card ring-current"
              : "border-border text-muted-foreground hover:border-muted-foreground/50"
          }`}
        >
          {ROLE_LABELS[r]}
        </button>
      ))}
    </div>
  )
}

interface EditState {
  id: number; password: string; email: string; role: Role; is_active: boolean
}

// ─── Tipo Maestro Section ────────────────────────────────────────────────────

interface TipoItem { id: number; nombre: string; abreviatura?: string | null }

interface TipoMaestroSectionProps {
  title: string
  items: TipoItem[]
  conAbreviatura?: boolean
  onAdd: (nombre: string, abreviatura?: string) => Promise<void>
  onUpdate: (id: number, nombre: string, abreviatura?: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

function TipoMaestroSection({ title, items, conAbreviatura, onAdd, onUpdate, onDelete }: TipoMaestroSectionProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newNombre, setNewNombre] = useState("")
  const [newAbrev, setNewAbrev] = useState("")
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editAbrev, setEditAbrev] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState<TipoItem | null>(null)
  const { page, setPage, pageItems, totalPages, goLast } = usePagination(items)

  const handleAdd = async () => {
    if (!newNombre.trim()) return
    setAdding(true)
    try {
      await onAdd(newNombre.trim(), conAbreviatura ? newAbrev.trim() || undefined : undefined)
      setNewNombre(""); setNewAbrev(""); setShowAdd(false)
      goLast()
    } finally { setAdding(false) }
  }

  const startEdit = (item: TipoItem) => {
    setEditId(item.id); setEditNombre(item.nombre); setEditAbrev(item.abreviatura ?? "")
  }
  const cancelEdit = () => { setEditId(null); setEditNombre(""); setEditAbrev("") }

  const handleSave = async () => {
    if (editId === null || !editNombre.trim()) return
    setSaving(true)
    try {
      await onUpdate(editId, editNombre.trim(), conAbreviatura ? editAbrev.trim() || undefined : undefined)
      cancelEdit()
    } finally { setSaving(false) }
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
        <h2 className="font-semibold text-sm">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{items.length} tipos</span>
          <Button
            size="sm" variant="ghost" className="h-7 px-2 gap-1.5 text-xs"
            onClick={() => { setShowAdd(true); setNewNombre(""); setNewAbrev("") }}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/10">
          {conAbreviatura && (
            <Input
              className="h-7 text-sm w-20"
              placeholder="Abrev."
              value={newAbrev}
              onChange={(e) => setNewAbrev(e.target.value)}
            />
          )}
          <Input
            className="h-7 text-sm flex-1 max-w-xs"
            placeholder="Nombre…"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setShowAdd(false) } }}
            autoFocus={!conAbreviatura}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={handleAdd} disabled={adding || !newNombre.trim()}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setShowAdd(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
          No hay tipos registrados.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {pageItems.map((item) => {
            const isEditing = editId === item.id
            return (
              <li key={item.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/10 transition-colors">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    {conAbreviatura && (
                      <Input
                        className="h-7 text-sm w-20"
                        placeholder="Abrev."
                        value={editAbrev}
                        onChange={(e) => setEditAbrev(e.target.value)}
                      />
                    )}
                    <Input
                      className="h-7 text-sm max-w-xs"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") cancelEdit() }}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={handleSave} disabled={saving || !editNombre.trim()}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {conAbreviatura && item.abreviatura && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.abreviatura}</span>
                      )}
                      <span className="text-sm">{item.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDel(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} total={items.length} onChange={setPage} />

      <ConfirmDialog
        open={confirmDel !== null}
        title="Eliminar tipo"
        message={confirmDel ? `¿Eliminar "${confirmDel.nombre}"? Si hay registros asociados no se podrá eliminar.` : ""}
        confirmLabel="Eliminar"
        onConfirm={async () => { if (confirmDel) { await onDelete(confirmDel.id); setConfirmDel(null) } }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [users, setUsers] = useState<OrdoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ username: "", password: "", email: "", role: "asesor" as Role })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; username: string } | null>(null)

  const [tiposBanano, setTiposBanano] = useState<TipoBanano[]>([])
  const [tiposCafe, setTiposCafe] = useState<TipoCafeVenta[]>([])
  const [tiposLabor, setTiposLabor] = useState<TipoLabor[]>([])
  const [tiposCobro, setTiposCobro] = useState<TipoCobro[]>([])
  const [variedadesLote, setVariedadesLote] = useState<VariedadLote[]>([])
  const [ciudades, setCiudades] = useState<CiudadMaestro[]>([])
  const usersPag = usePagination(users)

  const load = () => {
    setLoading(true)
    setError("")
    Promise.all([
      api.users.list(),
      api.produccion.tiposBanano.list(),
      api.produccion.tiposCafe.list(),
      api.nomina.tiposLabor.list(),
      api.nomina.tiposCobro.list(),
      api.produccion.variedadesLote.list(),
      api.finanzas.ciudades.list(),
    ])
      .then(([u, b, c, l, co, vl, ci]) => {
        setUsers(u); setTiposBanano(b); setTiposCafe(c); setTiposLabor(l); setTiposCobro(co)
        setVariedadesLote(vl); setCiudades(ci)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newForm.username || !newForm.password) { setCreateError("Usuario y contraseña son requeridos"); return }
    setCreating(true); setCreateError("")
    try {
      const user = await api.users.create(newForm)
      setUsers((prev) => [...prev, user])
      setShowNew(false)
      setNewForm({ username: "", password: "", email: "", role: "asesor" })
      usersPag.goLast()
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Error al crear usuario")
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.users.delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setConfirmDelete(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  const handleSave = async () => {
    if (!editState) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { email: editState.email, role: editState.role, is_active: editState.is_active }
      if (editState.password) payload.password = editState.password
      const updated = await api.users.update(editState.id, payload)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditState(null)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al guardar")
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de usuarios, accesos y maestros de la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={() => { setShowNew(true); setCreateError("") }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {/* New user form */}
      {showNew && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#ccff00]" />
            Crear usuario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Usuario <span className="text-destructive">*</span></Label>
              <Input
                placeholder="nombre.apellido"
                value={newForm.username}
                onChange={(e) => setNewForm((p) => ({ ...p, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newForm.password}
                onChange={(e) => setNewForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@empresa.com"
                value={newForm.email}
                onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <div className="pt-1">
                <RoleChips value={newForm.role} onChange={(r) => setNewForm((p) => ({ ...p, role: r }))} />
              </div>
            </div>
          </div>
          {createError && <p className="text-destructive text-sm">{createError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" onClick={() => { setShowNew(false); setCreateError("") }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creando…" : "Crear usuario"}
            </Button>
          </div>
        </div>
      )}

      {/* Users section */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
          <h2 className="font-semibold text-sm">Usuarios</h2>
          <span className="text-xs text-muted-foreground">{users.length} usuario{users.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Cargando…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Reintentar</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No hay usuarios registrados.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium">Rol</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Estado</th>
                <th className="text-right px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersPag.pageItems.map((u) => {
                const isEditing = editState?.id === u.id
                return (
                  <tr key={u.id} className={cn("transition-colors", isEditing ? "bg-muted/10" : "hover:bg-muted/10")}>
                    {/* Username */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          u.is_superuser ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40" : "bg-muted text-muted-foreground"
                        }`}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-medium">
                            {u.username}
                            {u.is_superuser && (
                              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                            )}
                          </div>
                          {u.is_superuser && (
                            <span className="text-[10px] text-purple-400/70">superuser</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      {isEditing ? (
                        <Input
                          className="h-7 text-xs w-52"
                          value={editState.email}
                          onChange={(e) => setEditState((p) => p && { ...p, email: e.target.value })}
                        />
                      ) : (
                        u.email || <span className="text-muted-foreground/40 italic text-xs">—</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      {isEditing ? (
                        <RoleChips value={editState.role} onChange={(r) => setEditState((p) => p && { ...p, role: r })} />
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => setEditState((p) => p && { ...p, is_active: !p.is_active })}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all cursor-pointer ${
                            editState.is_active
                              ? "bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30"
                              : "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                          }`}
                        >
                          {editState.is_active ? "Activo" : "Inactivo"}
                        </button>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                          u.is_active
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}>
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Input
                              className="h-7 text-xs w-36 mr-2"
                              type="password"
                              placeholder="Nueva contraseña"
                              value={editState.password}
                              onChange={(e) => setEditState((p) => p && { ...p, password: e.target.value })}
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={handleSave} disabled={saving}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditState(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditState({ id: u.id, password: "", email: u.email, role: u.role as Role, is_active: u.is_active })}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete({ id: u.id, username: u.username })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pager page={usersPag.page} totalPages={usersPag.totalPages} total={users.length} onChange={usersPag.setPage} />
      </div>

      {/* Tipos maestros — producción */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TipoMaestroSection
          title="Tipos de Banano"
          items={tiposBanano}
          onAdd={async (nombre) => {
            const nuevo = await api.produccion.tiposBanano.create({ nombre })
            setTiposBanano((prev) => [...prev, nuevo])
          }}
          onUpdate={async (id, nombre) => {
            const updated = await api.produccion.tiposBanano.update(id, { nombre })
            setTiposBanano((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }}
          onDelete={async (id) => {
            await api.produccion.tiposBanano.delete(id)
            setTiposBanano((prev) => prev.filter((t) => t.id !== id))
          }}
        />

        <TipoMaestroSection
          title="Tipos de Café"
          items={tiposCafe}
          onAdd={async (nombre) => {
            const nuevo = await api.produccion.tiposCafe.create({ nombre })
            setTiposCafe((prev) => [...prev, nuevo])
          }}
          onUpdate={async (id, nombre) => {
            const updated = await api.produccion.tiposCafe.update(id, { nombre })
            setTiposCafe((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }}
          onDelete={async (id) => {
            await api.produccion.tiposCafe.delete(id)
            setTiposCafe((prev) => prev.filter((t) => t.id !== id))
          }}
        />
      </div>

      {/* Tipos maestros — nómina */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TipoMaestroSection
          title="Tipos de Labor"
          items={tiposLabor}
          conAbreviatura
          onAdd={async (nombre, abreviatura) => {
            const nuevo = await api.nomina.tiposLabor.create({ nombre, abreviatura })
            setTiposLabor((prev) => [...prev, nuevo])
          }}
          onUpdate={async (id, nombre, abreviatura) => {
            const updated = await api.nomina.tiposLabor.update(id, { nombre, abreviatura })
            setTiposLabor((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }}
          onDelete={async (id) => {
            await api.nomina.tiposLabor.delete(id)
            setTiposLabor((prev) => prev.filter((t) => t.id !== id))
          }}
        />

        <TipoMaestroSection
          title="Tipos de Cobro"
          items={tiposCobro}
          conAbreviatura
          onAdd={async (nombre, abreviatura) => {
            const nuevo = await api.nomina.tiposCobro.create({ nombre, abreviatura })
            setTiposCobro((prev) => [...prev, nuevo])
          }}
          onUpdate={async (id, nombre, abreviatura) => {
            const updated = await api.nomina.tiposCobro.update(id, { nombre, abreviatura })
            setTiposCobro((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }}
          onDelete={async (id) => {
            await api.nomina.tiposCobro.delete(id)
            setTiposCobro((prev) => prev.filter((t) => t.id !== id))
          }}
        />
      </div>

      {/* Maestros — producción y finanzas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TipoMaestroSection
          title="Variedades de Lote"
          items={variedadesLote}
          onAdd={async (nombre) => {
            const nuevo = await api.produccion.variedadesLote.create({ nombre })
            setVariedadesLote((prev) => [...prev, nuevo])
          }}
          onUpdate={async (id, nombre) => {
            const updated = await api.produccion.variedadesLote.update(id, { nombre })
            setVariedadesLote((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }}
          onDelete={async (id) => {
            await api.produccion.variedadesLote.delete(id)
            setVariedadesLote((prev) => prev.filter((t) => t.id !== id))
          }}
        />

        <TipoMaestroSection
          title="Ciudades"
          items={ciudades}
          onAdd={async (nombre) => {
            const nuevo = await api.finanzas.ciudades.create({ nombre })
            setCiudades((prev) => [...prev, nuevo])
          }}
          onUpdate={async (id, nombre) => {
            const updated = await api.finanzas.ciudades.update(id, { nombre })
            setCiudades((prev) => prev.map((t) => (t.id === id ? updated : t)))
          }}
          onDelete={async (id) => {
            await api.finanzas.ciudades.delete(id)
            setCiudades((prev) => prev.filter((t) => t.id !== id))
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Eliminar usuario"
        message={confirmDelete ? `¿Seguro que quieres eliminar al usuario "${confirmDelete.username}"? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

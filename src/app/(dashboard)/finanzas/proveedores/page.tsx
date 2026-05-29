"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Search, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { api, type Proveedor } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

// ── Form ──────────────────────────────────────────────────────────────────────
interface FormData {
  nombre: string
  cedula_nit: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
}

const EMPTY: FormData = {
  nombre:     "",
  cedula_nit: "",
  telefono:   "",
  email:      "",
  direccion:  "",
  activo:     true,
}

function proveedorToForm(p: Proveedor): FormData {
  return {
    nombre:     p.nombre,
    cedula_nit: p.cedula_nit ?? "",
    telefono:   p.telefono ?? "",
    email:      p.email ?? "",
    direccion:  p.direccion ?? "",
    activo:     p.activo !== false,
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function ModalProveedor({
  proveedor,
  onGuardado,
  onCerrar,
  onEliminar,
}: {
  proveedor: Proveedor | null
  onGuardado: () => void
  onCerrar: () => void
  onEliminar?: () => void
}) {
  const esEdicion = proveedor !== null
  const [form, setForm] = useState<FormData>(proveedor ? proveedorToForm(proveedor) : EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const payload: Partial<Proveedor> = {
        nombre:     form.nombre.trim(),
        cedula_nit: form.cedula_nit || null,
        telefono:   form.telefono || null,
        email:      form.email || null,
        direccion:  form.direccion || null,
      }
      if (esEdicion && proveedor) {
        await api.finanzas.proveedores.update(proveedor.id, payload)
      } else {
        await api.finanzas.proveedores.create(payload)
      }
      onGuardado()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!proveedor) return
    setEliminando(true)
    try {
      await api.finanzas.proveedores.delete(proveedor.id)
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
            {esEdicion ? "Editar proveedor" : "Nuevo proveedor"}
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

          <div className={field}>
            <label className={lbl}>Nombre *</label>
            <input value={form.nombre} onChange={set("nombre")}
              placeholder="Nombre o razón social" className={inp} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Cédula / NIT</label>
              <input value={form.cedula_nit} onChange={set("cedula_nit")}
                placeholder="123456789" className={inp} />
            </div>
            <div className={field}>
              <label className={lbl}>Teléfono</label>
              <input value={form.telefono} onChange={set("telefono")}
                placeholder="300…" className={inp} />
            </div>
          </div>

          <div className={field}>
            <label className={lbl}>Email</label>
            <input type="email" value={form.email} onChange={set("email")}
              placeholder="proveedor@ejemplo.com" className={inp} />
          </div>

          <div className={field}>
            <label className={lbl}>Dirección</label>
            <input value={form.direccion} onChange={set("direccion")}
              placeholder="Calle 1 # 2-3, Ciudad" className={inp} />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="activo-check"
              checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-[#F0B429]"
            />
            <label htmlFor="activo-check" className={`${lbl} cursor-pointer`}>
              Proveedor activo
            </label>
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
export default function ProveedoresPage() {
  const [proveedores, setProveedores]   = useState<Proveedor[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [proveedorEditar, setProveedorEditar] = useState<Proveedor | null>(null)
  const [pagina, setPagina]             = useState(1)
  const [total, setTotal]               = useState(0)
  const [query, setQuery]               = useState("")
  const PAGE_SIZE = 50

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    api.finanzas.proveedores.list(params)
      .then(r => { setProveedores(r.results); setTotal(r.count) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function abrirNuevo() { setProveedorEditar(null); setModalAbierto(true) }
  function abrirEditar(p: Proveedor) { setProveedorEditar(p); setModalAbierto(true) }
  function cerrarModal() { setModalAbierto(false); setProveedorEditar(null) }

  const filtrados = proveedores.filter(p => {
    const q = query.toLowerCase()
    return !q
      || p.nombre.toLowerCase().includes(q)
      || (p.cedula_nit ?? "").toLowerCase().includes(q)
      || (p.email ?? "").toLowerCase().includes(q)
      || (p.telefono ?? "").toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5" style={{ color: "rgba(255,240,210,0.88)" }}>
      {modalAbierto && (
        <ModalProveedor
          proveedor={proveedorEditar}
          onGuardado={() => { cerrarModal(); cargar(1) }}
          onCerrar={cerrarModal}
          onEliminar={() => { cerrarModal(); cargar(1) }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Directorio de proveedores y contactos del negocio.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          style={{ background: "linear-gradient(135deg, #F0B429 0%, #C88A1A 100%)", color: "#3D1F00" }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIT o email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-lg pl-8 pr-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-[#F0B429]"
          />
        </div>
        <p className="text-xs text-muted-foreground shrink-0">{total} proveedores</p>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">NIT / CC</th>
                <th className="px-3 py-2.5 text-left">Teléfono</th>
                <th className="px-3 py-2.5 text-left">Email</th>
                <th className="px-3 py-2.5 text-left">Dirección</th>
                <th className="px-3 py-2.5 text-center">Activo</th>
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
                    Sin proveedores registrados.
                  </td>
                </tr>
              ) : filtrados.map(p => (
                <tr key={p.id} className="hover:bg-muted/15 text-sm">
                  <td className="px-3 py-2.5 font-medium">{p.nombre}</td>
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums font-mono text-xs">
                    {p.cedula_nit || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                    {p.telefono || p.celular || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[180px] truncate">
                    {p.email || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">
                    {p.direccion || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.activo !== false ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => abrirEditar(p)}
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

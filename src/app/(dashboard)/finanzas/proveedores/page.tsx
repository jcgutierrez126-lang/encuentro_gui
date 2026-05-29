"use client"

import { useEffect, useState } from "react"
import { Plus, Loader2, X, Search } from "lucide-react"
import { api, type Proveedor, type CiudadMaestro } from "@/lib/api"
import { Paginacion } from "@/components/ui/paginacion"

interface FormData {
  nombre: string
  cedula_nit: string
  ciudad: string
  telefono: string
  celular: string
  email: string
}

const EMPTY: FormData = {
  nombre: "",
  cedula_nit: "",
  ciudad: "",
  telefono: "",
  celular: "",
  email: "",
}

function FormProveedor({
  ciudades,
  onGuardado,
  onCerrar,
}: {
  ciudades: CiudadMaestro[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.nombre) {
      setError("El nombre es obligatorio.")
      return
    }
    setGuardando(true)
    setError(null)
    try {
      await api.finanzas.proveedores.create({
        nombre: form.nombre,
        cedula_nit: form.cedula_nit || undefined,
        ciudad: form.ciudad ? Number(form.ciudad) : null,
        telefono: form.telefono || undefined,
        celular: form.celular || undefined,
        email: form.email || undefined,
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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Nuevo proveedor</h2>
          <button onClick={onCerrar}><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={guardar} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          <div className={field}>
            <label className={label}>Nombre *</label>
            <input value={form.nombre} onChange={set("nombre")} placeholder="Nombre o razón social" className={input} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Cédula / NIT</label>
              <input value={form.cedula_nit} onChange={set("cedula_nit")} placeholder="123456789" className={input} />
            </div>
            <div className={field}>
              <label className={label}>Ciudad</label>
              <select value={form.ciudad} onChange={set("ciudad")} className={input}>
                <option value="">— Sin ciudad —</option>
                {ciudades.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={label}>Teléfono</label>
              <input value={form.telefono} onChange={set("telefono")} placeholder="604…" className={input} />
            </div>
            <div className={field}>
              <label className={label}>Celular</label>
              <input value={form.celular} onChange={set("celular")} placeholder="300…" className={input} />
            </div>
          </div>

          <div className={field}>
            <label className={label}>Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="proveedor@ejemplo.com" className={input} />
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

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [ciudades, setCiudades] = useState<CiudadMaestro[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState("")
  const PAGE_SIZE = 50

  const cargar = (pg = pagina) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    api.finanzas.proveedores.list(params)
      .then(r => { setProveedores(r.results); setTotal(r.count) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.finanzas.ciudades.list().then(setCiudades)
    cargar(1)
  }, [])

  return (
    <div className="space-y-5">
      {mostrarForm && (
        <FormProveedor
          ciudades={ciudades}
          onGuardado={() => { cargar(); setMostrarForm(false) }}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Directorio de proveedores y contactos</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, NIT o ciudad…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground shrink-0">{total} proveedores</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Cédula / NIT</th>
                <th className="px-3 py-2.5 text-left">Ciudad</th>
                <th className="px-3 py-2.5 text-left">Teléfono</th>
                <th className="px-3 py-2.5 text-left">Celular</th>
                <th className="px-3 py-2.5 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : proveedores.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  Sin proveedores registrados.
                </td></tr>
              ) : proveedores.filter(p => {
                  const q = query.toLowerCase()
                  return !q || p.nombre.toLowerCase().includes(q) || (p.cedula_nit ?? "").toLowerCase().includes(q) || (p.ciudad_nombre ?? "").toLowerCase().includes(q)
                }).map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30 text-sm">
                  <td className="px-3 py-2 font-medium">{p.nombre}</td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{p.cedula_nit || "—"}</td>
                  <td className="px-3 py-2">{p.ciudad_nombre || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{p.telefono || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">{p.celular || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.email || "—"}</td>
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

"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react"
import { api, type TipoCobro } from "@/lib/api"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface EditState { id: number; nombre: string; abreviatura: string }

export default function TiposCobroPage() {
  const [tipos, setTipos] = useState<TipoCobro[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevo, setNuevo] = useState({ nombre: "", abreviatura: "" })
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState<EditState | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const cargar = () => {
    setLoading(true)
    api.nomina.tiposCobro.list().then(setTipos).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const crear = async () => {
    if (!nuevo.nombre.trim()) return
    setGuardando(true)
    await api.nomina.tiposCobro.create({
      nombre: nuevo.nombre.trim(),
      abreviatura: nuevo.abreviatura.trim() || undefined,
    })
    setNuevo({ nombre: "", abreviatura: "" })
    setGuardando(false)
    cargar()
  }

  const guardarEdicion = async () => {
    if (!editando) return
    setGuardando(true)
    await api.nomina.tiposCobro.update(editando.id, {
      nombre: editando.nombre,
      abreviatura: editando.abreviatura || undefined,
    })
    setEditando(null)
    setGuardando(false)
    cargar()
  }

  const toggleActivo = async (t: TipoCobro) => {
    await api.nomina.tiposCobro.update(t.id, { activo: !t.activo })
    cargar()
  }

  const eliminar = async (id: number) => {
    await api.nomina.tiposCobro.delete(id)
    setConfirmId(null)
    cargar()
  }

  const inp = "text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
  const inpSm = "text-sm border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full"

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tipos de Cobro</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Maestro de modalidades de pago para el control semanal</p>
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={nuevo.abreviatura}
          onChange={e => setNuevo(f => ({ ...f, abreviatura: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && crear()}
          placeholder="Abrev."
          className={`${inp} w-24`}
        />
        <input
          value={nuevo.nombre}
          onChange={e => setNuevo(f => ({ ...f, nombre: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && crear()}
          placeholder="Nuevo tipo de cobro…"
          className={`${inp} flex-1`}
        />
        <button
          onClick={crear}
          disabled={guardando || !nuevo.nombre.trim()}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50 whitespace-nowrap"
        >
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left w-28">Abreviatura</th>
                <th className="px-4 py-2.5 text-left">Nombre</th>
                <th className="px-4 py-2.5 text-center w-20">Activo</th>
                <th className="px-4 py-2.5 text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 text-sm">
                  <td className="px-4 py-2.5">
                    {editando?.id === t.id ? (
                      <input
                        value={editando.abreviatura}
                        onChange={e => setEditando({ ...editando, abreviatura: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && guardarEdicion()}
                        className={`${inpSm} w-20`}
                        placeholder="Abrev."
                      />
                    ) : (
                      <span className="font-mono font-semibold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                        {t.abreviatura || <span className="text-muted-foreground font-normal">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {editando?.id === t.id ? (
                      <input
                        value={editando.nombre}
                        onChange={e => setEditando({ ...editando, nombre: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && guardarEdicion()}
                        className={inpSm}
                        autoFocus
                      />
                    ) : (
                      <span className={t.activo ? "" : "line-through text-muted-foreground"}>{t.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleActivo(t)}
                      className={`w-8 h-4 rounded-full transition-colors ${t.activo ? "bg-green-500" : "bg-muted-foreground/30"} relative`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${t.activo ? "left-4.5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {editando?.id === t.id ? (
                      <div className="flex justify-end gap-1">
                        <button onClick={guardarEdicion} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditando(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditando({ id: t.id, nombre: t.nombre, abreviatura: t.abreviatura ?? "" })}
                          className="p-1 text-muted-foreground hover:bg-muted rounded">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmId(t.id)}
                          className="p-1 text-destructive/70 hover:bg-destructive/10 rounded">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {tipos.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-sm text-muted-foreground">Sin tipos de cobro</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Eliminar tipo de cobro"
        message="¿Seguro que quieres eliminar este tipo de cobro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => confirmId !== null && eliminar(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}

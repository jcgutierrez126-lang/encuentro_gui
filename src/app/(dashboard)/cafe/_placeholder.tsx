// Componente auxiliar para páginas en construcción
import { LucideIcon } from "lucide-react"

export function PlaceholderPage({
  titulo,
  descripcion,
  Icon,
}: {
  titulo: string
  descripcion: string
  Icon: LucideIcon
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{descripcion}</p>
      </div>
      <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Módulo en construcción</p>
      </div>
    </div>
  )
}

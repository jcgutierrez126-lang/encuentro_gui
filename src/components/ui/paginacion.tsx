interface PaginacionProps {
  pagina: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

export function Paginacion({ pagina, total, pageSize, onChange }: PaginacionProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const btn =
    "px-2.5 py-1 rounded border border-border text-xs hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
      <span>
        {total.toLocaleString("es-CO")} registros · Página{" "}
        <span className="font-semibold text-foreground">{pagina}</span> de {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button className={btn} disabled={pagina === 1} onClick={() => onChange(1)}>«</button>
        <button className={btn} disabled={pagina === 1} onClick={() => onChange(pagina - 1)}>
          Anterior
        </button>
        <button className={btn} disabled={pagina === totalPages} onClick={() => onChange(pagina + 1)}>
          Siguiente
        </button>
        <button className={btn} disabled={pagina === totalPages} onClick={() => onChange(totalPages)}>»</button>
      </div>
    </div>
  )
}

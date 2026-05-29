"use client"

import { useEffect, useState } from "react"
import { Loader2, ShoppingBag, Package, TrendingDown, AlertCircle } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

function cop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(n))
}

function kg(n: string | number | null | undefined) {
  if (n == null) return "—"
  return `${Number(n).toLocaleString("es-CO", { maximumFractionDigits: 2 })} kg`
}

async function apiFetch(path: string) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

interface StockItem {
  calidad_nombre: string
  tipo_cafe: string
  stock_actual: string
}

interface VentaResumen {
  total_ventas: number
  pendientes_pago: number
  total_cop: string
}

interface Venta {
  id: number
  fecha: string
  total: string
  pagado: boolean
  cliente_nombre: string | null
}

function CopTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1" style={{ color: "rgba(255,240,210,0.7)" }}>{label}</p>
      <p style={{ color: "#F0B429" }}>{cop(payload[0].value)}</p>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent ? "rgba(240,180,41,0.12)" : "rgba(255,240,210,0.05)",
          border: `1px solid ${accent ? "rgba(240,180,41,0.22)" : "rgba(255,240,210,0.08)"}`,
        }}>
        <Icon className="h-5 w-5" style={{ color: accent ? "#F0B429" : "rgba(255,240,210,0.45)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-black tabular-nums leading-none" style={{ color: accent ? "#F0B429" : "rgba(255,240,210,0.92)" }}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// Agrupa ventas por mes
function agruparPorMes(ventas: Venta[]) {
  const meses: Record<string, number> = {}
  for (const v of ventas) {
    if (!v.fecha) continue
    const [y, m] = v.fecha.split("-")
    const key = `${y}-${m}`
    meses[key] = (meses[key] ?? 0) + Number(v.total ?? 0)
  }
  return Object.entries(meses)
    .sort()
    .slice(-6)
    .map(([k, total]) => {
      const [, m] = k.split("-")
      const label = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][Number(m) - 1]
      return { mes: label, total }
    })
}

export default function ResumenPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<VentaResumen | null>(null)
  const [stock, setStock] = useState<StockItem[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/cafe/ventas/resumen/"),
      apiFetch("/api/v1/cafe/inventario/stock/"),
      apiFetch("/api/v1/cafe/ventas/?page_size=200"),
      apiFetch("/api/v1/cafe/ventas/?page_size=5"),
    ])
      .then(([r, s, v, u]) => {
        setResumen(r)
        setStock(s)
        setVentas(v.results ?? v)
        setUltimasVentas(u.results ?? u)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 mt-4">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm text-destructive">Error al cargar datos: {error}</p>
    </div>
  )

  const ventasPorMes = agruparPorMes(ventas)
  const stockGrano  = stock.filter(s => s.tipo_cafe === "grano")
  const stockMolido = stock.filter(s => s.tipo_cafe === "molido")
  const totalStockKg = stock.reduce((s, i) => s + Number(i.stock_actual), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-muted-foreground text-sm mt-0.5">El Encuentro · Panel de gestión</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Total en ventas"
          value={cop(resumen?.total_cop)}
          sub={`${resumen?.total_ventas ?? 0} ventas registradas`}
          icon={ShoppingBag}
          accent
        />
        <KpiCard
          label="Pendientes de pago"
          value={String(resumen?.pendientes_pago ?? 0)}
          sub="ventas sin cobrar"
          icon={AlertCircle}
        />
        <KpiCard
          label="Stock total"
          value={kg(totalStockKg)}
          sub="grano + molido en inventario"
          icon={Package}
        />
      </div>

      {/* Gráfica ventas por mes */}
      {ventasPorMes.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Ventas por mes (últimos 6 meses)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ventasPorMes} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "rgba(255,240,210,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,240,210,0.3)" }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} width={40} />
              <Tooltip content={<CopTooltip />} cursor={{ fill: "rgba(240,180,41,0.06)" }} />
              <Bar dataKey="total" fill="#F0B429" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stock + Últimas ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Stock por calidad */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Inventario actual
          </p>
          {stock.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin movimientos aún</p>
          ) : (
            <div className="space-y-3">
              {stock.filter(s => Number(s.stock_actual) > 0).map(s => {
                const max = Math.max(...stock.map(x => Number(x.stock_actual)), 1)
                const pct = Math.max(2, Math.round(Number(s.stock_actual) / max * 100))
                return (
                  <div key={`${s.calidad_nombre}-${s.tipo_cafe}`} className="flex items-center gap-3 text-xs">
                    <span className="w-28 text-right text-muted-foreground truncate"
                      style={{ fontSize: "11px" }}>
                      {s.calidad_nombre} · {s.tipo_cafe}
                    </span>
                    <div className="flex-1 rounded-full h-2.5 overflow-hidden bg-muted">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: s.tipo_cafe === "grano"
                            ? "linear-gradient(90deg, #F0B429, #C88A1A)"
                            : "linear-gradient(90deg, rgba(240,180,41,0.5), rgba(200,138,26,0.5))",
                        }} />
                    </div>
                    <span className="w-20 tabular-nums text-right" style={{ color: "rgba(255,240,210,0.6)", fontSize: "11px" }}>
                      {kg(s.stock_actual)}
                    </span>
                  </div>
                )
              })}
              {stock.every(s => Number(s.stock_actual) <= 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Sin stock disponible</p>
              )}
            </div>
          )}
        </div>

        {/* Últimas ventas */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Últimas ventas
          </p>
          {ultimasVentas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin ventas registradas</p>
          ) : (
            <div className="divide-y divide-border">
              {ultimasVentas.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "rgba(255,240,210,0.85)" }}>
                      {v.cliente_nombre ?? "Cliente directo"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{v.fecha}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums" style={{ color: "#F0B429" }}>
                      {cop(v.total)}
                    </p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      v.pagado
                        ? "text-emerald-400 bg-emerald-400/10"
                        : "text-amber-400 bg-amber-400/10"
                    }`}>
                      {v.pagado ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Línea de tendencia ventas */}
      {ventasPorMes.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Tendencia de ingresos
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={ventasPorMes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,240,210,0.05)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "rgba(255,240,210,0.4)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CopTooltip />} cursor={{ stroke: "rgba(240,180,41,0.2)" }} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#F0B429"
                strokeWidth={2}
                dot={{ fill: "#F0B429", r: 3 }}
                activeDot={{ r: 5, fill: "#F0B429" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

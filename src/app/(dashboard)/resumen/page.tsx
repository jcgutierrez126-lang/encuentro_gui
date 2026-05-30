"use client"

import { useEffect, useState } from "react"
import {
  Loader2, ShoppingBag, Package, AlertCircle,
  TrendingUp, TrendingDown, Scale,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts"
import { getToken } from "@/lib/auth"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")

// ─── Helpers ───────────────────────────────────────────────────────────────

function cop(n: string | number | null | undefined) {
  if (n == null || n === "") return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(Number(n))
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

// ─── Types ────────────────────────────────────────────────────────────────

interface VentaResumen {
  total_ventas: number
  pendientes_pago: number
  total_cop: string
}

interface StockItem {
  calidad_nombre: string
  tipo_cafe: string
  stock_actual: string
}

interface Venta {
  id: number
  fecha: string
  total: string
  pagado: boolean
  cliente_nombre?: string | null
}

interface Compra {
  valor_total: string | number
}

interface LoteProceso {
  total_costo: string | number
}

interface Egreso {
  valor: string | number
}

// ─── Chart tooltip ────────────────────────────────────────────────────────

function CopTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1" style={{ color: "rgba(255,240,210,0.7)" }}>{label}</p>
      <p style={{ color: "#F0B429" }}>{cop(payload[0].value)}</p>
    </div>
  )
}

// ─── KpiCard ──────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: accent ? "rgba(240,180,41,0.12)" : "rgba(255,240,210,0.05)",
          border: `1px solid ${accent ? "rgba(240,180,41,0.22)" : "rgba(255,240,210,0.08)"}`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color: accent ? "#F0B429" : "rgba(255,240,210,0.45)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p
          className="text-xl font-black tabular-nums leading-none"
          style={{ color: accent ? "#F0B429" : "rgba(255,240,210,0.92)" }}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Análisis Financiero ──────────────────────────────────────────────────

function AnalisisFinanciero({
  totalVentas, totalCostos, roi, pe,
}: { totalVentas: number; totalCostos: number; roi: number; pe: number }) {
  const ganando   = totalVentas >= totalCostos
  const resultNeto = totalVentas - totalCostos
  const pct = totalCostos > 0 ? Math.min((totalVentas / totalCostos) * 100, 200) : 0
  const pctDisplay = totalCostos > 0 ? ((totalVentas / totalCostos) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Análisis Financiero
      </p>

      {/* Resultado neto */}
      <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
        style={{
          background: ganando ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${ganando ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: ganando ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)",
              border: `1px solid ${ganando ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}>
            {ganando
              ? <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
              : <TrendingDown className="h-4.5 w-4.5 text-red-400" />}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado Neto</p>
            <p className="text-2xl font-black tabular-nums leading-none"
              style={{ color: ganando ? "rgb(52,211,153)" : "rgb(248,113,113)" }}>
              {cop(resultNeto)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {ganando ? "El Encuentro está generando utilidad" : "Los costos superan los ingresos"}
            </p>
          </div>
        </div>
        <span className="text-sm font-black px-4 py-2 rounded-xl shrink-0"
          style={{
            background: ganando ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
            color: ganando ? "rgb(52,211,153)" : "rgb(248,113,113)",
          }}>
          {ganando ? "GANANDO" : "PERDIENDO"}
        </span>
      </div>

      {/* KPIs fila */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ingresos Totales", value: cop(totalVentas), sub: "Total ventas", color: "#F0B429" },
          { label: "Costos Totales",   value: cop(totalCostos), sub: "Total egresos registrados", color: "rgba(248,113,113,0.9)" },
          { label: "% ROI",            value: `${roi > 0 ? "+" : ""}${roi.toFixed(1)}%`, sub: "Retorno sobre costos", color: roi >= 0 ? "rgb(52,211,153)" : "rgb(248,113,113)" },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
            <p className="text-lg font-black tabular-nums leading-none" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Punto de equilibrio con barra */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Punto de Equilibrio</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Ingresos actuales: <span className="font-semibold" style={{ color: "rgba(255,240,210,0.8)" }}>{cop(totalVentas)}</span></span>
          <span>Meta: <span className="font-semibold" style={{ color: "rgba(255,240,210,0.8)" }}>{cop(pe > 0 ? pe : totalCostos)}</span></span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-muted mb-2">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: ganando
                ? "linear-gradient(90deg, rgba(52,211,153,0.7), rgb(52,211,153))"
                : "linear-gradient(90deg, rgba(240,180,41,0.6), #F0B429)",
            }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">$0 ── {pctDisplay}% cubierto</span>
          <span className="text-sm font-bold"
            style={{ color: ganando ? "rgb(52,211,153)" : "rgba(255,240,210,0.6)" }}>
            {ganando ? `EXCEDE POR ${cop(resultNeto)}` : `Faltan ${cop(totalCostos - totalVentas)}`}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Ventas por mes ───────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────

export default function ResumenPage() {
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [resumen, setResumen]   = useState<VentaResumen | null>(null)
  const [stock, setStock]       = useState<StockItem[]>([])
  const [ventas, setVentas]     = useState<Venta[]>([])
  const [ultimas, setUltimas]   = useState<Venta[]>([])
  const [compras, setCompras]   = useState<Compra[]>([])
  const [lotes, setLotes]       = useState<LoteProceso[]>([])
  const [egresos, setEgresos]   = useState<Egreso[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch("/api/v1/cafe/ventas/resumen/"),
      apiFetch("/api/v1/cafe/inventario/stock/"),
      apiFetch("/api/v1/cafe/ventas/?page_size=200"),
      apiFetch("/api/v1/cafe/compras-materia/?page_size=200"),
      apiFetch("/api/v1/cafe/lotes-proceso/?page_size=200"),
      apiFetch("/api/v1/finanzas/egresos/?page_size=200"),
    ])
      .then(([r, s, v, c, l, e]) => {
        setResumen(r)
        setStock(Array.isArray(s) ? s : (s.results ?? []))
        const ventasList: Venta[] = Array.isArray(v) ? v : (v.results ?? [])
        setVentas(ventasList)
        // últimas 5 ventas ordenadas desc por fecha
        const sorted = [...ventasList].sort((a, b) => b.fecha.localeCompare(a.fecha))
        setUltimas(sorted.slice(0, 5))
        setCompras(Array.isArray(c) ? c : (c.results ?? []))
        setLotes(Array.isArray(l) ? l : (l.results ?? []))
        setEgresos(Array.isArray(e) ? e : (e.results ?? []))
      })
      .catch(e => setError(e instanceof Error ? e.message : "Error"))
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

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const totalVentas   = Number(resumen?.total_cop ?? 0)
  const totalStockKg  = stock.reduce((s, i) => s + Number(i.stock_actual ?? 0), 0)

  const sumaCompras   = compras.reduce((acc, c) => acc + Number(c.valor_total ?? 0), 0)
  const sumaLotes     = lotes.reduce((acc, l) => acc + Number(l.total_costo ?? 0), 0)
  const sumaEgresos   = egresos.reduce((acc, e) => acc + Number(e.valor ?? 0), 0)
  const totalCostos   = sumaCompras + sumaLotes + sumaEgresos

  // ROI = ((ventas - costos) / costos) * 100
  const roi = totalCostos > 0
    ? ((totalVentas - totalCostos) / totalCostos) * 100
    : 0

  // PE = total_costos / (1 - (total_costos / total_ventas))
  const pe = totalVentas > 0 && totalCostos < totalVentas
    ? totalCostos / (1 - totalCostos / totalVentas)
    : totalCostos > 0 ? totalCostos * 2 : 0

  const ventasPorMes = agruparPorMes(ventas)
  const stockConValor = stock.filter(s => Number(s.stock_actual) > 0)
  const maxStock = Math.max(...stockConValor.map(s => Number(s.stock_actual)), 1)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "rgba(255,240,210,0.92)" }}>
          Resumen
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">El Encuentro · Panel de gestión</p>
      </div>

      {/* KPIs fila 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Total Ventas"
          value={cop(totalVentas)}
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

      {/* Análisis financiero completo */}
      <AnalisisFinanciero
        totalVentas={totalVentas}
        totalCostos={totalCostos}
        roi={roi}
        pe={pe}
      />

      {/* Costos desglosados */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Estructura de costos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Compras materia prima", value: sumaCompras },
            { label: "Costos de proceso", value: sumaLotes },
            { label: "Egresos / Gastos", value: sumaEgresos },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: "rgba(255,240,210,0.02)", border: "1px solid rgba(255,240,210,0.06)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-black tabular-nums" style={{ color: "rgba(255,240,210,0.82)" }}>
                {cop(value)}
              </p>
            </div>
          ))}
        </div>
        <div
          className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "rgba(240,180,41,0.06)", border: "1px solid rgba(240,180,41,0.14)" }}
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total costos</span>
          <span className="text-lg font-black tabular-nums" style={{ color: "#F0B429" }}>
            {cop(totalCostos)}
          </span>
        </div>
      </div>

      {/* Gráfica ventas por mes */}
      {ventasPorMes.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Ventas por mes (últimos 6 meses)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ventasPorMes} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "rgba(255,240,210,0.4)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,240,210,0.3)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`}
                width={40}
              />
              <Tooltip content={<CopTooltip />} cursor={{ fill: "rgba(240,180,41,0.06)" }} />
              <Bar dataKey="total" fill="#F0B429" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stock + Últimas ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Inventario */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Inventario actual
          </p>
          {stockConValor.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin stock disponible</p>
          ) : (
            <div className="space-y-3">
              {stockConValor.map(s => {
                const pct = Math.max(2, Math.round(Number(s.stock_actual) / maxStock * 100))
                return (
                  <div key={`${s.calidad_nombre}-${s.tipo_cafe}`} className="flex items-center gap-3 text-xs">
                    <span
                      className="w-28 text-right text-muted-foreground truncate"
                      style={{ fontSize: "11px" }}
                    >
                      {s.calidad_nombre} · {s.tipo_cafe}
                    </span>
                    <div className="flex-1 rounded-full h-2.5 overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: s.tipo_cafe === "grano"
                            ? "linear-gradient(90deg, #F0B429, #C88A1A)"
                            : "linear-gradient(90deg, rgba(240,180,41,0.5), rgba(200,138,26,0.5))",
                        }}
                      />
                    </div>
                    <span
                      className="w-20 tabular-nums text-right"
                      style={{ color: "rgba(255,240,210,0.6)", fontSize: "11px" }}
                    >
                      {kg(s.stock_actual)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas 5 ventas */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Últimas ventas
          </p>
          {ultimas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin ventas registradas</p>
          ) : (
            <div className="divide-y divide-border">
              {ultimas.map(v => (
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
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        v.pagado
                          ? "text-emerald-400 bg-emerald-400/10"
                          : "text-amber-400 bg-amber-400/10"
                      }`}
                    >
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
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "rgba(255,240,210,0.4)" }}
                axisLine={false}
                tickLine={false}
              />
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

"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Loader2,
  TrendingDown,
  TrendingUp,
  Coffee,
  Banana,
  Users,
  Landmark,
  ArrowRight,
  ClipboardList,
  Target,
  Percent,
  Scale,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts"
import { api, type ResumenData, type GraficasData } from "@/lib/api"

function cop(n: string | number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

function num(n: string | number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Number(n))
}

type Color = "red" | "green" | "amber" | "yellow" | "blue" | "zinc"

const COLOR_CLASSES: Record<Color, string> = {
  red:    "text-red-500 bg-red-500/10",
  green:  "text-emerald-500 bg-emerald-500/10",
  amber:  "text-amber-500 bg-amber-500/10",
  yellow: "text-yellow-500 bg-yellow-500/10",
  blue:   "text-blue-500 bg-blue-500/10",
  zinc:   "text-zinc-400 bg-zinc-500/10",
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  href?: string
  color: Color
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-card p-5 hover:bg-accent/50 transition-colors h-full">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 rounded-lg p-2 ${COLOR_CLASSES[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums mt-0.5 truncate">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        </div>
        {href && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-1" />}
      </div>
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>
}

const TH = "px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
const TD = "px-3 py-2 text-sm tabular-nums"

const ANIOS = ["2022", "2023", "2024", "2025"]
const CHART_COLORS = ["#e4e4e7", "#71717a", "#a1a1aa", "#52525b"]

function CopTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function ResumenPage() {
  const [data, setData] = useState<ResumenData | null>(null)
  const [graficas, setGraficas] = useState<GraficasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingG, setLoadingG] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anio, setAnio] = useState(String(new Date().getFullYear()))

  useEffect(() => {
    api.finanzas.resumen()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoadingG(true)
    api.finanzas.graficas(anio)
      .then(setGraficas)
      .finally(() => setLoadingG(false))
  }, [anio])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        {error ?? "Sin datos"}
      </div>
    )
  }

  const kpis = data.kpis

  return (
    <div className="space-y-7">
      {/* Hero image header */}
      <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden">
        <Image
          src="/cafe-header.webp"
          alt="Finca El Cielo — café"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow">Finca El Cielo</h1>
          <p className="text-white/80 text-sm mt-0.5">Panel de gestión — café y banano</p>
        </div>
      </div>

      {/* Acceso rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/nomina/control-semanal" className="block group">
          <div className="rounded-xl border-2 border-dashed border-border bg-card hover:border-foreground/40 hover:bg-accent/40 transition-all p-5 flex items-center gap-4">
            <div className="flex-shrink-0 rounded-xl bg-foreground/10 group-hover:bg-foreground/15 transition-colors p-3">
              <ClipboardList className="h-7 w-7 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold tracking-tight">Control Semanal</p>
              <p className="text-xs text-muted-foreground mt-0.5">Jornales, kilos y vales del personal</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
        </Link>
        <Link href="/produccion/ventas-banano" className="block group">
          <div className="rounded-xl border-2 border-dashed border-border bg-card hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all p-5 flex items-center gap-4">
            <div className="flex-shrink-0 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors p-3">
              <Banana className="h-7 w-7 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold tracking-tight">Ventas Banano</p>
              <p className="text-xs text-muted-foreground mt-0.5">Registro por foto automática</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-yellow-500 transition-colors flex-shrink-0" />
          </div>
        </Link>
        <Link href="/produccion/ventas-cafe" className="block group">
          <div className="rounded-xl border-2 border-dashed border-border bg-card hover:border-amber-700/50 hover:bg-amber-700/5 transition-all p-5 flex items-center gap-4">
            <div className="flex-shrink-0 rounded-xl bg-amber-700/10 group-hover:bg-amber-700/20 transition-colors p-3">
              <Coffee className="h-7 w-7 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold tracking-tight">Ventas Café</p>
              <p className="text-xs text-muted-foreground mt-0.5">Registro por foto automática</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-amber-700 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* ── KPIs Financieros ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Análisis financiero
        </h2>

        {/* Resultado neto — card grande */}
        <div className={`rounded-xl border p-6 mb-4 ${
          kpis.ganando
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Scale className={`h-4 w-4 ${kpis.ganando ? "text-emerald-500" : "text-red-500"}`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Resultado neto
                </span>
              </div>
              <p className={`text-4xl font-bold tabular-nums ${kpis.ganando ? "text-emerald-500" : "text-red-500"}`}>
                {cop(kpis.utilidad)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {kpis.ganando ? "La finca está generando utilidad" : "La finca está en pérdida"}
              </p>
            </div>
            <div className={`flex-shrink-0 rounded-xl px-5 py-3 text-center font-bold text-lg tracking-wide ${
              kpis.ganando
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-red-500/15 text-red-500"
            }`}>
              {kpis.ganando ? "GANANDO" : "PERDIENDO"}
            </div>
          </div>
        </div>

        {/* KPI grid: Ingresos, Costos, ROI, Nómina */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ingresos totales</p>
            </div>
            <p className="text-xl font-bold tabular-nums text-emerald-500">{cop(kpis.total_ingresos)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Café + Banano + Otros ingresos</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Costos totales</p>
            </div>
            <p className="text-xl font-bold tabular-nums text-red-500">{cop(kpis.total_costos)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total egresos registrados</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ROI</p>
            </div>
            <p className={`text-xl font-bold tabular-nums ${Number(kpis.roi) >= 0 ? "text-blue-500" : "text-red-500"}`}>
              {Number(kpis.roi).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Retorno sobre costos</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-purple-500" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nómina</p>
            </div>
            <p className="text-xl font-bold tabular-nums text-purple-500">{cop(data.nomina.total)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{num(data.nomina.count)} registros diarios</p>
          </div>
        </div>

        {/* Punto de equilibrio */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Punto de equilibrio
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Ingresos actuales: <span className="font-semibold text-foreground">{cop(kpis.total_ingresos)}</span></span>
                <span>Meta: <span className="font-semibold text-foreground">{cop(kpis.punto_equilibrio)}</span></span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    kpis.ganando ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(Number(kpis.cobertura), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>$0</span>
                <span className="font-medium">
                  {Number(kpis.cobertura).toFixed(1)}% cubierto
                </span>
              </div>
            </div>
            <div className={`text-right flex-shrink-0 rounded-lg px-4 py-2 ${
              kpis.ganando
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
            }`}>
              <p className="text-[10px] font-medium uppercase tracking-wide">
                {kpis.ganando ? "Excede por" : "Faltan"}
              </p>
              <p className="text-base font-bold tabular-nums">
                {cop(Math.abs(Number(kpis.utilidad)))}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Saldo total + bar chart por cuenta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Saldo total en cuentas
          </p>
          <p className="text-4xl font-bold mt-2 tabular-nums">{cop(data.saldo_total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.cuentas.length} cuentas activas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Saldo por cuenta
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={data.cuentas.map(c => ({ nombre: c.nombre.split(" ")[0], saldo: Number(c.saldo) }))}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10 }} width={70} />
              <Tooltip content={<CopTooltip />} />
              <Bar dataKey="saldo" name="Saldo" fill="#71717a" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estado de cuentas — tabla detallada */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Estado de cuentas
          </h2>
          <Link
            href="/finanzas/cuentas"
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Ver cuentas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className={`${TH} text-left`}>Cuenta</th>
                  <th className={`${TH} text-right`}>Saldo</th>
                  <th className={`${TH} text-right`}>Ingresos</th>
                  <th className={`${TH} text-right`}>Egresos</th>
                  <th className={`${TH} text-right`}>Recibe</th>
                  <th className={`${TH} text-right`}>Envía</th>
                </tr>
              </thead>
              <tbody>
                {data.cuentas.map((c) => {
                  const totalIngresos = Number(c.ingresos) + Number(c.pagos)
                  return (
                    <tr key={c.nombre} className="border-b border-border hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium">{c.nombre}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{c.tipo.replace(/_/g, " ")}</p>
                      </td>
                      <td className={`${TD} text-right font-semibold`}>{cop(c.saldo)}</td>
                      <td className={`${TD} text-right text-emerald-600`}>{totalIngresos ? cop(totalIngresos) : "—"}</td>
                      <td className={`${TD} text-right text-red-600`}>{Number(c.egresos) ? cop(c.egresos) : "—"}</td>
                      <td className={`${TD} text-right text-blue-500`}>{Number(c.from) ? cop(c.from) : "—"}</td>
                      <td className={`${TD} text-right text-zinc-500`}>{Number(c.to) ? cop(c.to) : "—"}</td>
                    </tr>
                  )
                })}
                <tr className="bg-muted/20 font-semibold border-t-2 border-border">
                  <td className="px-3 py-2 text-sm">Total</td>
                  <td className={`${TD} text-right`}>{cop(data.saldo_total)}</td>
                  <td className={`${TD} text-right`}>{cop(kpis.total_ingresos)}</td>
                  <td className={`${TD} text-right`}>{cop(kpis.total_costos)}</td>
                  <td className="px-3 py-2 text-sm text-right">—</td>
                  <td className="px-3 py-2 text-sm text-right">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Indicadores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            icon={TrendingDown}
            label="Total egresos"
            value={cop(kpis.total_costos)}
            sub={`Gastos + nómina · ${num(data.egresos.count)} egresos`}
            href="/finanzas/egresos"
            color="red"
          />
          <KpiCard
            icon={TrendingUp}
            label="Total ingresos"
            value={cop(kpis.total_ingresos)}
            sub="Café + Banano + Ingresos varios"
            href="/finanzas/ingresos"
            color="green"
          />
          <KpiCard
            icon={Landmark}
            label="Saldo en cuentas"
            value={cop(data.saldo_total)}
            sub={`${data.cuentas.length} cuentas activas`}
            href="/finanzas/cuentas"
            color={Number(data.saldo_total) >= 0 ? "green" : "red"}
          />
          <KpiCard
            icon={Coffee}
            label="Ventas café"
            value={cop(data.ventas_cafe.total_valor)}
            sub={`${num(data.ventas_cafe.total_kilos)} kg · ${num(data.ventas_cafe.count)} ventas`}
            href="/produccion/ventas-cafe"
            color="amber"
          />
          <KpiCard
            icon={Banana}
            label="Ventas banano"
            value={cop(data.ventas_banano.total_valor)}
            sub={`${num(data.ventas_banano.total_kilos)} kg · ${num(data.ventas_banano.count)} ventas`}
            href="/produccion/ventas-banano"
            color="yellow"
          />
          <KpiCard
            icon={Users}
            label="Empleados activos"
            value={String(data.empleados_activos)}
            sub="Personal activo"
            href="/nomina/empleados"
            color="blue"
          />
        </div>
      </section>

      {/* ── Sección gráficas ────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Análisis por año
          </h2>
          <div className="flex gap-1">
            {ANIOS.map(a => (
              <button
                key={a}
                onClick={() => setAnio(a)}
                className={`text-xs px-3 py-1 rounded-md border transition-colors ${
                  a === anio
                    ? "border-foreground bg-foreground text-background font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {loadingG ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : graficas && (
          <div className="space-y-6">
            {/* Pie chart: distribución ingresos (Café / Banano / Otros) */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Ingresos {anio} — distribución
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Café", value: Number(graficas.totales_ingresos.cafe) },
                        { name: "Banano", value: Number(graficas.totales_ingresos.banano) },
                        { name: "Ingresos", value: Number(graficas.totales_ingresos.otros) },
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {CHART_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip content={<CopTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Tabla de totales */}
                <div className="flex flex-col justify-center gap-3">
                  {[
                    { label: "Café", value: graficas.totales_ingresos.cafe },
                    { label: "Banano", value: graficas.totales_ingresos.banano },
                    { label: "Ingresos varios", value: graficas.totales_ingresos.otros },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-sm text-muted-foreground">{r.label}</span>
                      <span className="text-sm font-semibold tabular-nums">{cop(r.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar charts: Café y Banano por mes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Ventas café {anio} — valor neto mensual
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={graficas.cafe_mensual} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} width={40} />
                    <Tooltip content={<CopTooltip />} />
                    <Bar dataKey="valor" name="Café" fill="#e4e4e7" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Ventas banano {anio} — valor total mensual
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={graficas.banano_mensual} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} width={40} />
                    <Tooltip content={<CopTooltip />} />
                    <Bar dataKey="valor" name="Banano" fill="#71717a" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line chart: egresos vs ingresos por mes */}
            {(graficas.egresos_mensual.length > 0 || graficas.ingresos_mensual.length > 0) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Egresos vs ingresos {anio} — por mes
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={Array.from({ length: 12 }, (_, i) => {
                      const mes = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][i]
                      const e = graficas.egresos_mensual.find(r => r.mes_num === i + 1)
                      const ing = graficas.ingresos_mensual.find(r => r.mes_num === i + 1)
                      return { mes, egresos: Number(e?.valor ?? 0), ingresos: Number(ing?.valor ?? 0) }
                    })}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} width={40} />
                    <Tooltip content={<CopTooltip />} />
                    <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#e4e4e7" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#71717a" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Café detalle por fecha (cargas y precio) */}
            {graficas.cafe_detalle.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Café {anio} — cargas y precio por fecha
                </p>
                <p className="text-[11px] text-muted-foreground mb-4">Sin pasilla y sin corriente</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={graficas.cafe_detalle.map(r => ({
                      fecha: r.fecha.slice(5),
                      cargas: Number(r.cargas),
                      precio: Number(r.precio_kilo),
                    }))}
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="c" orientation="left" tick={{ fontSize: 10 }} label={{ value: "Cargas", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} width={45} />
                    <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={45} />
                    <Tooltip />
                    <Line yAxisId="c" type="monotone" dataKey="cargas" name="Cargas" stroke="#e4e4e7" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="p" type="monotone" dataKey="precio" name="Precio/kg ($)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Egresos por categoría */}
      {data.egresos_por_categoria.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Egresos por categoría
            </h2>
            <Link
              href="/finanzas/egresos"
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Ver egresos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horizontal bar chart */}
            <div className="rounded-xl border border-border bg-card p-5">
              <ResponsiveContainer width="100%" height={Math.max(180, data.egresos_por_categoria.length * 32)}>
                <BarChart
                  data={[...data.egresos_por_categoria]
                    .sort((a, b) => Number(b.total) - Number(a.total))
                    .map(r => ({ cat: r.categoria.replace(/_/g, " "), total: Number(r.total) }))}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="cat" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip content={<CopTooltip />} />
                  <Bar dataKey="total" name="Total" fill="#e4e4e7" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className={`${TH} text-left`}>Categoría</th>
                      <th className={`${TH} text-right`}>Total</th>
                      <th className={`${TH} text-right`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.egresos_por_categoria.map((r) => {
                      const pct = Number(data.egresos.total) > 0
                        ? (Number(r.total) / Number(data.egresos.total) * 100).toFixed(1)
                        : "0.0"
                      return (
                        <tr key={r.categoria} className="border-b border-border hover:bg-muted/30">
                          <td className="px-3 py-2 text-sm capitalize">{r.categoria.replace(/_/g, " ")}</td>
                          <td className={`${TD} text-right font-medium`}>{cop(r.total)}</td>
                          <td className={`${TD} text-right text-muted-foreground`}>{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

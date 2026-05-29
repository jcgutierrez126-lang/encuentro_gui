const BASE =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000")

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("cielo_access")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeader(),
      ...options?.headers,
    },
    ...options,
  })
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cielo_access")
      localStorage.removeItem("cielo_user")
      window.location.href = "/login"
    }
    throw new Error("No autorizado")
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type TipoCuenta = "bancaria" | "efectivo" | "prestamo" | "agencia" | "dividendos" | "inversion"
export type EstadoEgreso = "pagada" | "pendiente" | "parcial"
export type CalidadFloracion = "buena" | "regular" | "muy_buena" | "excelente"

export interface TipoBanano {
  id: number
  nombre: string
  status: boolean
}

export interface TipoCafeVenta {
  id: number
  nombre: string
  status: boolean
}

export interface VariedadLote {
  id: number
  nombre: string
  status: boolean
}

export interface CiudadMaestro {
  id: number
  nombre: string
  status: boolean
}

export interface VentaPorPeriodo {
  periodo: string
  valor: number
}

export interface VentaPorTipo {
  tipo_id: number
  nombre: string
  valor: number
}

export interface FacturaComsabItem {
  descripcion: string
  kilos: number
  precio_kilo: number
  valor_total: number
}

export interface FacturaComsabDeduccion {
  concepto: string
  valor: number
}

export interface FacturaComsab {
  fecha: string
  finca: string | null
  numero_cuenta: string | null
  banco: string | null
  items: FacturaComsabItem[]
  deducciones: FacturaComsabDeduccion[]
  total_pagos: number
  total_a_pagar: number
}

export interface FacturaCafeucol {
  fecha: string
  comprador: string
  factura: string
  items: { descripcion: string; kilos: number; precio_kilo: number; valor_total: number }[]
  retenciones: number
  total: number
}
export interface TipoLabor {
  id: number
  abreviatura: string | null
  nombre: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface TipoCobro {
  id: number
  abreviatura: string | null
  nombre: string
  activo: boolean
  created_at: string
  updated_at: string
}

// ── Finanzas ──────────────────────────────────────────────────────────────────

export interface Cuenta {
  id: number
  nombre: string
  tipo: TipoCuenta
  saldo: string
  descripcion: string
  activa: boolean
  numero_cuenta: string | null
  banco: string | null
  created_at: string
}

export interface Proveedor {
  id: number
  nombre: string
  telefono: string | null
  celular: string | null
  cedula_nit: string | null
  ciudad: number | null
  ciudad_nombre: string | null
  email: string | null
  direccion: string | null
  comentarios: string | null
  activo?: boolean
  created_at: string
}

export interface Egreso {
  id: number
  fecha: string
  nombre: string
  descripcion: string
  cantidad: string
  unidad: string
  valor: string
  cuenta: number
  cuenta_nombre: string
  categoria: string
  proveedor: number | null
  proveedor_nombre: string | null
  nit_proveedor_destino: string | null
  facturado_a: string | null
  estado: EstadoEgreso
  created_at: string
}

export interface Ingreso {
  id: number
  fecha: string
  descripcion: string
  valor: string
  cuenta_destino: number
  cuenta_destino_nombre: string
  origen: string
  created_at: string
}

export interface Transaccion {
  id: number
  fecha: string
  descripcion: string
  valor: string
  cuenta_origen: number
  cuenta_origen_nombre: string
  cuenta_destino: number
  cuenta_destino_nombre: string
  created_at: string
}

export interface Observacion {
  id: number
  fecha: string
  observacion: string
  origen: "manual" | "control_semanal"
  control_semanal_id: number | null
  semana_ref: string | null
  created_at: string
}

// ── Producción ────────────────────────────────────────────────────────────────

export interface Lote {
  id: number
  abreviatura: string | null
  nombre: string
  variedad: number | null
  variedad_nombre: string | null
  tipo_cultivo: string | null
  tipo_materia: "cafe" | "banano" | null
  año_siembra: string | null
  num_arboles: number
  created_at: string
}

export interface VentaCafe {
  id: number
  fecha: string
  kilos: string
  cargas: string
  tipo_cafe: number
  tipo_cafe_nombre: string
  factor: string
  precio_kilo: string
  comprador: string
  valor_total: string
  retefuente: string
  valor_neto: string
  cuenta_destino: number
  cuenta_destino_nombre: string
  created_at: string
}

export interface InversionCDT {
  id: number
  entidad: string
  monto: string
  tasa_ea: string
  fecha_inicio: string
  fecha_vencimiento: string
  plazo_dias: number
  estado: "activo" | "liquidado" | "renovado"
  cuenta_origen: number
  cuenta_origen_nombre: string
  rendimiento_proyectado: string
  rendimiento_real: string | null
  fecha_liquidacion: string | null
  observaciones: string | null
  created_at: string
}

export interface VentaBanano {
  id: number
  fecha: string
  tipo_platano: number
  tipo_nombre: string
  lote: number | null
  lote_nombre: string | null
  lote_abreviatura: string | null
  kilos: string
  precio_kilo: string
  valor_total: string
  cuenta_destino: number
  cuenta_destino_nombre: string
  proveedor: number | null
  proveedor_nombre: string | null
  created_at: string
}

export interface Floracion {
  id: number
  fecha: string
  lote: number
  lote_nombre: string
  lote_abreviatura: string | null
  calidad: CalidadFloracion
  created_at: string
}

export interface MezclaAbonoFertilizante {
  id: number
  fertilizante: string
  bultos: number
  precio_bulto: string
  subtotal: string
}

export interface MezclaAbono {
  id: number
  fecha: string
  formula: string
  lote: number
  lote_nombre: string
  lote_abreviatura: string | null
  fertilizantes: MezclaAbonoFertilizante[]
  costo_total: string
  created_at: string
}

// ── Nómina ────────────────────────────────────────────────────────────────────

export interface Empleado {
  id: number
  nombre_completo: string
  cedula: string
  jornal: string
  salario_mensual: string | null
  salario_semanal: string | null
  eps: string
  pension: string
  arl: string
  caja_compensacion: string
  activo: boolean
  created_at: string
}

export interface ControlSemanal {
  id: number
  empleado: number
  empleado_nombre: string
  fecha_inicio: string
  fecha_fin: string
  semana_ref: string
  dia: string | null
  fecha: string | null
  tipo_labor: number
  tipo_labor_nombre: string
  tipo_cobro: number
  tipo_cobro_nombre: string
  lote: number | null
  lote_nombre: string | null
  kilos: string | null
  jornales: string | null
  costo_unidad: string
  valor: string
  observaciones: string | null
  es_vale: boolean
  created_at: string
}

export interface ControlSemanalStats {
  total_valor: string
  total_kilos: string
  total_jornales: string
  num_registros: number
  num_empleados: number
  promedio_valor: string
  por_labor: { tipo_labor__nombre: string; total: string; registros: number }[]
}

export interface GuardarPlanillaResult {
  ok: boolean
  creados: number
  errores: string[]
  semana_ref: string
}

export interface PrestamoEmpleado {
  id: number
  empleado: number
  empleado_nombre: string
  fecha: string
  monto: string
  descripcion: string
  saldo: string
  created_at: string
}

export interface AbonoPrestamo {
  id: number
  prestamo: number
  fecha: string
  valor: string
  created_at: string
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface CieloUser {
  id: number
  username: string
  email: string
  role: string
  is_active: boolean
  is_superuser: boolean
}

export type OrdoUser = CieloUser

// ── Resumen ───────────────────────────────────────────────────────────────────

export interface ResumenCuenta {
  nombre: string
  tipo: string
  saldo: string
  ingresos: string
  cafe: string
  banano: string
  egresos: string
  pagos: string
  from: string
  to: string
}

export interface ResumenData {
  cuentas: ResumenCuenta[]
  saldo_total: string
  egresos: { total: string; count: number }
  ingresos: { total: string; count: number }
  nomina: { total: string; count: number }
  ventas_cafe: { total_kilos: string; total_valor: string; count: number }
  ventas_banano: { total_kilos: string; total_valor: string; count: number }
  egresos_por_categoria: { categoria: string; total: string; count: number }[]
  empleados_activos: number
  kpis: {
    total_ingresos: string
    total_costos: string
    utilidad: string
    roi: string
    cobertura: string
    punto_equilibrio: string
    ganando: boolean
  }
}

// ── Gráficas ──────────────────────────────────────────────────────────────────

export interface GraficaMensual {
  mes: string
  mes_num: number
  valor: string
}

export interface GraficaCafeMensual {
  mes: string
  mes_num: number
  kilos: string
  valor: string
}

export interface GraficaDetalleCafe {
  fecha: string
  cargas: string
  precio_kilo: string
  tipo_cafe: string
  kilos: string
  valor_neto: string
}

export interface GraficasData {
  cafe_mensual: GraficaCafeMensual[]
  banano_mensual: GraficaCafeMensual[]
  ingresos_mensual: GraficaMensual[]
  egresos_mensual: GraficaMensual[]
  cafe_detalle: GraficaDetalleCafe[]
  totales_ingresos: { cafe: string; banano: string; otros: string }
}

// ── Paginación ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
  total_valor?: number
  total_kilos?: number
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ access: string; refresh: string }>("/api/v1/users/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<CieloUser>("/api/v1/users/me/"),
  },

  finanzas: {
    resumen: () => request<ResumenData>("/api/v1/finanzas/resumen/"),
    graficas: (anio?: string) => {
      const qs = anio ? `?anio=${anio}` : ""
      return request<GraficasData>(`/api/v1/finanzas/graficas/${qs}`)
    },
    ciudades: {
      list: () => request<CiudadMaestro[]>("/api/v1/finanzas/ciudades/"),
      create: (data: { nombre: string }) =>
        request<CiudadMaestro>("/api/v1/finanzas/ciudades/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: { nombre: string }) =>
        request<CiudadMaestro>(`/api/v1/finanzas/ciudades/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/ciudades/${id}/`, { method: "DELETE" }),
    },
    cuentas: {
      list: () => request<Cuenta[]>("/api/v1/finanzas/cuentas/"),
      get: (id: number) => request<Cuenta>(`/api/v1/finanzas/cuentas/${id}/`),
      create: (data: Partial<Cuenta>) =>
        request<Cuenta>("/api/v1/finanzas/cuentas/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Cuenta>) =>
        request<Cuenta>(`/api/v1/finanzas/cuentas/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/cuentas/${id}/`, { method: "DELETE" }),
    },
    proveedores: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Proveedor>>(`/api/v1/finanzas/proveedores/${qs}`)
      },
      get: (id: number) => request<Proveedor>(`/api/v1/finanzas/proveedores/${id}/`),
      create: (data: Partial<Proveedor>) =>
        request<Proveedor>("/api/v1/finanzas/proveedores/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Proveedor>) =>
        request<Proveedor>(`/api/v1/finanzas/proveedores/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/proveedores/${id}/`, { method: "DELETE" }),
    },
    egresos: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Egreso>>(`/api/v1/finanzas/egresos/${qs}`)
      },
      get: (id: number) => request<Egreso>(`/api/v1/finanzas/egresos/${id}/`),
      create: (data: Partial<Egreso>) =>
        request<Egreso>("/api/v1/finanzas/egresos/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Egreso>) =>
        request<Egreso>(`/api/v1/finanzas/egresos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/egresos/${id}/`, { method: "DELETE" }),
    },
    ingresos: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Ingreso>>(`/api/v1/finanzas/ingresos/${qs}`)
      },
      get: (id: number) => request<Ingreso>(`/api/v1/finanzas/ingresos/${id}/`),
      create: (data: Partial<Ingreso>) =>
        request<Ingreso>("/api/v1/finanzas/ingresos/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Ingreso>) =>
        request<Ingreso>(`/api/v1/finanzas/ingresos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/ingresos/${id}/`, { method: "DELETE" }),
    },
    transacciones: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Transaccion>>(`/api/v1/finanzas/transacciones/${qs}`)
      },
      get: (id: number) => request<Transaccion>(`/api/v1/finanzas/transacciones/${id}/`),
      create: (data: Partial<Transaccion>) =>
        request<Transaccion>("/api/v1/finanzas/transacciones/", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/transacciones/${id}/`, { method: "DELETE" }),
    },
    cdts: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<InversionCDT[]>(`/api/v1/finanzas/cdts/${qs}`)
      },
      create: (data: Partial<InversionCDT>) =>
        request<InversionCDT>("/api/v1/finanzas/cdts/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<InversionCDT>) =>
        request<InversionCDT>(`/api/v1/finanzas/cdts/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/finanzas/cdts/${id}/`, { method: "DELETE" }),
      liquidar: (id: number, data: { rendimiento_real?: number; fecha_liquidacion?: string }) =>
        request<{ ok: boolean; rendimiento: string; total: string }>(
          `/api/v1/finanzas/cdts/${id}/liquidar/`,
          { method: "POST", body: JSON.stringify(data) }
        ),
    },
  },

  produccion: {
    tiposBanano: {
      list: () => request<TipoBanano[]>("/api/v1/produccion/tipos-banano/"),
      create: (data: { nombre: string }) =>
        request<TipoBanano>("/api/v1/produccion/tipos-banano/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: { nombre: string }) =>
        request<TipoBanano>(`/api/v1/produccion/tipos-banano/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/tipos-banano/${id}/`, { method: "DELETE" }),
    },
    tiposCafe: {
      list: () => request<TipoCafeVenta[]>("/api/v1/produccion/tipos-cafe/"),
      create: (data: { nombre: string }) =>
        request<TipoCafeVenta>("/api/v1/produccion/tipos-cafe/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: { nombre: string }) =>
        request<TipoCafeVenta>(`/api/v1/produccion/tipos-cafe/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/tipos-cafe/${id}/`, { method: "DELETE" }),
    },
    variedadesLote: {
      list: () => request<VariedadLote[]>("/api/v1/produccion/variedades-lote/"),
      create: (data: { nombre: string }) =>
        request<VariedadLote>("/api/v1/produccion/variedades-lote/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: { nombre: string }) =>
        request<VariedadLote>(`/api/v1/produccion/variedades-lote/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/variedades-lote/${id}/`, { method: "DELETE" }),
    },
    lotes: {
      list: () => request<Lote[]>("/api/v1/produccion/lotes/"),
      get: (id: number) => request<Lote>(`/api/v1/produccion/lotes/${id}/`),
      create: (data: Partial<Lote>) =>
        request<Lote>("/api/v1/produccion/lotes/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Lote>) =>
        request<Lote>(`/api/v1/produccion/lotes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/lotes/${id}/`, { method: "DELETE" }),
    },
    ventasCafe: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<VentaCafe>>(`/api/v1/produccion/ventas-cafe/${qs}`)
      },
      get: (id: number) => request<VentaCafe>(`/api/v1/produccion/ventas-cafe/${id}/`),
      create: (data: Partial<VentaCafe>) =>
        request<VentaCafe>("/api/v1/produccion/ventas-cafe/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<VentaCafe>) =>
        request<VentaCafe>(`/api/v1/produccion/ventas-cafe/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/ventas-cafe/${id}/`, { method: "DELETE" }),
      porPeriodo: (grupo: "semana" | "mes" | "año", params?: Record<string, string>) => {
        const p = new URLSearchParams({ grupo, ...params }).toString()
        return request<VentaPorPeriodo[]>(`/api/v1/produccion/ventas-cafe/por_periodo/?${p}`)
      },
      porTipo: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<VentaPorTipo[]>(`/api/v1/produccion/ventas-cafe/por_tipo/${qs}`)
      },
      parseFactura: (imagen: File, proveedorIA?: "claude" | "gpt") => {
        const form = new FormData()
        form.append("imagen", imagen)
        if (proveedorIA) form.append("proveedor_ia", proveedorIA)
        return request<FacturaCafeucol>("/api/v1/produccion/ventas-cafe/parse_factura/", {
          method: "POST",
          body: form,
        })
      },
      bulkCreate: (items: object[]) =>
        request<VentaCafe[]>("/api/v1/produccion/ventas-cafe/bulk_create/", {
          method: "POST",
          body: JSON.stringify({ items }),
        }),
    },
    ventasBanano: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<VentaBanano>>(`/api/v1/produccion/ventas-banano/${qs}`)
      },
      get: (id: number) => request<VentaBanano>(`/api/v1/produccion/ventas-banano/${id}/`),
      create: (data: Partial<VentaBanano>) =>
        request<VentaBanano>("/api/v1/produccion/ventas-banano/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<VentaBanano>) =>
        request<VentaBanano>(`/api/v1/produccion/ventas-banano/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/ventas-banano/${id}/`, { method: "DELETE" }),
      porPeriodo: (grupo: "semana" | "mes" | "año", params?: Record<string, string>) => {
        const p = new URLSearchParams({ grupo, ...params }).toString()
        return request<VentaPorPeriodo[]>(`/api/v1/produccion/ventas-banano/por_periodo/?${p}`)
      },
      porTipo: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<VentaPorTipo[]>(`/api/v1/produccion/ventas-banano/por_tipo/${qs}`)
      },
      parseFactura: (imagen: File, proveedorIA?: "claude" | "gpt") => {
        const form = new FormData()
        form.append("imagen", imagen)
        if (proveedorIA) form.append("proveedor_ia", proveedorIA)
        return request<FacturaComsab>("/api/v1/produccion/ventas-banano/parse_factura/", {
          method: "POST",
          body: form,
        })
      },
      bulkCreate: (items: object[]) =>
        request<VentaBanano[]>("/api/v1/produccion/ventas-banano/bulk_create/", {
          method: "POST",
          body: JSON.stringify({ items }),
        }),
    },
    floraciones: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Floracion>>(`/api/v1/produccion/floraciones/${qs}`)
      },
      get: (id: number) => request<Floracion>(`/api/v1/produccion/floraciones/${id}/`),
      create: (data: Partial<Floracion>) =>
        request<Floracion>("/api/v1/produccion/floraciones/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Floracion>) =>
        request<Floracion>(`/api/v1/produccion/floraciones/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/floraciones/${id}/`, { method: "DELETE" }),
    },
    mezclasAbono: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<MezclaAbono>>(`/api/v1/produccion/mezclas-abono/${qs}`)
      },
      get: (id: number) => request<MezclaAbono>(`/api/v1/produccion/mezclas-abono/${id}/`),
      create: (data: Partial<MezclaAbono>) =>
        request<MezclaAbono>("/api/v1/produccion/mezclas-abono/", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/mezclas-abono/${id}/`, { method: "DELETE" }),
    },
    observaciones: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Observacion>>(`/api/v1/produccion/observaciones/${qs}`)
      },
      create: (data: Partial<Observacion>) =>
        request<Observacion>("/api/v1/produccion/observaciones/", { method: "POST", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/produccion/observaciones/${id}/`, { method: "DELETE" }),
    },
  },

  nomina: {
    empleados: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<Empleado>>(`/api/v1/nomina/empleados/${qs}`)
      },
      get: (id: number) => request<Empleado>(`/api/v1/nomina/empleados/${id}/`),
      create: (data: Partial<Empleado>) =>
        request<Empleado>("/api/v1/nomina/empleados/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<Empleado>) =>
        request<Empleado>(`/api/v1/nomina/empleados/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/nomina/empleados/${id}/`, { method: "DELETE" }),
    },
    controlSemanal: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<ControlSemanal>>(`/api/v1/nomina/control-semanal/${qs}`)
      },
      get: (id: number) => request<ControlSemanal>(`/api/v1/nomina/control-semanal/${id}/`),
      create: (data: Partial<ControlSemanal>) =>
        request<ControlSemanal>("/api/v1/nomina/control-semanal/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<ControlSemanal>) =>
        request<ControlSemanal>(`/api/v1/nomina/control-semanal/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/nomina/control-semanal/${id}/`, { method: "DELETE" }),
      stats: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<ControlSemanalStats>(`/api/v1/nomina/control-semanal/stats/${qs}`)
      },
      semanas: () =>
        request<{ semana_ref: string; fecha_min: string }[]>("/api/v1/nomina/control-semanal/semanas/"),
      porSemana: (semanaRef: string) =>
        request<ControlSemanal[]>(`/api/v1/nomina/control-semanal/por-semana/?semana_ref=${encodeURIComponent(semanaRef)}`),
      borrarSemana: (semanaRef: string) =>
        request<{ eliminados: number }>(`/api/v1/nomina/control-semanal/borrar-semana/?semana_ref=${encodeURIComponent(semanaRef)}`, { method: "DELETE" }),
      renombrarSemana: (semanaRef: string, nuevoNombre: string) =>
        request<{ ok: boolean; actualizados: number }>("/api/v1/nomina/control-semanal/renombrar-semana/", {
          method: "POST",
          body: JSON.stringify({ semana_ref: semanaRef, nuevo_nombre: nuevoNombre }),
        }),
      guardarPlanilla: (payload: { semana_ref: string; fecha_inicio: string; registros: object[] }) =>
        request<GuardarPlanillaResult>("/api/v1/nomina/guardar-planilla/", { method: "POST", body: JSON.stringify(payload) }),
    },
    prestamos: {
      list: (params?: Record<string, string>) => {
        const qs = params ? "?" + new URLSearchParams(params).toString() : ""
        return request<PaginatedResponse<PrestamoEmpleado>>(`/api/v1/nomina/prestamos/${qs}`)
      },
      get: (id: number) => request<PrestamoEmpleado>(`/api/v1/nomina/prestamos/${id}/`),
      create: (data: Partial<PrestamoEmpleado>) =>
        request<PrestamoEmpleado>("/api/v1/nomina/prestamos/", { method: "POST", body: JSON.stringify(data) }),
      abonos: (prestamoId: number) =>
        request<AbonoPrestamo[]>(`/api/v1/nomina/prestamos/${prestamoId}/abonos/`),
      abonar: (prestamoId: number, data: Partial<AbonoPrestamo>) =>
        request<AbonoPrestamo>(`/api/v1/nomina/prestamos/${prestamoId}/abonos/`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    tiposLabor: {
      list: () => request<TipoLabor[]>("/api/v1/nomina/tipos-labor/"),
      create: (data: { nombre: string; abreviatura?: string }) =>
        request<TipoLabor>("/api/v1/nomina/tipos-labor/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<TipoLabor>) =>
        request<TipoLabor>(`/api/v1/nomina/tipos-labor/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/nomina/tipos-labor/${id}/`, { method: "DELETE" }),
    },
    tiposCobro: {
      list: () => request<TipoCobro[]>("/api/v1/nomina/tipos-cobro/"),
      create: (data: { nombre: string; abreviatura?: string }) =>
        request<TipoCobro>("/api/v1/nomina/tipos-cobro/", { method: "POST", body: JSON.stringify(data) }),
      update: (id: number, data: Partial<TipoCobro>) =>
        request<TipoCobro>(`/api/v1/nomina/tipos-cobro/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
      delete: (id: number) =>
        request<void>(`/api/v1/nomina/tipos-cobro/${id}/`, { method: "DELETE" }),
    },
  },

  users: {
    list: () => request<CieloUser[]>("/api/v1/users/settings/list/"),
    create: (data: { username: string; password: string; role: string; email?: string }) =>
      request<CieloUser>("/api/v1/users/settings/create/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ password: string; email: string; role: string; is_active: boolean }>) =>
      request<CieloUser>(`/api/v1/users/settings/${id}/patch/`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/api/v1/users/settings/${id}/delete/`, { method: "DELETE" }),
  },
}

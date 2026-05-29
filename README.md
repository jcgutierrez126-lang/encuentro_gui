# gestion_el_cielo_gui — Frontend Finca El Cielo

Dashboard web para la plataforma de gestión de **Finca El Cielo**.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui (Radix UI)
- Framer Motion

## Módulos

| Módulo | Rutas |
|--------|-------|
| Finanzas | `/finanzas/cuentas`, `/finanzas/egresos`, `/finanzas/ingresos`, `/finanzas/proveedores`, `/finanzas/transacciones`, `/finanzas/observaciones` |
| Producción | `/produccion/lotes`, `/produccion/ventas-cafe`, `/produccion/ventas-cafe-tostado`, `/produccion/ventas-banano`, `/produccion/floraciones`, `/produccion/mezclas-abono` |
| Nómina | `/nomina/empleados`, `/nomina/control-semanal`, `/nomina/prestamos` |

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Arranque

```bash
npm install
npm run dev     # http://localhost:3000
```

## Conexión con el backend

El cliente API en `src/lib/api.ts` apunta a `/api/v1/...` (se proxea via Nginx en producción).
Token JWT se guarda en `localStorage` como `cielo_access`.

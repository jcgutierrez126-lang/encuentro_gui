"use client"

// Formato Gastos Semanal — Finca El Cielo
// Formulario de una página A4 para registrar gastos de la semana
// El mayordomo lo llena a mano → foto → Claude extrae los datos

const s = {
  th: {
    border: "1px solid #000",
    padding: "3px 4px",
    textAlign: "left" as const,
    fontSize: "7.5px",
    fontWeight: "bold",
    backgroundColor: "#e8e8e8",
  },
  td: {
    border: "1px solid #000",
    padding: 0,
    height: "22px",
    fontSize: "7.5px",
  },
  tdLabel: {
    border: "1px solid #000",
    padding: "2px 5px",
    fontSize: "7.5px",
    fontWeight: "bold" as const,
    backgroundColor: "#f0f0f0",
    whiteSpace: "nowrap" as const,
  },
  tdWrite: {
    border: "1px solid #000",
    padding: "2px 4px",
    height: "22px",
    fontSize: "7.5px",
    width: "100%",
  },
  seccionTitle: {
    fontWeight: 900,
    fontSize: "8.5px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    borderBottom: "1.5px solid #000",
    padding: "2px 0",
    marginBottom: "4px",
    marginTop: "8px",
  },
}

const CUENTAS = ["Efectivo","Agencia","Bancolombia","Vale","Dividendos"]
const CATEGORIAS_NOMINA = [
  { label: "Mayordomo / Administrador" },
  { label: "Mano de obra — Recolección" },
  { label: "Mano de obra — Guadaña" },
  { label: "Mano de obra — Abono" },
  { label: "Mano de obra — Banano" },
  { label: "Mano de obra — Otros / Varios" },
  { label: "Transporte trabajadores" },
  { label: "Viáticos" },
]
const CATEGORIAS_INSUMOS = [
  { label: "Fertilizantes" },
  { label: "Herbicidas" },
  { label: "Control Broca" },
  { label: "Control Roya / Plagas" },
  { label: "Mantenimiento maquinaria" },
  { label: "Combustible (gasolina/ACPM)" },
  { label: "Herramientas" },
  { label: "Materiales / Construcción" },
]
const CATEGORIAS_SERVICIOS = [
  { label: "Acueducto / Agua" },
  { label: "EPM / Energía" },
  { label: "Comsab / Comunicaciones" },
  { label: "Impuestos / Predial" },
  { label: "Animales / Ganado" },
  { label: "Otros / Sin clasificar" },
]

function FilaGasto({ label, cuenta = false }: { label: string; cuenta?: boolean }) {
  return (
    <tr>
      <td style={s.tdLabel}>{label}</td>
      <td style={s.td} />
      <td style={s.td} />
      <td style={s.td} />
      {cuenta && <td style={s.td} />}
      {!cuenta && <td style={{ ...s.td, backgroundColor: "#f9f9f9" }} />}
    </tr>
  )
}

export default function FormatoGastosPage() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", background: "#fff" }}>

      {/* ── Barra navegación — no se imprime ── */}
      <div className="print:hidden" style={{ display: "flex", gap: "12px", padding: "12px 16px", background: "#f4f4f4", borderBottom: "1px solid #ddd", alignItems: "center" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
        >
          Imprimir (Ctrl+P)
        </button>
        <span style={{ fontSize: "12px", color: "#666" }}>
          1 página A4 · Formato de Gastos Semanal
        </span>
        <a href="/planilla" style={{ marginLeft: "auto", fontSize: "12px", color: "#1a73e8", textDecoration: "none" }}>
          ← Planilla de Labores
        </a>
      </div>

      {/* ══════════════════════════════════════════
          PÁGINA A4 — FORMATO GASTOS
      ══════════════════════════════════════════ */}
      <div style={{ maxWidth: "210mm", margin: "0 auto", padding: "8mm", boxSizing: "border-box", fontSize: "8px" }}>

        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2.5px solid #000", paddingBottom: "4px", marginBottom: "8px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>Finca El Cielo</div>
            <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", color: "#444" }}>
              Formato de Gastos Semanal
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "8.5px", textAlign: "right" }}>
            <span>
              Semana del:&nbsp;
              <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: "80px" }}>&nbsp;</span>
              &nbsp;al:&nbsp;
              <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: "80px" }}>&nbsp;</span>
            </span>
            <span>
              Kilos café recolectados:&nbsp;
              <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: "60px" }}>&nbsp;</span>
              &nbsp;kg
            </span>
          </div>
        </div>

        {/* Layout dos columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

          {/* ── COLUMNA IZQUIERDA ── */}
          <div>
            {/* Nómina y mano de obra */}
            <div style={s.seccionTitle}>Nómina y Mano de Obra</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, minWidth: "130px" }}>Concepto</th>
                  <th style={{ ...s.th, width: "52px" }}>Valor $</th>
                  <th style={{ ...s.th, width: "48px" }}>Cuenta</th>
                  <th style={{ ...s.th, width: "60px" }}>Proveedor</th>
                  <th style={{ ...s.th, width: "38px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIAS_NOMINA.map(({ label }) => (
                  <FilaGasto key={label} label={label} cuenta />
                ))}
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <td style={{ ...s.tdLabel, fontWeight: 900 }}>SUBTOTAL NÓMINA</td>
                  <td style={{ ...s.td, fontWeight: "bold" }} />
                  <td colSpan={3} style={{ border: "1px solid #000" }} />
                </tr>
              </tbody>
            </table>

            {/* Seguridad social */}
            <div style={s.seccionTitle}>Seguridad Social</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, minWidth: "130px" }}>Concepto</th>
                  <th style={{ ...s.th, width: "52px" }}>Valor $</th>
                  <th style={{ ...s.th, width: "48px" }}>Cuenta</th>
                  <th style={{ ...s.th, width: "60px" }}>Entidad</th>
                  <th style={{ ...s.th, width: "38px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {["EPS", "Pensión", "ARL", "Caja de Compensación"].map(l => (
                  <FilaGasto key={l} label={l} cuenta />
                ))}
              </tbody>
            </table>

            {/* Servicios */}
            <div style={s.seccionTitle}>Servicios y Otros</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, minWidth: "130px" }}>Concepto</th>
                  <th style={{ ...s.th, width: "52px" }}>Valor $</th>
                  <th style={{ ...s.th, width: "48px" }}>Cuenta</th>
                  <th style={{ ...s.th, width: "60px" }}>Proveedor</th>
                  <th style={{ ...s.th, width: "38px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIAS_SERVICIOS.map(({ label }) => (
                  <FilaGasto key={label} label={label} cuenta />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div>
            {/* Insumos */}
            <div style={s.seccionTitle}>Insumos Agrícolas</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, minWidth: "130px" }}>Concepto</th>
                  <th style={{ ...s.th, width: "52px" }}>Valor $</th>
                  <th style={{ ...s.th, width: "48px" }}>Cuenta</th>
                  <th style={{ ...s.th, width: "60px" }}>Proveedor</th>
                  <th style={{ ...s.th, width: "38px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIAS_INSUMOS.map(({ label }) => (
                  <FilaGasto key={label} label={label} cuenta />
                ))}
                <tr style={{ backgroundColor: "#e8e8e8" }}>
                  <td style={{ ...s.tdLabel, fontWeight: 900 }}>SUBTOTAL INSUMOS</td>
                  <td style={{ ...s.td, fontWeight: "bold" }} />
                  <td colSpan={3} style={{ border: "1px solid #000" }} />
                </tr>
              </tbody>
            </table>

            {/* Préstamos */}
            <div style={s.seccionTitle}>Préstamos a Empleados</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={s.th}>Empleado</th>
                  <th style={{ ...s.th, width: "52px" }}>Monto $</th>
                  <th style={{ ...s.th, width: "70px" }}>Concepto</th>
                  <th style={{ ...s.th, width: "48px" }}>Cuenta</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ height: "22px" }}>
                    <td style={s.td} />
                    <td style={s.td} />
                    <td style={s.td} />
                    <td style={s.td} />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Ingresos de la semana */}
            <div style={s.seccionTitle}>Ingresos de la Semana</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={s.th}>Origen</th>
                  <th style={{ ...s.th, width: "65px" }}>Valor $</th>
                  <th style={{ ...s.th, width: "65px" }}>Cuenta destino</th>
                </tr>
              </thead>
              <tbody>
                {["Venta Café","Venta Banano","Otro"].map(l => (
                  <tr key={l} style={{ height: "22px" }}>
                    <td style={{ ...s.tdLabel }}>{l}</td>
                    <td style={s.td} />
                    <td style={s.td} />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumen totales */}
            <div style={{ ...s.seccionTitle, marginTop: "10px" }}>Resumen Total</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  "TOTAL NÓMINA",
                  "TOTAL INSUMOS",
                  "TOTAL SERVICIOS Y OTROS",
                  "TOTAL PRÉSTAMOS",
                  "TOTAL GASTOS SEMANA",
                ].map((l, i) => (
                  <tr key={l} style={{ height: "20px", backgroundColor: i === 4 ? "#000" : i % 2 === 0 ? "#f0f0f0" : "#fff" }}>
                    <td style={{ ...s.tdLabel, fontWeight: i === 4 ? 900 : "bold", color: i === 4 ? "#fff" : "#000", backgroundColor: i === 4 ? "#000" : "inherit" }}>
                      {l}
                    </td>
                    <td style={{ ...s.td, fontWeight: "bold", color: i === 4 ? "#fff" : "#000", backgroundColor: i === 4 ? "#000" : "inherit" }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cuentas referencia */}
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap", fontSize: "7px", border: "1px solid #ccc", padding: "3px 6px", borderRadius: "3px", backgroundColor: "#fafafa" }}>
          <span style={{ fontWeight: "bold" }}>CUENTAS:</span>
          {CUENTAS.map((c, i) => <span key={c}><b>{i + 1}</b>={c}</span>)}
          <span style={{ marginLeft: "10px", fontWeight: "bold" }}>ESTADO:</span>
          <span><b>P</b>=Pagada</span><span><b>PE</b>=Pendiente</span><span><b>PA</b>=Parcial</span>
        </div>

        {/* Observaciones */}
        <div style={{ marginTop: "8px", border: "1px solid #000", borderRadius: "3px", padding: "5px" }}>
          <div style={{ fontWeight: "bold", fontSize: "8px", textTransform: "uppercase", marginBottom: "4px" }}>Observaciones</div>
          {[0,1].map(i => (
            <div key={i} style={{ borderBottom: "1px solid #aaa", height: "20px", marginBottom: "3px" }} />
          ))}
        </div>

        {/* Pie */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "7.5px" }}>
          <span>Elaboró: <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: "110px" }}>&nbsp;</span></span>
          <span>Revisó: <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: "110px" }}>&nbsp;</span></span>
          <span>Fecha: <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: "80px" }}>&nbsp;</span></span>
          <span style={{ color: "#aaa" }}>Finca El Cielo</span>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: A4 portrait; margin: 8mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

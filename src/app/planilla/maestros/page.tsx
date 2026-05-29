"use client"

// Planilla Diaria de Maestros — Finca El Cielo

const LOTES = [
  { abr: "M",   nombre: "La Milagrosa" },
  { abr: "T",   nombre: "El Tanque" },
  { abr: "C",   nombre: "La Cruz" },
  { abr: "SJ",  nombre: "San José" },
  { abr: "N",   nombre: "El Niño" },
  { abr: "SCH", nombre: "San Charbel" },
  { abr: "CP",  nombre: "La Ceja Palos" },
  { abr: "CZ",  nombre: "La Ceja Zocas" },
  { abr: "H",   nombre: "Huerta" },
  { abr: "HC",  nombre: "Hoyo Caliente" },
  { abr: "GU",  nombre: "Guaduas" },
  { abr: "BO",  nombre: "La Bola" },
  { abr: "LL",  nombre: "El Llano" },
  { abr: "DT",  nombre: "Destechada" },
]

const LABORES = [
  { cod: "R",   label: "Recolección" },
  { cod: "G",   label: "Guadaña" },
  { cod: "A",   label: "Abono" },
  { cod: "B",   label: "Banano" },
  { cod: "E",   label: "Embolsada" },
  { cod: "S",   label: "Siembra" },
  { cod: "C",   label: "Cosecha" },
  { cod: "V",   label: "Varios" },
  { cod: "D",   label: "Deshojada" },
  { cod: "DC",  label: "Deschuponar" },
  { cod: "DB",  label: "Desbejucar" },
  { cod: "AL",  label: "Aux. Labor" },
  { cod: "AT",  label: "Aux. Transporte" },
  { cod: "CT",  label: "Contrato" },
  { cod: "P",   label: "Permiso" },
  { cod: "N",   label: "Nómina" },
]

const s = {
  celda: {
    border: "1px solid #000",
    padding: 0,
    verticalAlign: "middle" as const,
    fontSize: "10px",
  },
  th: {
    border: "1px solid #000",
    padding: "4px 5px",
    textAlign: "center" as const,
    fontSize: "10px",
    fontWeight: "bold",
    backgroundColor: "#d4e8d4",
    verticalAlign: "middle" as const,
  },
  fila: { height: "30px" },
  lineaEscritura: {
    borderBottom: "1px solid #aaa",
    display: "inline-block",
  },
}

function LeyendaLotes() {
  return (
    <div style={{
      display: "flex", gap: "10px", flexWrap: "wrap",
      border: "1px solid #ccc", padding: "5px 8px", marginBottom: "5px",
      fontSize: "9px", borderRadius: "3px", backgroundColor: "#fafafa",
    }}>
      <span style={{ fontWeight: "bold" }}>LOTES:</span>
      {LOTES.map(({ abr, nombre }) => (
        <span key={abr}><b>{abr}</b>={nombre}</span>
      ))}
    </div>
  )
}

function LeyendaLabores() {
  return (
    <div style={{
      display: "flex", gap: "10px", flexWrap: "wrap",
      border: "1px solid #ccc", padding: "5px 8px", marginBottom: "6px",
      fontSize: "9px", borderRadius: "3px", backgroundColor: "#fafafa",
    }}>
      <span style={{ fontWeight: "bold" }}>LABOR:</span>
      {LABORES.map(({ cod, label }) => (
        <span key={cod}><b>{cod}</b>={label}</span>
      ))}
      <span style={{ marginLeft: "8px", fontWeight: "bold" }}>COBRO:</span>
      <span><b>K</b>=Kilos</span>
      <span><b>J</b>=Jornal</span>
      <span><b>C</b>=Contrato</span>
    </div>
  )
}

export default function PlanillaMaestrosPage() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", background: "#fff" }}>

      {/* Barra — no se imprime */}
      <div className="print:hidden" style={{ display: "flex", gap: "12px", padding: "12px 16px", background: "#f4f4f4", borderBottom: "1px solid #ddd", alignItems: "center" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#2d6a2d", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
        >
          Imprimir (Ctrl+P)
        </button>
        <span style={{ fontSize: "12px", color: "#666" }}>
          1 página A4 — Planilla diaria de maestros (Nombre | Lote | Labor | Cantidad | Cobro | Valor)
        </span>
        <a href="/planilla/diaria" style={{ marginLeft: "auto", fontSize: "12px", color: "#1a73e8", textDecoration: "none" }}>
          ← Planilla Diaria
        </a>
      </div>

      {/* Página A4 */}
      <div style={{ maxWidth: "210mm", margin: "0 auto", padding: "8mm", boxSizing: "border-box" }}>

        {/* Encabezado */}
        <div style={{ borderBottom: "2.5px solid #000", paddingBottom: "5px", marginBottom: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px", textTransform: "uppercase" }}>
                Finca El Cielo
              </div>
              <div style={{ fontSize: "9px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>
                Planilla Diaria de{" "}
                <span style={{ color: "#2d6a2d" }}>Maestros</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "9px", alignItems: "flex-end" }}>
              <span>Fecha:&nbsp;<span style={{ ...s.lineaEscritura, width: "80px" }}>&nbsp;</span></span>
              <span>Día:&nbsp;<span style={{ ...s.lineaEscritura, width: "70px" }}>&nbsp;</span></span>
              <span>Precio kilo: $<span style={{ ...s.lineaEscritura, width: "50px" }}>&nbsp;</span></span>
            </div>
          </div>
        </div>

        <LeyendaLotes />
        <LeyendaLabores />

        {/* Tabla principal */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: "20px" }}>#</th>
              <th style={{ ...s.th, minWidth: "80px" }}>Nombre</th>
              <th style={{ ...s.th, width: "50px" }}>Lote</th>
              <th style={{ ...s.th, width: "50px" }}>Labor</th>
              <th style={{ ...s.th, width: "54px" }}>Cantidad</th>
              <th style={{ ...s.th, width: "46px" }}>Cobro</th>
              <th style={{ ...s.th, width: "95px" }}>Valor $</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }).map((_, i) => (
              <tr key={i} style={s.fila}>
                <td style={{ ...s.celda, textAlign: "center", color: "#999", fontSize: "9px" }}>{i + 1}</td>
                <td style={s.celda} />
                <td style={s.celda} />
                <td style={s.celda} />
                <td style={s.celda} />
                <td style={s.celda} />
                <td style={s.celda} />
              </tr>
            ))}
            {/* Fila total */}
            <tr style={{ height: "26px", backgroundColor: "#d4e8d4" }}>
              <td colSpan={6} style={{ ...s.celda, textAlign: "right", fontWeight: "bold", paddingRight: "8px", fontSize: "9px" }}>
                TOTAL DÍA →
              </td>
              <td style={{ ...s.celda, fontWeight: "bold", fontSize: "11px" }} />
            </tr>
          </tbody>
        </table>

        {/* Observaciones */}
        <div style={{ marginTop: "10px", border: "1px solid #000", borderRadius: "3px", padding: "5px" }}>
          <div style={{ fontWeight: "bold", fontSize: "9px", textTransform: "uppercase", marginBottom: "4px" }}>
            Observaciones
          </div>
          {[0, 1].map(i => (
            <div key={i} style={{ borderBottom: "1px solid #aaa", height: "22px", marginBottom: "3px" }} />
          ))}
        </div>

        {/* Pie */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "9px" }}>
          <span>Mayordomo: <span style={{ ...s.lineaEscritura, width: "130px" }}>&nbsp;</span></span>
          <span>Firma: <span style={{ ...s.lineaEscritura, width: "100px" }}>&nbsp;</span></span>
          <span>Entregada: <span style={{ ...s.lineaEscritura, width: "80px" }}>&nbsp;</span></span>
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

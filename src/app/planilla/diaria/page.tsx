"use client"

// Planilla Diaria — Finca El Cielo

import { useEffect, useState } from "react"
import { api, type Lote, type TipoLabor } from "@/lib/api"

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
    backgroundColor: "#e8e8e8",
    verticalAlign: "middle" as const,
  },
  fila: { height: "30px" },
  lineaEscritura: {
    borderBottom: "1px solid #aaa",
    display: "inline-block",
  },
}

function LeyendaLotes({ lotes }: { lotes: Lote[] }) {
  if (!lotes.length) return null
  return (
    <div style={{
      display: "flex", gap: "10px", flexWrap: "wrap",
      border: "1px solid #ccc", padding: "5px 8px", marginBottom: "5px",
      fontSize: "9px", borderRadius: "3px", backgroundColor: "#fafafa",
    }}>
      <span style={{ fontWeight: "bold" }}>LOTES:</span>
      {lotes.map(l => (
        <span key={l.id}><b>{l.abreviatura}</b>={l.nombre}</span>
      ))}
    </div>
  )
}

function LeyendaLabores({ labores }: { labores: TipoLabor[] }) {
  if (!labores.length) return null
  return (
    <div style={{
      display: "flex", gap: "10px", flexWrap: "wrap",
      border: "1px solid #ccc", padding: "5px 8px", marginBottom: "6px",
      fontSize: "9px", borderRadius: "3px", backgroundColor: "#fafafa",
    }}>
      <span style={{ fontWeight: "bold" }}>LABOR:</span>
      {labores.map(l => (
        <span key={l.id}><b>{l.abreviatura}</b>={l.nombre}</span>
      ))}
      <span style={{ marginLeft: "8px", fontWeight: "bold" }}>COBRO:</span>
      <span><b>K</b>=Kilos</span>
      <span><b>J</b>=Jornal</span>
      <span><b>C</b>=Contrato</span>
      <span><b>N</b>=Nómina</span>
    </div>
  )
}

export default function PlanillaDiariaPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [labores, setLabores] = useState<TipoLabor[]>([])

  useEffect(() => {
    api.produccion.lotes.list().then(r => setLotes(r)).catch(() => {})
    api.nomina.tiposLabor.list().then(r => setLabores(r)).catch(() => {})
  }, [])

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", background: "#fff" }}>

      {/* Barra — no se imprime */}
      <div className="print:hidden" style={{ display: "flex", gap: "12px", padding: "12px 16px", background: "#f4f4f4", borderBottom: "1px solid #ddd", alignItems: "center" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
        >
          Imprimir (Ctrl+P)
        </button>
        <a href="/planilla/maestros"
          style={{ padding: "8px 16px", background: "#2d6a2d", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer", textDecoration: "none" }}
        >
          Maestros
        </a>
        <span style={{ fontSize: "12px", color: "#666" }}>
          1 página A4 — Planilla diaria (Nombre | Lote | Labor | Cantidad | Cobro | Valor)
        </span>
        <a href="/planilla" style={{ marginLeft: "auto", fontSize: "12px", color: "#1a73e8", textDecoration: "none" }}>
          → Planilla Semanal
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
              <div style={{ fontSize: "9px", color: "#444", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>
                Planilla Diaria de Labores
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "9px", alignItems: "flex-end" }}>
              <span>Fecha:&nbsp;<span style={{ ...s.lineaEscritura, width: "80px" }}>&nbsp;</span></span>
              <span>Día:&nbsp;<span style={{ ...s.lineaEscritura, width: "70px" }}>&nbsp;</span></span>
              <span>Precio kilo: $<span style={{ ...s.lineaEscritura, width: "50px" }}>&nbsp;</span></span>
            </div>
          </div>
        </div>

        {/* Leyendas — solo en pantalla, no en impresión */}
        <div className="print:hidden">
          <LeyendaLotes lotes={lotes} />
          <LeyendaLabores labores={labores} />
        </div>

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
            {Array.from({ length: 28 }).map((_, i) => (
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
            <tr style={{ height: "26px", backgroundColor: "#f0f0f0" }}>
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

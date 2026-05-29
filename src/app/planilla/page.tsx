"use client"

// Planilla Semanal de Labores — Finca El Cielo
// Formato: A4 landscape

import { useEffect, useState } from "react"
import { api, type Lote, type TipoLabor } from "@/lib/api"

const NUM_FILAS = 14

const ROW_BORDER = "2px solid #000"   // borde horizontal entre renglones
const COL_BORDER = "1px solid #000"   // borde vertical entre columnas

const s = {
  cell: {
    borderTop: ROW_BORDER,
    borderBottom: ROW_BORDER,
    borderLeft: COL_BORDER,
    borderRight: COL_BORDER,
    verticalAlign: "middle" as const,
    fontSize: "9px",
    padding: "0 2px",
    height: "38px",
  } as React.CSSProperties,
  cellSmall: {
    borderTop: ROW_BORDER,
    borderBottom: ROW_BORDER,
    borderLeft: COL_BORDER,
    borderRight: COL_BORDER,
    verticalAlign: "middle" as const,
    fontSize: "7.5px",
    padding: "0 1px",
    height: "38px",
  } as React.CSSProperties,
  th: {
    border: "1px solid #000",
    padding: "2px 2px",
    textAlign: "center" as const,
    fontSize: "8px",
    fontWeight: "bold" as const,
    backgroundColor: "#ddd",
    verticalAlign: "middle" as const,
  } as React.CSSProperties,
}

function line(w = 100) {
  return (
    <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: `${w}px` }}>&nbsp;</span>
  )
}

const DIAS_NORMALES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
const SABADO = "Sábado"

// Columnas totales: 1(Nombre) + 3×5(L-V) + 4(Sáb) + 1(Cobro) + 1(Valor) = 22

export default function PlanillaPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [labores, setLabores] = useState<TipoLabor[]>([])

  useEffect(() => {
    api.produccion.lotes.list().then(r => setLotes(r)).catch(() => {})
    api.nomina.tiposLabor.list().then(r => setLabores(r)).catch(() => {})
  }, [])

  void lotes; void labores

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", background: "#fff" }}>

      {/* Barra — no se imprime */}
      <div className="print:hidden" style={{
        display: "flex", gap: "12px", padding: "10px 16px",
        background: "#f4f4f4", borderBottom: "1px solid #ddd", alignItems: "center",
      }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "7px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
        >
          Imprimir (Ctrl+P)
        </button>
        <span style={{ fontSize: "12px", color: "#666" }}>
          1 página A4 landscape · Planilla Semanal
        </span>
        <a href="/nomina/control-semanal" style={{ marginLeft: "auto", fontSize: "12px", color: "#1a73e8", textDecoration: "none" }}>
          ← Control Semanal
        </a>
      </div>

      {/* Página A4 landscape */}
      <div style={{ padding: "0", boxSizing: "border-box" }}>

        {/* Encabezado */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          borderBottom: "2px solid #000", paddingBottom: "4px", marginBottom: "6px",
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px" }}>Finca El Cielo</div>
            <div style={{ fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.7px", color: "#444" }}>
              Planilla Semanal de Labores
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", fontSize: "8px", alignItems: "flex-end" }}>
            <span>Semana #: {line(48)}</span>
            <span>Del {line(28)}/{line(28)}</span>
            <span>al {line(28)}/{line(28)}</span>
            <span>de {line(52)}</span>
          </div>
        </div>

        {/*
          Columnas: 1(Nombre) + 3×5(L-V) + 4(Sáb) + 1(Cobro) + 1(Valor) = 22
          Valor: si Cobro=K o J → valor individual por día/labor
                 si Cobro=C o N → valor general por semana
        */}
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            {/* Nombre — ancha */}
            <col style={{ width: "16%" }} />
            {/* Lunes–Viernes: Labor + Lote + Cant. */}
            {DIAS_NORMALES.flatMap((_, i) => [
              <col key={`la${i}`} style={{ width: "3.2%" }} />,
              <col key={`lo${i}`} style={{ width: "3.2%" }} />,
              <col key={`ca${i}`} style={{ width: "4.2%" }} />,
            ])}
            {/* Sábado: Labor + Lote + Cant. + 1/2 */}
            <col style={{ width: "3.2%" }} />
            <col style={{ width: "3.2%" }} />
            <col style={{ width: "4.2%" }} />
            <col style={{ width: "1.8%" }} />
            {/* Cobro | Valor */}
            <col style={{ width: "2.4%" }} />
            <col style={{ width: "7.5%" }} />
          </colgroup>

          <thead>
            {/* Fila 1: nombres de día */}
            <tr>
              <th style={s.th} rowSpan={2}>Nombre</th>
              {DIAS_NORMALES.map(dia => (
                <th key={dia} style={{ ...s.th, borderLeft: "4px solid #000" }} colSpan={3}>{dia}</th>
              ))}
              <th style={{ ...s.th, borderLeft: "4px solid #000" }} colSpan={4}>{SABADO}</th>
              <th style={{ ...s.th, fontSize: "6.5px", borderLeft: "4px solid #000", lineHeight: "1.3" }} rowSpan={2}>K·J<br />C·N</th>
              <th style={{ ...s.th, fontSize: "7px" }} rowSpan={2}>Valor</th>
            </tr>
            {/* Fila 2: sub-columnas */}
            <tr>
              {DIAS_NORMALES.map(dia => (
                <>
                  <th key={`${dia}-labor`} style={{ ...s.th, fontSize: "6.5px", borderLeft: "4px solid #000" }}>Labor</th>
                  <th key={`${dia}-lote`}  style={{ ...s.th, fontSize: "6.5px" }}>Lote</th>
                  <th key={`${dia}-cant`}  style={{ ...s.th, fontSize: "6.5px" }}>Cant.</th>
                </>
              ))}
              {/* Sábado sub-columnas */}
              <th style={{ ...s.th, fontSize: "6.5px", borderLeft: "4px solid #000" }}>Labor</th>
              <th style={{ ...s.th, fontSize: "6.5px" }}>Lote</th>
              <th style={{ ...s.th, fontSize: "6.5px" }}>Cant.</th>
              <th style={{ ...s.th, fontSize: "6.5px" }}>1/2</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: NUM_FILAS }).map((_, i) => (
              <tr key={i}>
                {/* Nombre */}
                <td style={{ ...s.cell, color: "#aaa", fontSize: "7px", paddingLeft: "3px" }}>{i + 1}</td>
                {/* Lunes–Viernes: Labor(9px) | Lote(9px) | Cant(7.5px) — borde grueso en Labor */}
                {Array.from({ length: 15 }).map((__, j) => (
                  <td key={j} style={
                    j % 3 === 0 ? { ...s.cell, borderLeft: "4px solid #000" } :
                    j % 3 === 2 ? s.cellSmall : s.cell
                  } />
                ))}
                {/* Sábado: Labor, Lote, Cant., 1/2 */}
                <td style={{ ...s.cell, borderLeft: "4px solid #000" }} />
                <td style={s.cell} />
                <td style={s.cellSmall} />
                <td style={{ ...s.cellSmall, textAlign: "center" }} />
                {/* Cobro */}
                <td style={{ ...s.cellSmall, borderLeft: "4px solid #000", textAlign: "center" }} />
                {/* Valor */}
                <td style={s.cell} />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pie — Observaciones como tabla */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "6px" }}>
          <colgroup>
            <col style={{ width: "80px" }} />
            <col />
          </colgroup>
          <tbody>
            <tr style={{ height: "20px" }}>
              <td rowSpan={3} style={{
                border: "1px solid #000", fontWeight: "bold", fontSize: "8px",
                paddingLeft: "4px", verticalAlign: "top", paddingTop: "4px",
              }}>
                Observaciones:
              </td>
              <td style={{ border: "1px solid #000" }} />
            </tr>
            <tr style={{ height: "20px" }}>
              <td style={{ border: "1px solid #000" }} />
            </tr>
            <tr style={{ height: "20px" }}>
              <td style={{ border: "1px solid #000" }} />
            </tr>
          </tbody>
        </table>

        {/* Fecha entrega — al fondo */}
        <div style={{ marginTop: "6px", fontSize: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Fecha entrega: {line(100)}</span>
          <span style={{ color: "#999" }}>Finca El Cielo</span>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: A4 landscape; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

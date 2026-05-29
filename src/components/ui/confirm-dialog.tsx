"use client"

import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "default"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = "Confirmar acción",
  message,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {variant === "danger" && (
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
              variant === "danger"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

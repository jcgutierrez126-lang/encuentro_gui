"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getUser, saveAuth, getToken, getRoleLabel, type AuthUser } from "@/lib/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User, Mail, Shield, Camera, Key, Calendar,
  Clock, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react"

const BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL ?? "")
const ME_URL = "/api/v1/users/me/"

async function compressImage(file: File, maxPx = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.src = url
  })
}

async function apiPatch(path: string, body: object, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.detail || "Error desconocido")
  return data
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || "Error")
  return data
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function AvatarPreview({ src, username }: { src: string; username: string }) {
  const dicebear = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=27272a&textColor=ffffff&fontSize=38`
  const [imgSrc, setImgSrc] = useState(src || dicebear)
  useEffect(() => { setImgSrc(src || dicebear) }, [src, dicebear])
  return (
    <div className="relative group">
      <div className="h-24 w-24 rounded-full ring-2 ring-border ring-offset-2 ring-offset-background overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={username} className="w-full h-full object-cover" onError={() => setImgSrc(dicebear)} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Camera className="h-5 w-5 text-foreground" />
      </div>
    </div>
  )
}

function StatusMsg({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
      type === "success"
        ? "bg-muted border-border text-foreground/80"
        : "bg-destructive/10 border-destructive/20 text-destructive"
    }`}>
      {type === "success"
        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      {msg}
    </div>
  )
}

function Section({ title, icon: Icon, description, children }: {
  title: string
  icon: React.ElementType
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Separator />
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [fullUser, setFullUser] = useState<AuthUser & { date_joined?: string; last_login?: string | null } | null>(null)

  const [avatarUrl, setAvatarUrl]   = useState("")
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarStatus, setAvatarStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const [email, setEmail]           = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStatus, setEmailStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const [oldPass, setOldPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [passLoading, setPassLoading] = useState(false)
  const [passStatus, setPassStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace("/login"); return }
    setUser(u)
    setEmail(u.email || "")
    setAvatarUrl(u.avatar_url || "")
    const token = getToken()
    if (token) {
      apiGet(ME_URL, token)
        .then(data => { setFullUser(data); setEmail(data.email || ""); setAvatarUrl(data.avatar_url || "") })
        .catch(() => {})
    }
  }, [router])

  if (!user) return null
  const token = getToken()!

  async function saveAvatar() {
    setAvatarLoading(true); setAvatarStatus(null)
    try {
      const updated = await apiPatch(ME_URL, { avatar_url: avatarUrl }, token)
      const stored = getUser()
      if (stored) {
        saveAuth(getToken()!, { ...stored, avatar_url: updated.avatar_url })
        window.dispatchEvent(new CustomEvent("cielo-user-updated"))
      }
      setAvatarStatus({ type: "success", msg: "Foto actualizada." })
    } catch (e: unknown) {
      setAvatarStatus({ type: "error", msg: e instanceof Error ? e.message : "Error al guardar" })
    } finally { setAvatarLoading(false) }
  }

  async function saveEmail() {
    setEmailLoading(true); setEmailStatus(null)
    try {
      const updated = await apiPatch(ME_URL, { email }, token)
      const stored = getUser()
      if (stored) saveAuth(getToken()!, { ...stored, email: updated.email })
      setEmailStatus({ type: "success", msg: "Email actualizado." })
    } catch (e: unknown) {
      setEmailStatus({ type: "error", msg: e instanceof Error ? e.message : "Error al guardar" })
    } finally { setEmailLoading(false) }
  }

  async function savePassword() {
    if (!newPass) return
    setPassLoading(true); setPassStatus(null)
    try {
      await apiPatch(ME_URL, { old_password: oldPass, password: newPass }, token)
      setPassStatus({ type: "success", msg: "Contraseña cambiada." })
      setOldPass(""); setNewPass("")
    } catch (e: unknown) {
      setPassStatus({ type: "error", msg: e instanceof Error ? e.message : "Error al cambiar contraseña" })
    } finally { setPassLoading(false) }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUrl(await compressImage(file))
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tu información personal y seguridad de la cuenta.</p>
      </div>

      {/* Identidad */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-5">
          <AvatarPreview src={avatarUrl || ""} username={user.username} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold">{user.username}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium uppercase tracking-wide">
                {getRoleLabel(user.role)}
              </span>
              {user.is_superuser && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Super
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {fullUser?.email || user.email || "Sin email"}
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Desde {fmt(fullUser?.date_joined)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Último acceso {fmt(fullUser?.last_login)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Foto de perfil */}
      <Section title="Foto de perfil" icon={Camera}
        description="Sube una foto o pega la URL de una imagen pública.">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <AvatarPreview src={avatarUrl} username={user.username} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Camera className="h-3 w-3" /> Subir foto
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-muted-foreground text-xs">URL de imagen (opcional)</Label>
            <Input
              value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://github.com/usuario.png"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Si se deja vacío se genera un avatar con tus iniciales.
            </p>
          </div>
        </div>
        {avatarStatus && <StatusMsg {...avatarStatus} />}
        <button
          onClick={saveAvatar} disabled={avatarLoading}
          className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {avatarLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar foto
        </button>
      </Section>

      {/* Info personal */}
      <Section title="Información personal" icon={User}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Usuario</Label>
            <Input value={user.username} disabled className="text-sm opacity-60" />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Rol</Label>
            <Input value={getRoleLabel(user.role)} disabled className="text-sm opacity-60" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com" className="text-sm" />
        </div>
        {emailStatus && <StatusMsg {...emailStatus} />}
        <button
          onClick={saveEmail} disabled={emailLoading}
          className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {emailLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar email
        </button>
      </Section>

      {/* Contraseña */}
      <Section title="Cambiar contraseña" icon={Key}
        description="Requiere tu contraseña actual para confirmar el cambio.">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Contraseña actual</Label>
          <Input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)}
            placeholder="••••••••" className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Nueva contraseña</Label>
          <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
            placeholder="••••••••" className="text-sm" />
        </div>
        {passStatus && <StatusMsg {...passStatus} />}
        <button
          onClick={savePassword} disabled={passLoading || !oldPass || !newPass}
          className="text-sm px-4 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {passLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Cambiar contraseña
        </button>
      </Section>

      {/* Sesión */}
      <Section title="Sesión activa" icon={Shield}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Usuario", value: user.username },
            { label: "Rol", value: getRoleLabel(user.role) },
            { label: "Tipo de cuenta", value: user.is_superuser ? "Superusuario" : "Estándar" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-muted-foreground text-xs mb-1">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
        <Separator />
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Miembro desde: <span className="text-foreground">{fmt(fullUser?.date_joined)}</span></p>
          <p>Último acceso: <span className="text-foreground">{fmt(fullUser?.last_login)}</span></p>
        </div>
      </Section>
    </div>
  )
}

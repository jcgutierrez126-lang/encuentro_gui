export interface AuthUser {
  id: number
  username: string
  email: string
  role: "administrador" | "asesor"
  is_superuser: boolean
  avatar_url?: string
  date_joined?: string
  last_login?: string | null
}

const TOKEN_KEY = "cielo_access"
const USER_KEY = "cielo_user"

export function saveAuth(access: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  document.cookie = `cielo_token=1; path=/; max-age=${8 * 3600}; SameSite=Lax`
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = "cielo_token=; path=/; max-age=0"
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  asesor: "Asesor",
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

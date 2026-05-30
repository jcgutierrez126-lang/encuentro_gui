"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavLinks } from "@/components/dashboard/nav-links"
import { Button } from "@/components/ui/button"
import { getUser, clearAuth, getRoleLabel, type AuthUser } from "@/lib/auth"
import { LogOut, Clock } from "lucide-react"
import Image from "next/image"

function LiveClock() {
  const [time, setTime] = useState<string>("")
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  if (!time) return null
  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/35 font-mono tabular-nums">
      <Clock className="h-3 w-3" />
      {time}
    </div>
  )
}

function UserAvatar({ user, size = 28 }: { user: AuthUser; size?: number }) {
  const dicebear = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.username)}&backgroundColor=3f3f46&textColor=ffffff&fontSize=38`
  const src = user.avatar_url || dicebear
  return (
    <div
      className="flex-shrink-0 rounded-full ring-1 ring-white/20 overflow-hidden bg-white/10"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={user.username} width={size} height={size}
        className="w-full h-full object-cover"
        onError={(e) => { const t = e.currentTarget; if (t.src !== dicebear) t.src = dicebear }}
      />
    </div>
  )
}

function UserBadge({ user }: { user: AuthUser }) {
  return (
    <Link href="/profile" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
      <UserAvatar user={user} size={28} />
      <div className="hidden sm:flex flex-col min-w-0">
        <span className="text-[11px] font-semibold text-white/80 leading-none truncate max-w-[110px]">
          {user.username}
        </span>
        <span className="text-[9px] text-white/35 font-medium uppercase tracking-wider leading-none mt-0.5">
          {getRoleLabel(user.role)}
        </span>
      </div>
    </Link>
  )
}

function SidebarBrand() {
  const { collapsed } = useSidebar()
  return (
    <Link
      href="/resumen"
      className={`flex items-center hover:opacity-80 transition-opacity overflow-hidden ${collapsed ? "justify-center" : "gap-2.5"}`}
    >
      <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg overflow-hidden"
        style={{ background: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.22)" }}>
        <Image src="/logo-encuentro.png" alt="El Encuentro" width={28} height={28} className="object-contain" />
      </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="text-sm font-bold text-sidebar-foreground leading-tight whitespace-nowrap">El Encuentro</span>
          <span className="text-[9px] text-sidebar-foreground/40 font-medium uppercase tracking-wider whitespace-nowrap">Café Tostado</span>
        </div>
      )}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace("/login"); return }
    setUser(u)

    const refresh = () => { const updated = getUser(); if (updated) setUser(updated) }
    window.addEventListener("encuentro-user-updated", refresh)
    return () => window.removeEventListener("encuentro-user-updated", refresh)
  }, [router])

  function handleLogout() {
    clearAuth()
    router.replace("/login")
  }

  if (!user) return null

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="h-14 flex items-center px-3 border-b border-sidebar-border/50 shrink-0">
          <SidebarBrand />
        </SidebarHeader>

        <SidebarContent>
          <NavLinks />
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between px-4 lg:px-6 bg-sidebar border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-white/50 hover:text-white hover:bg-white/8" />
          </div>

          <div className="flex items-center gap-3">
            <LiveClock />
            <div className="hidden sm:block h-4 w-px bg-white/10" />
            <ThemeToggle />
            <div className="h-5 w-px bg-white/10" />
            <UserBadge user={user} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="gap-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 h-8 px-2 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Salir</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

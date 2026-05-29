"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type SidebarContextValue = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function Sidebar({ className, children }: { className?: string; children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[220px]",
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex-shrink-0", className)}>{children}</div>
}

export function SidebarContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex-1 overflow-y-auto", className)}>{children}</div>
}

export function SidebarFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex-shrink-0", className)}>{children}</div>
}

export function SidebarInset({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-1 flex-col min-w-0 overflow-hidden", className)}>{children}</div>
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { collapsed, setCollapsed } = useSidebar()
  return (
    <button
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
        className
      )}
      aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-transform duration-300", collapsed ? "rotate-180" : "")}
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m16 15-3-3 3-3" />
      </svg>
    </button>
  )
}

export function SidebarMenu({ className, children }: { className?: string; children: React.ReactNode }) {
  return <ul className={cn("flex flex-col gap-0.5 px-2 py-1", className)}>{children}</ul>
}

export function SidebarMenuItem({ className, children }: { className?: string; children: React.ReactNode }) {
  return <li className={cn("list-none", className)}>{children}</li>
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
}

export function SidebarMenuButton({ className, asChild, isActive, children, ...props }: SidebarMenuButtonProps) {
  const { collapsed } = useSidebar()
  const btnClass = cn(
    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
    collapsed && "justify-center px-0",
    className
  )

  if (asChild) {
    return <div className={btnClass}>{children}</div>
  }

  return (
    <button className={btnClass} {...props}>
      {children}
    </button>
  )
}

export function SidebarGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("py-1", className)}>{children}</div>
}

export function SidebarGroupLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  if (collapsed) return null
  return (
    <p className={cn("px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50", className)}>
      {children}
    </p>
  )
}

export function SidebarGroupContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>
}

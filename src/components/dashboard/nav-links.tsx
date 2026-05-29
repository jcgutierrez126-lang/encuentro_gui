"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FlaskConical,
  Truck,
  Users,
  Wallet,
  TrendingDown,
  Building2,
  Coffee,
  Leaf,
  Settings,
  UserCircle,
  Landmark,
} from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { getUser, isAdmin } from "@/lib/auth"

const topLinks = [
  { href: "/resumen", label: "Resumen", icon: LayoutDashboard },
]

// Módulos siempre visibles
const groupsCafe = {
  id: "cafe",
  label: "Café",
  icon: Coffee,
  links: [
    { href: "/cafe/ventas",     label: "Ventas",     icon: ShoppingBag },
    { href: "/cafe/inventario", label: "Inventario", icon: Package },
    { href: "/cafe/procesos",   label: "Procesos",   icon: FlaskConical },
    { href: "/cafe/compras",    label: "Compras",    icon: Truck },
    { href: "/cafe/clientes",   label: "Clientes",   icon: Users },
  ],
}

// Finanzas: solo lo especificado en el proyecto
const groupsFinanzas = {
  id: "finanzas",
  label: "Finanzas",
  icon: Wallet,
  links: [
    { href: "/finanzas/cuentas",    label: "Cuentas",    icon: Landmark },
    { href: "/finanzas/egresos",    label: "Egresos",    icon: TrendingDown },
    { href: "/finanzas/proveedores",label: "Proveedores",icon: Building2 },
  ],
}

// Maestros: solo visible para administradores
const groupsMaestros = {
  id: "maestros",
  label: "Maestros",
  icon: Leaf,
  links: [
    { href: "/cafe/vendedores", label: "Vendedores", icon: Users },
    { href: "/cafe/productos",  label: "Productos",  icon: Package },
    { href: "/cafe/calidades",  label: "Calidades",  icon: Coffee },
  ],
}

const bottomLinks = [
  { href: "/profile",  label: "Mi perfil",     icon: UserCircle },
  { href: "/settings", label: "Configuración", icon: Settings },
]

function activeGroups(pathname: string, groups: typeof groupsCafe[]) {
  return groups.find(g => g.links.some(l => pathname === l.href || pathname.startsWith(l.href + "/")))?.id
}

export function NavLinks() {
  const pathname = usePathname()
  const { collapsed } = useSidebar()
  const [open, setOpen] = useState<string | undefined>()
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    const user = getUser()
    setAdmin(isAdmin(user))
    const groups = [groupsCafe, groupsFinanzas, ...(isAdmin(user) ? [groupsMaestros] : [])]
    const active = activeGroups(pathname, groups)
    if (active) setOpen(active)
  }, [pathname])

  const groups = [groupsCafe, groupsFinanzas, ...(admin ? [groupsMaestros] : [])]

  const renderLink = (item: { href: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={item.href} className={cn("flex items-center gap-2 w-full", collapsed && "justify-center")}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1">{item.label}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>General</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>{topLinks.map(renderLink)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {!collapsed && (
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="w-full">
              {groups.map(group => {
                const GroupIcon = group.icon
                const isGroupActive = group.links.some(l => pathname === l.href || pathname.startsWith(l.href + "/"))
                return (
                  <AccordionItem key={group.id} value={group.id} className="border-none">
                    <AccordionTrigger className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline [&>svg.lucide-chevron-down]:ml-auto [&>svg.lucide-chevron-down]:flex-shrink-0",
                      isGroupActive && "bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium"
                    )}>
                      <GroupIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{group.label}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-0.5">
                      <div className="ml-3 border-l border-sidebar-border pl-3 flex flex-col gap-0.5 py-1">
                        <SidebarMenu>{group.links.map(renderLink)}</SidebarMenu>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {collapsed && (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{groups.flatMap(g => g.links).map(renderLink)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <SidebarGroup className="mt-auto border-t border-sidebar-border pt-2">
        <SidebarGroupContent>
          <SidebarMenu>{bottomLinks.map(renderLink)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

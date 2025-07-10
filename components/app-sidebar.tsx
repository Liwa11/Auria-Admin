"use client"

import {
  BarChart3,
  Users,
  Megaphone,
  Building2,
  UserCheck,
  Phone,
  FileText,
  Settings,
  Activity,
  PieChart,
  Menu,
  Brain,
  MapPin,
  LogOut,
  User,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Gebruikersbeheer",
    url: "/gebruikersbeheer",
    icon: Users,
  },
  {
    title: "Regio's",
    url: "/regios",
    icon: MapPin,
  },
  {
    title: "Campagnes",
    url: "/campagnes",
    icon: Megaphone,
  },
  {
    title: "Klanten",
    url: "/klanten",
    icon: Building2,
  },
  {
    title: "Verkopers",
    url: "/verkopers",
    icon: UserCheck,
  },
  {
    title: "Gesprekken",
    url: "/gesprekken",
    icon: Phone,
  },
  {
    title: "Belscherm",
    url: "/belscherm",
    icon: FileText,
  },
  {
    title: "Instellingen",
    url: "/instellingen",
    icon: Settings,
  },
  {
    title: "Logs",
    url: "/logs",
    icon: Activity,
  },
  {
    title: "Rapporten",
    url: "/rapporten",
    icon: PieChart,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="bg-gray-800 border-r border-gray-700">
      <SidebarHeader className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Auria</h1>
                <p className="text-xs text-gray-400">by Impact IQ</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-2 rounded-lg bg-green-600 mx-auto">
              <Brain className="h-6 w-6 text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 flex flex-col h-full">
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={isCollapsed ? item.title : undefined}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 data-[active=true]:bg-green-600 data-[active=true]:text-white rounded-lg transition-colors"
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

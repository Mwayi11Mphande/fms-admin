"use client"

import * as React from "react"
import {
  Settings2,
  Users,
  Truck,
  Calendar,
  Wrench,
  Fuel,
  Navigation,
  Bell,
  Link2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Logo } from "./logo"

// This is sample data.
const data = {
  user: {
    name: "Administrator",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "EAGLE TFH",
      logo: Logo,
      plan: "Administrator",
    },
  ],
  navMain: [
    {
      title: "Admin Dashboard",
      url: "/dashboard",
      icon: Settings2,
      isActive: true,

    },
    {
      title: "Driver Management",
      url: "/dashboard/driver_m",
      icon: Users,
      isActive: true,

    },
    {
      title: "Vehicle Management",
      url: "/dashboard/v-ma",
      icon: Truck,
    },
    {
      title: "Scheduling",
      url: "/dashboard/schedule",
      icon: Calendar,
      isActive: true,

    },
    {
      title: "Maintenance Tracking",
      url: "/dashboard/maintain-trac",
      icon: Wrench,
      isActive: true,

    },
    {
      title: "Fuel Management",
      url: "/dashboard/fuel-man",
      icon: Fuel,
      isActive: true,

    },
    {
      title: "Assignments",
      url: "/dashboard/assignments",
      icon: Link2,
      isActive: true,
    },
    {
      title: "Vehicle Tracking",
      url: "/dashboard/v-tracking",
      icon: Navigation,
      isActive: true,
    },
    {
      title: "Trace Driver",
      url: "/dashboard/v-tracking/drivers",
      icon: Navigation,
      isActive: true,
    },
    {
      title: "Notifications & Alerts",
      url: "/dashboard/noti-alerts",
      icon: Bell,
      isActive: true,

    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      isActive: true,

    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {/* footer */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
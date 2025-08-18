import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LineChart,
  Settings,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { Logo } from "@/components/shared/Logo";

const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/projects", icon: FolderKanban, label: "Projects" },
    { href: "/admin/clients", icon: Users, label: "Clients" },
    { href: "/admin/reports", icon: LineChart, label: "Reports" },
];

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/admin/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <div className="bg-primary rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-primary-foreground transition-all group-hover:scale-110"
              >
                <path d="M11.25 4.533A9.708 9.708 0 0 0 3 12a9.708 9.708 0 0 0 8.25 7.467c.928.146 1.825.233 2.75.233s1.822-.087 2.75-.233A9.708 9.708 0 0 0 21 12a9.708 9.708 0 0 0-8.25-7.467A10.153 10.153 0 0 0 12 4.5c-.928 0-1.825.087-2.75.233Z" />
                <path
                  fillRule="evenodd"
                  d="M12.75 2.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm-2.25 4.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75ZM11.25 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM12 15.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5H12.75a.75.75 0 0 1-.75-.75ZM15.75 12a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM12.75 18a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5h-.75a.75.75 0 0 1-.75-.75ZM9.75 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM12 9.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 0 1.5H12.75a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          <span className="sr-only">MotionMint Hub</span>
        </Link>
        <TooltipProvider>
        {navItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/admin/settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}

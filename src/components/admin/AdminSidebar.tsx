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
          <div className="rounded-full">
             <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-8 w-8 text-primary-foreground transition-all group-hover:scale-110"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="12" fill="#16a34a"></circle>
                <path
                  fill="#ffffff"
                  d="M6.2,16.8V9.3h1.7l1.4,2.8c0.4,0.7,0.7,1.4,0.9,2.1h0.1c-0.1-0.8-0.1-1.6-0.1-2.5V9.3h1.6v7.5H9.9L8.5,14c-0.4-0.8-0.7-1.5-0.9-2.2h-0.1c0.1,0.8,0.1,1.6,0.1,2.5v2.5H6.2z M12.5,16.8V9.3h1.7l1.4,2.8c0.4,0.7,0.7,1.4,0.9,2.1h0.1c-0.1-0.8-0.1-1.6-0.1-2.5V9.3h1.6v7.5h-1.8l-1.4-2.8c-0.4-0.7-0.7-1.4-0.9-2.1h-0.1c0.1,0.8,0.1,1.6,0.1,2.5v2.5H12.5z M18.8,12c0,0.7-0.5,1.2-1.2,1.2s-1.2-0.5-1.2-1.2s0.5-1.2,1.2-1.2S18.8,11.3,18.8,12z"
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

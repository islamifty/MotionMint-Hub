
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/profile",
    icon: User
  },
  {
    title: "Notifications",
    href: "/settings",
    icon: Bell
  },
];

interface AccountLayoutProps {
  children: React.ReactNode;
}

export function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto py-8">
       <div className="space-y-6">
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Account Settings</h1>
                <p className="text-muted-foreground">
                Manage your account settings and preferences.
                </p>
            </div>
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                    {sidebarNavItems.map((item) => (
                    <Button
                        key={item.href}
                        asChild
                        variant="ghost"
                        className={cn(
                        "w-full justify-start",
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline"
                        )}
                    >
                        <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.title}
                        </Link>
                    </Button>
                    ))}
                </nav>
                </aside>
                <div className="flex-1 lg:max-w-4xl">{children}</div>
            </div>
       </div>
    </div>
  );
}


"use client";
import dynamic from 'next/dynamic';
import { Logo } from "@/components/shared/Logo";
import { Skeleton } from "@/components/ui/skeleton";

const UserNav = dynamic(() => import('@/components/shared/UserNav').then(mod => mod.UserNav), {
  ssr: false,
  loading: () => <Skeleton className="h-9 w-9 rounded-full" />,
});

export function ClientHeader() {  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}

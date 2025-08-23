
"use client";

import dynamic from 'next/dynamic';
import { ClientHeader } from "@/components/client/ClientHeader";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import UserNav to prevent SSR issues with its client-side hooks
const UserNav = dynamic(() => import('@/components/shared/UserNav').then(mod => mod.UserNav), {
  ssr: false,
  loading: () => <Skeleton className="h-9 w-9 rounded-full" />,
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-muted/40">
      <ClientHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

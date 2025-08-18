import { ClientHeader } from "@/components/client/ClientHeader";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ClientHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

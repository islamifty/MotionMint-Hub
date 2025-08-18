import { UserNav } from "@/components/shared/UserNav";
import { Logo } from "@/components/shared/Logo";
import { users } from "@/lib/data";

export function ClientHeader() {
  const clientUser = users["user-2"];
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <UserNav user={clientUser} />
          </nav>
        </div>
      </div>
    </header>
  );
}

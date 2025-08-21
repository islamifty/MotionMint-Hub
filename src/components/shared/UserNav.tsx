
"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { use, Suspense } from 'react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { User, Settings, LogOut } from "lucide-react";

async function fetchUser(refetch: () => Promise<void>) {
    await refetch();
    return true; // Return something to satisfy `use`
}


function UserNavContent() {
  const { currentUser, loading, refetchUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // This hook will suspend until the user is fetched on the client.
  use(fetchUser(refetchUser));

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Use window.location.href for a full page reload to ensure session is cleared
      window.location.href = '/login';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };
  
  if (!currentUser) {
    return (
      <Button variant="outline" onClick={() => router.push('/login')}>
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function UserNav() {
    return (
        <Suspense fallback={<Skeleton className="h-9 w-9 rounded-full" />}>
            <UserNavContent />
        </Suspense>
    )
}

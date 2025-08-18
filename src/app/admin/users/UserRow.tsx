
"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { makeUserClient } from "./actions";
import type { User } from "@/types";

export function UserRow({ user: initialUser }: { user: User }) {
  const { toast } = useToast();
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const isClient = user.role === 'client';
  const isAdmin = user.role === 'admin';

  const handleMakeClient = async () => {
    setIsLoading(true);
    const result = await makeUserClient(user);
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      // Optimistically update the UI to reflect the new role
      setUser(prevUser => ({...prevUser, role: 'client'}));
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{user.name || user.email}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell className="capitalize">{user.role}</TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMakeClient}
          disabled={isClient || isLoading || isAdmin}
        >
          {isLoading ? "Processing..." : (isClient ? "Already a Client" : (isAdmin ? "Admin User" : "Make Client"))}
        </Button>
      </TableCell>
    </TableRow>
  );
}

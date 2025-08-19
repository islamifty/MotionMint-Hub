"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { User } from "@/types";
import { UserActions } from "./UserActions";
import { getSession } from "@/lib/session";


export function UserRow({ user: initialUser, currentUserId }: { user: User, currentUserId: string }) {
  const [user, setUser] = useState(initialUser);

  const handleRoleChange = (newRole: 'admin' | 'client' | 'user') => {
    setUser(prevUser => ({ ...prevUser, role: newRole }));
  };
  
  return (
    <TableRow>
      <TableCell className="font-medium">{user.name || user.email || 'N/A'}</TableCell>
      <TableCell>{user.email || 'No email provided'}</TableCell>
      <TableCell className="capitalize">{user.role}</TableCell>
      <TableCell className="text-right">
        <UserActions user={user} onRoleChange={handleRoleChange} currentUserId={currentUserId} />
      </TableCell>
    </TableRow>
  );
}

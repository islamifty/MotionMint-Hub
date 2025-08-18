
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { clients } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getUsers, makeUserClient } from "./actions";
import type { User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

export default function UsersPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      if (!currentUser) {
        setIsLoadingUsers(false);
        return;
      }
      try {
        // Fetch users using the secure server action
        const userList = await getUsers(currentUser.email);
        setAllUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch users. Please try again.",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [toast, currentUser]);

  const clientEmails = new Set(clients.map(c => c.email));

  const handleMakeClient = async (user: User) => {
    setLoadingUserId(user.id);
    const result = await makeUserClient(user);
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      // Optimistically update the UI to reflect the new role
      setAllUsers(prevUsers => prevUsers.map(u => u.id === user.id ? {...u, role: 'client'} : u));
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setLoadingUserId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>
              List of all users who have signed up. You can promote a user to a client.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))
            ) : (
              allUsers.map((user) => {
                const isClient = clientEmails.has(user.email) || user.role === 'client';
                const isLoading = loadingUserId === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakeClient(user)}
                        disabled={isClient || isLoading || user.role === 'admin'}
                      >
                        {isLoading ? "Processing..." : (isClient ? "Already a Client" : "Make Client")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types";
import { updateUserRole, deleteUser } from "./actions";
import { adminEmails } from "@/lib/data";


interface UserActionsProps {
  user: User;
  onRoleChange: (newRole: 'admin' | 'client' | 'user') => void;
  currentUserId: string;
}

export function UserActions({ user, onRoleChange, currentUserId }: UserActionsProps) {
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMainAdmin = adminEmails.includes(user.email) && user.email === adminEmails[0];
  const isSelf = user.id === currentUserId;


  const handleRoleUpdate = async (newRole: 'admin' | 'client' | 'user') => {
    setIsSubmitting(true);
    const result = await updateUserRole(user.id, newRole);
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      onRoleChange(newRole);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteUser(user.id);
     if (result.success) {
      toast({
        title: "User Deleted",
        description: result.message,
      });
      // The parent component will handle removing the user from the list
       window.location.reload(); // Simple way to refresh the list
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
    setIsSubmitting(false);
    setIsAlertOpen(false);
  };
  
  if (isMainAdmin) {
    return null; // Don't show actions for the main admin
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role !== 'admin' && (
            <DropdownMenuItem onClick={() => handleRoleUpdate('admin')} disabled={isSubmitting}>
              Make Admin
            </DropdownMenuItem>
          )}
           {user.role !== 'client' && (
            <DropdownMenuItem onClick={() => handleRoleUpdate('client')} disabled={isSubmitting}>
              Make Client
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
           <DropdownMenuItem 
            className="text-red-600" 
            onClick={() => setIsAlertOpen(true)}
            disabled={isSubmitting || isSelf}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for <strong>{user.name}</strong> and remove their associated client profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

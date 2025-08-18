"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { deleteClients as deleteClientsAction, getClients } from "./actions";
import type { Client } from "@/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadClients() {
        const serverClients = await getClients();
        setClients(serverClients);
    }
    loadClients();
  }, []);

  const handleSelectionChange = (id: string, checked: boolean) => {
    setSelectedClients((prev) =>
      checked ? [...prev, id] : prev.filter((cId) => cId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map((c) => c.id));
    } else {
      setSelectedClients([]);
    }
  };
  
  const handleDelete = async () => {
    const result = await deleteClientsAction(selectedClients);
    if (result.success) {
      setClients((prev) => prev.filter(c => !selectedClients.includes(c.id)));
      setSelectedClients([]);
      toast({
        title: "Clients Deleted",
        description: `${selectedClients.length} client(s) have been successfully deleted.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete clients. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Manage your clients and view their project history.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
             {selectedClients.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-8 gap-1">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Delete ({selectedClients.length})
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the selected {selectedClients.length} client account(s), including their authentication record and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href="/admin/clients/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Client
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={clients.length > 0 && selectedClients.length === clients.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Joined Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} data-state={selectedClients.includes(client.id) && "selected"}>
                <TableCell>
                   <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => handleSelectionChange(client.id, !!checked)}
                    aria-label={`Select client ${client.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/admin/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.projectIds.length}</TableCell>
                <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

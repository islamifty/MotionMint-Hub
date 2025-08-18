
"use client";

import { useState } from "react";
import Link from "next/link";
import { File, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { projects as initialProjects } from "@/lib/data";
import type { Project } from "@/types";
import { deleteProjects } from "./actions";
import { useToast } from "@/hooks/use-toast";

const ProjectTable = ({ 
  projects,
  selectedProjects,
  onSelectionChange,
  onSelectAll
}: { 
  projects: Project[],
  selectedProjects: string[],
  onSelectionChange: (id: string, checked: boolean) => void,
  onSelectAll: (checked: boolean) => void
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-[40px]">
          <Checkbox
            checked={projects.length > 0 && selectedProjects.length === projects.length}
            onCheckedChange={(checked) => onSelectAll(!!checked)}
            aria-label="Select all"
          />
        </TableHead>
        <TableHead>Project</TableHead>
        <TableHead>Client</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Expiry Date</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {projects.map((project) => (
        <TableRow key={project.id} data-state={selectedProjects.includes(project.id) && "selected"}>
          <TableCell>
            <Checkbox
              checked={selectedProjects.includes(project.id)}
              onCheckedChange={(checked) => onSelectionChange(project.id, !!checked)}
              aria-label={`Select project ${project.title}`}
            />
          </TableCell>
          <TableCell className="font-medium">{project.title}</TableCell>
          <TableCell>{project.clientName}</TableCell>
          <TableCell>
            <Badge variant="outline">{project.paymentStatus}</Badge>
          </TableCell>
          <TableCell>{format(new Date(project.expiryDate), 'PPP')}</TableCell>
          <TableCell className="text-right">${project.amount.toLocaleString()}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("all");

  const handleSelectionChange = (id: string, checked: boolean) => {
    setSelectedProjects((prev) =>
      checked ? [...prev, id] : prev.filter((pId) => pId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    const currentProjects = getFilteredProjects(activeTab);
    if (checked) {
      setSelectedProjects(currentProjects.map((p) => p.id));
    } else {
      setSelectedProjects([]);
    }
  };
  
  const handleDelete = async () => {
    const result = await deleteProjects(selectedProjects);
    if (result.success) {
      // Optimistically update the UI
      setProjects((prev) => prev.filter(p => !selectedProjects.includes(p.id)));
      setSelectedProjects([]);
      toast({
        title: "Projects Deleted",
        description: `${selectedProjects.length} project(s) have been successfully deleted.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete projects. Please try again.",
      });
    }
  };
  
  const getFilteredProjects = (tab: string): Project[] => {
    switch(tab) {
      case 'paid': return projects.filter(p => p.paymentStatus === 'paid');
      case 'pending': return projects.filter(p => p.paymentStatus === 'pending');
      case 'overdue': return projects.filter(p => p.paymentStatus === 'overdue');
      default: return projects;
    }
  }
  
  const allProjects = getFilteredProjects("all");
  const paidProjects = getFilteredProjects("paid");
  const pendingProjects = getFilteredProjects("pending");
  const overdueProjects = getFilteredProjects("overdue");

  return (
    <Tabs defaultValue="all" onValueChange={(value) => { setActiveTab(value); setSelectedProjects([]); }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-headline font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and view their status.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedProjects.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="h-8 gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Delete ({selectedProjects.length})
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected {selectedProjects.length} project(s) and their associated files from Nextcloud.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link href="/admin/projects/new">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Project
              </span>
            </Link>
          </Button>
        </div>
      </div>

      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="paid">Paid</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="overdue">Overdue</TabsTrigger>
      </TabsList>

      <Card className="mt-4">
        <TabsContent value="all">
          <CardContent className="p-0">
            <ProjectTable projects={allProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
        <TabsContent value="paid">
          <CardContent className="p-0">
            <ProjectTable projects={paidProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
        <TabsContent value="pending">
          <CardContent className="p-0">
            <ProjectTable projects={pendingProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
        <TabsContent value="overdue">
          <CardContent className="p-0">
            <ProjectTable projects={overdueProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  );
}

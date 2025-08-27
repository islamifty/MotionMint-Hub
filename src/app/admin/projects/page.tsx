
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { File, PlusCircle, Trash2, Edit, Search } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";

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
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types";
import { deleteProjects, getProjects } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

// Utility to generate CSV from data
function generateCsv(data: Project[]) {
    if (data.length === 0) return "";
    const headers = "Project Title,Client Name,Status,Expiry Date,Amount (BDT),Created At\n";
    const rows = data.map(p => 
        `"${p.title.replace(/"/g, '""')}",` +
        `"${p.clientName.replace(/"/g, '""')}",` +
        `"${p.paymentStatus}",` +
        `"${format(new Date(p.expiryDate), "yyyy-MM-dd")}",` +
        `"${p.amount}",` +
        `"${format(new Date(p.createdAt), "yyyy-MM-dd")}"`
    ).join("\n");
    return headers + rows;
}

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
        <TableHead className="w-[80px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {projects.length > 0 ? projects.map((project) => (
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
          <TableCell>
            {format(new Date(project.expiryDate), "PP")}
          </TableCell>
          <TableCell className="text-right">{project.amount.toLocaleString()} BDT</TableCell>
          <TableCell className="text-right">
             <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                <Link href={`/admin/projects/edit/${project.id}`}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Link>
              </Button>
          </TableCell>
        </TableRow>
      )) : (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            No projects found for this filter.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  
  useEffect(() => {
    async function loadProjects() {
      const serverProjects = await getProjects();
      setProjects(serverProjects);
    }
    loadProjects();
  }, []);
  
  const handleSelectionChange = (id: string, checked: boolean) => {
    setSelectedProjects((prev) =>
      checked ? [...prev, id] : prev.filter((pId) => pId !== id)
    );
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        if (activeTab === "all") return true;
        return p.paymentStatus === activeTab;
      })
      .filter(p => 
        p.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
  }, [projects, activeTab, debouncedSearchTerm]);


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(filteredProjects.map((p) => p.id));
    } else {
      setSelectedProjects([]);
    }
  };
  
  const handleDelete = async () => {
    const result = await deleteProjects(selectedProjects);
    if (result.success) {
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
  
  const handleExport = () => {
    const csvData = generateCsv(filteredProjects);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `projects-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <Tabs defaultValue="all" onValueChange={(value) => { setActiveTab(value); setSelectedProjects([]); }}>
      <div className="space-y-4">
         <div>
          <h1 className="text-2xl font-headline font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and view their status.</p>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title or client..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center gap-2">
            {selectedProjects.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-9 gap-1">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete ({selectedProjects.length})</span>
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
            <Button size="sm" variant="outline" className="h-9 gap-1" onClick={handleExport}>
              <File className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
            <Button size="sm" className="h-9 gap-1" asChild>
              <Link href="/admin/projects/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Add Project</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
     

      <Card className="mt-4">
        <TabsContent value="all" className="mt-0">
          <CardContent className="p-0">
            <ProjectTable projects={filteredProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
        <TabsContent value="paid" className="mt-0">
          <CardContent className="p-0">
            <ProjectTable projects={filteredProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
        <TabsContent value="pending" className="mt-0">
          <CardContent className="p-0">
            <ProjectTable projects={filteredProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
        <TabsContent value="overdue" className="mt-0">
          <CardContent className="p-0">
            <ProjectTable projects={filteredProjects} selectedProjects={selectedProjects} onSelectionChange={handleSelectionChange} onSelectAll={handleSelectAll} />
          </CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  );
}

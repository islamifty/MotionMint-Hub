import {
    File,
    PlusCircle,
  } from "lucide-react"
  import Link from "next/link"
  
  import { Button } from "@/components/ui/button"
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
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
  import { Badge } from "@/components/ui/badge"
  import { projects } from "@/lib/data"
  import type { Project } from "@/types"
  
  const ProjectTable = ({ projects }: { projects: Project[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.title}</TableCell>
            <TableCell>{project.clientName}</TableCell>
            <TableCell>
              <Badge variant="outline">{project.paymentStatus}</Badge>
            </TableCell>
            <TableCell>{new Date(project.expiryDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">${project.amount.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  
  export default function ProjectsPage() {
    const allProjects = projects;
    const paidProjects = projects.filter(p => p.paymentStatus === 'paid');
    const pendingProjects = projects.filter(p => p.paymentStatus === 'pending');
    const overdueProjects = projects.filter(p => p.paymentStatus === 'overdue');

    return (
        <Tabs defaultValue="all">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-headline font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">Manage your projects and view their status.</p>
                </div>
                <div className="flex items-center gap-2">
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
                        <ProjectTable projects={allProjects} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="paid">
                    <CardContent className="p-0">
                        <ProjectTable projects={paidProjects} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="pending">
                    <CardContent className="p-0">
                        <ProjectTable projects={pendingProjects} />
                    </CardContent>
                </TabsContent>
                <TabsContent value="overdue">
                    <CardContent className="p-0">
                        <ProjectTable projects={overdueProjects} />
                    </CardContent>
                </TabsContent>
            </Card>
        </Tabs>
    )
  }
  


import { ProjectCard } from "@/components/client/ProjectCard";
import { readDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClientDashboard() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  
  const db = await readDb();
  const clientProjects = db.projects.filter(p => p.clientId === session.user.id);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">Your Projects</h1>
        <p className="text-muted-foreground">
          Here are the projects we are currently working on for you.
        </p>
      </div>
      {clientProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clientProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
            <CardDescription>
              There are currently no projects assigned to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Once a project is created for you by an administrator, it will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

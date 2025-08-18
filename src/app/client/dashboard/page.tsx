import { ProjectCard } from "@/components/client/ProjectCard";
import { projects } from "@/lib/data";

export default function ClientDashboard() {
  // In a real app, you would fetch projects for the currently logged-in user.
  const clientProjects = projects;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">Your Projects</h1>
        <p className="text-muted-foreground">
          Here are the projects we are currently working on for you.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clientProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

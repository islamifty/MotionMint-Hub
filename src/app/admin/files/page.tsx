
import { Loader2 } from "lucide-react";

export default function FileManagerRedirectPage() {
  return (
    <>
      <head>
        {/* This meta tag will perform the redirect without client-side hooks, making it build-friendly */}
        <meta http-equiv="refresh" content="0; url=/admin/files?path=/" />
      </head>
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirecting to File Manager...</span>
        </div>
      </div>
    </>
  );
}

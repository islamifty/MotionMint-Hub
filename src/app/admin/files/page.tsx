"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FileManagerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/files?path=/");
  }, [router]);

  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Redirecting to File Manager...</span>
      </div>
    </div>
  );
}

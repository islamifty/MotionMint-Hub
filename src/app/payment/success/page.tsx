"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentSuccessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to a safe, static page as we can't use searchParams here
    router.replace("/client/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Processing payment result...</span>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";

export default function ClientParams() {
  const params = useSearchParams();
  const message = params?.get("message");

  if (!message) return null;

  return (
    <p className="mt-2 text-sm text-muted-foreground">
      {message}
    </p>
  );
}

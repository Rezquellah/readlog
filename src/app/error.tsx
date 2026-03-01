"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm">The app hit an unexpected error while rendering this page.</p>
      <Button variant="outline" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}

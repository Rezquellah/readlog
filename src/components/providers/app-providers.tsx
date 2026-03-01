"use client";

import { type PropsWithChildren } from "react";

import { AppErrorBoundary } from "@/components/errors/app-error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/context/auth-context";
import { ReadingDataProvider } from "@/lib/context/reading-data-context";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <ReadingDataProvider>
          {children}
          <Toaster />
        </ReadingDataProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

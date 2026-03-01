"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { toast } from "sonner";

import { ReadLogLogo } from "@/components/layout/readlog-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth-context";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back.");
      const nextPath =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("next");
      const safeNext = nextPath && nextPath.startsWith("/") ? nextPath : "/";
      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <Card className="w-full border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3">
          <ReadLogLogo className="px-0" />
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <p className="text-sm text-slate-500">Access your synced reading log from any device.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

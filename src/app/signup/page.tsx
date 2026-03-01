"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { ReadLogLogo } from "@/components/layout/readlog-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth-context";

export default function SignUpPage() {
  const { signOut, signUp, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (user) {
      toast.error("Sign out first to create a different account.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password);
      toast.success("Account created. Check your email if confirmation is required.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create account.";
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
          <CardTitle className="text-2xl">Create account</CardTitle>
          <p className="text-sm text-slate-500">Start syncing your books, notes, and vocabulary across devices.</p>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="mb-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p>You are currently signed in as <strong>{user.email}</strong>.</p>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  toast.success("Signed out. You can create a new account now.");
                }}
              >
                Sign out to create a new account
              </Button>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm password</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { ReadLogLogo } from "@/components/layout/readlog-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/context/auth-context";

type AuthTab = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "signup") {
      setActiveTab("signup");
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password);
      toast.success("Account created. You can log in now.");
      setActiveTab("login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create account.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-6 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3">
          <ReadLogLogo className="px-0" />
          <CardTitle className="text-3xl">ReadLog</CardTitle>
          <p className="text-sm text-slate-600">
            ReadLog helps you build reading consistency by tracking books, chapter learnings,
            rich notes, and vocabulary in one place across all your devices.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">What you can do</p>
            <ul className="mt-2 space-y-1">
              <li>Track English and French libraries with progress and goals.</li>
              <li>Save chapter learnings, rich notes, and vocabulary per book.</li>
              <li>See momentum widgets: goals this week, next step, and streak.</li>
              <li>Access your data securely with Supabase authentication.</li>
            </ul>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-cyan-800">
            <BookOpenCheck className="h-4 w-4" />
            Create an account to start your personal synced reading workspace.
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 bg-white/95 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="auth-email-login">Email</Label>
                  <Input
                    id="auth-email-login"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password-login">Password</Label>
                  <Input
                    id="auth-password-login"
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
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="auth-email-signup">Email</Label>
                  <Input
                    id="auth-email-signup"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password-signup">Password</Label>
                  <Input
                    id="auth-password-signup"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password-confirm">Confirm password</Label>
                  <Input
                    id="auth-password-confirm"
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

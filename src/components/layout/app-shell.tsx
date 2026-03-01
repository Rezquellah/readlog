"use client";

import Link from "next/link";
import { useMemo, useState, type PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CirclePlus,
  Flashlight,
  Home,
  Languages,
  LoaderCircle,
  NotebookPen,
  Settings,
} from "lucide-react";

import { AddBookDialog } from "@/components/books/add-book-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { QuickAddModal } from "@/components/quick-add/quick-add-modal";
import { ReadLogLogo } from "@/components/layout/readlog-logo";
import { GlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { useReadingData } from "@/lib/context/reading-data-context";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "English Library",
    href: "/library/en",
    icon: BookOpen,
  },
  {
    label: "French Library",
    href: "/library/fr",
    icon: Languages,
  },
  {
    label: "Statistics",
    href: "/statistics",
    icon: BarChart3,
  },
  {
    label: "Weekly Review",
    href: "/weekly-review",
    icon: NotebookPen,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
        active
          ? "bg-slate-900 text-white shadow"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isLoaded, isPersisting } = useReadingData();
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const activeLabel = useMemo(
    () => NAV_ITEMS.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)))?.label ?? "ReadLog",
    [pathname],
  );

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.16),transparent_38%),linear-gradient(180deg,#f7fafc_0%,#f8fafc_52%,#eef2ff_100%)]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.16),transparent_38%),linear-gradient(180deg,#f7fafc_0%,#f8fafc_52%,#eef2ff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200/70 bg-white/75 p-5 backdrop-blur md:flex md:flex-col md:gap-6">
          <ReadLogLogo />

          <GlobalSearch />

          <div className="grid grid-cols-2 gap-2">
            <Button className="w-full justify-start gap-2" onClick={() => setIsAddBookOpen(true)}>
              <CirclePlus className="h-4 w-4" />
              Add Book
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsQuickAddOpen(true)}>
              <Flashlight className="h-4 w-4" />
              Quick Add
            </Button>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
              />
            ))}
          </nav>

          <div className="mt-auto space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Synced mode</p>
              <p className="mt-1">Data is stored in Supabase and available across your devices.</p>
            </div>
            <UserMenu />
            {isPersisting ? (
              <p className="mt-2 inline-flex items-center gap-1 text-cyan-700">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Saving changes...
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 hidden items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-8 py-3 backdrop-blur md:flex">
            <p className="text-sm font-semibold text-slate-900">{activeLabel}</p>
            <div className="flex items-center gap-2">
              <UserMenu />
              <Button variant="outline" onClick={() => setIsQuickAddOpen(true)}>
                <Flashlight className="h-4 w-4" />
                Quick Add
              </Button>
              <Button onClick={() => setIsAddBookOpen(true)}>
                <CirclePlus className="h-4 w-4" />
                Add Book
              </Button>
            </div>
          </header>

          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <ReadLogLogo className="px-0" />
              <div className="flex items-center gap-2">
                <UserMenu />
                <Button size="sm" variant="outline" onClick={() => setIsQuickAddOpen(true)}>
                  <Flashlight className="h-4 w-4" />
                  <span className="ml-1">Quick</span>
                </Button>
                <Button size="sm" onClick={() => setIsAddBookOpen(true)}>
                  <CirclePlus className="h-4 w-4" />
                  <span className="ml-1">Add</span>
                </Button>
              </div>
            </div>
            <p className="mb-2 text-sm font-semibold text-slate-900">{activeLabel}</p>
            <GlobalSearch />
          </header>

          <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:py-8">
            {isLoaded ? (
              children
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Loading your reading data...
              </div>
            )}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium",
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2 md:hidden">
        <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full border-slate-300 bg-white shadow-xl"
          onClick={() => setIsQuickAddOpen(true)}
        >
          <Flashlight className="h-5 w-5" />
          <span className="sr-only">Quick Add</span>
        </Button>
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl"
          onClick={() => setIsAddBookOpen(true)}
        >
          <CirclePlus className="h-5 w-5" />
          <span className="sr-only">Add Book</span>
        </Button>
      </div>

      <AddBookDialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen} />
      <QuickAddModal open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen} />
    </div>
  );
}

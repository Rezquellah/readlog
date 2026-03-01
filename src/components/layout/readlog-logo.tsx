"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface ReadLogLogoProps {
  className?: string;
  compact?: boolean;
}

export function ReadLogLogo({ className, compact = false }: ReadLogLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
        className,
      )}
      aria-label="Go to ReadLog dashboard"
    >
      <svg
        viewBox="0 0 56 56"
        className="h-10 w-10 shrink-0"
        role="img"
        aria-label="ReadLog logo"
      >
        <defs>
          <linearGradient id="readlog-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="48" height="48" rx="14" fill="url(#readlog-gradient)" />
        <path
          d="M16 17.5C16 15.6 17.6 14 19.5 14H31C36 14 40 18 40 23V36C40 37.7 38.7 39 37 39H19.5C17.6 39 16 37.4 16 35.5V17.5Z"
          fill="white"
          fillOpacity="0.94"
        />
        <path
          d="M23 22h12M23 27h12M23 32h7"
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="16.5" cy="39.5" r="4.5" fill="#22D3EE" />
      </svg>

      <div className={cn("min-w-0", compact && "sr-only")}> 
        <p className="text-xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-cyan-700">
          ReadLog
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Reading dashboard</p>
      </div>
    </Link>
  );
}

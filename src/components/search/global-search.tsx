"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpenText, FileText, Search, TextSelect } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useReadingData } from "@/lib/context/reading-data-context";
import { cn, languageLabel } from "@/lib/utils";

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const { search } = useReadingData();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => search(query), [query, search]);
  const showResults = focused && query.trim().length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 150);
          }}
          placeholder="Search books, notes, vocabulary"
          className="pl-9"
        />
      </div>

      {showResults ? (
        <div className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur">
          {results.length === 0 ? (
            <p className="p-2 text-sm text-slate-500">No matches found.</p>
          ) : null}

          {results.map((result) => {
            const href =
              result.type === "book"
                ? `/books/${result.bookId}`
                : result.type === "note"
                  ? `/books/${result.bookId}?tab=notes`
                  : `/books/${result.bookId}?tab=vocabulary`;

            return (
              <Link
                key={result.id}
                href={href}
                className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100"
                onClick={() => {
                  setQuery("");
                  setFocused(false);
                }}
              >
                <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5 text-slate-600">
                  {result.type === "book" ? (
                    <BookOpenText className="h-4 w-4" />
                  ) : result.type === "note" ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <TextSelect className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{result.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {languageLabel(result.language)} · {result.bookTitle}
                  </p>
                  {result.excerpt ? (
                    <p className="mt-0.5 truncate text-xs text-slate-400">{result.excerpt}</p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";

import { LibraryPage } from "@/components/books/library-page";
import { Card, CardContent } from "@/components/ui/card";
import { type BookLanguage } from "@/lib/types";

function normalizeLanguage(rawLanguage: string | string[] | undefined): BookLanguage | null {
  const firstValue = Array.isArray(rawLanguage) ? rawLanguage[0] : rawLanguage;
  const normalized = (firstValue || "").toUpperCase();

  if (normalized === "EN" || normalized === "FR") {
    return normalized;
  }

  return null;
}

export default function LibraryRoutePage() {
  const params = useParams<{ language: string }>();
  const language = normalizeLanguage(params?.language);

  if (!language) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-500">
          Invalid library route. Use <code>/library/en</code> or <code>/library/fr</code>.
        </CardContent>
      </Card>
    );
  }

  return <LibraryPage language={language} />;
}

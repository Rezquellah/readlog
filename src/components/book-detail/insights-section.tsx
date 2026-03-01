"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadingData } from "@/lib/context/reading-data-context";
import { stripHtml } from "@/lib/utils";

interface InsightsSectionProps {
  bookId: string;
}

function daysBetween(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  return diff;
}

export function InsightsSection({ bookId }: InsightsSectionProps) {
  const { getBook, getBookNote, getChapterNotes, getVocabEntries } = useReadingData();

  const book = getBook(bookId);
  const note = getBookNote(bookId);
  const chapters = getChapterNotes(bookId);
  const vocabEntries = getVocabEntries(bookId);

  if (!book) {
    return null;
  }

  const noteWordCount = note
    ? stripHtml(note.richTextContent)
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  const elapsedDays = daysBetween(book.createdAt, new Date().toISOString());
  const pace = (book.currentChapter / elapsedDays).toFixed(2);

  const stats = [
    {
      label: "Note word count",
      value: noteWordCount,
      hint: "Words in rich text notes",
    },
    {
      label: "Vocabulary items",
      value: vocabEntries.length,
      hint: "Words saved in this book",
    },
    {
      label: "Chapters logged",
      value: chapters.length,
      hint: "Chapter learning entries",
    },
    {
      label: "Reading pace",
      value: `${pace}/day`,
      hint: "Current chapter progression",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

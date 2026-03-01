"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadingData } from "@/lib/context/reading-data-context";
import { addDaysToIsoDate, todayIsoDate } from "@/lib/utils";

export default function WeeklyReviewPage() {
  const { data, getBook } = useReadingData();

  const today = todayIsoDate();
  const weekStart = addDaysToIsoDate(today, -6);

  const chapterLearnings = useMemo(
    () =>
      data.chapterNotes
        .filter((note) => note.updatedAt.slice(0, 10) >= weekStart)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.chapterNotes, weekStart],
  );

  const vocabThisWeek = useMemo(
    () =>
      data.vocabEntries
        .filter((entry) => entry.updatedAt.slice(0, 10) >= weekStart)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.vocabEntries, weekStart],
  );

  const exportMarkdown = () => {
    const lines: string[] = [];

    lines.push(`# ReadLog Weekly Review (${weekStart} to ${today})`);
    lines.push("");
    lines.push("## Chapter Learnings");

    if (!chapterLearnings.length) {
      lines.push("- No chapter learnings logged this week.");
    } else {
      chapterLearnings.forEach((note) => {
        const bookTitle = getBook(note.bookId)?.title || "Unknown Book";
        lines.push(
          `- **${bookTitle}** - Chapter ${note.chapterNumber}${
            note.chapterTitle ? ` (${note.chapterTitle})` : ""
          }: ${note.learnedText}`,
        );
      });
    }

    lines.push("");
    lines.push("## Vocabulary Added");

    if (!vocabThisWeek.length) {
      lines.push("- No vocabulary entries added this week.");
    } else {
      vocabThisWeek.forEach((entry) => {
        const bookTitle = getBook(entry.bookId)?.title || "Unknown Book";
        lines.push(
          `- **${entry.word}** (${bookTitle}): ${entry.meaning}${
            entry.example ? ` | Example: ${entry.example}` : ""
          }`,
        );
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `readlog-weekly-review-${today}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reflection</p>
        <h1 className="text-3xl font-bold text-slate-900">Weekly Review</h1>
        <p className="text-sm text-slate-600">
          What you learned this week from chapter notes and vocabulary captures.
        </p>
        <Button variant="outline" onClick={exportMarkdown}>
          <Download className="h-4 w-4" />
          Export Markdown
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chapter Learnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {chapterLearnings.length === 0 ? (
              <p className="text-sm text-slate-500">No chapter learnings logged this week.</p>
            ) : (
              chapterLearnings.map((note) => {
                const bookTitle = getBook(note.bookId)?.title || "Unknown Book";
                return (
                  <div key={note.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">{bookTitle}</p>
                    <p className="text-xs text-slate-500">
                      Chapter {note.chapterNumber}
                      {note.chapterTitle ? ` · ${note.chapterTitle}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{note.learnedText}</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vocabThisWeek.length === 0 ? (
              <p className="text-sm text-slate-500">No vocabulary entries added this week.</p>
            ) : (
              vocabThisWeek.map((entry) => {
                const bookTitle = getBook(entry.bookId)?.title || "Unknown Book";
                return (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{entry.word}</p>
                      <p className="text-xs text-slate-500">{bookTitle}</p>
                    </div>
                    <p className="text-sm text-slate-700">{entry.meaning}</p>
                    <p className="mt-1 text-xs italic text-slate-500">{entry.example}</p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookCopy,
  BookOpenText,
  Flame,
  Plus,
  Sigma,
  Target,
  TextSelect,
} from "lucide-react";

import { AddBookDialog } from "@/components/books/add-book-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReadingData } from "@/lib/context/reading-data-context";
import { calculateStreakDays, diffInDays, todayIsoDate } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { data } = useReadingData();
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [selectedBookForVocab, setSelectedBookForVocab] = useState<string>("");
  const [goalsWindow, setGoalsWindow] = useState<"7" | "14">("7");

  const stats = useMemo(() => {
    const englishBooks = data.books.filter((book) => book.language === "EN").length;
    const frenchBooks = data.books.filter((book) => book.language === "FR").length;
    const inProgress = data.books.filter((book) => book.status === "READING").length;
    const finished = data.books.filter((book) => book.status === "FINISHED").length;

    return {
      englishBooks,
      frenchBooks,
      inProgress,
      finished,
      totalVocabulary: data.vocabEntries.length,
    };
  }, [data.books, data.vocabEntries.length]);

  const continueReading = useMemo(
    () => [...data.books].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [data.books],
  );

  const lastEditedNoteBookId = useMemo(() => {
    if (!data.bookNotes.length) {
      return null;
    }

    return [...data.bookNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.bookId ?? null;
  }, [data.bookNotes]);

  const todayNextStepBook = useMemo(
    () =>
      [...data.books]
        .filter((book) => book.status !== "FINISHED")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
    [data.books],
  );

  const today = todayIsoDate();

  const goalsThisWeek = useMemo(() => {
    const windowDays = Number(goalsWindow);

    return data.books
      .filter((book) => Boolean(book.targetFinishDate) && book.status !== "FINISHED")
      .map((book) => {
        const days = diffInDays(today, book.targetFinishDate as string);
        return {
          book,
          days,
        };
      })
      .filter((item) => item.days <= windowDays)
      .sort((a, b) => a.days - b.days);
  }, [data.books, goalsWindow, today]);

  const streak = useMemo(
    () => calculateStreakDays(data.activityLogDays.map((day) => day.date)),
    [data.activityLogDays],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back to ReadLog</h1>
        <p className="text-sm text-slate-600">
          You are building consistency one page and one note at a time.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">English Books</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{stats.englishBooks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">French Books</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{stats.frenchBooks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Reading Now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{stats.inProgress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Finished</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{stats.finished}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Total Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{stats.totalVocabulary}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Goals this week</CardTitle>
            <Select value={goalsWindow} onValueChange={(value: "7" | "14") => setGoalsWindow(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="14">Next 14 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2">
            {goalsThisWeek.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No goals in this time window yet.
              </p>
            ) : (
              goalsThisWeek.map(({ book, days }) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className={`block rounded-xl border p-3 transition-colors ${
                    days < 0
                      ? "border-amber-300 bg-amber-50/70"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{book.title}</p>
                    <span className="text-xs text-slate-600">
                      {days < 0 ? `Overdue by ${Math.abs(days)}d` : `${days}d left`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Target: {book.targetFinishDate}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-amber-500" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-slate-900">{streak.current} day(s)</p>
            <p className="text-sm text-slate-600">Best streak: {streak.best} day(s)</p>
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              You are building consistency.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Continue Reading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {continueReading.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No books yet. Add your first book to start tracking progress.
              </div>
            ) : (
              continueReading.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{book.title}</p>
                    <p className="text-xs text-slate-500">
                      {book.currentChapter}/{book.totalChapters} chapters
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(book.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-cyan-600" />
              Today&apos;s next step
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayNextStepBook ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{todayNextStepBook.title}</p>
                  <p className="text-xs text-slate-600">
                    Chapter {todayNextStepBook.currentChapter}/{todayNextStepBook.totalChapters}
                  </p>
                </div>
                <Button
                  className="w-full justify-start"
                  onClick={() => router.push(`/books/${todayNextStepBook.id}`)}
                >
                  <BookOpenText className="h-4 w-4" />
                  Update progress
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/books/${todayNextStepBook.id}?tab=chapters`)}
                >
                  <BookCopy className="h-4 w-4" />
                  Add chapter learning
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push(`/books/${todayNextStepBook.id}?tab=vocabulary`)}
                >
                  <TextSelect className="h-4 w-4" />
                  Add vocabulary
                </Button>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No active books. Add a new one and start today.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button className="justify-start" onClick={() => setIsAddBookOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Book
              </Button>
              <Button variant="outline" onClick={() => router.push("/weekly-review")}> 
                <Sigma className="h-4 w-4" />
                Weekly Review
              </Button>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-800">Add vocabulary to a book</p>
              <Select value={selectedBookForVocab} onValueChange={setSelectedBookForVocab}>
                <SelectTrigger>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {data.books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                variant="outline"
                disabled={!selectedBookForVocab}
                onClick={() => {
                  if (!selectedBookForVocab) {
                    return;
                  }

                  router.push(`/books/${selectedBookForVocab}?tab=vocabulary`);
                }}
              >
                <TextSelect className="h-4 w-4" />
                Open Vocabulary
              </Button>
            </div>

            <Button
              className="w-full justify-start"
              variant="outline"
              disabled={!lastEditedNoteBookId}
              onClick={() => {
                if (!lastEditedNoteBookId) {
                  return;
                }

                router.push(`/books/${lastEditedNoteBookId}?tab=notes`);
              }}
            >
              <BookOpenText className="h-4 w-4" />
              Open last edited note
            </Button>
          </CardContent>
        </Card>
      </div>

      <AddBookDialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  PencilLine,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ChaptersSection } from "@/components/book-detail/chapters-section";
import { InsightsSection } from "@/components/book-detail/insights-section";
import { NotesSection } from "@/components/book-detail/notes-section";
import { VocabularySection } from "@/components/book-detail/vocabulary-section";
import { EditBookDialog } from "@/components/books/edit-book-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReadingData } from "@/lib/context/reading-data-context";
import { type BookStatus } from "@/lib/types";
import {
  computeProgress,
  diffInDays,
  languageLabel,
  statusLabel,
  todayIsoDate,
} from "@/lib/utils";

interface BookDetailPageProps {
  bookId: string;
}

export function BookDetailPage({ bookId }: BookDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    getBook,
    updateBook,
    markBookAsFinished,
    deleteBook,
    getChapterNotes,
    getVocabEntries,
    getBookNote,
  } = useReadingData();

  const book = getBook(bookId);

  const [totalChapters, setTotalChapters] = useState("1");
  const [currentChapter, setCurrentChapter] = useState("0");
  const [progressError, setProgressError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const initialTab = useMemo(() => {
    const requested = searchParams.get("tab");
    if (requested === "notes" || requested === "vocabulary" || requested === "insights") {
      return requested;
    }

    return "chapters";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!book) {
      return;
    }

    setTotalChapters(String(book.totalChapters));
    setCurrentChapter(String(book.currentChapter));
    setProgressError("");
  }, [book]);

  if (!book) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Book not found</h2>
          <p className="mt-2 text-sm text-slate-500">
            The selected book does not exist in your local library.
          </p>
          <Link
            href="/library/en"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Go to English Library
          </Link>
        </CardContent>
      </Card>
    );
  }

  const progress = computeProgress(book.currentChapter, book.totalChapters);
  const chapterCount = getChapterNotes(book.id).length;
  const vocabCount = getVocabEntries(book.id).length;
  const noteExists = Boolean(getBookNote(book.id));

  const today = todayIsoDate();
  const hasGoal = Boolean(book.targetFinishDate);
  const daysDelta = hasGoal ? diffInDays(today, book.targetFinishDate as string) : null;
  const chaptersRemaining = Math.max(0, book.totalChapters - book.currentChapter);
  const suggestedPace =
    hasGoal && book.totalChapters > 0
      ? chaptersRemaining / Math.max(1, daysDelta ?? 1)
      : null;

  const handleProgressUpdate = () => {
    setProgressError("");
    const parsedTotal = Number(totalChapters);
    const parsedCurrent = Number(currentChapter);

    if (Number.isNaN(parsedTotal) || parsedTotal < 1) {
      setProgressError("Total chapters must be 1 or more.");
      return;
    }

    if (Number.isNaN(parsedCurrent) || parsedCurrent < 0) {
      setProgressError("Current chapter must be 0 or more.");
      return;
    }

    if (parsedCurrent > parsedTotal) {
      setProgressError("Current chapter cannot exceed total chapters.");
      return;
    }

    updateBook(book.id, {
      totalChapters: parsedTotal,
      currentChapter: parsedCurrent,
      status:
        parsedCurrent === parsedTotal
          ? "FINISHED"
          : parsedCurrent > 0
            ? "READING"
            : book.status,
    });
    toast.success("Progress updated.");
  };

  const handleStatusChange = (status: BookStatus) => {
    updateBook(book.id, { status });
    toast.success("Book status updated.");
  };

  return (
    <div className="space-y-6">
      <Link
        href={book.language === "EN" ? "/library/en" : "/library/fr"}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {languageLabel(book.language)} Library
      </Link>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{languageLabel(book.language)}</Badge>
              <Badge
                variant={
                  book.status === "READING"
                    ? "reading"
                    : book.status === "FINISHED"
                      ? "finished"
                      : "planned"
                }
              >
                {statusLabel(book.status)}
              </Badge>
            </div>
            <CardTitle className="text-3xl">{book.title}</CardTitle>
            <p className="text-sm text-slate-600">{book.author || "Unknown author"}</p>
            <div className="flex flex-wrap items-center gap-2">
              {book.tags.length ? (
                book.tags.map((tag) => <Badge key={tag}>#{tag}</Badge>)
              ) : (
                <span className="text-xs text-slate-400">No tags</span>
              )}
            </div>
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              Created {new Date(book.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-52">
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <PencilLine className="h-4 w-4" />
              Edit Book
            </Button>

            {book.status !== "FINISHED" ? (
              <Button
                onClick={() => {
                  markBookAsFinished(book.id, todayIsoDate());
                  toast.success("Marked as finished.");
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as Finished
              </Button>
            ) : null}

            <Label>Status</Label>
            <Select value={book.status} onValueChange={(value: BookStatus) => handleStatusChange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">{statusLabel("PLANNED")}</SelectItem>
                <SelectItem value="READING">{statusLabel("READING")}</SelectItem>
                <SelectItem value="FINISHED">{statusLabel("FINISHED")}</SelectItem>
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-rose-600 hover:text-rose-700">
                  <Trash2 className="h-4 w-4" />
                  Delete Book
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this book?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the book, chapter notes, rich notes, and vocabulary entries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteBook(book.id);
                      toast.success("Book deleted.");
                      router.push(book.language === "EN" ? "/library/en" : "/library/fr");
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>
                Progress: Chapter {book.currentChapter}/{book.totalChapters}
              </span>
              <span className="font-semibold text-slate-900">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Total Chapters</Label>
              <Input
                type="number"
                min={1}
                value={totalChapters}
                onChange={(event) => setTotalChapters(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Chapter</Label>
              <Input
                type="number"
                min={0}
                value={currentChapter}
                onChange={(event) => setCurrentChapter(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleProgressUpdate} className="w-full">
                Update Progress
              </Button>
            </div>
          </div>

          {progressError ? <p className="text-sm text-rose-600">{progressError}</p> : null}

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Chapters logged</p>
              <p className="text-xl font-semibold text-slate-900">{chapterCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Vocabulary entries</p>
              <p className="text-xl font-semibold text-slate-900">{vocabCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Rich notes</p>
              <p className="text-xl font-semibold text-slate-900">{noteExists ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef2ff)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-700" />
              <p className="text-sm font-semibold text-slate-900">Goal</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Start date</p>
                <p className="text-sm font-medium text-slate-900">{book.startDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Target finish</p>
                <p className="text-sm font-medium text-slate-900">{book.targetFinishDate || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {(daysDelta ?? 0) >= 0 ? "Days remaining" : "Overdue by"}
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {hasGoal ? `${Math.abs(daysDelta ?? 0)} day(s)` : "No deadline"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Finished date</p>
                <p className="text-sm font-medium text-slate-900">{book.finishedDate || "Not finished"}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Goal progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-600">
                <CalendarClock className="h-3.5 w-3.5" />
                {hasGoal && suggestedPace !== null
                  ? `To finish by your goal, read ~${suggestedPace.toFixed(2)} chapters/day.`
                  : "Set start and target finish dates to get pacing guidance."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="chapters">
          <ChaptersSection bookId={book.id} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection bookId={book.id} />
        </TabsContent>

        <TabsContent value="vocabulary">
          <VocabularySection bookId={book.id} />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsSection bookId={book.id} />
        </TabsContent>
      </Tabs>

      <EditBookDialog open={isEditOpen} onOpenChange={setIsEditOpen} book={book} />
    </div>
  );
}

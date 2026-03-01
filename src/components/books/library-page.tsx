"use client";

import { useMemo, useState } from "react";
import { Grid3X3, List, SlidersHorizontal } from "lucide-react";

import { BookCard } from "@/components/books/book-card";
import { EditBookDialog } from "@/components/books/edit-book-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReadingData } from "@/lib/context/reading-data-context";
import { type Book, type BookLanguage } from "@/lib/types";
import { languageLabel, statusLabel } from "@/lib/utils";

type SortMode = "recent" | "title" | "progress" | "goal";

type StatusFilter = "ALL" | Book["status"];
type GoalFilter = "ALL" | "HAS_GOAL";

interface LibraryPageProps {
  language: BookLanguage;
}

export function LibraryPage({ language }: LibraryPageProps) {
  const { booksByLanguage } = useReadingData();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [goalFilter, setGoalFilter] = useState<GoalFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const books = booksByLanguage(language);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    books.forEach((book) => {
      book.tags.forEach((tag) => tags.add(tag));
    });

    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return books
      .filter((book) => {
        if (statusFilter !== "ALL" && book.status !== statusFilter) {
          return false;
        }

        if (tagFilter !== "ALL" && !book.tags.includes(tagFilter)) {
          return false;
        }

        if (goalFilter === "HAS_GOAL" && !book.targetFinishDate) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = `${book.title} ${book.author ?? ""} ${book.tags.join(" ")}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortMode === "title") {
          return a.title.localeCompare(b.title);
        }

        if (sortMode === "progress") {
          const aProgress = a.totalChapters ? a.currentChapter / a.totalChapters : 0;
          const bProgress = b.totalChapters ? b.currentChapter / b.totalChapters : 0;
          return bProgress - aProgress;
        }

        if (sortMode === "goal") {
          if (!a.targetFinishDate && !b.targetFinishDate) {
            return b.updatedAt.localeCompare(a.updatedAt);
          }
          if (!a.targetFinishDate) {
            return 1;
          }
          if (!b.targetFinishDate) {
            return -1;
          }
          return a.targetFinishDate.localeCompare(b.targetFinishDate);
        }

        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [books, goalFilter, query, sortMode, statusFilter, tagFilter]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Library</p>
        <h2 className="text-3xl font-bold text-slate-900">{languageLabel(language)} Books</h2>
        <p className="text-sm text-slate-600">
          Keep chapter learnings, rich notes, and vocabulary for every book.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-0">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search in this library"
              className="lg:col-span-2"
            />

            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="READING">{statusLabel("READING")}</SelectItem>
                <SelectItem value="FINISHED">{statusLabel("FINISHED")}</SelectItem>
                <SelectItem value="PLANNED">{statusLabel("PLANNED")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={goalFilter} onValueChange={(value: GoalFilter) => setGoalFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All goals</SelectItem>
                <SelectItem value="HAS_GOAL">Has goal date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Sort: Recent</SelectItem>
                <SelectItem value="title">Sort: Title</SelectItem>
                <SelectItem value="progress">Sort: Progress</SelectItem>
                <SelectItem value="goal">Sort: Goal date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredBooks.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No books found</h3>
            <p className="text-sm text-slate-500">
              Try adjusting filters, clearing search, or add a new {languageLabel(language).toLowerCase()} book.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-4"
          }
        >
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} view={viewMode} onEdit={setEditingBook} />
          ))}
        </div>
      )}

      {editingBook ? (
        <EditBookDialog
          open={Boolean(editingBook)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingBook(null);
            }
          }}
          book={editingBook}
        />
      ) : null}
    </div>
  );
}

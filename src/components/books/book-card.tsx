"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, PencilLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { type Book } from "@/lib/types";
import { computeProgress, diffInDays, languageLabel, statusLabel, todayIsoDate } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  view: "grid" | "list";
  onEdit?: (book: Book) => void;
}

function StatusBadge({ status }: { status: Book["status"] }) {
  const variant =
    status === "READING" ? "reading" : status === "FINISHED" ? "finished" : "planned";

  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

export function BookCard({ book, view, onEdit }: BookCardProps) {
  const progress = computeProgress(book.currentChapter, book.totalChapters);
  const isOverdue =
    Boolean(book.targetFinishDate) &&
    book.status !== "FINISHED" &&
    diffInDays(todayIsoDate(), book.targetFinishDate as string) < 0;

  return (
    <Card className="group relative h-full overflow-hidden border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-18px_rgba(15,23,42,0.35)]">
      <Link href={`/books/${book.id}`} className="absolute inset-0 z-10" aria-label={`Open ${book.title}`} />

      <div className="relative z-20 flex justify-end p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full bg-white/90"
              onClick={(event) => event.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Book actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault();
                onEdit?.(book);
              }}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Edit Book
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={view === "list" ? "-mt-2 flex" : "-mt-2 block"}>
        <div
          className={
            view === "list"
              ? "m-3 h-28 w-20 shrink-0 rounded-xl"
              : "m-3 h-44 w-auto rounded-xl"
          }
        >
          {book.cover ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <Image
                src={book.cover}
                alt={`${book.title} cover`}
                fill
                sizes={view === "list" ? "80px" : "320px"}
                className="object-cover"
                unoptimized
                loader={({ src }) => src}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-[linear-gradient(150deg,#0f172a,#1e3a8a)] text-2xl font-bold text-white">
              {book.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <CardHeader className="gap-2 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={book.status} />
              <Badge>{languageLabel(book.language)}</Badge>
              {book.targetFinishDate ? (
                <Badge variant={isOverdue ? "planned" : "default"}>
                  Goal {book.targetFinishDate}
                </Badge>
              ) : null}
            </div>
            <CardTitle className="line-clamp-2 text-base">{book.title}</CardTitle>
            <p className="text-sm text-slate-500">{book.author || "Unknown author"}</p>
          </CardHeader>

          <CardContent className="mt-auto space-y-2 pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Chapter {book.currentChapter}/{book.totalChapters}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{book.tags.length ? `#${book.tags[0]}` : "No tags"}</span>
              <span>
                Updated {formatDistanceToNow(new Date(book.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

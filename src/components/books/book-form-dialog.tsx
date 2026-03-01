"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReadingData } from "@/lib/context/reading-data-context";
import { type Book, type BookLanguage, type BookStatus } from "@/lib/types";
import {
  addDaysToIsoDate,
  languageLabel,
  normalizeTags,
  statusLabel,
  todayIsoDate,
} from "@/lib/utils";

export type BookFormMode = "create" | "edit";

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: BookFormMode;
  defaultLanguage?: BookLanguage;
  initialBook?: Book;
  onSuccess?: (bookId: string) => void;
}

interface BookFormState {
  title: string;
  author: string;
  cover: string;
  language: BookLanguage;
  status: BookStatus;
  tags: string;
  totalChapters: string;
  currentChapter: string;
  startDate: string;
  targetFinishDate: string;
  finishedDate: string;
}

function getCreateInitialState(defaultLanguage: BookLanguage): BookFormState {
  return {
    title: "",
    author: "",
    cover: "",
    language: defaultLanguage,
    status: "PLANNED",
    tags: "",
    totalChapters: "10",
    currentChapter: "0",
    startDate: "",
    targetFinishDate: "",
    finishedDate: "",
  };
}

function getEditInitialState(book: Book): BookFormState {
  return {
    title: book.title,
    author: book.author || "",
    cover: book.cover || "",
    language: book.language,
    status: book.status,
    tags: book.tags.join(", "),
    totalChapters: String(book.totalChapters),
    currentChapter: String(book.currentChapter),
    startDate: book.startDate || "",
    targetFinishDate: book.targetFinishDate || "",
    finishedDate: book.finishedDate || "",
  };
}

export function BookFormDialog({
  open,
  onOpenChange,
  mode,
  defaultLanguage = "EN",
  initialBook,
  onSuccess,
}: BookFormDialogProps) {
  const { addBook, updateBook, uploadCoverImage } = useReadingData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [form, setForm] = useState<BookFormState>(() =>
    mode === "edit" && initialBook
      ? getEditInitialState(initialBook)
      : getCreateInitialState(defaultLanguage),
  );
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const resetForm = () => {
    clearPreviewUrl();

    if (mode === "edit" && initialBook) {
      setForm(getEditInitialState(initialBook));
    } else {
      setForm(getCreateInitialState(defaultLanguage));
    }

    setSelectedCoverFile(null);
    setCoverPreviewUrl("");
    setError("");
    setIsSubmitting(false);
  };

  useEffect(
    () => () => {
      clearPreviewUrl();
    },
    [],
  );

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const isSubmitDisabled = useMemo(() => !form.title.trim(), [form.title]);

  const update = (patch: Partial<BookFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onCoverFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    clearPreviewUrl();

    const localPreviewUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = localPreviewUrl;

    setSelectedCoverFile(selectedFile);
    setCoverPreviewUrl(localPreviewUrl);
    toast.success("Cover uploaded.");

    event.target.value = "";
  };

  const removeCover = () => {
    clearPreviewUrl();
    setSelectedCoverFile(null);
    setCoverPreviewUrl("");
    update({ cover: "" });
    toast.success("Removed cover.");
  };

  const setGoalInDays = (days: number) => {
    const base = form.startDate || todayIsoDate();
    update({ targetFinishDate: addDaysToIsoDate(base, days) });
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    const totalChapters = Number(form.totalChapters);
    let currentChapter = Number(form.currentChapter);

    if (!form.title.trim()) {
      setError("Title is required.");
      setIsSubmitting(false);
      return;
    }

    if (Number.isNaN(totalChapters) || totalChapters < 1) {
      setError("Total chapters must be 1 or more.");
      setIsSubmitting(false);
      return;
    }

    if (Number.isNaN(currentChapter) || currentChapter < 0) {
      setError("Current chapter must be 0 or more.");
      setIsSubmitting(false);
      return;
    }

    if (currentChapter > totalChapters) {
      currentChapter = totalChapters;
      update({ currentChapter: String(totalChapters) });
      toast.warning("Current chapter was adjusted to match total chapters.", {
        description: "You lowered total chapters below the previous progress value.",
      });
    }

    if (form.startDate && form.targetFinishDate && form.targetFinishDate < form.startDate) {
      setError("Goal finish date must be on or after your start date.");
      setIsSubmitting(false);
      return;
    }

    if (
      form.status === "FINISHED" &&
      form.startDate &&
      form.finishedDate &&
      form.finishedDate < form.startDate
    ) {
      setError("Finished date must be on or after your start date.");
      setIsSubmitting(false);
      return;
    }

    try {
      let coverValue = form.cover.trim();
      if (selectedCoverFile) {
        coverValue = await uploadCoverImage(selectedCoverFile);
      }

      let bookId = initialBook?.id ?? "";
      const finishedDate =
        form.status === "FINISHED"
          ? form.finishedDate || todayIsoDate()
          : "";

      if (mode === "create") {
        bookId = addBook({
          language: form.language,
          title: form.title,
          author: form.author,
          cover: coverValue || undefined,
          status: form.status,
          tags: normalizeTags(form.tags),
          totalChapters,
          currentChapter,
          startDate: form.startDate || null,
          targetFinishDate: form.targetFinishDate || null,
          finishedDate: finishedDate || null,
        });
        toast.success("Book added.");
      } else if (initialBook) {
        updateBook(initialBook.id, {
          language: form.language,
          title: form.title,
          author: form.author,
          cover: coverValue || undefined,
          status: form.status,
          tags: normalizeTags(form.tags),
          totalChapters,
          currentChapter,
          startDate: form.startDate || null,
          targetFinishDate: form.targetFinishDate || null,
          finishedDate: finishedDate || null,
        });
        toast.success("Book updated.");

        bookId = initialBook.id;
      }

      handleDialogOpenChange(false);
      onSuccess?.(bookId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save book.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewSrc = coverPreviewUrl || form.cover;
  const hasCover = Boolean(previewSrc);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-5 py-4">
          <DialogTitle>{mode === "create" ? "Add Book" : "Edit Book"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a reading log entry with progress tracking, notes, vocabulary, and goals."
              : "Update book details, progress, and goal timeline without losing your content."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-4">
          <div className="grid gap-4 pb-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="book-title">Title</Label>
              <Input
                id="book-title"
                placeholder="Book title"
                value={form.title}
                onChange={(event) => update({ title: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-author">Author</Label>
              <Input
                id="book-author"
                placeholder="Optional"
                value={form.author}
                onChange={(event) => update({ author: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-cover">Cover URL</Label>
              <Input
                id="book-cover"
                placeholder="https://..."
                value={form.cover}
                onChange={(event) => {
                  setSelectedCoverFile(null);
                  setCoverPreviewUrl("");
                  clearPreviewUrl();
                  update({ cover: event.target.value });
                }}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Cover upload</Label>
                <div className="flex items-center gap-2">
                  {hasCover ? (
                    <Button type="button" size="sm" variant="outline" onClick={removeCover}>
                      <Trash2 className="h-4 w-4" />
                      Remove image
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload Image
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onCoverFileSelected}
              />

              <div className="h-[176px] w-[132px] max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                {hasCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt="Book cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(150deg,#f8fafc,#e2e8f0)]">
                    <div className="h-16 w-10 rounded-md border border-slate-300 bg-white shadow-sm" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Preview area is fixed to prevent layout shifts on large images.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={form.language}
                onValueChange={(value: BookLanguage) => update({ language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">{languageLabel("EN")}</SelectItem>
                  <SelectItem value="FR">{languageLabel("FR")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: BookStatus) =>
                  update({
                    status: value,
                    finishedDate:
                      value === "FINISHED"
                        ? form.finishedDate || todayIsoDate()
                        : "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">{statusLabel("PLANNED")}</SelectItem>
                  <SelectItem value="READING">{statusLabel("READING")}</SelectItem>
                  <SelectItem value="FINISHED">{statusLabel("FINISHED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="book-tags">Tags (comma separated)</Label>
              <Input
                id="book-tags"
                placeholder="learning, business"
                value={form.tags}
                onChange={(event) => update({ tags: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-total">Total Chapters</Label>
              <Input
                id="book-total"
                type="number"
                min={1}
                value={form.totalChapters}
                onChange={(event) => update({ totalChapters: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-current">Current Chapter</Label>
              <Input
                id="book-current"
                type="number"
                min={0}
                value={form.currentChapter}
                onChange={(event) => update({ currentChapter: event.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <p className="text-xs text-slate-500">
                Optional but recommended for tracking momentum.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="book-start-date">Started reading on</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => update({ startDate: todayIsoDate() })}
                >
                  Start today
                </Button>
              </div>
              <Input
                id="book-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => update({ startDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="book-target-date">Goal: finish by</Label>
              <Input
                id="book-target-date"
                type="date"
                value={form.targetFinishDate}
                onChange={(event) => update({ targetFinishDate: event.target.value })}
              />
              <div className="flex flex-wrap gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => setGoalInDays(7)}>
                  Goal in 7 days
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setGoalInDays(14)}>
                  14 days
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setGoalInDays(30)}>
                  30 days
                </Button>
              </div>
            </div>

            {form.status === "FINISHED" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="book-finished-date">Finished on</Label>
                <Input
                  id="book-finished-date"
                  type="date"
                  value={form.finishedDate}
                  onChange={(event) => update({ finishedDate: event.target.value })}
                />
              </div>
            ) : null}

            {error ? (
              <p className="inline-flex items-center gap-2 text-sm text-rose-600 sm:col-span-2">
                <TriangleAlert className="h-4 w-4" />
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled || isSubmitting}>
            {isSubmitting
              ? mode === "create"
                ? "Adding..."
                : "Saving..."
              : mode === "create"
                ? "Add Book"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

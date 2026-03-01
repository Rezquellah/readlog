"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReadingData } from "@/lib/context/reading-data-context";

interface ChaptersSectionProps {
  bookId: string;
}

interface ChapterFormState {
  id?: string;
  chapterNumber: string;
  chapterTitle: string;
  learnedText: string;
}

const EMPTY_FORM: ChapterFormState = {
  chapterNumber: "",
  chapterTitle: "",
  learnedText: "",
};

export function ChaptersSection({ bookId }: ChaptersSectionProps) {
  const { getChapterNotes, upsertChapterNote, deleteChapterNote } = useReadingData();

  const chapterNotes = getChapterNotes(bookId);
  const [form, setForm] = useState<ChapterFormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const handleEdit = (chapterId: string) => {
    const chapterNote = chapterNotes.find((note) => note.id === chapterId);
    if (!chapterNote) {
      return;
    }

    setForm({
      id: chapterNote.id,
      chapterNumber: String(chapterNote.chapterNumber),
      chapterTitle: chapterNote.chapterTitle || "",
      learnedText: chapterNote.learnedText,
    });
    setError("");
  };

  const handleSubmit = () => {
    setError("");
    const chapterNumber = Number(form.chapterNumber);

    if (Number.isNaN(chapterNumber) || chapterNumber <= 0) {
      setError("Chapter number must be greater than 0.");
      return;
    }

    try {
      upsertChapterNote({
        id: form.id,
        bookId,
        chapterNumber,
        chapterTitle: form.chapterTitle,
        learnedText: form.learnedText,
      });
      setForm(EMPTY_FORM);
      toast.success(isEditing ? "Chapter note updated." : "Chapter note added.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save chapter note.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? "Edit Chapter Learning" : "Add Chapter Learning"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chapter-number">Chapter Number</Label>
            <Input
              id="chapter-number"
              type="number"
              min={1}
              value={form.chapterNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, chapterNumber: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapter-title">Chapter Title (optional)</Label>
            <Input
              id="chapter-title"
              value={form.chapterTitle}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, chapterTitle: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="chapter-learning">What I learned</Label>
            <Textarea
              id="chapter-learning"
              value={form.learnedText}
              placeholder="Capture key insights from this chapter..."
              className="min-h-28"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, learnedText: event.target.value }))
              }
            />
          </div>

          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4" />
              {isEditing ? "Save Changes" : "Add Chapter Note"}
            </Button>
            {isEditing ? (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setError("");
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {chapterNotes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-500">
            No chapter notes yet. Start by adding what you learned.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapterNotes.map((chapterNote) => (
            <Card key={chapterNote.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base">
                    Chapter {chapterNote.chapterNumber}
                    {chapterNote.chapterTitle ? `: ${chapterNote.chapterTitle}` : ""}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Updated {new Date(chapterNote.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(chapterNote.id)}>
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete chapter note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteChapterNote(chapterNote.id);
                            toast.success("Chapter note deleted.");
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>

              <CardContent className="pt-0 text-sm leading-6 text-slate-700">
                {chapterNote.learnedText || "No content"}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

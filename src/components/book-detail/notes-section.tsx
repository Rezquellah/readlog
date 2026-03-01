"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { AppErrorBoundary } from "@/components/errors/app-error-boundary";
import { RichTextEditor } from "@/components/book-detail/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadingData } from "@/lib/context/reading-data-context";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";

interface NotesSectionProps {
  bookId: string;
}

export function NotesSection({ bookId }: NotesSectionProps) {
  const { getBookNote, setBookNoteContent, saveMediaBlob } = useReadingData();
  const savedNote = getBookNote(bookId);

  const [content, setContent] = useState(() => savedNote?.richTextContent || "<p></p>");
  const [status, setStatus] = useState<"saved" | "saving">("saved");
  const [savedAt, setSavedAt] = useState(() => savedNote?.updatedAt || "");

  const debouncedSave = useDebouncedCallback((nextContent: string) => {
    setBookNoteContent(bookId, nextContent);
    setStatus("saved");
    setSavedAt(new Date().toISOString());
  }, 700);

  const handleEditorChange = (nextContent: string) => {
    setContent(nextContent);
    setStatus("saving");
    debouncedSave(nextContent);
  };

  const savedLabel = useMemo(() => {
    if (!savedAt) {
      return "Saved";
    }

    return `Saved ${new Date(savedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [savedAt]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Book Notes</CardTitle>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {status === "saving" ? (
            <>
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {savedLabel}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AppErrorBoundary>
          <RichTextEditor
            content={content}
            onChange={handleEditorChange}
            onImageUpload={(file, dataUrl) => {
              saveMediaBlob({
                kind: "NOTE_IMAGE",
                bookId,
                mimeType: file.type || "image/*",
                dataUrl,
              });
            }}
          />
        </AppErrorBoundary>
      </CardContent>
    </Card>
  );
}

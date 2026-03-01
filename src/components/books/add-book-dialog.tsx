"use client";

import { useRouter } from "next/navigation";

import { BookFormDialog } from "@/components/books/book-form-dialog";
import { type BookLanguage } from "@/lib/types";

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLanguage?: BookLanguage;
}

export function AddBookDialog({
  open,
  onOpenChange,
  defaultLanguage = "EN",
}: AddBookDialogProps) {
  const router = useRouter();

  return (
    <BookFormDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      defaultLanguage={defaultLanguage}
      onSuccess={(bookId) => {
        router.push(`/books/${bookId}`);
      }}
    />
  );
}

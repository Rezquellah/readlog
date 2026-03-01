"use client";

import { BookFormDialog } from "@/components/books/book-form-dialog";
import { type Book } from "@/lib/types";

interface EditBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book;
}

export function EditBookDialog({ open, onOpenChange, book }: EditBookDialogProps) {
  return (
    <BookFormDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="edit"
      initialBook={book}
    />
  );
}

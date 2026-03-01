"use client";

import { useParams } from "next/navigation";

import { BookDetailPage } from "@/components/book-detail/book-detail-page";

export default function BookDetailRoutePage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params?.bookId;

  if (!bookId) {
    return null;
  }

  return <BookDetailPage bookId={bookId} />;
}

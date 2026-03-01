import type { SupabaseClient } from "@supabase/supabase-js";

import { type Book } from "@/lib/types";

interface BookRow {
  id: string;
  user_id: string;
  language: "EN" | "FR";
  title: string;
  author: string | null;
  cover_url: string | null;
  status: "READING" | "FINISHED" | "PLANNED";
  tags: string[] | null;
  total_chapters: number;
  current_chapter: number;
  start_date: string | null;
  target_finish_date: string | null;
  finished_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapBookRowToBook(row: BookRow): Book {
  return {
    id: row.id,
    language: row.language,
    title: row.title,
    author: row.author || undefined,
    cover: row.cover_url || undefined,
    status: row.status,
    tags: row.tags ?? [],
    totalChapters: row.total_chapters,
    currentChapter: row.current_chapter,
    startDate: row.start_date,
    targetFinishDate: row.target_finish_date,
    finishedDate: row.finished_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBookToRow(book: Book, userId: string) {
  return {
    id: book.id,
    user_id: userId,
    language: book.language,
    title: book.title,
    author: book.author ?? null,
    cover_url: book.cover ?? null,
    status: book.status,
    tags: book.tags,
    total_chapters: book.totalChapters,
    current_chapter: book.currentChapter,
    start_date: book.startDate,
    target_finish_date: book.targetFinishDate,
    finished_date: book.finishedDate,
    created_at: book.createdAt,
    updated_at: book.updatedAt,
  };
}

export async function listBooksByUser(supabase: SupabaseClient, userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapBookRowToBook(row as BookRow));
}

export async function upsertBookByUser(supabase: SupabaseClient, userId: string, book: Book) {
  const { error } = await supabase
    .from("books")
    .upsert(mapBookToRow(book, userId), { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function upsertBooksByUser(supabase: SupabaseClient, userId: string, books: Book[]) {
  if (!books.length) {
    return;
  }

  const { error } = await supabase
    .from("books")
    .upsert(books.map((book) => mapBookToRow(book, userId)), { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function deleteBookByUser(supabase: SupabaseClient, userId: string, bookId: string) {
  const { error } = await supabase
    .from("books")
    .delete()
    .eq("user_id", userId)
    .eq("id", bookId);

  if (error) {
    throw error;
  }
}

export async function deleteAllBooksByUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("books").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}

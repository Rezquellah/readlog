import type { SupabaseClient } from "@supabase/supabase-js";

import { type BookNote } from "@/lib/types";

interface BookNoteRow {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function mapRowToBookNote(row: BookNoteRow): BookNote {
  return {
    bookId: row.book_id,
    richTextContent: row.content,
    updatedAt: row.updated_at,
  };
}

function mapBookNoteToRow(note: BookNote, userId: string) {
  return {
    user_id: userId,
    book_id: note.bookId,
    content: note.richTextContent,
    created_at: note.updatedAt,
    updated_at: note.updatedAt,
  };
}

export async function listBookNotesByUser(supabase: SupabaseClient, userId: string): Promise<BookNote[]> {
  const { data, error } = await supabase
    .from("book_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToBookNote(row as BookNoteRow));
}

export async function upsertBookNoteByUser(
  supabase: SupabaseClient,
  userId: string,
  note: BookNote,
) {
  const { error } = await supabase
    .from("book_notes")
    .upsert(mapBookNoteToRow(note, userId), { onConflict: "book_id" });

  if (error) {
    throw error;
  }
}

export async function upsertBookNotesByUser(
  supabase: SupabaseClient,
  userId: string,
  notes: BookNote[],
) {
  if (!notes.length) {
    return;
  }

  const { error } = await supabase
    .from("book_notes")
    .upsert(notes.map((note) => mapBookNoteToRow(note, userId)), { onConflict: "book_id" });

  if (error) {
    throw error;
  }
}

export async function deleteAllBookNotesByUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("book_notes").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}

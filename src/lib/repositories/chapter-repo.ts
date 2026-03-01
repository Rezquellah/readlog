import type { SupabaseClient } from "@supabase/supabase-js";

import { type ChapterNote } from "@/lib/types";

interface ChapterNoteRow {
  id: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  chapter_title: string | null;
  learned_text: string;
  created_at: string;
  updated_at: string;
}

function mapRowToChapterNote(row: ChapterNoteRow): ChapterNote {
  return {
    id: row.id,
    bookId: row.book_id,
    chapterNumber: row.chapter_number,
    chapterTitle: row.chapter_title || undefined,
    learnedText: row.learned_text,
    updatedAt: row.updated_at,
  };
}

function mapChapterNoteToRow(note: ChapterNote, userId: string) {
  return {
    id: note.id,
    user_id: userId,
    book_id: note.bookId,
    chapter_number: note.chapterNumber,
    chapter_title: note.chapterTitle ?? null,
    learned_text: note.learnedText,
    created_at: note.updatedAt,
    updated_at: note.updatedAt,
  };
}

export async function listChapterNotesByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChapterNote[]> {
  const { data, error } = await supabase
    .from("chapter_notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToChapterNote(row as ChapterNoteRow));
}

export async function upsertChapterNoteByUser(
  supabase: SupabaseClient,
  userId: string,
  note: ChapterNote,
) {
  const { error } = await supabase
    .from("chapter_notes")
    .upsert(mapChapterNoteToRow(note, userId), { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function upsertChapterNotesByUser(
  supabase: SupabaseClient,
  userId: string,
  notes: ChapterNote[],
) {
  if (!notes.length) {
    return;
  }

  const { error } = await supabase
    .from("chapter_notes")
    .upsert(notes.map((note) => mapChapterNoteToRow(note, userId)), { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function deleteChapterNoteByUser(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
) {
  const { error } = await supabase
    .from("chapter_notes")
    .delete()
    .eq("user_id", userId)
    .eq("id", noteId);

  if (error) {
    throw error;
  }
}

export async function deleteAllChapterNotesByUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("chapter_notes").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}

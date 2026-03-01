import type { SupabaseClient } from "@supabase/supabase-js";

import { type VocabEntry } from "@/lib/types";

interface VocabEntryRow {
  id: string;
  user_id: string;
  book_id: string;
  word: string;
  meaning: string;
  example: string;
  chapter_number: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

function mapRowToVocab(row: VocabEntryRow): VocabEntry {
  return {
    id: row.id,
    bookId: row.book_id,
    word: row.word,
    meaning: row.meaning,
    example: row.example,
    chapterNumber: row.chapter_number ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVocabToRow(entry: VocabEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    book_id: entry.bookId,
    word: entry.word,
    meaning: entry.meaning,
    example: entry.example,
    chapter_number: entry.chapterNumber ?? null,
    tags: entry.tags,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

export async function listVocabEntriesByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<VocabEntry[]> {
  const { data, error } = await supabase
    .from("vocab_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRowToVocab(row as VocabEntryRow));
}

export async function upsertVocabEntryByUser(
  supabase: SupabaseClient,
  userId: string,
  entry: VocabEntry,
) {
  const { error } = await supabase
    .from("vocab_entries")
    .upsert(mapVocabToRow(entry, userId), { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function upsertVocabEntriesByUser(
  supabase: SupabaseClient,
  userId: string,
  entries: VocabEntry[],
) {
  if (!entries.length) {
    return;
  }

  const { error } = await supabase
    .from("vocab_entries")
    .upsert(entries.map((entry) => mapVocabToRow(entry, userId)), { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function deleteVocabEntryByUser(
  supabase: SupabaseClient,
  userId: string,
  entryId: string,
) {
  const { error } = await supabase
    .from("vocab_entries")
    .delete()
    .eq("user_id", userId)
    .eq("id", entryId);

  if (error) {
    throw error;
  }
}

export async function deleteAllVocabEntriesByUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("vocab_entries").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}

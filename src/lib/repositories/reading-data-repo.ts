import type { SupabaseClient } from "@supabase/supabase-js";

import { type ReadingData } from "@/lib/types";
import { EMPTY_READING_DATA } from "@/lib/storage/storage-adapter";
import {
  deleteAllBooksByUser,
  listBooksByUser,
  upsertBooksByUser,
} from "@/lib/repositories/book-repo";
import {
  deleteAllChapterNotesByUser,
  listChapterNotesByUser,
  upsertChapterNotesByUser,
} from "@/lib/repositories/chapter-repo";
import {
  deleteAllBookNotesByUser,
  listBookNotesByUser,
  upsertBookNotesByUser,
} from "@/lib/repositories/note-repo";
import {
  deleteAllVocabEntriesByUser,
  listVocabEntriesByUser,
  upsertVocabEntriesByUser,
} from "@/lib/repositories/vocab-repo";
import {
  createDefaultSettings,
  deleteAllActivityLogDaysByUser,
  listActivityLogDaysByUser,
  loadSettingsByUser,
  upsertActivityLogDaysByUser,
  upsertSettingsByUser,
} from "@/lib/repositories/settings-repo";

export async function loadReadingDataByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ReadingData> {
  const [books, chapterNotes, bookNotes, vocabEntries, settings, activityLogDays] =
    await Promise.all([
      listBooksByUser(supabase, userId),
      listChapterNotesByUser(supabase, userId),
      listBookNotesByUser(supabase, userId),
      listVocabEntriesByUser(supabase, userId),
      loadSettingsByUser(supabase, userId),
      listActivityLogDaysByUser(supabase, userId),
    ]);

  return {
    books,
    chapterNotes,
    bookNotes,
    vocabEntries,
    settings,
    mediaBlobs: [],
    activityLogDays,
  };
}

export async function clearReadingDataByUser(supabase: SupabaseClient, userId: string) {
  await Promise.all([
    deleteAllChapterNotesByUser(supabase, userId),
    deleteAllBookNotesByUser(supabase, userId),
    deleteAllVocabEntriesByUser(supabase, userId),
    deleteAllActivityLogDaysByUser(supabase, userId),
  ]);

  await deleteAllBooksByUser(supabase, userId);
  await upsertSettingsByUser(supabase, userId, createDefaultSettings());
}

export async function replaceReadingDataByUser(
  supabase: SupabaseClient,
  userId: string,
  data: ReadingData,
) {
  await clearReadingDataByUser(supabase, userId);

  await Promise.all([
    upsertBooksByUser(supabase, userId, data.books),
    upsertChapterNotesByUser(supabase, userId, data.chapterNotes),
    upsertBookNotesByUser(supabase, userId, data.bookNotes),
    upsertVocabEntriesByUser(supabase, userId, data.vocabEntries),
    upsertActivityLogDaysByUser(supabase, userId, data.activityLogDays),
  ]);

  await upsertSettingsByUser(supabase, userId, data.settings);
}

export function createEmptyReadingData(): ReadingData {
  return {
    ...EMPTY_READING_DATA,
    settings: createDefaultSettings(),
  };
}

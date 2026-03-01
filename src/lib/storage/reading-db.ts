import Dexie, { type Table } from "dexie";

import { EMPTY_READING_DATA } from "@/lib/storage/storage-adapter";
import {
  LEGACY_LOCAL_STORAGE_KEY,
  normalizeLoadedData,
} from "@/lib/storage/local-storage-adapter";
import {
  type ActivityLogDay,
  type AppSettings,
  type Book,
  type BookNote,
  type ChapterNote,
  type MediaBlobRecord,
  type ReadingActivityType,
  type ReadingData,
  type VocabEntry,
} from "@/lib/types";

export interface ReadingBackupFile {
  version: 2;
  exportedAt: string;
  data: ReadingData;
}

export function createDefaultSettings(): AppSettings {
  return {
    id: "app",
    cloudSyncEnabled: false,
    celebrationsEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeBook(rawBook: Partial<Book>): Book {
  return {
    id: rawBook.id || "",
    language: rawBook.language || "EN",
    title: rawBook.title || "",
    author: rawBook.author,
    cover: rawBook.cover,
    status: rawBook.status || "PLANNED",
    tags: Array.isArray(rawBook.tags) ? rawBook.tags : [],
    totalChapters: typeof rawBook.totalChapters === "number" ? rawBook.totalChapters : 1,
    currentChapter: typeof rawBook.currentChapter === "number" ? rawBook.currentChapter : 0,
    startDate: rawBook.startDate ?? null,
    targetFinishDate: rawBook.targetFinishDate ?? null,
    finishedDate: rawBook.finishedDate ?? null,
    createdAt: rawBook.createdAt || new Date().toISOString(),
    updatedAt: rawBook.updatedAt || new Date().toISOString(),
  };
}

function normalizeActivityLogDay(rawDay: Partial<ActivityLogDay>): ActivityLogDay {
  const allowedTypes: ReadingActivityType[] = [
    "PROGRESS_UPDATE",
    "CHAPTER_NOTE",
    "VOCAB_ENTRY",
    "BOOK_NOTE",
  ];

  const types = Array.isArray(rawDay.types)
    ? rawDay.types.filter((value): value is ReadingActivityType =>
        allowedTypes.includes(value as ReadingActivityType),
      )
    : [];

  return {
    date: rawDay.date || new Date().toISOString().slice(0, 10),
    count: typeof rawDay.count === "number" ? rawDay.count : 1,
    lastActivityAt: rawDay.lastActivityAt || new Date().toISOString(),
    types,
  };
}

export function normalizeReadingData(data: Partial<ReadingData> | null | undefined): ReadingData {
  if (!data) {
    return {
      ...EMPTY_READING_DATA,
      settings: createDefaultSettings(),
    };
  }

  return {
    books: Array.isArray(data.books) ? data.books.map((book) => normalizeBook(book)) : [],
    chapterNotes: Array.isArray(data.chapterNotes) ? data.chapterNotes : [],
    bookNotes: Array.isArray(data.bookNotes) ? data.bookNotes : [],
    vocabEntries: Array.isArray(data.vocabEntries) ? data.vocabEntries : [],
    settings:
      data.settings && typeof data.settings === "object"
        ? { ...createDefaultSettings(), ...data.settings }
        : createDefaultSettings(),
    mediaBlobs: Array.isArray(data.mediaBlobs) ? data.mediaBlobs : [],
    activityLogDays: Array.isArray(data.activityLogDays)
      ? data.activityLogDays.map((day) => normalizeActivityLogDay(day))
      : [],
  };
}

export class ReadLogDexie extends Dexie {
  books!: Table<Book, string>;
  chapterNotes!: Table<ChapterNote, string>;
  bookNotes!: Table<BookNote, string>;
  vocabEntries!: Table<VocabEntry, string>;
  settings!: Table<AppSettings, "app">;
  mediaBlobs!: Table<MediaBlobRecord, string>;
  activityLogDays!: Table<ActivityLogDay, string>;

  constructor(dbName = "readlog-indexeddb") {
    super(dbName);

    this.version(1).stores({
      books: "id, language, status, updatedAt",
      chapterNotes: "id, bookId, chapterNumber, updatedAt",
      bookNotes: "bookId, updatedAt",
      vocabEntries: "id, bookId, word, updatedAt",
    });

    this.version(2)
      .stores({
        books: "id, language, status, updatedAt",
        chapterNotes: "id, bookId, chapterNumber, updatedAt",
        bookNotes: "bookId, updatedAt",
        vocabEntries: "id, bookId, word, updatedAt",
        settings: "id, updatedAt",
        mediaBlobs: "id, bookId, kind, updatedAt",
      })
      .upgrade(async (transaction) => {
        const settingsTable = transaction.table("settings") as Table<AppSettings, "app">;
        const existingSettings = await settingsTable.get("app");

        if (!existingSettings) {
          await settingsTable.put(createDefaultSettings());
        }
      });

    this.version(3)
      .stores({
        books: "id, language, status, targetFinishDate, updatedAt",
        chapterNotes: "id, bookId, chapterNumber, updatedAt",
        bookNotes: "bookId, updatedAt",
        vocabEntries: "id, bookId, word, updatedAt",
        settings: "id, updatedAt",
        mediaBlobs: "id, bookId, kind, updatedAt",
        activityLogDays: "date, lastActivityAt",
      })
      .upgrade(async (transaction) => {
        const booksTable = transaction.table("books") as Table<Book, string>;
        const settingsTable = transaction.table("settings") as Table<AppSettings, "app">;

        await booksTable.toCollection().modify((book) => {
          const mutableBook = book as Partial<Book>;
          mutableBook.startDate = mutableBook.startDate ?? null;
          mutableBook.targetFinishDate = mutableBook.targetFinishDate ?? null;
          mutableBook.finishedDate = mutableBook.finishedDate ?? null;
        });

        const settings = await settingsTable.get("app");
        if (!settings) {
          await settingsTable.put(createDefaultSettings());
        } else if (typeof settings.celebrationsEnabled !== "boolean") {
          await settingsTable.put({
            ...settings,
            celebrationsEnabled: true,
            updatedAt: new Date().toISOString(),
          });
        }
      });
  }
}

export const readLogDb = new ReadLogDexie();

export async function loadReadingDataFromDexie(db = readLogDb): Promise<ReadingData> {
  const [books, chapterNotes, bookNotes, vocabEntries, settings, mediaBlobs, activityLogDays] =
    await Promise.all([
      db.books.toArray(),
      db.chapterNotes.toArray(),
      db.bookNotes.toArray(),
      db.vocabEntries.toArray(),
      db.settings.get("app"),
      db.mediaBlobs.toArray(),
      db.activityLogDays.toArray(),
    ]);

  const normalized = normalizeReadingData({
    books,
    chapterNotes,
    bookNotes,
    vocabEntries,
    settings,
    mediaBlobs,
    activityLogDays,
  });

  return normalized;
}

export async function saveReadingDataToDexie(
  readingData: ReadingData,
  db = readLogDb,
): Promise<void> {
  const normalized = normalizeReadingData(readingData);

  await db.transaction(
    "rw",
    [
      db.books,
      db.chapterNotes,
      db.bookNotes,
      db.vocabEntries,
      db.settings,
      db.mediaBlobs,
      db.activityLogDays,
    ],
    async () => {
      await Promise.all([
        db.books.clear(),
        db.chapterNotes.clear(),
        db.bookNotes.clear(),
        db.vocabEntries.clear(),
        db.mediaBlobs.clear(),
        db.activityLogDays.clear(),
      ]);

      if (normalized.books.length) {
        await db.books.bulkPut(normalized.books);
      }

      if (normalized.chapterNotes.length) {
        await db.chapterNotes.bulkPut(normalized.chapterNotes);
      }

      if (normalized.bookNotes.length) {
        await db.bookNotes.bulkPut(normalized.bookNotes);
      }

      if (normalized.vocabEntries.length) {
        await db.vocabEntries.bulkPut(normalized.vocabEntries);
      }

      if (normalized.mediaBlobs.length) {
        await db.mediaBlobs.bulkPut(normalized.mediaBlobs);
      }

      if (normalized.activityLogDays.length) {
        await db.activityLogDays.bulkPut(normalized.activityLogDays);
      }

      await db.settings.put(normalized.settings);
    },
  );
}

export async function clearReadingDataFromDexie(db = readLogDb): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.books,
      db.chapterNotes,
      db.bookNotes,
      db.vocabEntries,
      db.settings,
      db.mediaBlobs,
      db.activityLogDays,
    ],
    async () => {
      await Promise.all([
        db.books.clear(),
        db.chapterNotes.clear(),
        db.bookNotes.clear(),
        db.vocabEntries.clear(),
        db.settings.clear(),
        db.mediaBlobs.clear(),
        db.activityLogDays.clear(),
      ]);

      await db.settings.put(createDefaultSettings());
    },
  );
}

export async function deleteBookCascadeFromDexie(bookId: string, db = readLogDb): Promise<void> {
  await db.transaction(
    "rw",
    [db.books, db.chapterNotes, db.bookNotes, db.vocabEntries, db.mediaBlobs],
    async () => {
      await Promise.all([
        db.books.delete(bookId),
        db.chapterNotes.where("bookId").equals(bookId).delete(),
        db.bookNotes.where("bookId").equals(bookId).delete(),
        db.vocabEntries.where("bookId").equals(bookId).delete(),
        db.mediaBlobs.where("bookId").equals(bookId).delete(),
      ]);
    },
  );
}

export async function exportBackupFromDexie(db = readLogDb): Promise<ReadingBackupFile> {
  const data = await loadReadingDataFromDexie(db);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function importBackupToDexie(
  payload: ReadingBackupFile | ReadingData,
  db = readLogDb,
): Promise<ReadingData> {
  const data = "data" in payload ? payload.data : payload;
  const normalized = normalizeReadingData(data);

  await saveReadingDataToDexie(normalized, db);
  return normalized;
}

export function readLegacyLocalStorageSnapshot(): ReadingData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeLoadedData(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearLegacyLocalStorageSnapshot() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
}

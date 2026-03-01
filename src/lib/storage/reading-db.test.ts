import "fake-indexeddb/auto";

import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { DEMO_READING_DATA } from "@/lib/data/demo-seed";
import {
  ReadLogDexie,
  clearReadingDataFromDexie,
  importBackupToDexie,
  loadReadingDataFromDexie,
  saveReadingDataToDexie,
} from "@/lib/storage/reading-db";
import { type ReadingData } from "@/lib/types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe("ReadLogDexie", () => {
  let db: ReadLogDexie;

  beforeEach(() => {
    db = new ReadLogDexie(`readlog-test-${Date.now()}-${Math.random()}`);
  });

  afterEach(async () => {
    await db.delete();
  });

  it("initializes with default settings", async () => {
    const loaded = await loadReadingDataFromDexie(db);

    expect(loaded.books).toHaveLength(0);
    expect(loaded.settings.id).toBe("app");
    expect(loaded.settings.cloudSyncEnabled).toBe(false);
    expect(loaded.settings.celebrationsEnabled).toBe(true);
    expect(loaded.activityLogDays).toHaveLength(0);
  });

  it("saves and reloads full snapshot", async () => {
    const snapshot = clone(DEMO_READING_DATA);

    snapshot.mediaBlobs = [
      {
        id: "media-1",
        kind: "BOOK_COVER",
        bookId: snapshot.books[0].id,
        mimeType: "image/png",
        dataUrl: "data:image/png;base64,AAAA",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await saveReadingDataToDexie(snapshot, db);
    const loaded = await loadReadingDataFromDexie(db);

    expect(loaded.books).toHaveLength(snapshot.books.length);
    expect(loaded.vocabEntries).toHaveLength(snapshot.vocabEntries.length);
    expect(loaded.mediaBlobs).toHaveLength(1);
    expect(loaded.mediaBlobs[0]?.kind).toBe("BOOK_COVER");
    expect(loaded.books[0]?.startDate).not.toBeUndefined();
  });

  it("restores from backup and replaces stale records", async () => {
    const initial = clone(DEMO_READING_DATA);
    await saveReadingDataToDexie(initial, db);

    const replacement: ReadingData = {
      books: [initial.books[0]],
      chapterNotes: [],
      bookNotes: [],
      vocabEntries: [],
      settings: {
        id: "app",
        cloudSyncEnabled: true,
        celebrationsEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      mediaBlobs: [],
      activityLogDays: [],
    };

    await importBackupToDexie(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        data: replacement,
      },
      db,
    );

    const loaded = await loadReadingDataFromDexie(db);

    expect(loaded.books).toHaveLength(1);
    expect(loaded.chapterNotes).toHaveLength(0);
    expect(loaded.vocabEntries).toHaveLength(0);
    expect(loaded.settings.cloudSyncEnabled).toBe(true);
    expect(loaded.settings.celebrationsEnabled).toBe(false);
  });

  it("clears all data while preserving settings row", async () => {
    await saveReadingDataToDexie(clone(DEMO_READING_DATA), db);
    await clearReadingDataFromDexie(db);

    const loaded = await loadReadingDataFromDexie(db);
    expect(loaded.books).toHaveLength(0);
    expect(loaded.settings.id).toBe("app");
  });
});

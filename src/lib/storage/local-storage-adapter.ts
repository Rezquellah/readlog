import {
  EMPTY_READING_DATA,
  type ReadingStorageAdapter,
} from "@/lib/storage/storage-adapter";
import { type AppSettings, type ReadingData } from "@/lib/types";

export const LEGACY_LOCAL_STORAGE_KEY = "readblog.reading-data.v1";

function getDefaultSettings(): AppSettings {
  return {
    id: "app",
    cloudSyncEnabled: false,
    celebrationsEnabled: true,
    updatedAt: new Date(0).toISOString(),
  };
}

export function normalizeLoadedData(raw: unknown): ReadingData {
  if (!raw || typeof raw !== "object") {
    return EMPTY_READING_DATA;
  }

  const parsed = raw as Partial<ReadingData>;

  return {
    books: Array.isArray(parsed.books) ? parsed.books : [],
    chapterNotes: Array.isArray(parsed.chapterNotes) ? parsed.chapterNotes : [],
    bookNotes: Array.isArray(parsed.bookNotes) ? parsed.bookNotes : [],
    vocabEntries: Array.isArray(parsed.vocabEntries) ? parsed.vocabEntries : [],
    settings:
      parsed.settings && typeof parsed.settings === "object"
        ? { ...getDefaultSettings(), ...(parsed.settings as Partial<AppSettings>) }
        : getDefaultSettings(),
    mediaBlobs: Array.isArray(parsed.mediaBlobs) ? parsed.mediaBlobs : [],
    activityLogDays: Array.isArray(parsed.activityLogDays) ? parsed.activityLogDays : [],
  };
}

export function createLocalStorageAdapter(): ReadingStorageAdapter {
  return {
    async load() {
      if (typeof window === "undefined") {
        return EMPTY_READING_DATA;
      }

      const serialized = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
      if (!serialized) {
        return EMPTY_READING_DATA;
      }

      try {
        const parsed = JSON.parse(serialized);
        return normalizeLoadedData(parsed);
      } catch {
        return EMPTY_READING_DATA;
      }
    },
    async save(data) {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, JSON.stringify(data));
    },
    async clear() {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    },
  };
}

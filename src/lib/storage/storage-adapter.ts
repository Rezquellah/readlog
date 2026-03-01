import { type ReadingData } from "@/lib/types";

export interface ReadingStorageAdapter {
  load: () => Promise<ReadingData>;
  save: (data: ReadingData) => Promise<void>;
  clear: () => Promise<void>;
}

export const EMPTY_READING_DATA: ReadingData = {
  books: [],
  chapterNotes: [],
  bookNotes: [],
  vocabEntries: [],
  settings: {
    id: "app",
    cloudSyncEnabled: false,
    celebrationsEnabled: true,
    updatedAt: new Date(0).toISOString(),
  },
  mediaBlobs: [],
  activityLogDays: [],
};

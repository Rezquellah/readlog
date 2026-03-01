export type BookLanguage = "EN" | "FR";

export type BookStatus = "READING" | "FINISHED" | "PLANNED";

export type MediaKind = "BOOK_COVER" | "NOTE_IMAGE";

export type ReadingActivityType =
  | "PROGRESS_UPDATE"
  | "CHAPTER_NOTE"
  | "VOCAB_ENTRY"
  | "BOOK_NOTE";

export interface Book {
  id: string;
  language: BookLanguage;
  title: string;
  author?: string;
  cover?: string;
  status: BookStatus;
  tags: string[];
  totalChapters: number;
  currentChapter: number;
  startDate: string | null;
  targetFinishDate: string | null;
  finishedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterNote {
  id: string;
  bookId: string;
  chapterNumber: number;
  chapterTitle?: string;
  learnedText: string;
  updatedAt: string;
}

export interface BookNote {
  bookId: string;
  richTextContent: string;
  updatedAt: string;
}

export interface VocabEntry {
  id: string;
  bookId: string;
  word: string;
  meaning: string;
  example: string;
  chapterNumber?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: "app";
  cloudSyncEnabled: boolean;
  celebrationsEnabled: boolean;
  lastBackupAt?: string;
  updatedAt: string;
}

export interface MediaBlobRecord {
  id: string;
  kind: MediaKind;
  bookId?: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogDay {
  date: string; // YYYY-MM-DD
  count: number;
  lastActivityAt: string;
  types: ReadingActivityType[];
}

export interface ReadingData {
  books: Book[];
  chapterNotes: ChapterNote[];
  bookNotes: BookNote[];
  vocabEntries: VocabEntry[];
  settings: AppSettings;
  mediaBlobs: MediaBlobRecord[];
  activityLogDays: ActivityLogDay[];
}

export interface CreateBookInput {
  language: BookLanguage;
  title: string;
  author?: string;
  cover?: string;
  status: BookStatus;
  tags?: string[];
  totalChapters?: number;
  currentChapter?: number;
  startDate?: string | null;
  targetFinishDate?: string | null;
  finishedDate?: string | null;
}

export interface UpdateBookInput {
  language?: BookLanguage;
  title?: string;
  author?: string;
  cover?: string;
  status?: BookStatus;
  tags?: string[];
  totalChapters?: number;
  currentChapter?: number;
  startDate?: string | null;
  targetFinishDate?: string | null;
  finishedDate?: string | null;
}

export interface UpsertChapterNoteInput {
  id?: string;
  bookId: string;
  chapterNumber: number;
  chapterTitle?: string;
  learnedText: string;
}

export interface UpsertVocabEntryInput {
  id?: string;
  bookId: string;
  word: string;
  meaning: string;
  example: string;
  chapterNumber?: number;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  type: "book" | "note" | "vocab";
  bookId: string;
  bookTitle: string;
  language: BookLanguage;
  title: string;
  excerpt?: string;
}

export interface SaveMediaBlobInput {
  kind: MediaKind;
  bookId?: string;
  mimeType: string;
  dataUrl: string;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/context/auth-context";
import { DEMO_READING_DATA } from "@/lib/data/demo-seed";
import {
  clearReadingDataByUser,
  createEmptyReadingData,
  loadReadingDataByUser,
  replaceReadingDataByUser,
} from "@/lib/repositories/reading-data-repo";
import { uploadCoverForUser } from "@/lib/repositories/storage-repo";
import {
  type ActivityLogDay,
  type AppSettings,
  type Book,
  type BookLanguage,
  type BookNote,
  type CreateBookInput,
  type ReadingActivityType,
  type ReadingData,
  type SaveMediaBlobInput,
  type SearchResult,
  type UpsertChapterNoteInput,
  type UpsertVocabEntryInput,
  type UpdateBookInput,
  type VocabEntry,
} from "@/lib/types";
import {
  clampNumber,
  computeProgress,
  diffInDays,
  generateId,
  normalizeIsoDateInput,
  normalizeTags,
  stripHtml,
  toSafeChapterValue,
  todayIsoDate,
} from "@/lib/utils";

export interface ReadingBackupFile {
  version: 3;
  exportedAt: string;
  data: ReadingData;
}

interface ReadingDataContextValue {
  data: ReadingData;
  isLoaded: boolean;
  isPersisting: boolean;
  booksByLanguage: (language: BookLanguage) => Book[];
  getBook: (bookId: string) => Book | undefined;
  getChapterNotes: (bookId: string) => ReadingData["chapterNotes"];
  getBookNote: (bookId: string) => BookNote | undefined;
  getVocabEntries: (bookId: string) => VocabEntry[];
  search: (query: string) => SearchResult[];
  addBook: (input: CreateBookInput) => string;
  updateBook: (bookId: string, input: UpdateBookInput) => void;
  markBookAsFinished: (bookId: string, finishedDate?: string | null) => void;
  deleteBook: (bookId: string) => void;
  upsertChapterNote: (input: UpsertChapterNoteInput) => void;
  deleteChapterNote: (chapterNoteId: string) => void;
  setBookNoteContent: (bookId: string, richTextContent: string) => void;
  appendBookNoteSnippet: (bookId: string, snippet: string) => void;
  upsertVocabEntry: (input: UpsertVocabEntryInput) => void;
  deleteVocabEntry: (vocabEntryId: string) => void;
  saveMediaBlob: (input: SaveMediaBlobInput) => string;
  uploadCoverImage: (file: File) => Promise<string>;
  seedDemoData: () => void;
  clearAllData: () => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  setCelebrationsEnabled: (enabled: boolean) => void;
  exportBackup: () => Promise<ReadingBackupFile>;
  importBackup: (payload: unknown) => Promise<void>;
}

const ReadingDataContext = createContext<ReadingDataContextValue | null>(null);

const PROGRESS_MILESTONES = [25, 50, 75, 100] as const;

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function sanitizeProgress(totalChapters: number, currentChapter: number) {
  const safeTotal = Math.max(1, toSafeChapterValue(totalChapters, 1));
  const safeCurrent = clampNumber(toSafeChapterValue(currentChapter, 0), 0, safeTotal);
  return { totalChapters: safeTotal, currentChapter: safeCurrent };
}

function sanitizeBookDates(params: {
  status: Book["status"];
  startDate: string | null | undefined;
  targetFinishDate: string | null | undefined;
  finishedDate: string | null | undefined;
}) {
  const startDate = normalizeIsoDateInput(params.startDate);
  let targetFinishDate = normalizeIsoDateInput(params.targetFinishDate);
  let finishedDate = normalizeIsoDateInput(params.finishedDate);

  if (startDate && targetFinishDate && diffInDays(startDate, targetFinishDate) < 0) {
    targetFinishDate = startDate;
  }

  if (params.status === "FINISHED") {
    if (!finishedDate) {
      finishedDate = todayIsoDate();
    }

    if (startDate && finishedDate && diffInDays(startDate, finishedDate) < 0) {
      finishedDate = startDate;
    }
  } else {
    finishedDate = null;
  }

  return {
    startDate,
    targetFinishDate,
    finishedDate,
  };
}

function withUpdatedSettings(previous: ReadingData, patch: Partial<AppSettings>): ReadingData {
  return {
    ...previous,
    settings: {
      ...previous.settings,
      ...patch,
      id: "app",
      updatedAt: new Date().toISOString(),
    },
  };
}

function recordActivityDay(
  activityLogDays: ActivityLogDay[],
  activityType: ReadingActivityType,
  atIsoDateTime: string,
): ActivityLogDay[] {
  const date = atIsoDateTime.slice(0, 10);
  const existing = activityLogDays.find((day) => day.date === date);

  if (existing) {
    return activityLogDays.map((day) => {
      if (day.date !== date) {
        return day;
      }

      const nextTypes = day.types.includes(activityType)
        ? day.types
        : [...day.types, activityType];

      return {
        ...day,
        count: day.count + 1,
        lastActivityAt: atIsoDateTime,
        types: nextTypes,
      };
    });
  }

  return [
    ...activityLogDays,
    {
      date,
      count: 1,
      lastActivityAt: atIsoDateTime,
      types: [activityType],
    },
  ];
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function reachedProgressMilestone(previousProgress: number, nextProgress: number) {
  return PROGRESS_MILESTONES.filter(
    (milestone) => previousProgress < milestone && nextProgress >= milestone,
  ).at(-1);
}

function normalizeSnapshot(data: Partial<ReadingData> | null | undefined): ReadingData {
  const defaults = createEmptyReadingData();

  if (!data) {
    return defaults;
  }

  return {
    ...defaults,
    books: Array.isArray(data.books) ? data.books : [],
    chapterNotes: Array.isArray(data.chapterNotes) ? data.chapterNotes : [],
    bookNotes: Array.isArray(data.bookNotes) ? data.bookNotes : [],
    vocabEntries: Array.isArray(data.vocabEntries) ? data.vocabEntries : [],
    settings:
      data.settings && typeof data.settings === "object"
        ? { ...defaults.settings, ...data.settings }
        : defaults.settings,
    mediaBlobs: Array.isArray(data.mediaBlobs) ? data.mediaBlobs : [],
    activityLogDays: Array.isArray(data.activityLogDays) ? data.activityLogDays : [],
  };
}

function buildBackup(data: ReadingData): ReadingBackupFile {
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function ReadingDataProvider({ children }: PropsWithChildren) {
  const { supabase, user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id ?? null;

  const [data, setData] = useState<ReadingData>(() => createEmptyReadingData());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);

  const syncTimerRef = useRef<number | null>(null);
  const syncCounterRef = useRef(0);

  const beginPersist = useCallback(() => {
    syncCounterRef.current += 1;
    setIsPersisting(true);
  }, []);

  const endPersist = useCallback(() => {
    syncCounterRef.current = Math.max(0, syncCounterRef.current - 1);
    if (syncCounterRef.current === 0) {
      setIsPersisting(false);
    }
  }, []);

  const queueSync = useCallback(
    (nextData: ReadingData) => {
      if (!userId || typeof window === "undefined") {
        return;
      }

      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = window.setTimeout(() => {
        beginPersist();
        void replaceReadingDataByUser(supabase, userId, nextData)
          .catch((error) => {
            console.error(error);
            toast.error("Could not sync data to Supabase.");
          })
          .finally(() => {
            endPersist();
          });
      }, 250);
    },
    [beginPersist, endPersist, supabase, userId],
  );

  const commit = useCallback(
    (updater: (prev: ReadingData) => ReadingData) => {
      setData((prev) => {
        const next = updater(prev);
        queueSync(next);
        return next;
      });
    },
    [queueSync],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let active = true;

    if (!userId) {
      setData(createEmptyReadingData());
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    void (async () => {
      try {
        const loaded = await loadReadingDataByUser(supabase, userId);
        if (!active) {
          return;
        }

        setData(normalizeSnapshot(loaded));
      } catch (error) {
        console.error(error);
        if (!active) {
          return;
        }

        toast.error("Failed to load synced data.");
        setData(createEmptyReadingData());
      } finally {
        if (active) {
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      active = false;
      if (syncTimerRef.current && typeof window !== "undefined") {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [isAuthLoading, supabase, userId]);

  const booksByLanguage = useCallback(
    (language: BookLanguage) => data.books.filter((book) => book.language === language),
    [data.books],
  );

  const getBook = useCallback(
    (bookId: string) => data.books.find((book) => book.id === bookId),
    [data.books],
  );

  const getChapterNotes = useCallback(
    (bookId: string) =>
      data.chapterNotes
        .filter((chapterNote) => chapterNote.bookId === bookId)
        .sort((a, b) => a.chapterNumber - b.chapterNumber),
    [data.chapterNotes],
  );

  const getBookNote = useCallback(
    (bookId: string) => data.bookNotes.find((bookNote) => bookNote.bookId === bookId),
    [data.bookNotes],
  );

  const getVocabEntries = useCallback(
    (bookId: string) =>
      data.vocabEntries
        .filter((entry) => entry.bookId === bookId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.vocabEntries],
  );

  const search = useCallback(
    (query: string) => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return [];
      }

      const bookIndex = new Map(data.books.map((book) => [book.id, book]));
      const results: SearchResult[] = [];

      data.books.forEach((book) => {
        const haystack = `${book.title} ${book.author ?? ""} ${book.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return;
        }

        results.push({
          id: `book-${book.id}`,
          type: "book",
          bookId: book.id,
          bookTitle: book.title,
          language: book.language,
          title: book.title,
          excerpt: book.author,
        });
      });

      data.bookNotes.forEach((note) => {
        const linkedBook = bookIndex.get(note.bookId);
        if (!linkedBook) {
          return;
        }

        const plainText = stripHtml(note.richTextContent);
        if (!plainText.toLowerCase().includes(normalizedQuery)) {
          return;
        }

        results.push({
          id: `note-${note.bookId}`,
          type: "note",
          bookId: note.bookId,
          bookTitle: linkedBook.title,
          language: linkedBook.language,
          title: `Notes in ${linkedBook.title}`,
          excerpt: plainText.slice(0, 110),
        });
      });

      data.vocabEntries.forEach((entry) => {
        const linkedBook = bookIndex.get(entry.bookId);
        if (!linkedBook) {
          return;
        }

        const haystack = `${entry.word} ${entry.meaning} ${entry.example} ${entry.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return;
        }

        results.push({
          id: `vocab-${entry.id}`,
          type: "vocab",
          bookId: entry.bookId,
          bookTitle: linkedBook.title,
          language: linkedBook.language,
          title: entry.word,
          excerpt: entry.meaning,
        });
      });

      return results.slice(0, 18);
    },
    [data.books, data.bookNotes, data.vocabEntries],
  );

  const addBook = useCallback(
    (input: CreateBookInput) => {
      const title = input.title.trim();
      if (!title) {
        throw new Error("Book title is required.");
      }

      const now = new Date().toISOString();
      const { totalChapters, currentChapter } = sanitizeProgress(
        input.totalChapters ?? 1,
        input.currentChapter ?? 0,
      );
      const dates = sanitizeBookDates({
        status: input.status,
        startDate: input.startDate,
        targetFinishDate: input.targetFinishDate,
        finishedDate: input.finishedDate,
      });

      const newBook: Book = {
        id: generateId(),
        language: input.language,
        title,
        author: input.author?.trim() || undefined,
        cover: input.cover?.trim() || undefined,
        status: input.status,
        tags: normalizeTags(input.tags),
        totalChapters,
        currentChapter,
        startDate: dates.startDate,
        targetFinishDate: dates.targetFinishDate,
        finishedDate: dates.finishedDate,
        createdAt: now,
        updatedAt: now,
      };

      commit((prev) => ({
        ...prev,
        books: [newBook, ...prev.books],
      }));

      return newBook.id;
    },
    [commit],
  );

  const updateBook = useCallback(
    (bookId: string, input: UpdateBookInput) => {
      let milestoneReached: number | undefined;

      commit((prev) => {
        const now = new Date().toISOString();

        return {
          ...prev,
          books: prev.books.map((book) => {
            if (book.id !== bookId) {
              return book;
            }

            const mergedTotal = input.totalChapters ?? book.totalChapters;
            const mergedCurrent = input.currentChapter ?? book.currentChapter;
            const safeProgress = sanitizeProgress(mergedTotal, mergedCurrent);
            const nextStatus = input.status ?? book.status;

            const dates = sanitizeBookDates({
              status: nextStatus,
              startDate: input.startDate !== undefined ? input.startDate : book.startDate,
              targetFinishDate:
                input.targetFinishDate !== undefined ? input.targetFinishDate : book.targetFinishDate,
              finishedDate: input.finishedDate !== undefined ? input.finishedDate : book.finishedDate,
            });

            const previousProgress = computeProgress(book.currentChapter, book.totalChapters);
            const nextProgress = computeProgress(safeProgress.currentChapter, safeProgress.totalChapters);
            milestoneReached = reachedProgressMilestone(previousProgress, nextProgress);

            return {
              ...book,
              language: input.language ?? book.language,
              title: input.title?.trim() || book.title,
              author: input.author !== undefined ? input.author.trim() || undefined : book.author,
              cover: input.cover !== undefined ? input.cover.trim() || undefined : book.cover,
              status: nextStatus,
              tags: input.tags ? normalizeTags(input.tags) : book.tags,
              totalChapters: safeProgress.totalChapters,
              currentChapter: safeProgress.currentChapter,
              startDate: dates.startDate,
              targetFinishDate: dates.targetFinishDate,
              finishedDate: dates.finishedDate,
              updatedAt: now,
            };
          }),
          activityLogDays:
            input.currentChapter !== undefined || input.totalChapters !== undefined
              ? recordActivityDay(prev.activityLogDays, "PROGRESS_UPDATE", now)
              : prev.activityLogDays,
        };
      });

      if (milestoneReached && data.settings.celebrationsEnabled) {
        toast.success(`Milestone reached: ${milestoneReached}%`, {
          description: "Small steps build consistency.",
        });
      }
    },
    [commit, data.settings.celebrationsEnabled],
  );

  const markBookAsFinished = useCallback(
    (bookId: string, finishedDate?: string | null) => {
      updateBook(bookId, {
        status: "FINISHED",
        finishedDate: finishedDate ?? todayIsoDate(),
      });
    },
    [updateBook],
  );

  const deleteBook = useCallback(
    (bookId: string) => {
      commit((prev) => ({
        ...prev,
        books: prev.books.filter((book) => book.id !== bookId),
        chapterNotes: prev.chapterNotes.filter((chapterNote) => chapterNote.bookId !== bookId),
        bookNotes: prev.bookNotes.filter((bookNote) => bookNote.bookId !== bookId),
        vocabEntries: prev.vocabEntries.filter((entry) => entry.bookId !== bookId),
        mediaBlobs: prev.mediaBlobs.filter((blob) => blob.bookId !== bookId),
      }));
    },
    [commit],
  );

  const upsertChapterNote = useCallback(
    (input: UpsertChapterNoteInput) => {
      const safeChapterNumber = toSafeChapterValue(input.chapterNumber, 0);
      if (safeChapterNumber <= 0) {
        throw new Error("Chapter number must be greater than 0.");
      }

      commit((prev) => {
        const now = new Date().toISOString();
        const chapterTitle = input.chapterTitle?.trim() || undefined;
        const learnedText = input.learnedText.trim();

        let effectiveId = input.id;
        if (!effectiveId) {
          const existingChapter = prev.chapterNotes.find(
            (chapterNote) =>
              chapterNote.bookId === input.bookId &&
              chapterNote.chapterNumber === safeChapterNumber,
          );
          effectiveId = existingChapter?.id;
        }

        if (effectiveId) {
          return {
            ...prev,
            chapterNotes: prev.chapterNotes.map((chapterNote) =>
              chapterNote.id === effectiveId
                ? {
                    ...chapterNote,
                    chapterNumber: safeChapterNumber,
                    chapterTitle,
                    learnedText,
                    updatedAt: now,
                  }
                : chapterNote,
            ),
            books: prev.books.map((book) =>
              book.id === input.bookId ? { ...book, updatedAt: now } : book,
            ),
            activityLogDays: recordActivityDay(prev.activityLogDays, "CHAPTER_NOTE", now),
          };
        }

        return {
          ...prev,
          chapterNotes: [
            {
              id: generateId(),
              bookId: input.bookId,
              chapterNumber: safeChapterNumber,
              chapterTitle,
              learnedText,
              updatedAt: now,
            },
            ...prev.chapterNotes,
          ],
          books: prev.books.map((book) =>
            book.id === input.bookId ? { ...book, updatedAt: now } : book,
          ),
          activityLogDays: recordActivityDay(prev.activityLogDays, "CHAPTER_NOTE", now),
        };
      });
    },
    [commit],
  );

  const deleteChapterNote = useCallback(
    (chapterNoteId: string) => {
      commit((prev) => ({
        ...prev,
        chapterNotes: prev.chapterNotes.filter((chapterNote) => chapterNote.id !== chapterNoteId),
      }));
    },
    [commit],
  );

  const setBookNoteContent = useCallback(
    (bookId: string, richTextContent: string) => {
      commit((prev) => {
        const now = new Date().toISOString();
        const existing = prev.bookNotes.find((bookNote) => bookNote.bookId === bookId);
        const filteredMedia = prev.mediaBlobs.filter((blob) => {
          if (blob.kind !== "NOTE_IMAGE" || blob.bookId !== bookId) {
            return true;
          }

          return richTextContent.includes(blob.dataUrl);
        });

        if (existing) {
          return {
            ...prev,
            mediaBlobs: filteredMedia,
            bookNotes: prev.bookNotes.map((bookNote) =>
              bookNote.bookId === bookId
                ? { ...bookNote, richTextContent, updatedAt: now }
                : bookNote,
            ),
            books: prev.books.map((book) =>
              book.id === bookId ? { ...book, updatedAt: now } : book,
            ),
            activityLogDays: recordActivityDay(prev.activityLogDays, "BOOK_NOTE", now),
          };
        }

        return {
          ...prev,
          mediaBlobs: filteredMedia,
          bookNotes: [...prev.bookNotes, { bookId, richTextContent, updatedAt: now }],
          books: prev.books.map((book) =>
            book.id === bookId ? { ...book, updatedAt: now } : book,
          ),
          activityLogDays: recordActivityDay(prev.activityLogDays, "BOOK_NOTE", now),
        };
      });
    },
    [commit],
  );

  const appendBookNoteSnippet = useCallback(
    (bookId: string, snippet: string) => {
      const trimmed = snippet.trim();
      if (!trimmed) {
        return;
      }

      const existing = getBookNote(bookId);
      const escaped = escapeHtml(trimmed);
      const datedBlock = `<p><strong>Journal ${todayIsoDate()}:</strong> ${escaped}</p>`;
      const nextContent = existing?.richTextContent
        ? `${existing.richTextContent}${datedBlock}`
        : `<p></p>${datedBlock}`;

      setBookNoteContent(bookId, nextContent);
    },
    [getBookNote, setBookNoteContent],
  );

  const upsertVocabEntry = useCallback(
    (input: UpsertVocabEntryInput) => {
      const word = input.word.trim();
      if (!word) {
        throw new Error("Word is required.");
      }

      const meaning = input.meaning.trim();
      const example = input.example.trim();
      const chapterNumber =
        input.chapterNumber !== undefined
          ? toSafeChapterValue(input.chapterNumber, 0)
          : undefined;

      let isFirstWordForBook = false;

      commit((prev) => {
        const now = new Date().toISOString();

        if (input.id) {
          return {
            ...prev,
            vocabEntries: prev.vocabEntries.map((entry) =>
              entry.id === input.id
                ? {
                    ...entry,
                    word,
                    meaning,
                    example,
                    chapterNumber: chapterNumber || undefined,
                    tags: normalizeTags(input.tags),
                    updatedAt: now,
                  }
                : entry,
            ),
            books: prev.books.map((book) =>
              book.id === input.bookId ? { ...book, updatedAt: now } : book,
            ),
            activityLogDays: recordActivityDay(prev.activityLogDays, "VOCAB_ENTRY", now),
          };
        }

        isFirstWordForBook = prev.vocabEntries.every((entry) => entry.bookId !== input.bookId);

        return {
          ...prev,
          vocabEntries: [
            {
              id: generateId(),
              bookId: input.bookId,
              word,
              meaning,
              example,
              chapterNumber: chapterNumber || undefined,
              tags: normalizeTags(input.tags),
              createdAt: now,
              updatedAt: now,
            },
            ...prev.vocabEntries,
          ],
          books: prev.books.map((book) =>
            book.id === input.bookId ? { ...book, updatedAt: now } : book,
          ),
          activityLogDays: recordActivityDay(prev.activityLogDays, "VOCAB_ENTRY", now),
        };
      });

      if (isFirstWordForBook && data.settings.celebrationsEnabled) {
        toast.success("First vocabulary item added for this book.", {
          description: "Great start. Keep collecting useful words.",
        });
      }
    },
    [commit, data.settings.celebrationsEnabled],
  );

  const deleteVocabEntry = useCallback(
    (vocabEntryId: string) => {
      commit((prev) => ({
        ...prev,
        vocabEntries: prev.vocabEntries.filter((entry) => entry.id !== vocabEntryId),
      }));
    },
    [commit],
  );

  const saveMediaBlob = useCallback(
    (input: SaveMediaBlobInput) => {
      const now = new Date().toISOString();
      const mediaBlobId = generateId();

      commit((prev) => {
        const existingBlob = prev.mediaBlobs.find(
          (blob) =>
            blob.dataUrl === input.dataUrl &&
            blob.kind === input.kind &&
            blob.bookId === input.bookId,
        );

        if (existingBlob) {
          return prev;
        }

        return {
          ...prev,
          mediaBlobs: [
            {
              id: mediaBlobId,
              kind: input.kind,
              bookId: input.bookId,
              mimeType: input.mimeType,
              dataUrl: input.dataUrl,
              createdAt: now,
              updatedAt: now,
            },
            ...prev.mediaBlobs,
          ],
        };
      });

      return mediaBlobId;
    },
    [commit],
  );

  const uploadCoverImage = useCallback(
    async (file: File) => {
      if (!userId) {
        throw new Error("You must be logged in to upload a cover image.");
      }

      beginPersist();
      try {
        return await uploadCoverForUser(supabase, userId, file);
      } catch (error) {
        console.error(error);
        throw new Error("Could not upload cover image.");
      } finally {
        endPersist();
      }
    },
    [beginPersist, endPersist, supabase, userId],
  );

  const seedDemoData = useCallback(() => {
    const nextData = normalizeSnapshot(cloneData(DEMO_READING_DATA));
    setData(nextData);
    queueSync(nextData);
  }, [queueSync]);

  const clearAllData = useCallback(() => {
    const nextData = createEmptyReadingData();
    setData(nextData);

    if (userId) {
      beginPersist();
      void clearReadingDataByUser(supabase, userId)
        .catch((error) => {
          console.error(error);
          toast.error("Could not clear your data.");
        })
        .finally(() => {
          endPersist();
        });
      return;
    }

    queueSync(nextData);
  }, [beginPersist, endPersist, queueSync, supabase, userId]);

  const setCloudSyncEnabled = useCallback(
    (enabled: boolean) => {
      commit((prev) => withUpdatedSettings(prev, { cloudSyncEnabled: enabled }));
    },
    [commit],
  );

  const setCelebrationsEnabled = useCallback(
    (enabled: boolean) => {
      commit((prev) => withUpdatedSettings(prev, { celebrationsEnabled: enabled }));
    },
    [commit],
  );

  const exportBackup = useCallback(async () => {
    const backup = buildBackup(data);
    const nextData = withUpdatedSettings(data, {
      lastBackupAt: backup.exportedAt,
    });

    setData(nextData);
    queueSync(nextData);
    return backup;
  }, [data, queueSync]);

  const importBackup = useCallback(
    async (payload: unknown) => {
      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid backup payload.");
      }

      const raw =
        "data" in payload
          ? (payload as { data?: Partial<ReadingData> }).data
          : (payload as Partial<ReadingData>);
      const normalized = normalizeSnapshot(raw);

      setData(normalized);

      beginPersist();
      try {
        if (!userId) {
          throw new Error("You must be logged in to import backup data.");
        }

        await replaceReadingDataByUser(supabase, userId, normalized);
      } finally {
        endPersist();
      }
    },
    [beginPersist, endPersist, supabase, userId],
  );

  const value = useMemo<ReadingDataContextValue>(
    () => ({
      data,
      isLoaded,
      isPersisting,
      booksByLanguage,
      getBook,
      getChapterNotes,
      getBookNote,
      getVocabEntries,
      search,
      addBook,
      updateBook,
      markBookAsFinished,
      deleteBook,
      upsertChapterNote,
      deleteChapterNote,
      setBookNoteContent,
      appendBookNoteSnippet,
      upsertVocabEntry,
      deleteVocabEntry,
      saveMediaBlob,
      uploadCoverImage,
      seedDemoData,
      clearAllData,
      setCloudSyncEnabled,
      setCelebrationsEnabled,
      exportBackup,
      importBackup,
    }),
    [
      addBook,
      appendBookNoteSnippet,
      booksByLanguage,
      clearAllData,
      data,
      deleteBook,
      deleteChapterNote,
      deleteVocabEntry,
      exportBackup,
      getBook,
      getBookNote,
      getChapterNotes,
      getVocabEntries,
      importBackup,
      isLoaded,
      isPersisting,
      markBookAsFinished,
      saveMediaBlob,
      search,
      seedDemoData,
      setBookNoteContent,
      setCelebrationsEnabled,
      setCloudSyncEnabled,
      updateBook,
      uploadCoverImage,
      upsertChapterNote,
      upsertVocabEntry,
    ],
  );

  return <ReadingDataContext.Provider value={value}>{children}</ReadingDataContext.Provider>;
}

export function useReadingData() {
  const context = useContext(ReadingDataContext);
  if (!context) {
    throw new Error("useReadingData must be used within ReadingDataProvider");
  }

  return context;
}

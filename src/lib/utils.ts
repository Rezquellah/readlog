import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Math.random().toString(36).slice(2, 11)}`;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function toSafeChapterValue(value: number | undefined, fallback = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

export function computeProgress(currentChapter: number, totalChapters: number) {
  if (totalChapters <= 0) {
    return 0;
  }

  return Math.round((currentChapter / totalChapters) * 100);
}

export function normalizeTags(tags: string[] | string | undefined) {
  if (!tags) {
    return [];
  }

  const source = Array.isArray(tags) ? tags : tags.split(",");

  return source
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/\s+/g, " "));
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function statusLabel(status: "READING" | "FINISHED" | "PLANNED") {
  switch (status) {
    case "READING":
      return "Reading";
    case "FINISHED":
      return "Finished";
    case "PLANNED":
      return "Planned";
    default:
      return status;
  }
}

export function languageLabel(language: "EN" | "FR") {
  return language === "EN" ? "English" : "French";
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function normalizeIsoDateInput(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function diffInDays(fromIsoDate: string, toIsoDate: string) {
  const from = new Date(`${fromIsoDate}T00:00:00.000Z`).getTime();
  const to = new Date(`${toIsoDate}T00:00:00.000Z`).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to - from) / msPerDay);
}

export function calculateStreakDays(dates: string[]) {
  if (!dates.length) {
    return { current: 0, best: 0 };
  }

  const uniqueSorted = Array.from(new Set(dates))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (!uniqueSorted.length) {
    return { current: 0, best: 0 };
  }

  let best = 1;
  let currentRun = 1;

  for (let index = 1; index < uniqueSorted.length; index += 1) {
    const previous = uniqueSorted[index - 1];
    const current = uniqueSorted[index];
    const gap = diffInDays(previous, current);

    if (gap === 1) {
      currentRun += 1;
      best = Math.max(best, currentRun);
    } else if (gap > 1) {
      currentRun = 1;
    }
  }

  let current = 0;
  const today = todayIsoDate();

  for (let index = uniqueSorted.length - 1; index >= 0; index -= 1) {
    const date = uniqueSorted[index];
    const expectedDate = addDaysToIsoDate(today, -current);
    if (date === expectedDate) {
      current += 1;
      continue;
    }

    if (current === 0 && diffInDays(date, today) === 1) {
      current = 1;
      continue;
    }

    break;
  }

  return { current, best };
}

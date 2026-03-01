"use client";

import { BookOpenText, BookText, Languages, ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadingData } from "@/lib/context/reading-data-context";

export default function StatisticsPage() {
  const { data } = useReadingData();

  const enBooks = data.books.filter((book) => book.language === "EN");
  const frBooks = data.books.filter((book) => book.language === "FR");

  const enBookIds = new Set(enBooks.map((book) => book.id));
  const frBookIds = new Set(frBooks.map((book) => book.id));

  const stats = [
    {
      title: "English Books Read",
      value: enBooks.filter((book) => book.status === "FINISHED").length,
      icon: BookOpenText,
    },
    {
      title: "French Books Read",
      value: frBooks.filter((book) => book.status === "FINISHED").length,
      icon: Languages,
    },
    {
      title: "English In Progress",
      value: enBooks.filter((book) => book.status === "READING").length,
      icon: BookText,
    },
    {
      title: "French In Progress",
      value: frBooks.filter((book) => book.status === "READING").length,
      icon: BookText,
    },
    {
      title: "English Vocabulary",
      value: data.vocabEntries.filter((entry) => enBookIds.has(entry.bookId)).length,
      icon: ListChecks,
    },
    {
      title: "French Vocabulary",
      value: data.vocabEntries.filter((entry) => frBookIds.has(entry.bookId)).length,
      icon: ListChecks,
    },
    {
      title: "English Chapters Logged",
      value: data.chapterNotes.filter((note) => enBookIds.has(note.bookId)).length,
      icon: ListChecks,
    },
    {
      title: "French Chapters Logged",
      value: data.chapterNotes.filter((note) => frBookIds.has(note.bookId)).length,
      icon: ListChecks,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overview</p>
        <h2 className="text-3xl font-bold text-slate-900">Statistics</h2>
        <p className="text-sm text-slate-600">
          Compare English and French reading activity at a glance.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-slate-600">{stat.title}</CardTitle>
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chart-ready section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Add charts here later (Recharts/Chart.js) without changing the layout.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

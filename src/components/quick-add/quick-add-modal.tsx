"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useReadingData } from "@/lib/context/reading-data-context";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookPickerProps {
  selectedBookId: string;
  onSelect: (bookId: string) => void;
  label: string;
}

function BookPicker({ selectedBookId, onSelect, label }: BookPickerProps) {
  const { data } = useReadingData();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return data.books;
    }

    return data.books.filter((book) => {
      const haystack = `${book.title} ${book.author ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [data.books, searchQuery]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search book"
      />
      <select
        value={selectedBookId}
        onChange={(event) => onSelect(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
      >
        <option value="">Choose a book</option>
        {filteredBooks.map((book) => (
          <option key={book.id} value={book.id}>
            {book.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function QuickAddModal({ open, onOpenChange }: QuickAddModalProps) {
  const { upsertVocabEntry, upsertChapterNote, appendBookNoteSnippet } = useReadingData();

  const [vocabBookId, setVocabBookId] = useState("");
  const [vocabWord, setVocabWord] = useState("");
  const [vocabMeaning, setVocabMeaning] = useState("");
  const [vocabExample, setVocabExample] = useState("");
  const [vocabChapter, setVocabChapter] = useState("");

  const [learningBookId, setLearningBookId] = useState("");
  const [learningChapter, setLearningChapter] = useState("");
  const [learningText, setLearningText] = useState("");

  const [noteBookId, setNoteBookId] = useState("");
  const [noteSnippet, setNoteSnippet] = useState("");

  const clearVocab = () => {
    setVocabWord("");
    setVocabMeaning("");
    setVocabExample("");
    setVocabChapter("");
  };

  const clearLearning = () => {
    setLearningChapter("");
    setLearningText("");
  };

  const clearNote = () => {
    setNoteSnippet("");
  };

  const saveVocab = () => {
    if (!vocabBookId) {
      toast.error("Choose a book first.");
      return;
    }

    upsertVocabEntry({
      bookId: vocabBookId,
      word: vocabWord,
      meaning: vocabMeaning,
      example: vocabExample,
      chapterNumber: vocabChapter ? Number(vocabChapter) : undefined,
    });
    clearVocab();
    toast.success("Vocabulary saved. Keep going.");
  };

  const saveLearning = () => {
    if (!learningBookId) {
      toast.error("Choose a book first.");
      return;
    }

    const chapterNumber = Number(learningChapter);
    if (Number.isNaN(chapterNumber) || chapterNumber <= 0) {
      toast.error("Chapter number must be greater than 0.");
      return;
    }

    upsertChapterNote({
      bookId: learningBookId,
      chapterNumber,
      learnedText: learningText,
    });
    clearLearning();
    toast.success("Learning captured.");
  };

  const saveNoteSnippet = () => {
    if (!noteBookId) {
      toast.error("Choose a book first.");
      return;
    }

    if (!noteSnippet.trim()) {
      toast.error("Write a note snippet first.");
      return;
    }

    appendBookNoteSnippet(noteBookId, noteSnippet);
    clearNote();
    toast.success("Note snippet appended.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Capture vocabulary, learnings, and note snippets quickly without leaving your flow.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vocab">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-slate-100 p-1">
            <TabsTrigger value="vocab">Quick Vocab</TabsTrigger>
            <TabsTrigger value="learning">Quick Learning</TabsTrigger>
            <TabsTrigger value="note">Quick Note</TabsTrigger>
          </TabsList>

          <TabsContent value="vocab" className="space-y-3">
            <BookPicker selectedBookId={vocabBookId} onSelect={setVocabBookId} label="Book" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Word</Label>
                <Input value={vocabWord} onChange={(event) => setVocabWord(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Chapter (optional)</Label>
                <Input
                  type="number"
                  min={1}
                  value={vocabChapter}
                  onChange={(event) => setVocabChapter(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meaning</Label>
              <Textarea value={vocabMeaning} onChange={(event) => setVocabMeaning(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Example</Label>
              <Textarea value={vocabExample} onChange={(event) => setVocabExample(event.target.value)} />
            </div>
            <Button onClick={saveVocab}>Save Vocabulary</Button>
          </TabsContent>

          <TabsContent value="learning" className="space-y-3">
            <BookPicker selectedBookId={learningBookId} onSelect={setLearningBookId} label="Book" />
            <div className="space-y-2">
              <Label>Chapter number</Label>
              <Input
                type="number"
                min={1}
                value={learningChapter}
                onChange={(event) => setLearningChapter(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>What I learned</Label>
              <Textarea
                value={learningText}
                onChange={(event) => setLearningText(event.target.value)}
                className="min-h-28"
              />
            </div>
            <Button onClick={saveLearning}>Save Learning</Button>
          </TabsContent>

          <TabsContent value="note" className="space-y-3">
            <BookPicker selectedBookId={noteBookId} onSelect={setNoteBookId} label="Book" />
            <div className="space-y-2">
              <Label>Snippet to append</Label>
              <Textarea
                value={noteSnippet}
                onChange={(event) => setNoteSnippet(event.target.value)}
                className="min-h-28"
                placeholder="Add a quick reflection, key quote, or reminder..."
              />
            </div>
            <Button onClick={saveNoteSnippet}>Append to Notes</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

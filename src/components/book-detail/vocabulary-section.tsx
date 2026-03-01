"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useReadingData } from "@/lib/context/reading-data-context";
import { normalizeTags } from "@/lib/utils";

interface VocabularySectionProps {
  bookId: string;
}

interface VocabDraft {
  word: string;
  meaning: string;
  example: string;
  chapterNumber: string;
  tags: string;
}

const EMPTY_VOCAB_DRAFT: VocabDraft = {
  word: "",
  meaning: "",
  example: "",
  chapterNumber: "",
  tags: "",
};

export function VocabularySection({ bookId }: VocabularySectionProps) {
  const { getVocabEntries, upsertVocabEntry, deleteVocabEntry } = useReadingData();

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"recent" | "az">("recent");
  const [draft, setDraft] = useState<VocabDraft>(EMPTY_VOCAB_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<VocabDraft>(EMPTY_VOCAB_DRAFT);
  const [error, setError] = useState("");

  const entries = getVocabEntries(bookId);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const nextEntries = entries.filter((entry) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${entry.word} ${entry.meaning} ${entry.example} ${entry.tags.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    nextEntries.sort((a, b) => {
      if (sortMode === "az") {
        return a.word.localeCompare(b.word);
      }

      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return nextEntries;
  }, [entries, query, sortMode]);

  const handleCreate = () => {
    setError("");

    try {
      upsertVocabEntry({
        bookId,
        word: draft.word,
        meaning: draft.meaning,
        example: draft.example,
        chapterNumber: draft.chapterNumber ? Number(draft.chapterNumber) : undefined,
        tags: normalizeTags(draft.tags),
      });
      setDraft(EMPTY_VOCAB_DRAFT);
      toast.success("Vocabulary entry added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save entry.");
    }
  };

  const startEdit = (entryId: string) => {
    const existing = entries.find((entry) => entry.id === entryId);
    if (!existing) {
      return;
    }

    setEditingId(entryId);
    setEditDraft({
      word: existing.word,
      meaning: existing.meaning,
      example: existing.example,
      chapterNumber: existing.chapterNumber ? String(existing.chapterNumber) : "",
      tags: existing.tags.join(", "),
    });
  };

  const saveEdit = () => {
    if (!editingId) {
      return;
    }

    setError("");

    try {
      upsertVocabEntry({
        id: editingId,
        bookId,
        word: editDraft.word,
        meaning: editDraft.meaning,
        example: editDraft.example,
        chapterNumber: editDraft.chapterNumber ? Number(editDraft.chapterNumber) : undefined,
        tags: normalizeTags(editDraft.tags),
      });

      setEditingId(null);
      setEditDraft(EMPTY_VOCAB_DRAFT);
      toast.success("Vocabulary entry updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update entry.");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Vocabulary Entry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Word</Label>
            <Input
              placeholder="e.g., nuance"
              value={draft.word}
              onChange={(event) => setDraft((prev) => ({ ...prev, word: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Chapter (optional)</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g., 8"
              value={draft.chapterNumber}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, chapterNumber: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Meaning / Definition</Label>
            <Textarea
              value={draft.meaning}
              onChange={(event) => setDraft((prev) => ({ ...prev, meaning: event.target.value }))}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Example sentence</Label>
            <Textarea
              value={draft.example}
              onChange={(event) => setDraft((prev) => ({ ...prev, example: event.target.value }))}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tags (comma separated)</Label>
            <Input
              placeholder="verb, adjective"
              value={draft.tags}
              onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}
          <div className="md:col-span-2">
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Vocabulary</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative min-w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search word, meaning, tags"
                className="pl-9"
              />
            </div>
            <Select value={sortMode} onValueChange={(value: "recent" | "az") => setSortMode(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="az">A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {filteredEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No vocabulary entries match your search.
            </p>
          ) : null}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] table-auto">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3">Word</th>
                  <th className="pb-2 pr-3">Meaning</th>
                  <th className="pb-2 pr-3">Example</th>
                  <th className="pb-2 pr-3">Chapter</th>
                  <th className="pb-2 pr-3">Tags</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const isEditing = editingId === entry.id;
                  return (
                    <tr key={entry.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-3 text-sm font-semibold text-slate-900">
                        {isEditing ? (
                          <Input
                            value={editDraft.word}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, word: event.target.value }))
                            }
                          />
                        ) : (
                          entry.word
                        )}
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-700">
                        {isEditing ? (
                          <Textarea
                            value={editDraft.meaning}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, meaning: event.target.value }))
                            }
                            className="min-h-16"
                          />
                        ) : (
                          entry.meaning
                        )}
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-600">
                        {isEditing ? (
                          <Textarea
                            value={editDraft.example}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, example: event.target.value }))
                            }
                            className="min-h-16"
                          />
                        ) : (
                          <blockquote className="rounded-lg bg-slate-50 px-2 py-1.5 italic">
                            {entry.example || "No example"}
                          </blockquote>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-600">
                        {isEditing ? (
                          <Input
                            type="number"
                            min={1}
                            value={editDraft.chapterNumber}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                chapterNumber: event.target.value,
                              }))
                            }
                          />
                        ) : (
                          entry.chapterNumber || "-"
                        )}
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-600">
                        {isEditing ? (
                          <Input
                            value={editDraft.tags}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, tags: event.target.value }))
                            }
                          />
                        ) : entry.tags.length ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={saveEdit}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditDraft(EMPTY_VOCAB_DRAFT);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => startEdit(entry.id)}>
                                <PencilLine className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-rose-600 hover:text-rose-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete vocabulary entry?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        deleteVocabEntry(entry.id);
                                        toast.success("Vocabulary entry deleted.");
                                      }}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredEntries.map((entry) => {
              const isEditing = editingId === entry.id;

              return (
                <Card key={entry.id} className="border border-slate-200 shadow-none">
                  <CardContent className="space-y-3 p-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editDraft.word}
                          onChange={(event) =>
                            setEditDraft((prev) => ({ ...prev, word: event.target.value }))
                          }
                        />
                        <Textarea
                          value={editDraft.meaning}
                          onChange={(event) =>
                            setEditDraft((prev) => ({ ...prev, meaning: event.target.value }))
                          }
                        />
                        <Textarea
                          value={editDraft.example}
                          onChange={(event) =>
                            setEditDraft((prev) => ({ ...prev, example: event.target.value }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min={1}
                            placeholder="Chapter"
                            value={editDraft.chapterNumber}
                            onChange={(event) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                chapterNumber: event.target.value,
                              }))
                            }
                          />
                          <Input
                            placeholder="Tags"
                            value={editDraft.tags}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, tags: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-lg font-semibold text-slate-900">{entry.word}</h4>
                          {entry.chapterNumber ? <Badge>Ch {entry.chapterNumber}</Badge> : null}
                        </div>
                        <p className="text-sm text-slate-700">{entry.meaning}</p>
                        <blockquote className="rounded-xl border-l-4 border-cyan-500 bg-cyan-50 px-3 py-2 text-sm italic text-slate-700">
                          {entry.example || "No example"}
                        </blockquote>
                        {entry.tags.length ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <Badge key={tag}>{tag}</Badge>
                            ))}
                          </div>
                        ) : null}
                      </>
                    )}

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={saveEdit}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft(EMPTY_VOCAB_DRAFT);
                            }}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry.id)}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete vocabulary entry?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    deleteVocabEntry(entry.id);
                                    toast.success("Vocabulary entry deleted.");
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

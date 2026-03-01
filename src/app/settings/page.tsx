"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Download, Eraser, RefreshCw, Upload } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useReadingData } from "@/lib/context/reading-data-context";

export default function SettingsPage() {
  const {
    data,
    seedDemoData,
    clearAllData,
    exportBackup,
    importBackup,
    setCloudSyncEnabled,
    setCelebrationsEnabled,
  } = useReadingData();

  const [pendingImport, setPendingImport] = useState<unknown | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const totalBooks = data.books.length;
  const totalVocab = data.vocabEntries.length;
  const totalChapterNotes = data.chapterNotes.length;
  const totalActivityDays = data.activityLogDays.length;

  const mediaSizeMb = useMemo(() => {
    const totalChars = data.mediaBlobs.reduce((acc, blob) => acc + blob.dataUrl.length, 0);
    const bytes = totalChars * 0.75;
    return (bytes / (1024 * 1024)).toFixed(2);
  }, [data.mediaBlobs]);

  const triggerExport = async () => {
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `readlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported.");
    } catch (error) {
      console.error(error);
      toast.error("Backup export failed.");
    }
  };

  const readImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setPendingImport(parsed);
      } catch {
        toast.error("Invalid backup file.");
      }
    };
    reader.readAsText(selectedFile);
    event.target.value = "";
  };

  const confirmImport = async () => {
    if (!pendingImport) {
      return;
    }

    setIsImporting(true);
    try {
      await importBackup(pendingImport);
      setPendingImport(null);
      toast.success("Backup imported successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Backup import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Configuration</p>
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-600">
          Manage your synced Supabase data, backups, and reading momentum preferences.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Books</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalBooks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalVocab}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Chapter Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalChapterNotes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Image Blobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{data.mediaBlobs.length}</p>
            <p className="text-xs text-slate-500">~{mediaSizeMb} MB stored</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Activity Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{totalActivityDays}</p>
            <p className="text-xs text-slate-500">Used for streaks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage + Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>
            ReadLog stores your books, notes, vocabulary, and settings in Supabase so your data stays available across devices.
          </p>

          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>
                  <RefreshCw className="h-4 w-4" />
                  Seed Demo Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Load demo data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This replaces your current data with predefined sample books, notes, and vocabulary.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={seedDemoData}>Load Demo Data</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-rose-600 hover:text-rose-700">
                  <Eraser className="h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all local data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently clears books, notes, vocabulary, and settings from your synced account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllData}>Clear Data</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={triggerExport}>
              <Download className="h-4 w-4" />
              Export Backup
            </Button>

            <label>
              <input type="file" accept="application/json" className="hidden" onChange={readImportFile} />
              <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                <Upload className="h-4 w-4" />
                Import Backup
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync Preference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            Supabase sync is active for this account. This toggle is retained as a profile preference.
          </p>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <Label htmlFor="cloud-sync" className="text-sm font-semibold text-slate-800">
                Cloud sync preference
              </Label>
              <p className="text-xs text-slate-500">Data is synced by default for all signed-in sessions.</p>
            </div>
            <input
              id="cloud-sync"
              type="checkbox"
              checked={data.settings.cloudSyncEnabled}
              onChange={(event) => setCloudSyncEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Momentum Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <Label htmlFor="celebrations" className="text-sm font-semibold text-slate-800">
                Enable milestones and celebration toasts
              </Label>
              <p className="text-xs text-slate-500">
                Includes first-vocab and 25/50/75/100% progress milestones.
              </p>
            </div>
            <input
              id="celebrations"
              type="checkbox"
              checked={data.settings.celebrationsEnabled}
              onChange={(event) => setCelebrationsEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900"
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(pendingImport)} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import backup and overwrite current data?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current synced Supabase data will be replaced by the imported backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              {isImporting ? "Importing..." : "Import Backup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

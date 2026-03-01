import type { SupabaseClient } from "@supabase/supabase-js";

import { type ActivityLogDay, type AppSettings } from "@/lib/types";

interface AppSettingsRow {
  user_id: string;
  cloud_sync_enabled: boolean;
  celebrations_enabled: boolean;
  last_backup_at: string | null;
  updated_at: string;
}

interface ActivityLogDayRow {
  user_id: string;
  date: string;
  count: number;
  last_activity_at: string;
  types: string[] | null;
}

export function createDefaultSettings(overrides?: Partial<AppSettings>): AppSettings {
  return {
    id: "app",
    cloudSyncEnabled: true,
    celebrationsEnabled: true,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mapSettingsRowToModel(row: AppSettingsRow): AppSettings {
  return createDefaultSettings({
    cloudSyncEnabled: row.cloud_sync_enabled,
    celebrationsEnabled: row.celebrations_enabled,
    lastBackupAt: row.last_backup_at ?? undefined,
    updatedAt: row.updated_at,
  });
}

function mapSettingsToRow(settings: AppSettings, userId: string) {
  return {
    user_id: userId,
    cloud_sync_enabled: settings.cloudSyncEnabled,
    celebrations_enabled: settings.celebrationsEnabled,
    last_backup_at: settings.lastBackupAt ?? null,
    updated_at: settings.updatedAt,
  };
}

export async function loadSettingsByUser(supabase: SupabaseClient, userId: string): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const defaults = createDefaultSettings();
    await upsertSettingsByUser(supabase, userId, defaults);
    return defaults;
  }

  return mapSettingsRowToModel(data as AppSettingsRow);
}

export async function upsertSettingsByUser(
  supabase: SupabaseClient,
  userId: string,
  settings: AppSettings,
) {
  const { error } = await supabase
    .from("app_settings")
    .upsert(mapSettingsToRow(settings, userId), { onConflict: "user_id" });

  if (error) {
    throw error;
  }
}

export async function listActivityLogDaysByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActivityLogDay[]> {
  const { data, error } = await supabase
    .from("activity_log_days")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const typed = row as ActivityLogDayRow;

    return {
      date: typed.date,
      count: typed.count,
      lastActivityAt: typed.last_activity_at,
      types: (typed.types ?? []) as ActivityLogDay["types"],
    };
  });
}

function mapActivityLogDayToRow(day: ActivityLogDay, userId: string) {
  return {
    user_id: userId,
    date: day.date,
    count: day.count,
    last_activity_at: day.lastActivityAt,
    types: day.types,
  };
}

export async function upsertActivityLogDayByUser(
  supabase: SupabaseClient,
  userId: string,
  day: ActivityLogDay,
) {
  const { error } = await supabase
    .from("activity_log_days")
    .upsert(mapActivityLogDayToRow(day, userId), { onConflict: "user_id,date" });

  if (error) {
    throw error;
  }
}

export async function upsertActivityLogDaysByUser(
  supabase: SupabaseClient,
  userId: string,
  days: ActivityLogDay[],
) {
  if (!days.length) {
    return;
  }

  const { error } = await supabase
    .from("activity_log_days")
    .upsert(days.map((day) => mapActivityLogDayToRow(day, userId)), {
      onConflict: "user_id,date",
    });

  if (error) {
    throw error;
  }
}

export async function deleteAllActivityLogDaysByUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("activity_log_days").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}

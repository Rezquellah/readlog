import type { SupabaseClient } from "@supabase/supabase-js";

const COVER_BUCKET = "readlog-covers";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, "-").toLowerCase();
}

export async function uploadCoverForUser(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${userId}/${crypto.randomUUID()}.${sanitizeFilename(ext)}`;

  const { error } = await supabase.storage.from(COVER_BUCKET).upload(filePath, file, {
    upsert: false,
    contentType: file.type || "image/*",
    cacheControl: "3600",
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(COVER_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

export { COVER_BUCKET };

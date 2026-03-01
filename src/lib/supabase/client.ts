import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const supabaseUrl =
      publicEnv.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseAnonKey =
      publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key";

    browserClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
    );
  }

  return browserClient;
}

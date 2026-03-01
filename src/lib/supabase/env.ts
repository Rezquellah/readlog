export interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

function readPublicEnv(name: keyof PublicEnv) {
  const value = process.env[name];

  if (value && value.trim()) {
    return value;
  }

  if (process.env.NODE_ENV === "test") {
    return `test-${name.toLowerCase()}`;
  }

  const message = `Missing required environment variable ${name}. Add it to your .env.local (development) and Vercel project settings (production).`;

  // Avoid crashing the browser bundle from stale hot-reload env state.
  // Keep strict failure for server/build paths where env must exist.
  if (typeof window !== "undefined") {
    console.error(message);
    return "";
  }

  throw new Error(message);
}

export const publicEnv: PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: readPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};

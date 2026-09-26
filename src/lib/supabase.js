import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      // Passkeys/WebAuthn are opt-in in Supabase JS. Enabling the client API
      // does not force passkey login and does not weaken existing auth flows.
      experimental: { passkey: true },
    },
  }
);
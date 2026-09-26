// Reuse the single configured Supabase client.
// This keeps project credentials/configuration in one place and makes key rotation safe.
export { supabase } from "../lib/supabase";

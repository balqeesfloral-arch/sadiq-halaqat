import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://mdkhklotknuseilyrvqe.supabase.co";

const supabaseKey =
  "sb_publishable_bcUxs6kzHTz4nSli1l3w1A_E1tr8HOE";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null quando as variáveis de ambiente não estão configuradas —
// nesse caso o app cai de volta para localStorage (ver storageShim.js).
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

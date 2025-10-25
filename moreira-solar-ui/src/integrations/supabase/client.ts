// src/integrations/supabase/client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// 🔒 Protege contra múltiplas instâncias no mesmo contexto
let supabaseSingleton: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
  if (!supabaseSingleton) {
    supabaseSingleton = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseSingleton;
};

// ✅ export padrão compatível com todos os imports existentes
export const supabase = getSupabase();

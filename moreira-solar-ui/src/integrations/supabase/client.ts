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
        // 🔁 Sessão dura enquanto o navegador estiver aberto
        storage: sessionStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          "x-client-info": "moreira-solar-ui",
        },
      },
    });

    console.info("[Supabase] Client inicializado com sessionStorage 🧠");
  }
  return supabaseSingleton;
};

// ✅ export padrão compatível com todos os imports existentes
export const supabase = getSupabase();

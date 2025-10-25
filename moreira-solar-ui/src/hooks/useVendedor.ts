// src/hooks/useVendedor.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna um mapa de vendedores no formato:
 * {
 *   "uuid-do-vendedor": "Nome do Vendedor"
 * }
 */
export async function getVendedoresMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome");

  if (error) {
    console.error("Erro ao buscar vendedores:", error);
    return {};
  }

  const vendedoresMap: Record<string, string> = {};

  for (const vendedor of data) {
    vendedoresMap[vendedor.id] = vendedor.nome;
  }

  return vendedoresMap;
}

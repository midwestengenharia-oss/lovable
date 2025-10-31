// src/hooks/useVendedor.ts
// Vendedores via BFF

/**
 * Retorna um mapa de vendedores no formato:
 * {
 *   "uuid-do-vendedor": "Nome do Vendedor"
 * }
 */
export async function getVendedoresMap(): Promise<Record<string, string>> {
  try {
    const res = await fetch('/api/vendedores', { credentials: 'include' });
    if (!res.ok) throw new Error('Falha ao buscar vendedores');
    const data = await res.json();
    const map: Record<string, string> = {};
    for (const v of data || []) map[v.id] = v.nome;
    return map;
  } catch (e) {
    console.error('Erro ao buscar vendedores:', e);
    return {};
  }
}

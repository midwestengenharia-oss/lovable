/**
 * Gera o HTML da tabela de economia para o template do PDF.
 * Cada linha representa um ano com sua economia anual e acumulada.
 */
export function gerarTabelaEconomia(
    rows: { periodo: number; economiaAnual: string; economiaAcumulada: string }[]
): string {
    if (!rows || !rows.length) {
        return "<tr><td colspan='3' style='text-align:center'>Sem dados</td></tr>";
    }

    return rows
        .map(
            (row, index) => `
        <tr${index % 2 === 0 ? ' class="alt"' : ""}>
          <td class="col-ano">Ano ${row.periodo}</td>
          <td class="col-ea">${row.economiaAnual}</td>
          <td class="col-ac">${row.economiaAcumulada}</td>
        </tr>
      `
        )
        .join("");
}

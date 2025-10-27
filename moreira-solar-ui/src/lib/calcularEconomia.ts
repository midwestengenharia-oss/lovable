// utils/gerarTabelaEconomia.ts

interface LinhaTabela {
    periodo: string | number;
    economiaAnual: string;
    economiaAcumulada: string;
}

/**
 * Gera as linhas HTML da tabela de economia
 */
export function gerarTabelaEconomia(dados: LinhaTabela[]): string {
    return dados
        .map((row, index) => {
            const classAlt = index % 2 === 0 ? "" : ' class="alt"';
            return `
        <tr${classAlt}>
          <td class="col-ano">Ano ${row.periodo}</td>
          <td class="col-ea">${row.economiaAnual}</td>
          <td class="col-ac">${row.economiaAcumulada}</td>
        </tr>
      `;
        })
        .join("");
}
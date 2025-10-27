// src/lib/pdf/moreiraTemplate.ts
export type PdfData = {
    logo_url?: string;
    cliente_nome?: string;
    parcela_mensal?: string;
    geracao?: string;
    conta_base?: string;
    inversor?: string;
    modulos?: string;
    valor_estrutura_solo?: string;

    icon_economia?: string;
    retorno_mes?: string;   // "R$ 350,00 (78%)"
    icon_retorno?: string;
    retorno_ano?: string;   // "84 meses (~7 anos)"

    vendedor_nome?: string;
    vendedor_telefone?: string;

    saving_total?: string;
    acumulado_total?: string;

    // Tabela/Payback
    economia_payback?: string;   // linhas separadas por \n ex: "R$ 5.000,00\nR$ 5.300,00\n..."
    acumulado_payback?: string;  // idem
    valor_base?: string;         // para descobrir payback
};

function parseBRL(str: any) {
    if (str == null) return 0;
    const s = String(str).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
}

function descobrirPaybackAno(valorBaseStr?: string, acumuladoStr?: string) {
    const valorBase = parseBRL(valorBaseStr);
    const acumulados = String(acumuladoStr || '')
        .trim()
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(parseBRL);

    for (let i = 0; i < acumulados.length; i++) {
        if (acumulados[i] >= valorBase) return i + 1; // 1-based
    }
    return null;
}

function processarEconomias(economiaStr?: string, acumuladoStr?: string, paybackAnoCalc?: number | null) {
    const economias = String(economiaStr || '').trim().split('\n').map(s => s.trim()).filter(Boolean);
    const acumulados = String(acumuladoStr || '').trim().split('\n').map(s => s.trim()).filter(Boolean);

    let linhas = '';
    for (let ano = 1; ano <= 30; ano++) {
        const idx = ano - 1;
        const alt = (idx % 2 !== 0);
        const isFinal = (ano === 30);
        const isPayback = (paybackAnoCalc && ano === paybackAnoCalc);

        const baseBg = alt ? 'background:#fafafa;' : '';
        const finalBg = isFinal ? 'background:#f8f8f8;' : baseBg;
        const pbBg = isPayback ? 'background:rgba(13,159,0,.20);' : '';
        const weight = (isPayback || isFinal) ? 'font-weight:700;' : 'font-weight:600;';

        const ea = economias[idx] || 'R$ 0,00';
        const ac = acumulados[idx] || 'R$ 0,00';
        const rowBg = isPayback ? pbBg : finalBg;

        linhas += `
      <tr style="border-bottom:1px solid #f0f0f0;${rowBg}">
        <td style="padding:7px 8px;text-align:center;color:#333;${weight}font-size:11px;line-height:1.0;">Ano ${ano}</td>
        <td style="padding:7px 8px;text-align:center;color:#0d9f00;${weight}font-size:11px;line-height:1.0;">${ea}</td>
        <td style="padding:7px 8px;text-align:center;color:#004aad;${weight}font-size:11px;line-height:1.0;">${ac}</td>
      </tr>`;
    }
    return linhas;
}

export function buildMoreiraHtml(inputData: PdfData) {
    const paybackAnoCalc = descobrirPaybackAno(inputData.valor_base, inputData.acumulado_payback);

    // TODO: o HTML abaixo é exatamente o seu (n8n), apenas colado aqui:
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Simulação Solar - Moreira Solar</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0; }
    *{ box-sizing:border-box; margin:0; padding:0; }
    :root{ --logo-w: 280px; --logo-top: 10px; --logo-gap: 25px; --kpi-title-lh: 1.2; }
    body{ font-family:'Segoe UI','Montserrat',Arial,sans-serif; background:#d9d9d9; }
    .page{ position:relative; display:flex; flex-direction:column; justify-content:space-between; min-height:297mm; background:#d9d9d9; }
    .page-content{ flex:1; padding:30px 60px 80px 60px; display:flex; flex-direction:column; color:#0d103c; }
    .footer{ position:absolute; bottom:0; left:0; right:0; border-top:1px solid #999; padding:10px 60px; background:#d9d9d9; font:13px/1.4 'Montserrat',sans-serif; }
    .footer table{ width:100%; border-collapse:collapse; }
    .footer td{ vertical-align:top; font-size:13px; }
    .card{ border-radius:20px; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.08); overflow:hidden; }
    .card-head{ background:#ffcc27; color:#fff; font-size:23px; font-weight:700; line-height:1; text-align:center; padding:15px; text-transform:uppercase; letter-spacing:0.5px; font-family:'Montserrat',sans-serif; }
    .card-head.dark{ background:#0d103c; color:#fff; font-size:15px; padding:14px 30px; letter-spacing:0.3px; line-height: var(--kpi-title-lh); }
    .card-body{ padding:25px 20px; text-align:center; border-bottom:1px solid #e8e8e8; font-size:26px; font-weight:700; line-height:1.3; color:#0d103c; font-family:'Montserrat',sans-serif; }
    .card .grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:0; border-top:1px solid #e8e8e8; }
    .card .grid-2 .cell{ text-align:center; padding:20px; border-bottom:1px solid #e8e8e8; }
    .card .grid-2 .cell:nth-child(odd){ border-right:1px solid #e8e8e8; }
    .card .grid-2 .cell:nth-child(3), .card .grid-2 .cell:nth-child(4){ border-bottom:none; }
    .cell .lbl{ font-size:16px; font-weight:400; color:#333; margin-bottom:6px; }
    .cell .val{ font-size:16px; font-weight:700; color:#0d103c; }
    .kpi-grid{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
    .kpi-grid .card{ border-radius:18px; }
    .kpi-grid .card .card-body{ padding:30px 40px; border:none; font-size:inherit; }
    .grid-2-alt{ display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:25px; }
    .grid-2-alt .card{ border-radius:18px; }
    .grid-2-alt .card .card-head.dark{ font-size:14px; padding:14px 20px; line-height:1.3; }
    .grid-2-alt .card .card-body{ padding:20px; border:none; font-size:22px; color:#0d9f00; }
    .table-wrap{ background:#fff; border-radius:18px; box-shadow:0 2px 8px rgba(0,0,0,.08); overflow:hidden; }
    .table-econ{ width:100%; border-collapse:collapse; font-size:10px; }
    .table-econ thead th{ font-weight:700; font-size:14px; color:#0d103c; padding:10px 8px; text-align:center; border-bottom:2px solid #e0e0e0; line-height:1.2; font-family:'Montserrat',sans-serif; background:#f8f8f8; }
    .logo-wrap{ text-align:center; padding-top:var(--logo-top); margin-bottom:var(--logo-gap); }
    .logo{ display:block; width:var(--logo-w); height:auto; margin:0 auto; }
    .ac-line{ margin:0 0 25px 0; line-height:1.3; text-align:center; font-weight:400; }
    @media print { .card{ box-shadow:none !important; } }
  </style>
</head>
<body>

  <div class="page">
    <div class="page-content">
      <div class="logo-wrap">
        <img class="logo" src="${inputData.logo_url || 'https://baserow.simplexsolucoes.com.br/media/user_files/YkxEezEapDAth0bXQ85kqsffcNaEDXNe_f85e0986e4287a217e99c0f6d020e47fa49cba108c4bfbfb450e7eaa2a062ceb.png'}" alt="Moreira Solar">
      </div>

      <p class="ac-line" style="font-size:20px;">
        <strong style="font-weight:700;">A/C:</strong> <span>${inputData.cliente_nome || 'Cliente'}</span>
      </p>

      <div class="card" style="margin-bottom:20px;">
        <div class="card-head">Sistema Proposto</div>
        <div class="card-body" style="border-top:none;">
          ${inputData.parcela_mensal || 'PARCELAS_AQUIx de VALOR_PARCELA_AQUI'}
        </div>

        <div class="obs" style="padding:20px 30px; text-align:center; font-size:14px; line-height:1.6; border-bottom:1px solid #e8e8e8;">
          <p style="color:#666; font-weight:500; margin-bottom:8px; font-size:14px;">Observações:</p>
          <p style="color:#ff3838; font-weight:700; margin-bottom:0; font-size:24px; text-transform:uppercase;">
            A primeira parcela vence 30 dias<br>após a ligação da usina!
          </p>
        </div>

        <div class="grid-2">
          <div class="cell">
            <div class="lbl">Geração média mensal:</div>
            <strong class="val">${inputData.geracao || 'GERACAO_AQUI kWh/mês'}</strong>
          </div>
          <div class="cell">
            <div class="lbl">Equivalente à:</div>
            <strong class="val">${inputData.conta_base || 'CONTA_BASE_AQUI'}</strong>
          </div>
          <div class="cell">
            <div class="lbl">Tamanho do inversor:</div>
            <strong class="val">${inputData.inversor || 'INVERSOR_AQUI kW'}</strong>
          </div>
          <div class="cell">
            <div class="lbl">Quantidade de placas:</div>
            <strong class="val">${inputData.modulos || 'QTD_MODULOS_AQUI módulos de POTENCIA_MODULOS_AQUI W'}</strong>
          </div>
        </div>

        ${inputData.valor_estrutura_solo
            ? `<div style="border-top:1px solid #e8e8e8;padding:18px;text-align:center;">
               <div style="font-size:13px;font-weight:500;color:#555;margin-bottom:6px;">Custo Estrutura de Solo:</div>
               <strong style="color:#ff6b35;font-size:20px;font-weight:700;">${inputData.valor_estrutura_solo}</strong>
             </div>`
            : ``}
      </div>

      <div class="kpi-grid">
        <div class="card">
          <div class="card-head dark">Economia<br>Imediata</div>
          <div class="card-body">
            <img src="${inputData.icon_economia || 'https://baserow.simplexsolucoes.com.br/media/user_files/CqEeeRpaUXUdWarNvSoppCPsPj2EcDSw_3928b75fac9903b1611a8a92497620e86926936a6a4a05d24d74502de2e51531.png'}" alt="Economia" style="width:70px;height:70px;margin-bottom:12px;">
            <div style="font-weight:700;font-size:18px;color:#0d9f00;">
              ${inputData.retorno_mes || 'ECONOMIA_MENSAL_AQUI (ECONOMIA_PERCENTUAL_AQUI)'}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head dark">Retorno sobre<br>Investimento</div>
          <div class="card-body">
            <img src="${inputData.icon_retorno || 'https://baserow.simplexsolucoes.com.br/media/user_files/bjobT9yYhEOWOXOU49phCxzQyxTPphv8_807e0984649438b0d27a119827695d045d56faecea609bf897953f9d0dc8b243.png'}" alt="Retorno" style="width:70px;height:70px;margin-bottom:12px;">
            <div style="font-weight:700;font-size:18px;color:#004aad;">
              ${inputData.retorno_ano || 'PAYBACK_MESES_AQUI meses (~PAYBACK_ANOS_AQUI anos)'}
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="footer">
      <table>
        <tr>
          <td style="width:50%;text-align:left;">
            <div style="font-style:italic;margin-bottom:2px;">Atenciosamente,</div>
            <div style="font-weight:700;margin-bottom:2px;">${inputData.vendedor_nome || 'VENDEDOR_NOME_AQUI'}</div>
            <div>${inputData.vendedor_telefone || 'VENDEDOR_TELEFONE_AQUI'}</div>
          </td>
          <td style="width:50%;text-align:right;">
            <div style="font-weight:700;margin-bottom:2px;">MOREIRA SOLAR</div>
            <div>administrativo@moreirasolar.com.br</div>
            <div>Rua Desbravadores, 2050 - Bela Vista - Sorriso/MT</div>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <div class="page" style="page-break-before:always;">
    <div class="page-content">

      <div class="grid-2-alt">
        <div class="card">
          <div class="card-head dark">Ganhos Acumulados Durante o Pagamento do Financiamento</div>
          <div class="card-body">
            <div style="text-align:center;font-size:22px;font-weight:700;color:#0d9f00;font-family:'Montserrat',sans-serif;">
              ${inputData.saving_total || 'GANHOS_PARCELAMENTO_AQUI'}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head dark">Ganhos Acumulados<br>durante 30 Anos</div>
          <div class="card-body">
            <div style="text-align:center;font-size:22px;font-weight:700;color:#0d9f00;font-family:'Montserrat',sans-serif;">
              ${inputData.acumulado_total || 'ECONOMIA_TOTAL_AQUI'}
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table-econ">
          <thead>
            <tr>
              <th>Período</th>
              <th>Economia Anual</th>
              <th>Economia Acumulada</th>
            </tr>
          </thead>
          <tbody>
            ${processarEconomias(inputData.economia_payback, inputData.acumulado_payback, paybackAnoCalc)}
          </tbody>
        </table>
      </div>

    </div>

    <div class="footer">
      <table>
        <tr>
          <td style="width:50%;text-align:left;">
            <div style="font-style:italic;margin-bottom:2px;">Atenciosamente,</div>
            <div style="font-weight:700;margin-bottom:2px;">${inputData.vendedor_nome || 'VENDEDOR_NOME_AQUI'}</div>
            <div>${inputData.vendedor_telefone || 'VENDEDOR_TELEFONE_AQUI'}</div>
          </td>
          <td style="width:50%;text-align:right;">
            <div style="font-weight:700;margin-bottom:2px;">MOREIRA SOLAR</div>
            <div>administrativo@moreirasolar.com.br</div>
            <div>Rua Desbravadores, 2050 - Bela Vista - Sorriso/MT</div>
          </td>
        </tr>
      </table>
    </div>
  </div>

</body>
</html>`;

    return html;
}

import { toast } from "sonner";

export interface SalvarUnidadesEnergisaOptions {
  titularId: string | null;
  clienteId: string | null;
  projetoId: string | null;
  userId?: string | null;
}

// Estrutura genérica para a UC retornada pela API da Energisa.
export interface EnergisaUC {
  [key: string]: any;
}

// Estrutura de dados de GD da Energisa
export interface EnergisaGDInfo {
  numeroUc?: number;
  cdc?: number;
  codigoEmpresaWeb?: number;
  digitoVerificador?: number;
  tipoGeracao?: string;
  tipoCompartilhamento?: string;
  percentualCompensacao?: number;
  kwhExcedente?: number;
  qtdKwhSaldo?: number;
  qtdKwhGeracaoEnergia?: number;
  listaBeneficiarias?: Array<{
    cdc?: number;
    codigoEmpresaWeb?: number;
    digitoVerificador?: number;
    nome?: string;
    percentualRecebido?: number;
    qtdKwhRecebido?: number;
    cidade?: string;
    uf?: string;
    endereco?: string;
    tipoPessoa?: string;
  }>;
}

function extrairNumeroUC(uc: EnergisaUC): string | null {
  const candidates = [
    uc.cdc,
    uc.numeroUC,
    uc.numero_uc,
    uc.numeroInstalacao,
    uc.numero_instalacao,
    uc.numero,
    uc.uc,
    uc.codigo_uc,
    uc.codigo,
    uc.id,
  ];

  const valor = candidates
    .map((v) => (v != null ? String(v).trim() : ""))
    .find((v) => v.length > 0);

  return valor || null;
}

/**
 * Salva ou atualiza UCs da Energisa no banco com informações completas de GD
 * Realiza UPSERT: atualiza se existe, cria se não existe
 */
export async function salvarUnidadesEnergisa(
  energisaUCs: EnergisaUC[],
  options: SalvarUnidadesEnergisaOptions,
  gdInfo?: EnergisaGDInfo[] // Informações de GD opcionais
) {
  if (!Array.isArray(energisaUCs) || energisaUCs.length === 0) {
    toast.info("Nenhuma unidade para salvar");
    return [];
  }

  try {
    // Busca UCs já cadastradas
    const existingRes = await fetch("/api/unidades-consumidoras", {
      credentials: "include",
    });

    if (!existingRes.ok) {
      throw new Error("Falha ao carregar unidades já cadastradas");
    }

    const existingData = (await existingRes.json()) as any[];

    // Mapear UCs existentes por número de instalação
    const existentesMap = new Map(
      (existingData || [])
        .filter((u) => u && u.numero_instalacao)
        .map((u) => [String(u.numero_instalacao), u])
    );

    // Criar mapa de informações de GD por CDC
    const gdMap = new Map<string, EnergisaGDInfo>();
    if (gdInfo && Array.isArray(gdInfo)) {
      gdInfo.forEach((gd) => {
        const cdc = gd.numeroUc || gd.cdc;
        if (cdc) {
          gdMap.set(String(cdc), gd);
        }
      });
    }

    const results = {
      criadas: 0,
      atualizadas: 0,
      erros: 0,
      detalhes: [] as any[]
    };

    // Processar cada UC
    for (const uc of energisaUCs) {
      try {
        const numeroUC = extrairNumeroUC(uc);
        if (!numeroUC) {
          results.erros++;
          continue;
        }

        // Verificar se UC é geradora ou beneficiária
        const gdDaUC = gdMap.get(numeroUC);
        const ehGeradora = gdDaUC ? !!gdDaUC.listaBeneficiarias && gdDaUC.listaBeneficiarias.length > 0 : false;
        const ehBeneficiaria = false; // Será determinado na segunda passada

        // Preparar payload com todos os dados
        const payload = {
          numeroUC,
          titularId: options.titularId,
          clienteId: options.clienteId,
          projetoId: options.projetoId,
          cidade: uc.cidade ?? uc.cidade_instalacao ?? uc.cidadeInstalacao ?? null,
          uf: uc.uf ?? uc.estado ?? uc.ufInstalacao ?? null,
          distribuidora: uc.distribuidora ?? "Energisa",
          grupo: uc.grupo ?? uc.grupoTarifario ?? null,
          classe: uc.classe ?? uc.classeTarifaria ?? null,
          modalidade: uc.modalidade ?? uc.modalidadeTarifaria ?? null,
          ativo: uc.ativo ?? true,
          tipo: ehGeradora ? 'geradora' : 'consumidora',
          // Campos de endereço completos
          endereco: uc.endereco ?? uc.enderecoInstalacao ?? null,
          numero: uc.numero ?? uc.numeroEndereco ?? null,
          complemento: uc.complemento ?? null,
          bairro: uc.bairro ?? null,
          cep: uc.cep ?? null,
          // Campos técnicos
          tipo_ligacao: uc.tipoLigacao ?? uc.tipo_ligacao ?? null,
          tensao_nominal: uc.tensaoNominal ?? uc.tensao_nominal ?? null,
          // Campos de GD
          eh_geradora: ehGeradora,
          tipo_geracao: gdDaUC?.tipoGeracao ?? null,
          tipo_compartilhamento: gdDaUC?.tipoCompartilhamento ?? null,
          potencia_instalada_kw: gdDaUC?.kwhExcedente ?? null,
          saldo_creditos_kwh: gdDaUC?.qtdKwhSaldo ?? null,
          geracao_mensal_kwh: gdDaUC?.qtdKwhGeracaoEnergia ?? null,
        };

        const ucExistente = existentesMap.get(numeroUC);

        if (ucExistente) {
          // ATUALIZAR (UPDATE)
          const res = await fetch(`/api/unidades-consumidoras/${ucExistente.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            results.atualizadas++;
            results.detalhes.push({ numeroUC, acao: 'atualizada', status: 'sucesso' });
          } else {
            results.erros++;
            results.detalhes.push({ numeroUC, acao: 'atualizada', status: 'erro' });
          }
        } else {
          // CRIAR (INSERT)
          const res = await fetch("/api/unidades-consumidoras", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            results.criadas++;
            results.detalhes.push({ numeroUC, acao: 'criada', status: 'sucesso' });
          } else {
            results.erros++;
            results.detalhes.push({ numeroUC, acao: 'criada', status: 'erro' });
          }
        }
      } catch (error: any) {
        results.erros++;
        console.error(`Erro ao processar UC:`, error);
      }
    }

    // Segunda passada: identificar beneficiárias
    if (gdInfo && Array.isArray(gdInfo)) {
      for (const gd of gdInfo) {
        if (gd.listaBeneficiarias && gd.listaBeneficiarias.length > 0) {
          const cdcGeradora = String(gd.numeroUc || gd.cdc);

          for (const benef of gd.listaBeneficiarias) {
            const cdcBeneficiaria = String(benef.cdc);
            const ucBenef = Array.from(existentesMap.values()).find(
              (u) => String(u.numero_instalacao) === cdcBeneficiaria
            );

            if (ucBenef) {
              try {
                await fetch(`/api/unidades-consumidoras/${ucBenef.id}`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    eh_beneficiaria: true,
                    numero_uc_geradora: cdcGeradora,
                    percentual_compensacao: benef.percentualRecebido ?? 0,
                    kwh_recebido_mensal: benef.qtdKwhRecebido ?? 0,
                  }),
                });
              } catch (error) {
                console.error(`Erro ao atualizar beneficiária ${cdcBeneficiaria}:`, error);
              }
            }
          }
        }
      }
    }

    // Feedback para o usuário
    const mensagens = [];
    if (results.criadas > 0) mensagens.push(`${results.criadas} criada(s)`);
    if (results.atualizadas > 0) mensagens.push(`${results.atualizadas} atualizada(s)`);
    if (results.erros > 0) mensagens.push(`${results.erros} erro(s)`);

    if (mensagens.length > 0) {
      toast.success(`UCs processadas: ${mensagens.join(', ')}`);
    } else {
      toast.info("Nenhuma UC para processar");
    }

    return results;
  } catch (error: any) {
    toast.error(`Erro ao salvar UCs: ${error.message}`);
    throw error;
  }
}
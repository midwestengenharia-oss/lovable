// hooks/useEnergisaImport.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const ENERGISA_API_BASE = "http://localhost:8000";

export interface EnergisaUC {
    cdc: number;
    digito: number;
    codigo_empresa: number;
    numero_instalacao: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    titular?: string;
    tipo_ligacao?: string;
    classe?: string;
    status?: string;
    tipo_uc?: 'geradora' | 'beneficiaria' | 'convencional';
    potencia_instalada_kw?: number;
    existeNoBanco?: boolean;
    dadosAntigos?: any;
    [key: string]: any;
}

export interface GDInfo {
    cdc: number;
    tipo_participacao: 'Geradora' | 'Beneficiária';
    modalidade?: string;
    potencia_instalada_kw?: number;
    data_conexao?: string;
    status?: string;
    creditos_disponiveis_kwh?: number;
    ucs_relacionadas?: number[];
}

export interface ImportProgress {
    total: number;
    processadas: number;
    sucesso: number;
    erros: number;
    ucAtual?: string;
    logs: ImportLog[];
    percentual: number;
    tempoDecorrido: number;
    tempoEstimado?: number;
}

export interface ImportLog {
    timestamp: Date;
    tipo: 'info' | 'success' | 'error' | 'warning';
    mensagem: string;
    uc?: string;
    detalhes?: any;
}

export interface TitularEnergia {
    id: string;
    nome: string;
    cpfCnpj: string;
    email?: string;
    telefone?: string;
}

export function useEnergisaImport() {
    const queryClient = useQueryClient();

    // Estados principais
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [cpfGestor, setCpfGestor] = useState<string>('');
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [titular, setTitular] = useState<TitularEnergia | null>(null);
    const [ucsEnergisa, setUcsEnergisa] = useState<EnergisaUC[]>([]);
    const [gdInfo, setGdInfo] = useState<GDInfo[]>([]);
    const [importProgress, setImportProgress] = useState<ImportProgress>({
        total: 0,
        processadas: 0,
        sucesso: 0,
        erros: 0,
        logs: [],
        percentual: 0,
        tempoDecorrido: 0,
    });

    // Estados de controle
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importStartTime, setImportStartTime] = useState<number | null>(null);

    // ==============================================
    // 1. LOGIN ENERGISA
    // ==============================================
    const iniciarLogin = useCallback(async (cpf: string) => {
        if (!cpf || cpf.length !== 11) {
            setError("CPF inválido (11 dígitos).");
            return false;
        }

        setLoading(true);
        setError(null);
        setCpfGestor(cpf);

        try {
            const res = await fetch(`${ENERGISA_API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpf }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Erro ao iniciar login");
            }

            setSessionId(data.session_id);
            setStatusMsg(data.message || "SMS enviado com sucesso");

            // Salvar sessão no banco
            await salvarSessao(data.session_id, cpf, 'pendente_sms');

            toast.success("Código SMS enviado!");
            return true;
        } catch (e: any) {
            const mensagem = e.message || "Erro ao iniciar login";
            setError(mensagem);
            toast.error(mensagem);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // ==============================================
    // 2. CONFIRMAR SMS
    // ==============================================
    const confirmarSMS = useCallback(async (codigo: string) => {
        if (!sessionId || !codigo || codigo.length !== 6) {
            setError("Código SMS inválido");
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${ENERGISA_API_BASE}/api/sms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, codigo }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Código SMS inválido");
            }

            // Atualizar sessão para autenticado
            await atualizarSessao(sessionId, 'autenticado');

            toast.success("Autenticação realizada com sucesso!");
            return true;
        } catch (e: any) {
            const mensagem = e.message || "Erro ao confirmar SMS";
            setError(mensagem);
            toast.error(mensagem);
            return false;
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    // ==============================================
    // 3. BUSCAR OU CRIAR TITULAR
    // ==============================================
    const buscarOuCriarTitular = useCallback(async (
        cpf: string,
        autoCreate: boolean = true
    ): Promise<TitularEnergia | null> => {
        setLoading(true);
        setError(null);

        try {
            // Buscar titular existente por CPF
            const res = await fetch(`/api/titulares-energia/buscar-por-cpf?cpf=${cpf}`, {
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setTitular(data);
                    toast.success(`Titular encontrado: ${data.nome}`);
                    return data;
                }
            }

            // Se não encontrou e pode criar automaticamente
            if (autoCreate) {
                const createRes = await fetch('/api/titulares-energia', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome: `Titular ${cpf}`,
                        cpf_cnpj: cpf,
                        observacoes: 'Criado automaticamente via importação Energisa',
                    }),
                });

                if (!createRes.ok) {
                    throw new Error('Falha ao criar titular');
                }

                const novoTitular = await createRes.json();
                setTitular(novoTitular);
                toast.success("Novo titular criado!");
                return novoTitular;
            }

            return null;
        } catch (e: any) {
            const mensagem = e.message || "Erro ao buscar/criar titular";
            setError(mensagem);
            toast.error(mensagem);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ==============================================
    // 4. CARREGAR DADOS DA ENERGISA
    // ==============================================
    const carregarDadosEnergisa = useCallback(async () => {
        if (!sessionId) {
            setError("Sessão não encontrada");
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // Carregar UCs completas
            const ucsRes = await fetch(`${ENERGISA_API_BASE}/api/ucs-full/${sessionId}`);
            if (!ucsRes.ok) throw new Error("Erro ao carregar UCs");
            const ucsData = await ucsRes.json();

            // Carregar informações de GD
            const gdRes = await fetch(`${ENERGISA_API_BASE}/api/gd-full/${sessionId}`);
            let gdData = { gd_info: [] };
            if (gdRes.ok) {
                gdData = await gdRes.json();
            }

            // Processar e enriquecer dados
            const ucsProcessadas = await processarUCs(ucsData.ucs || [], gdData.gd_info || []);

            setUcsEnergisa(ucsProcessadas);
            setGdInfo(gdData.gd_info || []);

            toast.success(`${ucsProcessadas.length} UCs encontradas!`);
            return true;
        } catch (e: any) {
            const mensagem = e.message || "Erro ao carregar dados da Energisa";
            setError(mensagem);
            toast.error(mensagem);
            return false;
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    // ==============================================
    // 5. PROCESSAR E ENRIQUECER UCs
    // ==============================================
    const processarUCs = async (
        ucsEnergisa: any[],
        gdInfo: any[]
    ): Promise<EnergisaUC[]> => {
        // Buscar UCs existentes no banco
        const existingRes = await fetch('/api/unidades-consumidoras', {
            credentials: 'include',
        });

        let existentes: any[] = [];
        if (existingRes.ok) {
            existentes = await existingRes.json();
        }

        const existentesMap = new Map(
            existentes.map(uc => [uc.numero_instalacao, uc])
        );

        // Criar mapa de informações GD
        const gdMap = new Map(
            gdInfo.map(gd => [gd.cdc, gd])
        );

        // Processar cada UC
        return ucsEnergisa.map(uc => {
            const numeroUC = extrairNumeroUC(uc);
            const ucExistente = existentesMap.get(numeroUC);
            const infoGD = gdMap.get(uc.cdc);

            return {
                ...uc,
                numero_instalacao: numeroUC,
                tipo_uc: determinarTipoUC(uc, infoGD),
                potencia_instalada_kw: infoGD?.potencia_instalada_kw || null,
                existeNoBanco: !!ucExistente,
                dadosAntigos: ucExistente || null,
            };
        });
    };

    // ==============================================
    // 6. IMPORTAR UCs (UPSERT)
    // ==============================================
    const importarUCs = useCallback(async (
        selectedUCs: EnergisaUC[]
    ) => {
        if (!titular) {
            setError("Titular não selecionado");
            return false;
        }

        setLoading(true);
        setError(null);
        setImportStartTime(Date.now());

        // Inicializar progresso
        setImportProgress({
            total: selectedUCs.length,
            processadas: 0,
            sucesso: 0,
            erros: 0,
            logs: [{
                timestamp: new Date(),
                tipo: 'info',
                mensagem: `Iniciando importação de ${selectedUCs.length} UCs`,
            }],
            percentual: 0,
            tempoDecorrido: 0,
        });

        // Registrar início no log de auditoria
        const logId = await registrarLogInicio();

        try {
            let sucesso = 0;
            let erros = 0;

            // Processar em batches de 10
            const BATCH_SIZE = 10;
            for (let i = 0; i < selectedUCs.length; i += BATCH_SIZE) {
                const batch = selectedUCs.slice(i, i + BATCH_SIZE);

                const results = await Promise.allSettled(
                    batch.map(uc => upsertUC(uc, titular))
                );

                results.forEach((result, index) => {
                    const uc = batch[index];
                    const ucNumero = uc.numero_instalacao;

                    if (result.status === 'fulfilled') {
                        sucesso++;
                        adicionarLog('success', `✅ UC ${ucNumero} importada`, ucNumero);
                    } else {
                        erros++;
                        adicionarLog('error', `❌ Erro na UC ${ucNumero}: ${result.reason}`, ucNumero);
                    }
                });

                // Atualizar progresso
                const processadas = Math.min(i + BATCH_SIZE, selectedUCs.length);
                atualizarProgresso(processadas, sucesso, erros);

                // Pequeno delay entre batches
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Criar vínculos GD
            if (gdInfo.length > 0) {
                await criarVinculosGD();
            }

            // Registrar finalização
            await registrarLogFinalizacao(logId, {
                total: selectedUCs.length,
                sucesso,
                erros,
            });

            // Invalidar queries para recarregar dados
            queryClient.invalidateQueries({ queryKey: ['unidades_consumidoras'] });
            queryClient.invalidateQueries({ queryKey: ['vinculos_compensacao'] });

            toast.success(`Importação concluída! ${sucesso} UCs importadas`);
            return true;
        } catch (e: any) {
            const mensagem = e.message || "Erro na importação";
            setError(mensagem);
            toast.error(mensagem);
            return false;
        } finally {
            setLoading(false);
        }
    }, [titular, gdInfo, queryClient]);

    // ==============================================
    // 7. UPSERT INDIVIDUAL DE UC
    // ==============================================
    const upsertUC = async (uc: EnergisaUC, titular: TitularEnergia) => {
        const payload = {
            numero_instalacao: uc.numero_instalacao,
            titular_id: titular.id,
            cdc: uc.cdc,
            digito: uc.digito,
            codigo_empresa: uc.codigo_empresa,
            endereco: uc.endereco,
            cidade: uc.cidade,
            uf: uc.uf,
            distribuidora: uc.distribuidora || 'Energisa',
            tipo_ligacao: uc.tipo_ligacao,
            classe: uc.classe,
            status_energisa: uc.status,
            tipo_uc: uc.tipo_uc,
            potencia_instalada_kw: uc.potencia_instalada_kw,
            modalidade_gd: uc.modalidade_gd,
            dados_energisa: uc,
            cpf_gestor: cpfGestor,
            ultima_sincronizacao: new Date().toISOString(),
            ativo: true,
        };

        // Verificar se existe
        if (uc.existeNoBanco && uc.dadosAntigos?.id) {
            // ATUALIZAR
            const res = await fetch(`/api/unidades-consumidoras/${uc.dadosAntigos.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Erro ao atualizar UC ${uc.numero_instalacao}`);
            return await res.json();
        } else {
            // INSERIR
            const res = await fetch('/api/unidades-consumidoras', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Erro ao criar UC ${uc.numero_instalacao}`);
            return await res.json();
        }
    };

    // ==============================================
    // 8. CRIAR VÍNCULOS GD
    // ==============================================
    const criarVinculosGD = useCallback(async () => {
        if (!gdInfo || gdInfo.length === 0) return;

        adicionarLog('info', 'Criando vínculos de compensação GD...');

        try {
            // Buscar árvore de relacionamentos GD
            const treeRes = await fetch(`${ENERGISA_API_BASE}/api/gd-tree/${sessionId}`);
            if (!treeRes.ok) return;

            const treeData = await treeRes.json();

            // Processar cada usina
            for (const usina of treeData.usinas || []) {
                for (const geradora of usina.ucs_geradoras || []) {
                    for (const compensada of usina.ucs_compensadas || []) {
                        await criarVinculo(geradora.cdc, compensada.cdc, compensada.percentual_compensacao);
                    }
                }
            }

            adicionarLog('success', `✅ Vínculos GD criados com sucesso`);
        } catch (e) {
            adicionarLog('warning', `⚠️ Erro ao criar vínculos GD: ${e.message}`);
        }
    }, [gdInfo, sessionId]);

    // ==============================================
    // FUNÇÕES AUXILIARES
    // ==============================================

    const adicionarLog = (
        tipo: ImportLog['tipo'],
        mensagem: string,
        uc?: string
    ) => {
        setImportProgress(prev => ({
            ...prev,
            logs: [
                ...prev.logs,
                {
                    timestamp: new Date(),
                    tipo,
                    mensagem,
                    uc,
                },
            ],
        }));
    };

    const atualizarProgresso = (processadas: number, sucesso: number, erros: number) => {
        setImportProgress(prev => {
            const percentual = Math.round((processadas / prev.total) * 100);
            const tempoDecorrido = importStartTime ? Date.now() - importStartTime : 0;
            const tempoEstimado = processadas > 0
                ? (tempoDecorrido / processadas) * (prev.total - processadas)
                : undefined;

            return {
                ...prev,
                processadas,
                sucesso,
                erros,
                percentual,
                tempoDecorrido,
                tempoEstimado,
            };
        });
    };

    // Salvar sessão no banco
    const salvarSessao = async (sessionId: string, cpf: string, status: string) => {
        await fetch('/api/sessoes-energisa', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                cpf_gestor: cpf,
                status,
                data_expiracao: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
            }),
        });
    };

    // Atualizar status da sessão
    const atualizarSessao = async (sessionId: string, status: string) => {
        await fetch(`/api/sessoes-energisa/${sessionId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
    };

    // Registrar início do log
    const registrarLogInicio = async () => {
        const res = await fetch('/api/logs-importacao', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                cpf_gestor: cpfGestor,
                titular_id: titular?.id,
                status: 'iniciado',
                total_ucs_encontradas: ucsEnergisa.length,
            }),
        });
        const data = await res.json();
        return data.id;
    };

    // Registrar finalização do log
    const registrarLogFinalizacao = async (logId: string, resultado: any) => {
        await fetch(`/api/logs-importacao/${logId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: resultado.erros > 0 ? 'parcial' : 'sucesso',
                total_ucs_importadas: resultado.sucesso,
                total_ucs_erro: resultado.erros,
                tempo_processamento_ms: importProgress.tempoDecorrido,
            }),
        });
    };

    return {
        // Estados
        sessionId,
        cpfGestor,
        statusMsg,
        titular,
        ucsEnergisa,
        gdInfo,
        importProgress,
        loading,
        error,

        // Funções
        iniciarLogin,
        confirmarSMS,
        buscarOuCriarTitular,
        carregarDadosEnergisa,
        importarUCs,
        criarVinculosGD,

        // Setters
        setTitular,
    };
}

// ==============================================
// FUNÇÕES UTILITÁRIAS
// ==============================================

function extrairNumeroUC(uc: any): string {
    const candidates = [
        uc.numero_instalacao,
        uc.numeroInstalacao,
        uc.numero,
        uc.cdc,
        uc.codigo_uc,
    ];

    return candidates
        .map(v => v ? String(v).trim() : '')
        .find(v => v.length > 0) || '';
}

function determinarTipoUC(uc: any, gdInfo?: any): 'geradora' | 'beneficiaria' | 'convencional' {
    if (gdInfo) {
        if (gdInfo.tipo_participacao === 'Geradora') return 'geradora';
        if (gdInfo.tipo_participacao === 'Beneficiária') return 'beneficiaria';
    }

    if (uc.tipo_uc) return uc.tipo_uc;
    if (uc.potencia_instalada_kw && uc.potencia_instalada_kw > 0) return 'geradora';

    return 'convencional';
}

async function criarVinculo(ugiCdc: number, ucbCdc: number, percentual: number) {
    // Buscar IDs internos das UCs
    const ugiRes = await fetch(`/api/unidades-consumidoras/buscar-por-cdc?cdc=${ugiCdc}`, {
        credentials: 'include',
    });
    const ucbRes = await fetch(`/api/unidades-consumidoras/buscar-por-cdc?cdc=${ucbCdc}`, {
        credentials: 'include',
    });

    if (!ugiRes.ok || !ucbRes.ok) return;

    const ugi = await ugiRes.json();
    const ucb = await ucbRes.json();

    // Criar vínculo
    await fetch('/api/vinculos-compensacao', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ugi_id: ugi.id,
            ucb_id: ucb.id,
            percentual: percentual || 100,
            ativo: true,
        }),
    });
}
// ============================================
// EXEMPLOS DE ENDPOINTS BACKEND
// ============================================
// Arquivo: server/routes/gestao-faturas.ts
// ============================================

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticateUser } from '../middleware/auth';
import { validateCPF } from '../utils/validators';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateUser);

// ============================================
// TITULARES - BUSCAR OU CRIAR
// ============================================

/**
 * POST /api/titulares-energia/buscar-ou-criar
 * Busca um titular por CPF ou cria automaticamente
 */
router.post('/titulares-energia/buscar-ou-criar', async (req, res) => {
    try {
        const { cpf_cnpj, nome, auto_criar = true } = req.body;
        const userId = req.user.id;

        // Validar CPF
        if (!validateCPF(cpf_cnpj)) {
            return res.status(400).json({ error: 'CPF/CNPJ inválido' });
        }

        // Buscar titular existente
        const { data: titular, error: searchError } = await supabase
            .from('titulares_energia')
            .select('*')
            .eq('cpf_cnpj', cpf_cnpj)
            .eq('user_id', userId)
            .single();

        if (titular && !searchError) {
            return res.json({
                titular,
                criado: false,
                mensagem: 'Titular encontrado',
            });
        }

        // Se não encontrou e pode criar
        if (auto_criar) {
            const { data: novoTitular, error: createError } = await supabase
                .from('titulares_energia')
                .insert({
                    nome: nome || `Titular ${cpf_cnpj}`,
                    cpf_cnpj,
                    tipo_pessoa: cpf_cnpj.length === 11 ? 'PF' : 'PJ',
                    observacoes: 'Criado automaticamente via importação Energisa',
                    user_id: userId,
                })
                .select()
                .single();

            if (createError) throw createError;

            return res.json({
                titular: novoTitular,
                criado: true,
                mensagem: 'Titular criado automaticamente',
            });
        }

        // Não encontrou e não pode criar
        return res.status(404).json({
            titular: null,
            criado: false,
            mensagem: 'Titular não encontrado',
        });
    } catch (error: any) {
        console.error('Erro ao buscar/criar titular:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TITULARES - BUSCAR POR CPF
// ============================================

/**
 * GET /api/titulares-energia/buscar-por-cpf?cpf=12345678900
 * Busca um titular por CPF/CNPJ
 */
router.get('/titulares-energia/buscar-por-cpf', async (req, res) => {
    try {
        const { cpf } = req.query;
        const userId = req.user.id;

        if (!cpf || typeof cpf !== 'string') {
            return res.status(400).json({ error: 'CPF não informado' });
        }

        const { data, error } = await supabase
            .from('titulares_energia')
            .select('*')
            .eq('cpf_cnpj', cpf)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json(data || null);
    } catch (error: any) {
        console.error('Erro ao buscar titular por CPF:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// UNIDADES - UPSERT BATCH
// ============================================

/**
 * POST /api/unidades-consumidoras/upsert-batch
 * Insere ou atualiza múltiplas UCs de uma vez
 */
router.post('/unidades-consumidoras/upsert-batch', async (req, res) => {
    try {
        const { titular_id, cpf_gestor, unidades } = req.body;
        const userId = req.user.id;

        if (!titular_id || !Array.isArray(unidades) || unidades.length === 0) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const results = {
            total: unidades.length,
            inseridos: 0,
            atualizados: 0,
            erros: 0,
            detalhes: [] as any[],
        };

        // Buscar UCs existentes
        const numerosUC = unidades.map(u => u.numero_instalacao);
        const { data: existentes } = await supabase
            .from('unidades_consumidoras')
            .select('id, numero_instalacao')
            .in('numero_instalacao', numerosUC)
            .eq('user_id', userId);

        const existentesMap = new Map(
            (existentes || []).map(uc => [uc.numero_instalacao, uc.id])
        );

        // Processar cada UC
        for (const uc of unidades) {
            try {
                const ucId = existentesMap.get(uc.numero_instalacao);
                const payload = {
                    ...uc,
                    titular_id,
                    cpf_gestor,
                    user_id: userId,
                    ultima_sincronizacao: new Date().toISOString(),
                };

                if (ucId) {
                    // ATUALIZAR
                    const { error } = await supabase
                        .from('unidades_consumidoras')
                        .update(payload)
                        .eq('id', ucId)
                        .eq('user_id', userId);

                    if (error) throw error;

                    results.atualizados++;
                    results.detalhes.push({
                        numero_instalacao: uc.numero_instalacao,
                        acao: 'atualizado',
                        status: 'sucesso',
                    });
                } else {
                    // INSERIR
                    const { error } = await supabase
                        .from('unidades_consumidoras')
                        .insert(payload);

                    if (error) throw error;

                    results.inseridos++;
                    results.detalhes.push({
                        numero_instalacao: uc.numero_instalacao,
                        acao: 'inserido',
                        status: 'sucesso',
                    });
                }
            } catch (error: any) {
                results.erros++;
                results.detalhes.push({
                    numero_instalacao: uc.numero_instalacao,
                    acao: 'erro',
                    status: 'erro',
                    mensagem: error.message,
                });
            }
        }

        res.json(results);
    } catch (error: any) {
        console.error('Erro no upsert batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// UNIDADES - BUSCAR POR CDC
// ============================================

/**
 * GET /api/unidades-consumidoras/buscar-por-cdc?cdc=123456
 * Busca uma UC pelo código CDC da Energisa
 */
router.get('/unidades-consumidoras/buscar-por-cdc', async (req, res) => {
    try {
        const { cdc } = req.query;
        const userId = req.user.id;

        if (!cdc) {
            return res.status(400).json({ error: 'CDC não informado' });
        }

        const { data, error } = await supabase
            .from('unidades_consumidoras')
            .select('*')
            .eq('cdc', parseInt(cdc as string))
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json(data || null);
    } catch (error: any) {
        console.error('Erro ao buscar UC por CDC:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// VÍNCULOS - CRIAR AUTOMÁTICO
// ============================================

/**
 * POST /api/vinculos-compensacao/criar-automatico
 * Cria vínculos automaticamente baseado nos dados GD da Energisa
 */
router.post('/vinculos-compensacao/criar-automatico', async (req, res) => {
    try {
        const { titular_id, gd_data } = req.body;
        const userId = req.user.id;

        if (!titular_id || !gd_data) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        const results = {
            vinculos_criados: 0,
            vinculos_atualizados: 0,
            vinculos_erro: 0,
            detalhes: [] as any[],
        };

        // Processar cada usina
        for (const usina of gd_data.usinas || []) {
            for (const geradora of usina.ucs_geradoras || []) {
                // Buscar ID interno da UC geradora
                const { data: ugiData } = await supabase
                    .from('unidades_consumidoras')
                    .select('id')
                    .eq('cdc', geradora.cdc)
                    .eq('user_id', userId)
                    .single();

                if (!ugiData) continue;

                for (const compensada of usina.ucs_compensadas || []) {
                    try {
                        // Buscar ID interno da UC beneficiária
                        const { data: ucbData } = await supabase
                            .from('unidades_consumidoras')
                            .select('id')
                            .eq('cdc', compensada.cdc)
                            .eq('user_id', userId)
                            .single();

                        if (!ucbData) continue;

                        // Verificar se vínculo já existe
                        const { data: existente } = await supabase
                            .from('vinculos_compensacao')
                            .select('id')
                            .eq('ugi_id', ugiData.id)
                            .eq('ucb_id', ucbData.id)
                            .eq('user_id', userId)
                            .single();

                        if (existente) {
                            // ATUALIZAR
                            await supabase
                                .from('vinculos_compensacao')
                                .update({
                                    percentual: compensada.percentual_compensacao || 100,
                                    ativo: true,
                                })
                                .eq('id', existente.id);

                            results.vinculos_atualizados++;
                        } else {
                            // CRIAR
                            await supabase
                                .from('vinculos_compensacao')
                                .insert({
                                    ugi_id: ugiData.id,
                                    ucb_id: ucbData.id,
                                    percentual: compensada.percentual_compensacao || 100,
                                    ativo: true,
                                    user_id: userId,
                                });

                            results.vinculos_criados++;
                        }

                        results.detalhes.push({
                            ugi_cdc: geradora.cdc,
                            ucb_cdc: compensada.cdc,
                            percentual: compensada.percentual_compensacao,
                            status: 'sucesso',
                        });
                    } catch (error: any) {
                        results.vinculos_erro++;
                        results.detalhes.push({
                            ugi_cdc: geradora.cdc,
                            ucb_cdc: compensada.cdc,
                            status: 'erro',
                            mensagem: error.message,
                        });
                    }
                }
            }
        }

        res.json(results);
    } catch (error: any) {
        console.error('Erro ao criar vínculos automáticos:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SESSÕES ENERGISA
// ============================================

/**
 * POST /api/sessoes-energisa
 * Cria uma nova sessão de autenticação Energisa
 */
router.post('/sessoes-energisa', async (req, res) => {
    try {
        const { session_id, cpf_gestor, status, data_expiracao } = req.body;
        const userId = req.user.id;

        // Verificar limite de sessões ativas (máx 3)
        const { count } = await supabase
            .from('sessoes_energisa')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'autenticado');

        if (count && count >= 3) {
            return res.status(429).json({
                error: 'Limite de sessões simultâneas atingido (máximo 3)',
            });
        }

        const { data, error } = await supabase
            .from('sessoes_energisa')
            .insert({
                session_id,
                cpf_gestor,
                status,
                data_expiracao,
                user_id: userId,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            })
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/sessoes-energisa/:sessionId
 * Atualiza uma sessão existente
 */
router.patch('/sessoes-energisa/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('sessoes_energisa')
            .update(updates)
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Erro ao atualizar sessão:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/sessoes-energisa/:sessionId
 * Remove uma sessão
 */
router.delete('/sessoes-energisa/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const { error } = await supabase
            .from('sessoes_energisa')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Sessão removida com sucesso' });
    } catch (error: any) {
        console.error('Erro ao remover sessão:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// LOGS DE IMPORTAÇÃO
// ============================================

/**
 * POST /api/logs-importacao
 * Cria um novo log de importação
 */
router.post('/logs-importacao', async (req, res) => {
    try {
        const logData = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('logs_importacao_energisa')
            .insert({
                ...logData,
                user_id: userId,
            })
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Erro ao criar log:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/logs-importacao/:id
 * Atualiza um log de importação
 */
router.patch('/logs-importacao/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('logs_importacao_energisa')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        console.error('Erro ao atualizar log:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/logs-importacao/historico
 * Busca histórico de importações com filtros
 */
router.get('/logs-importacao/historico', async (req, res) => {
    try {
        const {
            cpf_gestor,
            titular_id,
            data_inicio,
            data_fim,
            status,
            limit = 50,
            offset = 0,
        } = req.query;

        const userId = req.user.id;

        let query = supabase
            .from('logs_importacao_energisa')
            .select('*, titulares_energia(nome, cpf_cnpj)', { count: 'exact' })
            .eq('user_id', userId);

        // Aplicar filtros
        if (cpf_gestor) query = query.eq('cpf_gestor', cpf_gestor);
        if (titular_id) query = query.eq('titular_id', titular_id);
        if (status) query = query.eq('status', status);
        if (data_inicio) query = query.gte('created_at', data_inicio);
        if (data_fim) query = query.lte('created_at', data_fim);

        // Paginação e ordenação
        query = query
            .order('created_at', { ascending: false })
            .range(
                parseInt(offset as string),
                parseInt(offset as string) + parseInt(limit as string) - 1
            );

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            total: count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            logs: data,
        });
    } catch (error: any) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ESTATÍSTICAS
// ============================================

/**
 * GET /api/estatisticas/importacoes
 * Retorna estatísticas de importação do usuário
 */
router.get('/estatisticas/importacoes', async (req, res) => {
    try {
        const { dias = 30 } = req.query;
        const userId = req.user.id;

        // Chamar função RPC do Supabase
        const { data, error } = await supabase.rpc('estatisticas_importacao', {
            p_user_id: userId,
            p_dias: parseInt(dias as string),
        });

        if (error) throw error;

        res.json(data[0] || {});
    } catch (error: any) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// EXPORTAR ROUTER
// ============================================

export default router;

// ============================================
// EXEMPLO DE USO NO APP PRINCIPAL
// ============================================

/*
// server/index.ts
import express from 'express';
import gestaoFaturasRoutes from './routes/gestao-faturas';

const app = express();

app.use(express.json());
app.use('/api', gestaoFaturasRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/
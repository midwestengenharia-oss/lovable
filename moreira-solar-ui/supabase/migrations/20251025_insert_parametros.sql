-- Inserir parâmetros necessários para as calculadoras
-- Este script insere valores padrão se os parâmetros não existirem
-- IMPORTANTE: A coluna 'valor' é do tipo JSON/JSONB

-- Taxa de juros mensal (2% ao mês)
INSERT INTO parametros (chave, valor, descricao)
VALUES ('taxa_juros_mes', '0.02'::jsonb, 'Taxa de juros mensal para financiamento (decimal)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Potência por placa em Watts
INSERT INTO parametros (chave, valor, descricao)
VALUES ('potencia_por_placa_wp', '565'::jsonb, 'Potência padrão por placa em Watts')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Adicional estrutura solo por placa
INSERT INTO parametros (chave, valor, descricao)
VALUES ('adicional_estrut_solo_por_placa', '250'::jsonb, 'Custo adicional por placa para estrutura de solo (R$)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Prazos de financiamento disponíveis
INSERT INTO parametros (chave, valor, descricao)
VALUES ('prazos', '[36, 48, 60, 72, 84, 96, 108, 120]'::jsonb, 'Opções de prazos de financiamento em meses (JSON array)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Número WhatsApp
INSERT INTO parametros (chave, valor, descricao)
VALUES ('numero_whatsapp', '"67999999999"'::jsonb, 'Número do WhatsApp para contato')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- TUSD (Tarifa de Uso do Sistema de Distribuição)
INSERT INTO parametros (chave, valor, descricao)
VALUES ('tusd', '0.3'::jsonb, 'TUSD - Tarifa de Uso do Sistema de Distribuição (R$/kWh)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- TE (Tarifa de Energia)
INSERT INTO parametros (chave, valor, descricao)
VALUES ('te', '0.4'::jsonb, 'TE - Tarifa de Energia (R$/kWh)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Fio B
INSERT INTO parametros (chave, valor, descricao)
VALUES ('fio_b', '0.05'::jsonb, 'Fio B - Componente tarifário (R$/kWh)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Reajuste médio anual
INSERT INTO parametros (chave, valor, descricao)
VALUES ('reajuste_medio', '0.08'::jsonb, 'Reajuste médio anual da tarifa de energia (8% ao ano)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Geração por kWp
INSERT INTO parametros (chave, valor, descricao)
VALUES ('geracao_kwp', '130'::jsonb, 'Geração mensal estimada por kWp instalado (kWh/kWp/mês)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Overload do inversor
INSERT INTO parametros (chave, valor, descricao)
VALUES ('over_load', '1.35'::jsonb, 'Fator de overload permitido para dimensionamento do inversor')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- PIS/COFINS
INSERT INTO parametros (chave, valor, descricao)
VALUES ('pis_confins', '0.0965'::jsonb, 'Alíquota PIS/COFINS sobre tarifa de energia (9.65%)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- ICMS
INSERT INTO parametros (chave, valor, descricao)
VALUES ('icms', '0.18'::jsonb, 'Alíquota ICMS sobre tarifa de energia (18%)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- UF (Estado)
INSERT INTO parametros (chave, valor, descricao)
VALUES ('uf', '"MS"'::jsonb, 'Estado (UF) padrão para cálculos')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Tarifa comercial
INSERT INTO parametros (chave, valor, descricao)
VALUES ('tarifa_comercial', '1.1'::jsonb, 'Tarifa comercial média da distribuidora (R$/kWh)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Taxa de compra energia investimento
INSERT INTO parametros (chave, valor, descricao)
VALUES ('taxa_compra_energia_investimento', '0.65'::jsonb, 'Taxa de compra de energia para modelo de investimento (R$/kWh)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Prazo contrato investimento
INSERT INTO parametros (chave, valor, descricao)
VALUES ('prazo_contrato_investimento', '15'::jsonb, 'Prazo padrão do contrato para modelo de investimento (anos)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Desconto venda GC (Geração Compartilhada)
INSERT INTO parametros (chave, valor, descricao)
VALUES ('desconto_venda_gc', '0.20'::jsonb, 'Desconto oferecido na venda de energia por GC (20%)')
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

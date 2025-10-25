# 📋 Como Executar a Migração no Supabase

Este guia explica como aplicar as migrações SQL criadas no seu projeto Supabase.

## 🎯 Arquivos de Migração

Você tem os seguintes arquivos SQL que precisam ser executados no Supabase:

1. **`20251025_add_missing_fields.sql`** - Campos extras para projetos e profiles
2. **`20251025_complete_missing_tables.sql`** - Tabelas e funcionalidades completas

---

## 🚀 Passo a Passo

### 1. Acesse o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/tcwqrpbpypvrhohawnme/sql/new
2. Faça login na sua conta do Supabase
3. Você verá o **SQL Editor**

### 2. Execute a Primeira Migração (Campos Extras)

**Arquivo:** `supabase/migrations/20251025_add_missing_fields.sql`

1. Abra o arquivo no seu editor de código
2. Copie **TODO O CONTEÚDO** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
5. Aguarde a confirmação de sucesso ✅

**O que essa migração faz:**
- Adiciona campos extras em `projetos`: kwp, prioridade, checklist, documentos, custos, timeline, orcamento_id
- Adiciona campo `avatar` em `profiles`
- Cria índices de performance

### 3. Execute a Segunda Migração (Tabelas Completas)

**Arquivo:** `supabase/migrations/20251025_complete_missing_tables.sql`

1. Abra o arquivo no seu editor de código
2. Copie **TODO O CONTEÚDO** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
5. Aguarde a confirmação de sucesso ✅

**O que essa migração faz:**
- Adiciona campos extras em `unidades_consumidoras`: apelido, tipo, status, valor_medio_fatura
- Cria tabela `chamados` com auto-numeração (CH-2025-001)
- Cria tabela `vinculos_compensacao` (UGIs e UCBs)
- Cria tabela `sessoes_autenticacao`
- Cria tabela `processamentos_faturas`
- Cria view `vw_unidades_stats` para estatísticas
- Cria funções auxiliares e triggers automáticos
- Configura RLS (Row Level Security) em todas as tabelas

---

## ✅ Verificar se Funcionou

Após executar as migrações, você pode verificar se tudo está correto:

### No Supabase Dashboard

1. Vá para **Table Editor**: https://supabase.com/dashboard/project/tcwqrpbpypvrhohawnme/editor
2. Verifique se as seguintes tabelas existem:
   - ✅ chamados
   - ✅ vinculos_compensacao
   - ✅ sessoes_autenticacao
   - ✅ processamentos_faturas

### Na sua aplicação

1. Acesse: http://localhost:8083/
2. Teste as funcionalidades:
   - **Pós-venda** (/pos-venda) - Deve mostrar a lista de chamados
   - **Gestão de Faturas** (/gestao-faturas) - Deve mostrar unidades e vínculos
   - **Projetos** (/projetos) - Novos campos disponíveis

---

## 🔍 Verificar Erros

Se algo der errado durante a execução:

### 1. Ler a mensagem de erro

O Supabase mostra mensagens detalhadas de erro. Leia com atenção!

### 2. Erros Comuns

**"relation already exists"**
- A tabela já existe. Tudo bem! A migração usa `IF NOT EXISTS`.
- Continue para a próxima etapa.

**"column already exists"**
- O campo já existe. Tudo bem! A migração usa `IF NOT EXISTS`.
- Continue para a próxima etapa.

**"permission denied"**
- Você precisa ser owner do projeto no Supabase.
- Verifique suas permissões.

**"syntax error"**
- Verifique se copiou o SQL completo (início ao fim do arquivo).
- Certifique-se de não ter cortado nenhuma linha.

### 3. Executar Novamente

Se algo falhou, você pode executar a migração novamente. Os comandos usam `IF NOT EXISTS`, então não vão duplicar dados.

---

## 📊 Resumo das Tabelas Criadas

### `chamados`
- **Propósito**: Gerenciar chamados de pós-venda (manutenção, garantia, suporte)
- **Auto-numeração**: Números automáticos tipo CH-2025-001
- **Campos especiais**: historico (JSON), fotos (JSON)

### `vinculos_compensacao`
- **Propósito**: Relacionar UGIs (Unidades Geradoras) com UCBs (Beneficiárias)
- **Validação**: Impede vincular uma unidade com ela mesma
- **Campos**: percentual de compensação, data início/fim

### `sessoes_autenticacao`
- **Propósito**: Histórico de autenticações em distribuidoras de energia
- **Campos**: método (CPF/CNPJ, certificado digital, gov.br), status, expiração

### `processamentos_faturas`
- **Propósito**: Histórico de processamentos em lote de faturas
- **Campos**: qtd de UCs, processadas, tempo decorrido, erros (JSON)

---

## 🛡️ Segurança (RLS)

Todas as tabelas criadas têm **Row Level Security (RLS)** configurado:

- ✅ Usuários veem apenas seus próprios dados
- ✅ Gestores veem dados dos seus vendedores
- ✅ Admins veem tudo
- ✅ Hierarquia de permissões respeitada

---

## 🎯 Próximos Passos

Após executar as migrações:

1. ✅ Teste a aplicação em http://localhost:8083/
2. ✅ Crie um chamado de teste na página Pós-venda
3. ✅ Adicione unidades consumidoras em Gestão de Faturas
4. ✅ Configure vínculos de compensação
5. ✅ Verifique os novos campos em Projetos

---

## 📞 Suporte

Se tiver problemas:

1. Verifique o console do navegador (F12 → Console)
2. Verifique o log de erros do Supabase
3. Consulte a documentação: https://supabase.com/docs

---

**Data da criação:** 25 de Outubro de 2025
**Versão:** 2.0.0
**Status:** ✅ Pronto para Execução

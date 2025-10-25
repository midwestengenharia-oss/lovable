# 🧹 Plano de Limpeza do AppContext

## 📋 Situação Atual

A aplicação foi migrada para **Supabase**, mas o **AppContext** ainda está presente com:
- ❌ Dados mock (Maria Santos, João Silva, etc.)
- ❌ Provider ativo no App.tsx
- ❌ 11 componentes ainda usando `useApp()`
- ❌ 23 arquivos com imports do AppContext

## ⚠️ Por que Limpar?

1. **Confusão**: Ter dois sistemas (Supabase + AppContext) é confuso
2. **Performance**: AppContext com seed data desnecessário ocupa memória
3. **Manutenção**: Código obsoleto dificulta manutenção
4. **Clareza**: Código mais limpo e fácil de entender

---

## 📊 Análise de Uso

### Componentes que USAM AppContext (11)

Estes ainda chamam `useApp()` e precisam ser atualizados:

1. **ClienteDialog.tsx** - Usa `addCliente` do AppContext
2. **UsuarioDialog.tsx** - Usa `addUsuario` do AppContext
3. **CalculadoraManual.tsx** - Usa equipamentos/parâmetros do AppContext
4. **CalculadoraInvestimento.tsx** - Usa equipamentos/parâmetros do AppContext
5. **CalculadoraFinanciamento.tsx** - Usa equipamentos/parâmetros do AppContext
6. **CalculadoraAssinatura.tsx** - Usa equipamentos/parâmetros do AppContext
7. **CobrancasKanban.tsx** - Usa cobranças do AppContext
8. **CobrancaDetailPanel.tsx** - Usa cobranças do AppContext
9. **ClienteDetailPanel.tsx** - Usa clientes do AppContext
10. **AutenticacaoForm.tsx** - Usa addTitularEnergia do AppContext
11. **ProcessamentoDialog.tsx** - Usa processamento de faturas do AppContext

### Arquivos que IMPORTAM apenas TIPOS (12)

Estes apenas importam interfaces/tipos:

- calculadoraGC.ts - `VinculoCompensacao`
- calculadoraSolar.ts - Tipos de cálculo
- Vários panels e tabelas - Tipos de dados

---

## 🎯 Estratégia de Limpeza

### Opção 1: Limpeza Gradual (RECOMENDADO)

Atualizar componentes um por um, testando cada mudança:

#### Fase 1: Criar arquivo de tipos
```typescript
// src/types/legacy.ts
export interface Cliente {
  // ... mover todos os tipos do AppContext
}
```

#### Fase 2: Atualizar componentes críticos
1. ClienteDialog → usar `useClientes`
2. UsuarioDialog → usar `useUsuarios`
3. Calculadoras → usar `useEquipamentos` e `useParametros`
4. Cobranças → usar `useCobrancas`

#### Fase 3: Remover AppProvider
Depois que todos os componentes estiverem atualizados:
```tsx
// App.tsx - REMOVER <AppProvider>
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    {/* <AppProvider> NÃO MAIS NECESSÁRIO */}
    <TooltipProvider>
      {/* ... */}
    </TooltipProvider>
    {/* </AppProvider> */}
  </AuthProvider>
</QueryClientProvider>
```

#### Fase 4: Arquivar AppContext
Mover para `src/contexts/archive/AppContext.tsx` (não deletar ainda)

---

### Opção 2: Limpeza Rápida (ARRISCADO)

Remover tudo de uma vez. **NÃO RECOMENDADO** - pode quebrar a aplicação.

---

## 🔧 Ações Imediatas Recomendadas

### 1. Limpar Seed Data (SEM RISCO)

Você pode **remover os dados mock** do AppContext agora mesmo sem quebrar nada:

**Arquivo:** `src/contexts/AppContext.tsx`

**ANTES:**
```typescript
const mockLeads = [
  { id: "...", cliente: "Maria Santos", ... },
  { id: "...", cliente: "João Silva", ... },
  // ... 50 linhas de dados mock
];
```

**DEPOIS:**
```typescript
const mockLeads: Lead[] = [];
const mockClientes: Cliente[] = [];
const mockOrcamentos: Orcamento[] = [];
// ... todos vazios
```

**Benefício:** Reduz o tamanho do arquivo, não impacta funcionalidade já migrada.

---

### 2. Atualizar ClienteDialog (BAIXO RISCO)

Este é usado na página Clientes que já está migrada.

**Arquivo:** `src/components/ClienteDialog.tsx`

**ANTES:**
```typescript
const { addCliente } = useApp();
addCliente(formData);
```

**DEPOIS:**
```typescript
import { useClientes } from "@/hooks/useClientes";
const { addCliente } = useClientes();
addCliente(formData); // Já retorna Promise, pode usar then/catch
```

---

### 3. Atualizar Calculadoras (MÉDIO RISCO)

As calculadoras usam equipamentos e parâmetros.

**Arquivos:**
- `CalculadoraManual.tsx`
- `CalculadoraInvestimento.tsx`
- `CalculadoraFinanciamento.tsx`
- `CalculadoraAssinatura.tsx`

**ANTES:**
```typescript
const { state } = useApp();
const modulos = state.equipamentos.filter(e => e.tipo === 'modulo');
```

**DEPOIS:**
```typescript
import { useEquipamentos } from "@/hooks/useEquipamentos";
import { useParametros } from "@/hooks/useParametros";

const { equipamentos } = useEquipamentos();
const { parametros } = useParametros();
const modulos = equipamentos.filter(e => e.tipo === 'modulo');
```

---

## ✅ Checklist de Limpeza

### Fase 1: Preparação
- [ ] Criar arquivo `src/types/legacy.ts` com todos os tipos
- [ ] Fazer backup do AppContext.tsx
- [ ] Garantir que todos os hooks do Supabase estão funcionando

### Fase 2: Limpeza de Dados
- [ ] Remover todos os arrays de seed data do AppContext
- [ ] Testar se a aplicação ainda inicia

### Fase 3: Migração de Componentes
- [ ] Atualizar ClienteDialog
- [ ] Atualizar UsuarioDialog
- [ ] Atualizar 4 Calculadoras
- [ ] Atualizar CobrancasKanban
- [ ] Atualizar Detail Panels
- [ ] Atualizar AutenticacaoForm
- [ ] Atualizar ProcessamentoDialog

### Fase 4: Remoção Final
- [ ] Remover `<AppProvider>` do App.tsx
- [ ] Arquivar AppContext.tsx em `/archive`
- [ ] Atualizar imports que ainda referenciam AppContext
- [ ] Testar TODA a aplicação

---

## 🚨 Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar calculadoras | Médio | Alto | Testar cada uma após atualizar |
| Quebrar dialogs | Baixo | Médio | Fácil de reverter |
| Perder referências de tipos | Baixo | Baixo | Criar arquivo types/legacy.ts |

---

## 📈 Benefícios Após Limpeza

1. ✅ **Código 50% menor** - Remoção de 500+ linhas de mock data
2. ✅ **Performance melhor** - Sem carregamento de dados desnecessários
3. ✅ **Manutenção mais fácil** - Um único sistema (Supabase)
4. ✅ **Menos confusão** - Claro que dados vêm do Supabase
5. ✅ **Código mais profissional** - Sem dados de teste em produção

---

## 🤔 Decisão

**Você quer:**

### A) Limpeza Imediata dos Dados Mock (SEM RISCO)
Eu removo todos os arrays de seed data agora. A aplicação continua funcionando normalmente.

### B) Limpeza Completa Gradual (RECOMENDADO)
Eu atualizo componente por componente, testando cada um. Leva mais tempo mas é seguro.

### C) Apenas Documentar por Enquanto
Deixo esse documento e você decide quando fazer a limpeza.

**Qual opção você prefere?**

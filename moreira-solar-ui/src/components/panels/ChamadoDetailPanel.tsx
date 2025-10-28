// src/components/panels/ChamadoDetailPanel.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Phone, UserRound } from "lucide-react";
import type { Chamado } from "@/hooks/useChamados";

type Props = {
  chamado: Chamado | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Chamado>) => void; // já está assim no seu hook
};

const TIPOS: Chamado["tipo"][] = ["Manutenção", "Garantia", "Suporte", "Limpeza"];
const PRIORIDADES: Chamado["prioridade"][] = ["Baixa", "Média", "Alta"];
const STATUS: Chamado["status"][] = ["Onboarding", "Triagem" as any, "Agendado" as any, "Em Rota" as any, "Em atendimento" as any, "Aguardando Peça" as any, "Aguardando Cliente" as any, "Ativo", "Manutenção", "Chamado", "Finalizado"]
// ^ você pode manter apenas os que realmente existem na sua CHECK constraint.
// Se sua tabela só aceita: Onboarding | Ativo | Manutenção | Chamado | Finalizado,
// troque pela linha abaixo e remova os demais:
// const STATUS: Chamado["status"][] = ["Onboarding", "Ativo", "Manutenção", "Chamado", "Finalizado"];

export function ChamadoDetailPanel({ chamado, open, onClose, onUpdate }: Props) {
  const [local, setLocal] = useState<Partial<Chamado>>({});

  useEffect(() => {
    setLocal(chamado ?? {});
  }, [chamado]);

  const numero = local.numero ?? chamado?.numero ?? "";
  const cliente = local.cliente ?? chamado?.cliente ?? "";
  const dataISO = (local.data ?? chamado?.data) || new Date().toISOString();
  const dataBR = useMemo(() => new Date(dataISO).toLocaleDateString("pt-BR"), [dataISO]);

  const dirty = useMemo(() => {
    if (!chamado) return false;
    const keys: (keyof Chamado)[] = [
      "cliente", "tipo", "prioridade", "status", "descricao", "resolucao", "tecnico", "data"
    ];
    return keys.some(k => (local as any)[k] !== (chamado as any)[k]);
  }, [local, chamado]);

  function save() {
    if (!chamado) return;
    // validações mínimas
    if (!local.cliente?.trim()) return toast.error("Informe o cliente");
    if (!local.tipo) return toast.error("Selecione o tipo");
    if (!local.prioridade) return toast.error("Selecione a prioridade");
    if (!local.status) return toast.error("Selecione o status");

    onUpdate(chamado.id, {
      cliente: local.cliente,
      tipo: local.tipo,
      prioridade: local.prioridade,
      status: local.status,
      descricao: local.descricao,
      resolucao: local.resolucao,
      tecnico: local.tecnico,
      data: local.data ?? chamado.data,
      historico: [
        ...(chamado.historico ?? []),
        {
          id: `hist-${Date.now()}`,
          data: new Date().toISOString(),
          acao: "Chamado atualizado",
          usuario: "Sistema",
        },
      ],
    });
    toast.success("Alterações salvas");
  }

  function finalizar() {
    if (!chamado) return;
    if (!local.resolucao || !local.resolucao.trim()) {
      return toast.error("Escreva a resolução antes de finalizar.");
    }
    onUpdate(chamado.id, {
      status: "Finalizado",
      resolucao: local.resolucao,
      data_finalizacao: new Date().toISOString(),
      historico: [
        ...(chamado.historico ?? []),
        {
          id: `hist-${Date.now()}`,
          data: new Date().toISOString(),
          acao: "Chamado finalizado",
          usuario: "Sistema",
        },
      ],
    });
    toast.success("Chamado finalizado");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Chamado {numero ? `#${numero}` : ""} · {cliente || "—"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Visualizar e editar os dados do chamado selecionado.
          </DialogDescription>
        </DialogHeader>

        {!chamado ? (
          <div className="text-sm text-muted-foreground">Nenhum chamado selecionado.</div>
        ) : (
          <div className="space-y-6">
            {/* Cabeçalho resumido */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Tipo:</span>
                <Badge variant="outline">{local.tipo || chamado.tipo}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>Data:</span>
                <Badge variant="outline">{dataBR}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span>Prioridade:</span>
                <Badge variant={
                  (local.prioridade || chamado.prioridade) === "Alta" ? "destructive" :
                    (local.prioridade || chamado.prioridade) === "Média" ? "secondary" : "outline"
                }>
                  {local.prioridade || chamado.prioridade}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>Status:</span>
                <Badge variant={
                  (local.status || chamado.status) === "Chamado" ? "destructive" :
                    (local.status || chamado.status) === "Finalizado" ? "outline" : "secondary"
                }>
                  {local.status || chamado.status}
                </Badge>
              </div>
            </div>

            {/* Form principal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input
                  value={local.cliente ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, cliente: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Técnico</Label>
                <Input
                  placeholder="Não atribuído"
                  value={local.tecnico ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, tecnico: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={local.tipo ?? chamado.tipo}
                  onValueChange={(v) => setLocal((p) => ({ ...p, tipo: v as Chamado["tipo"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={local.prioridade ?? chamado.prioridade}
                  onValueChange={(v) => setLocal((p) => ({ ...p, prioridade: v as Chamado["prioridade"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={local.status ?? chamado.status}
                  onValueChange={(v) => setLocal((p) => ({ ...p, status: v as Chamado["status"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={new Date(dataISO).toISOString().slice(0, 10)}
                  onChange={(e) => setLocal((p) => ({ ...p, data: new Date(e.target.value).toISOString() }))}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={local.descricao ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, descricao: e.target.value }))}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Resolução</Label>
                <Textarea
                  rows={3}
                  placeholder="Descreva a solução aplicada…"
                  value={local.resolucao ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, resolucao: e.target.value }))}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Criado em {new Date(chamado.created_at ?? chamado.data).toLocaleString("pt-BR")}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
                <Button variant="secondary" disabled={!dirty} onClick={save}>
                  Salvar alterações
                </Button>
                <Button onClick={finalizar} disabled={(local.status ?? chamado.status) === "Finalizado"}>
                  Finalizar Chamado
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

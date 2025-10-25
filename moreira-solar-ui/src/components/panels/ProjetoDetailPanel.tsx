import { useState } from "react";
import { SidePanel } from "./SidePanel";
import { Projeto } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/shared/FileUpload";
import { Timeline } from "@/components/shared/Timeline";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface ProjetoDetailPanelProps {
  projeto: Projeto | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Projeto>) => void;
  onConcluir?: (projeto: Projeto) => void;
}

export function ProjetoDetailPanel({
  projeto,
  open,
  onClose,
  onUpdate,
  onConcluir,
}: ProjetoDetailPanelProps) {
  if (!projeto) return null;

  const toggleChecklistItem = (itemId: string) => {
    if (!projeto.checklist) return;

    const updatedChecklist = projeto.checklist.map((item) =>
      item.id === itemId ? { ...item, concluido: !item.concluido } : item
    );
    onUpdate(projeto.id, { checklist: updatedChecklist });

    // Atualiza progresso automaticamente
    const concluidos = updatedChecklist.filter((i) => i.concluido).length;
    const progresso = Math.round(
      (concluidos / updatedChecklist.length) * 100
    );
    onUpdate(projeto.id, { progresso });
  };

  const getStatusIcon = () => {
    if (projeto.progresso === 100)
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (projeto.progresso > 50)
      return <TrendingUp className="h-5 w-5 text-blue-500" />;
    if (projeto.prioridade === "Alta")
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getPrioridadeBadge = () => {
    const variants = {
      Baixa: "outline",
      Média: "secondary",
      Alta: "destructive",
    } as const;
    return <Badge variant={variants[projeto.prioridade]}>{projeto.prioridade}</Badge>;
  };

  const tabs = [
    {
      id: "detalhes",
      label: "Detalhes",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {projeto.cliente_nome ?? "Cliente não informado"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Orçamento: {projeto.orcamento_numero ?? "Não informado"}
              </p>
            </div>
            {getPrioridadeBadge()}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">kWp</p>
              <p className="font-semibold">{projeto.kwp ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responsável</p>
              <p className="font-semibold">
                {projeto.responsavel_id ?? "Não definido"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prazo</p>
              <p className="font-semibold">
                {projeto.data_conclusao_prevista ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progresso</p>
              <p className="font-semibold">{projeto.progresso ?? 0}%</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Status Atual</p>
            <Badge variant="outline" className="text-sm">
              {projeto.status ?? "Sem status"}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Próximos Passos</p>
            <p className="text-sm text-muted-foreground">
              {projeto.proximos_passos ?? "Nenhum registrado"}
            </p>
          </div>

          {projeto.status === "Entrega" && onConcluir && (
            <Button onClick={() => onConcluir(projeto)} className="w-full" size="lg">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Concluir Obra
            </Button>
          )}
        </div>
      ),
    },
    {
      id: "checklist",
      label: "Checklist",
      content: (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progresso Geral</p>
              <p className="text-sm text-muted-foreground">
                {projeto.progresso ?? 0}%
              </p>
            </div>
            <Progress value={projeto.progresso ?? 0} />
          </div>

          <div className="space-y-3">
            {projeto.checklist?.length ? (
              projeto.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <Checkbox
                    checked={item.concluido}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5"
                  />
                  <label
                    className={`flex-1 text-sm cursor-pointer ${item.concluido ? "line-through text-muted-foreground" : ""
                      }`}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    {item.titulo}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum item no checklist
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "documentos",
      label: "Documentos",
      content: (
        <div className="space-y-4">
          <FileUpload
            files={projeto.documentos || []}
            onFilesChange={(files) =>
              onUpdate(projeto.id, { documentos: files })
            }
            accept="*"
            maxFiles={20}
            showGallery={true}
          />
        </div>
      ),
    },
    {
      id: "timeline",
      label: "Timeline",
      content: (
        <div className="space-y-4">
          <Timeline
            events={
              projeto.timeline?.map((t) => ({
                id: t.id,
                date: new Date(t.data),
                title: t.titulo,
                description: t.descricao,
              })) || []
            }
          />
        </div>
      ),
    },
    {
      id: "custos",
      label: "Custos",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Orçado</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {projeto.custos?.orcado?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) || "R$ 0,00"}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Real</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {projeto.custos?.real?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) || "R$ 0,00"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Itens de Custo</p>
            {projeto.custos?.itens?.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 rounded-lg border"
              >
                <span className="text-sm">{item.descricao}</span>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {item.real.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Orçado:{" "}
                    {item.orcado.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {projeto.custos && (
            <div
              className={`p-4 rounded-lg ${projeto.custos.real <= projeto.custos.orcado
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                }`}
            >
              <p className="text-sm font-medium">
                {projeto.custos.real <= projeto.custos.orcado
                  ? "Dentro do Orçamento"
                  : "Acima do Orçamento"}
              </p>
              <p className="text-xs">
                Diferença:{" "}
                {Math.abs(
                  projeto.custos.orcado - projeto.custos.real
                ).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={`Projeto: ${projeto.cliente_nome ?? "Sem nome"}`}
      description={`Orçamento ${projeto.orcamento_numero ?? "Não informado"
        } • ${projeto.kwp ?? 0} kWp`}
      tabs={tabs}
    />
  );
}

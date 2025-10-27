// src/pages/Projetos.tsx
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { useKanbanBoardBySlug, useKanbanColumns } from "@/hooks/useKanban";
import { Projeto, useMoveProjeto, useProjetos, useUpdateProjeto } from "@/hooks/useProjetosKanban";
import { ProjetoDetailPanel } from "@/components/panels/ProjetoDetailPanel";

const BOARD_SLUG = "obra";

export default function Projetos() {
  // dados do board/colunas
  const { data: board } = useKanbanBoardBySlug(BOARD_SLUG);
  const { data: columns = [], isLoading: loadingCols } = useKanbanColumns(board?.id);

  // projetos
  const { data: projetos = [], isLoading } = useProjetos();
  const moveProjeto = useMoveProjeto();
  const updateProjeto = useUpdateProjeto();

  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // util
  const columnsById = useMemo(() => {
    const map = new Map<string, any>();
    columns.forEach((c) => map.set(c.id, c));
    return map;
  }, [columns]);

  const columnsByKey = useMemo(() => {
    const map = new Map<string, any>();
    columns.forEach((c) => map.set(c.key, c));
    return map;
  }, [columns]);

  // agrupar por coluna (se faltar kanban_column_id, usa status->key)
  const grouped = useMemo(() => {
    const bucket: Record<string, Projeto[]> = {};
    for (const col of columns) bucket[col.id] = [];
    for (const p of projetos) {
      const colId = p.kanban_column_id || columnsByKey.get(String(p.status || ""))?.id;
      if (colId && bucket[colId]) bucket[colId].push(p);
    }
    return bucket;
  }, [projetos, columns, columnsByKey]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const projetoId = result.draggableId;
    const toColumnId = result.destination.droppableId; // usamos o ID da coluna como droppableId

    try {
      await moveProjeto.mutateAsync({ projetoId, toColumnId });
      const col = columnsById.get(toColumnId);
      toast.success(`Projeto movido para ${col?.title || "coluna"}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Não foi possível mover. Verifique as transições.");
    }
  };

  const handleCardClick = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setPanelOpen(true);
  };

  const handleConcluirObra = async (projeto: Projeto) => {
    try {
      // Encontrar coluna "concluído"
      const col = columns.find((c) => c.key === "concluido" || c.title.toLowerCase().includes("conclu"));
      if (!col) {
        toast.error("Coluna 'Concluído' não encontrada no board.");
        return;
      }
      await moveProjeto.mutateAsync({ projetoId: projeto.id, toColumnId: col.id });
      await updateProjeto.mutateAsync({
        id: projeto.id,
        progresso: 100,
        data_conclusao_real: new Date().toISOString(),
      });
      toast.success("Obra concluída!");
      setPanelOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao concluir a obra.");
    }
  };

  const getStatusIcon = (projeto: Projeto) => {
    if ((projeto.progresso ?? 0) >= 100) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    return name.toString().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading || loadingCols) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando projetos e colunas…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projetos (Pipeline de Obra)</h1>
          <p className="text-muted-foreground">Acompanhe todas as etapas dos projetos em execução</p>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-8 gap-4">
          {columns.map((col) => {
            const list = grouped[col.id] || [];
            return (
              <Droppable key={col.id} droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 ${snapshot.isDraggingOver ? "bg-accent/20 rounded-lg p-2" : ""}`}
                  >
                    <div
                      className="sticky top-0 z-10 pb-2 rounded-md px-2 py-1"
                      style={{ backgroundColor: col.color_header || undefined }}
                    >
                      <h3 className="font-semibold text-xs text-center">{col.title}</h3>
                      <Badge
                        variant="outline"
                        className="w-full justify-center mt-1"
                        style={{ backgroundColor: col.color_badge || undefined }}
                      >
                        {list.length}
                      </Badge>
                    </div>

                    {list.map((projeto, idx) => (
                      <Draggable key={projeto.id} draggableId={projeto.id} index={idx}>
                        {(prov, snap) => (
                          <Card
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`cursor-pointer hover:shadow-md transition-shadow ${snap.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                              }`}
                            onClick={() => handleCardClick(projeto)}
                          >
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-xs font-medium leading-tight">
                                  {projeto.cliente_nome || projeto.nome || "Sem nome"}
                                </CardTitle>
                                {getStatusIcon(projeto)}
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2">
                              <div className="space-y-1 text-xs">
                                {projeto.numero && (
                                  <p className="text-muted-foreground">
                                    <strong>Número:</strong> {projeto.numero}
                                  </p>
                                )}
                              </div>

                              {projeto.responsavel_id && (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(projeto.responsavel_id)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {projeto.responsavel_id}
                                  </span>
                                </div>
                              )}

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Progresso</span>
                                  <span className="font-medium">{projeto.progresso || 0}%</span>
                                </div>
                                <Progress value={projeto.progresso || 0} className="h-1.5" />
                              </div>

                              {projeto.data_conclusao_prevista && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(projeto.data_conclusao_prevista).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {selectedProjeto && (
        <ProjetoDetailPanel
          projeto={selectedProjeto}
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          onUpdate={(id, data) => updateProjeto.mutate({ id, ...data })}
          onConcluir={() => handleConcluirObra(selectedProjeto)}
        />
      )}
    </div>
  );
}

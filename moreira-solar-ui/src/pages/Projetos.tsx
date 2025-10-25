import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useProjetos } from "@/hooks/useProjetos";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ProjetoDetailPanel } from "@/components/panels/ProjetoDetailPanel";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const stages = [
  "Vistoria",
  "Projeto/ART",
  "Homologação",
  "Compra",
  "Instalação",
  "Comissionamento",
  "Entrega",
  "Concluído",
] as const;

export default function Projetos() {
  const { projetos, isLoading, updateProjeto } = useProjetos();
  const [selectedProjeto, setSelectedProjeto] = useState<any>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const projeto = projetos.find((p) => p.id === result.draggableId);
    if (!projeto) return;

    const newStatus = stages[result.destination.droppableId as any];
    if (newStatus) {
      updateProjeto({ id: projeto.id, status: newStatus });
      toast.success(`Projeto movido para ${newStatus}`);
    }
  };

  const getProjetosByStatus = (status: string) => {
    return projetos.filter((p) => p.status === status);
  };

  const getStatusIcon = (projeto: any) => {
    if (projeto.progresso === 100) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "Alta": return "bg-red-500";
      case "Média": return "bg-yellow-500";
      case "Baixa": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const handleCardClick = (projeto: any) => {
    setSelectedProjeto(projeto);
    setPanelOpen(true);
  };

  const handleConcluirObra = (projeto: any) => {
    // Mover para Concluído
    updateProjeto({
      id: projeto.id,
      status: "Concluído",
      progresso: 100,
      data_conclusao_real: new Date().toISOString(),
    });

    // TODO: Implementar criação de chamado de Onboarding quando o hook estiver disponível
    toast.success("Obra concluída!");
    setPanelOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando projetos...</p>
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
          {stages.map((stage, index) => (
            <Droppable key={stage} droppableId={String(index)}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 ${snapshot.isDraggingOver ? "bg-accent/20 rounded-lg p-2" : ""}`}
                >
                  <div className="sticky top-0 z-10 bg-background pb-2">
                    <h3 className="font-semibold text-xs text-center">{stage}</h3>
                    <Badge variant="outline" className="w-full justify-center mt-1">
                      {getProjetosByStatus(stage).length}
                    </Badge>
                  </div>

                  {getProjetosByStatus(stage).map((projeto, idx) => (
                    <Draggable key={projeto.id} draggableId={projeto.id} index={idx}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                          }`}
                          onClick={() => handleCardClick(projeto)}
                        >
                          <CardHeader className="p-3 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-xs font-medium leading-tight">
                                {projeto.cliente_nome || projeto.nome}
                              </CardTitle>
                              {getStatusIcon(projeto)}
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 space-y-2">
                            <div className="space-y-1 text-xs">
                              <p className="text-muted-foreground">
                                <strong>Número:</strong> {projeto.numero}
                              </p>
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
                                  {new Date(projeto.data_conclusao_prevista).toLocaleDateString('pt-BR')}
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
          ))}
        </div>
      </DragDropContext>

      {/* TODO: ProjetoDetailPanel needs to be updated to work with Supabase Projeto type */}
      {selectedProjeto && (
        <ProjetoDetailPanel
          projeto={selectedProjeto}
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          onUpdate={(id, data) => updateProjeto({ id, ...data })}
          onConcluir={handleConcluirObra}
        />
      )}
    </div>
  );
}

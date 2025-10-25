import { SidePanel } from "./SidePanel";
import { Chamado } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/shared/FileUpload";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar,
  Wrench,
  Shield,
  Phone,
  Droplets
} from "lucide-react";
import { useState } from "react";

interface ChamadoDetailPanelProps {
  chamado: Chamado | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Chamado>) => void;
}

export function ChamadoDetailPanel({ chamado, open, onClose, onUpdate }: ChamadoDetailPanelProps) {
  const [resolucao, setResolucao] = useState(chamado?.resolucao || "");

  if (!chamado) return null;

  const getTipoIcon = () => {
    switch (chamado.tipo) {
      case "Manutenção": return <Wrench className="h-4 w-4" />;
      case "Garantia": return <Shield className="h-4 w-4" />;
      case "Suporte": return <Phone className="h-4 w-4" />;
      case "Limpeza": return <Droplets className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getPrioridadeBadge = () => {
    const variants = {
      Baixa: "outline",
      Média: "secondary",
      Alta: "destructive",
    } as const;
    return <Badge variant={variants[chamado.prioridade]}>{chamado.prioridade}</Badge>;
  };

  const getStatusBadge = () => {
    const config = {
      Onboarding: { variant: "secondary" as const, label: "Onboarding" },
      Ativo: { variant: "default" as const, label: "Ativo" },
      Manutenção: { variant: "secondary" as const, label: "Manutenção" },
      Chamado: { variant: "destructive" as const, label: "Chamado" },
      Finalizado: { variant: "outline" as const, label: "Finalizado" },
    };
    const status = config[chamado.status];
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const finalizarChamado = () => {
    onUpdate(chamado.id, {
      status: "Finalizado",
      resolucao,
      dataFinalizacao: new Date().toISOString(),
      historico: [
        ...chamado.historico,
        {
          id: `hist-${Date.now()}`,
          data: new Date().toISOString(),
          acao: "Chamado finalizado",
          usuario: "Sistema",
        },
      ],
    });
    onClose();
  };

  const tabs = [
    {
      id: "detalhes",
      label: "Detalhes",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {getTipoIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{chamado.cliente}</h3>
              <p className="text-sm text-muted-foreground">Chamado #{chamado.numero}</p>
            </div>
            {getPrioridadeBadge()}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data
              </p>
              <p className="font-semibold text-sm">
                {new Date(chamado.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Técnico
              </p>
              <p className="font-semibold text-sm">{chamado.tecnico || "Não atribuído"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge variant="outline" className="mt-1">
                {getTipoIcon()}
                <span className="ml-1">{chamado.tipo}</span>
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Status</p>
            {getStatusBadge()}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Descrição</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chamado.descricao}</p>
          </div>

          {chamado.status !== "Finalizado" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Resolução</label>
                <Textarea
                  value={resolucao}
                  onChange={(e) => setResolucao(e.target.value)}
                  placeholder="Descreva a solução aplicada..."
                  rows={4}
                />
              </div>
              <Button 
                onClick={finalizarChamado}
                className="w-full"
                disabled={!resolucao.trim()}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar Chamado
              </Button>
            </div>
          )}

          {chamado.resolucao && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Resolução</p>
              <p className="text-sm text-green-600 dark:text-green-400">{chamado.resolucao}</p>
              {chamado.dataFinalizacao && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Finalizado em {new Date(chamado.dataFinalizacao).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "historico",
      label: "Histórico",
      content: (
        <div className="space-y-3">
          {chamado.historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma ação registrada ainda
            </p>
          ) : (
            chamado.historico.map((hist) => (
              <div key={hist.id} className="flex gap-3 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{hist.acao}</p>
                  <p className="text-xs text-muted-foreground">
                    {hist.usuario} • {new Date(hist.data).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: "fotos",
      label: "Fotos",
      content: (
        <div className="space-y-4">
          <FileUpload
            files={chamado.fotos.map(f => ({
              id: f.id,
              nome: f.descricao || "Foto",
              url: f.url,
              tipo: "image/jpeg",
              data: f.data,
            }))}
            onFilesChange={(files) => 
              onUpdate(chamado.id, {
                fotos: files.map(f => ({
                  id: f.id,
                  url: f.url,
                  descricao: f.nome,
                  data: f.data,
                })),
              })
            }
            accept="image/*"
            maxFiles={10}
            showGallery={true}
          />
        </div>
      ),
    },
  ];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={`Chamado #${chamado.numero}`}
      description={`${chamado.cliente} • ${chamado.tipo}`}
      tabs={tabs}
    />
  );
}

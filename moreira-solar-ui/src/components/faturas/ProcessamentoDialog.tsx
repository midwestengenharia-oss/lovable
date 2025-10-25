import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { UnidadeConsumidora } from "@/types/supabase";
import { toast } from "sonner";

interface ProcessamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUCIds: string[];
  unidades: UnidadeConsumidora[];
}

export function ProcessamentoDialog({ open, onOpenChange, selectedUCIds, unidades }: ProcessamentoDialogProps) {
  // TODO: Create useProcessamentosFaturas hook for Supabase integration
  // For now, these functions are not available - processamento will need to be re-implemented
  const [mesReferencia, setMesReferencia] = useState("");
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [processamentoId, setProcessamentoId] = useState<string | null>(null);

  const unidadesSelecionadas = unidades.filter((u) => selectedUCIds.includes(u.id));

  const handleIniciarProcessamento = async () => {
    if (!mesReferencia) {
      toast.error("Selecione o mês de referência");
      return;
    }

    setProcessando(true);
    setProgresso(0);

    const procId = addProcessamentoFatura({
      status: "em_fila",
      dataHora: new Date().toISOString(),
      qtdUCs: unidadesSelecionadas.length,
      processadas: 0,
      faturasBaixadas: 0,
      mesReferencia,
      ucsProcessadas: [],
    });

    setProcessamentoId(procId);

    // Simular processamento
    const total = unidadesSelecionadas.length;
    for (let i = 0; i < total; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setProgresso(((i + 1) / total) * 100);
    }

    calcularCobrancasGC(procId);
    toast.success(`Processamento concluído! ${unidadesSelecionadas.length} UC(s) processadas.`);
    setProcessando(false);
    setTimeout(() => onOpenChange(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Processar Faturas</DialogTitle>
          <DialogDescription>
            Selecione o mês de referência para iniciar o processamento automático
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">UCs Selecionadas</div>
                <div className="text-2xl font-bold">{unidadesSelecionadas.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tempo Estimado</div>
                <div className="text-2xl font-bold">~{unidadesSelecionadas.length * 2}s</div>
              </div>
            </div>
          </Card>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {unidadesSelecionadas.map((uc) => (
              <div key={uc.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{uc.numeroUC}</span>
                  {uc.apelido && <span className="text-sm text-muted-foreground">({uc.apelido})</span>}
                </div>
                <Badge variant="outline">{uc.tipo}</Badge>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Mês de Referência</Label>
            <Input
              type="month"
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              disabled={processando}
            />
          </div>

          {processando && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processando...</span>
                <span>{Math.round(progresso)}%</span>
              </div>
              <Progress value={progresso} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleIniciarProcessamento}
              disabled={processando || !mesReferencia}
              className="flex-1"
            >
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Iniciar Processamento
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processando}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

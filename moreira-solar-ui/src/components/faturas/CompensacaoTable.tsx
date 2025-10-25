import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnidadeConsumidora, VinculoCompensacao, TitularEnergia } from "@/contexts/AppContext";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { formatarPorcentagem } from "@/lib/calculadoraGC";

interface CompensacaoTableProps {
  unidades: UnidadeConsumidora[];
  vinculos: VinculoCompensacao[];
  titulares: TitularEnergia[];
  onEdit: (vinculo: VinculoCompensacao) => void;
  onDelete: (vinculoId: string) => void;
}

export function CompensacaoTable({
  unidades,
  vinculos,
  titulares,
  onEdit,
  onDelete,
}: CompensacaoTableProps) {
  const [filtroUGI, setFiltroUGI] = useState<string>("todas");
  const [filtroModelo, setFiltroModelo] = useState<string>("todos");

  const ugis = unidades.filter((u) => u.tipo === "geradora_investimento");

  const vinculosFiltrados = vinculos.filter((v) => {
    if (!v.ativo) return false;
    if (filtroUGI !== "todas" && v.ugiId !== filtroUGI) return false;
    if (filtroModelo !== "todos" && v.modeloCompensacao !== filtroModelo) return false;
    return true;
  });

  const getUCInfo = (ucId: string) => {
    const uc = unidades.find((u) => u.id === ucId);
    return uc ? `${uc.apelido || uc.numeroUC}` : "N/A";
  };

  const getTitularInfo = (ucId: string) => {
    const uc = unidades.find((u) => u.id === ucId);
    if (!uc) return "N/A";
    const titular = titulares.find((t) => t.id === uc.titularId);
    return titular?.nome || "N/A";
  };

  // Calcular totais por UGI
  const calcularTotais = () => {
    const totaisPorUGI: Record<string, number> = {};
    vinculosFiltrados.forEach((v) => {
      if (!totaisPorUGI[v.ugiId]) totaisPorUGI[v.ugiId] = 0;
      totaisPorUGI[v.ugiId] += v.percentualCompensacao;
    });
    return totaisPorUGI;
  };

  const totaisPorUGI = calcularTotais();
  const alertas = Object.entries(totaisPorUGI).filter(([_, total]) => total > 95 || total < 80);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vínculos de Compensação</CardTitle>
        <div className="flex gap-4 mt-4">
          <Select value={filtroUGI} onValueChange={setFiltroUGI}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por UGI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as UGIs</SelectItem>
              {ugis.map((ugi) => (
                <SelectItem key={ugi.id} value={ugi.id}>
                  {ugi.apelido || ugi.numeroUC}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroModelo} onValueChange={setFiltroModelo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Modelos</SelectItem>
              <SelectItem value="acr">ACR</SelectItem>
              <SelectItem value="associacao">Associação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertas.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Alertas de Compensação:</strong>
              <ul className="mt-2 space-y-1">
                {alertas.map(([ugiId, total]) => {
                  const ugi = unidades.find((u) => u.id === ugiId);
                  const sobra = 100 - total;
                  return (
                    <li key={ugiId}>
                      {ugi?.apelido || ugi?.numeroUC}: Total {formatarPorcentagem(total / 100)} | 
                      Sobra: {formatarPorcentagem(sobra / 100)}
                      {sobra > 5 && " (Alta sobra detectada)"}
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UGI</TableHead>
                <TableHead>UCB</TableHead>
                <TableHead>Titular UGI</TableHead>
                <TableHead>Titular UCB</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>% Compensação</TableHead>
                <TableHead>Créditos Mês</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vinculosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum vínculo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                vinculosFiltrados.map((vinculo) => {
                  const ugi = unidades.find((u) => u.id === vinculo.ugiId);
                  const creditosMes = ugi ? (ugi.faturamentoMedioKwh * vinculo.percentualCompensacao) / 100 : 0;

                  return (
                    <TableRow key={vinculo.id}>
                      <TableCell className="font-medium">{getUCInfo(vinculo.ugiId)}</TableCell>
                      <TableCell className="font-medium">{getUCInfo(vinculo.ucbId)}</TableCell>
                      <TableCell>{getTitularInfo(vinculo.ugiId)}</TableCell>
                      <TableCell>{getTitularInfo(vinculo.ucbId)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            vinculo.modeloCompensacao === "acr"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          }
                        >
                          {vinculo.modeloCompensacao.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatarPorcentagem(vinculo.percentualCompensacao / 100)}
                      </TableCell>
                      <TableCell>{Math.round(creditosMes)} kWh</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(vinculo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(vinculo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer com totais por UGI selecionada */}
        {filtroUGI !== "todas" && totaisPorUGI[filtroUGI] !== undefined && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Compensação:</span>
              <span className="text-lg font-bold">{formatarPorcentagem(totaisPorUGI[filtroUGI] / 100)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold">Sobra:</span>
              <span className="text-lg font-bold">
                {formatarPorcentagem((100 - totaisPorUGI[filtroUGI]) / 100)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnidadeConsumidora, TitularEnergia, VinculoCompensacao } from "@/contexts/AppContext";
import { Zap, Factory, Home, Users, FileText, Eye, Pencil, Download } from "lucide-react";
import { formatarMoeda } from "@/lib/calculadoraGC";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UnidadesTableProps {
  unidades: UnidadeConsumidora[];
  titulares: TitularEnergia[];
  vinculos: VinculoCompensacao[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onUCClick: (uc: UnidadeConsumidora) => void;
}

export function UnidadesTable({
  unidades,
  titulares,
  vinculos,
  selectedIds,
  onSelect,
  onUCClick,
}: UnidadesTableProps) {
  const getTipoBadge = (tipo: string) => {
    const config = {
      geradora_financiamento: {
        label: "UGF",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: Zap,
      },
      geradora_investimento: {
        label: "UGI",
        className: "bg-green-700 text-white dark:bg-green-800",
        icon: Factory,
      },
      beneficiaria_acr: {
        label: "UCB ACR",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: Home,
      },
      beneficiaria_associacao: {
        label: "UCB Assoc",
        className: "bg-blue-700 text-white dark:bg-blue-800",
        icon: Users,
      },
      convencional: {
        label: "Convencional",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        icon: FileText,
      },
    };

    const cfg = config[tipo as keyof typeof config] || config.convencional;
    const Icon = cfg.icon;

    return (
      <Badge className={cfg.className}>
        <Icon className="h-3 w-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ativa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      inativa: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      pendente_analise: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      em_analise: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={colors[status as keyof typeof colors]}>{status.replace(/_/g, " ")}</Badge>;
  };

  const getInfoExtra = (uc: UnidadeConsumidora) => {
    if (uc.tipo === "geradora_investimento") {
      const qtdBeneficiarias = vinculos.filter((v) => v.ugiId === uc.id && v.ativo).length;
      return qtdBeneficiarias > 0 ? `${qtdBeneficiarias} beneficiárias` : "Sem vínculos";
    }

    if (uc.tipo.startsWith("beneficiaria_")) {
      const vinculosUC = vinculos.filter((v) => v.ucbId === uc.id && v.ativo);
      if (vinculosUC.length > 0) {
        const totalPerc = vinculosUC.reduce((sum, v) => sum + v.percentualCompensacao, 0);
        return `${vinculosUC.length} geradora(s) | ${totalPerc}%`;
      }
      return "Sem vínculos";
    }

    return null;
  };

  const handleSelectAll = () => {
    if (selectedIds.length === unidades.length) {
      onSelect([]);
    } else {
      onSelect(unidades.map((u) => u.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  const getTitularNome = (titularId: string) => {
    return titulares.find((t) => t.id === titularId)?.nome || "N/A";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === unidades.length && unidades.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Nº UC</TableHead>
            <TableHead>Apelido</TableHead>
            <TableHead>Titular</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Faturamento</TableHead>
            <TableHead>Última Fatura</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unidades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                Nenhuma unidade consumidora cadastrada
              </TableCell>
            </TableRow>
          ) : (
            unidades.map((uc) => (
              <TableRow key={uc.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(uc.id)}
                    onCheckedChange={() => handleSelectOne(uc.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{uc.numeroUC}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{uc.apelido || "-"}</div>
                    {getInfoExtra(uc) && (
                      <div className="text-xs text-muted-foreground">{getInfoExtra(uc)}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getTitularNome(uc.titularId)}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {uc.endereco}, {uc.cidade}/{uc.estado}
                </TableCell>
                <TableCell>{getTipoBadge(uc.tipo)}</TableCell>
                <TableCell>{getStatusBadge(uc.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{formatarMoeda(uc.valorMedioFatura)}</div>
                    <div className="text-xs text-muted-foreground">{uc.faturamentoMedioKwh} kWh/mês</div>
                  </div>
                </TableCell>
                <TableCell>
                  {uc.ultimaFatura ? (
                    <div className="text-sm">
                      <div>{format(new Date(uc.ultimaFatura.mesReferencia), "MMM/yy", { locale: ptBR })}</div>
                      <div className="text-xs text-muted-foreground">{formatarMoeda(uc.ultimaFatura.valorConta)}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onUCClick(uc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

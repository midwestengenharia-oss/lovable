import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cobranca } from "@/types/supabase";
import { Eye } from "lucide-react";

interface CobrancasListProps {
  cobrancas: Cobranca[];
  onCobrancaClick: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "A Gerar":
      return "bg-gray-500";
    case "Gerado":
      return "bg-blue-500";
    case "Enviado":
      return "bg-purple-500";
    case "A Vencer":
      return "bg-yellow-500";
    case "Pago":
      return "bg-green-500";
    case "Atrasado":
      return "bg-red-500";
    case "Cancelado":
      return "bg-gray-700";
    default:
      return "bg-gray-500";
  }
};

export function CobrancasList({ cobrancas, onCobrancaClick }: CobrancasListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cobrancas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhuma cobrança encontrada
                </TableCell>
              </TableRow>
            ) : (
              cobrancas.map((cobranca) => (
                <TableRow key={cobranca.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{cobranca.numero}</TableCell>
                  <TableCell>{cobranca.clienteNome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cobranca.tipo}</Badge>
                  </TableCell>
                  <TableCell>R$ {cobranca.valor.toFixed(2)}</TableCell>
                  <TableCell>{new Date(cobranca.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(cobranca.status)}>{cobranca.status}</Badge>
                  </TableCell>
                  <TableCell>{cobranca.parcela || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCobrancaClick(cobranca.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

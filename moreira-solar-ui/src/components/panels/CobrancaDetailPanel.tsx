import { SidePanel } from "./SidePanel";
import { useCobrancas } from "@/hooks/useCobrancas";
import { useClientes } from "@/hooks/useClientes";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Timeline } from "@/components/shared/Timeline";
import { FileText, Send, CheckCircle, XCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface CobrancaDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cobrancaId: string | null;
}

export function CobrancaDetailPanel({ open, onOpenChange, cobrancaId }: CobrancaDetailPanelProps) {
  const { cobrancas, updateCobranca } = useCobrancas();
  const { clientes } = useClientes();
  const { orcamentos } = useOrcamentos();
  const cobranca = cobrancas.find((c) => c.id === cobrancaId);
  const [dataPagamento, setDataPagamento] = useState("");
  const [valorPago, setValorPago] = useState("");

  if (!cobranca) return null;

  const cliente = clientes.find((c) => c.id === cobranca.clienteId);
  const orcamento = cobranca.orcamentoId ? orcamentos.find((o) => o.id === cobranca.orcamentoId) : null;

  const handleGerarBoleto = () => {
    updateCobranca(cobranca.id, {
      status: "Gerado",
      historicoStatus: [
        ...cobranca.historicoStatus,
        {
          status: "Gerado",
          data: new Date().toISOString(),
          usuario: "Usuário Atual",
          obs: "Boleto gerado (placeholder - aguardando integração com API do banco)",
        },
      ],
    });
    toast.success("Status atualizado para Gerado. Integração com banco será implementada posteriormente.");
  };

  const handleEnviarWhatsApp = () => {
    const mensagem = `Olá ${cobranca.clienteNome}, sua cobrança ${cobranca.numero} no valor de R$ ${cobranca.valor.toFixed(2)} vence em ${new Date(cobranca.vencimento).toLocaleDateString("pt-BR")}.`;
    const url = `https://wa.me/${cliente?.telefone?.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");

    updateCobranca(cobranca.id, {
      status: "Enviado",
      dataEnvio: new Date().toISOString().split("T")[0],
      historicoStatus: [
        ...cobranca.historicoStatus,
        {
          status: "Enviado",
          data: new Date().toISOString(),
          usuario: "Usuário Atual",
          obs: "Enviado via WhatsApp",
        },
      ],
    });
    toast.success("Redirecionando para WhatsApp...");
  };

  const handleMarcarComoPago = () => {
    if (!dataPagamento || !valorPago) {
      toast.error("Preencha a data e o valor do pagamento");
      return;
    }

    updateCobranca(cobranca.id, {
      status: "Pago",
      dataPagamento,
      valorPago: parseFloat(valorPago),
      historicoStatus: [
        ...cobranca.historicoStatus,
        {
          status: "Pago",
          data: new Date().toISOString(),
          usuario: "Usuário Atual",
          obs: `Pagamento confirmado: R$ ${parseFloat(valorPago).toFixed(2)}`,
        },
      ],
    });
    toast.success("Cobrança marcada como paga!");
    setDataPagamento("");
    setValorPago("");
  };

  const handleCancelar = () => {
    if (confirm("Deseja realmente cancelar esta cobrança?")) {
      updateCobranca(cobranca.id, {
        status: "Cancelado",
        historicoStatus: [
          ...cobranca.historicoStatus,
          {
            status: "Cancelado",
            data: new Date().toISOString(),
            usuario: "Usuário Atual",
            obs: "Cobrança cancelada",
          },
        ],
      });
      toast.success("Cobrança cancelada");
      onOpenChange(false);
    }
  };

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

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)} title={`Cobrança ${cobranca.numero}`}>
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="detalhes" className="flex-1">
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex-1">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="acoes" className="flex-1">
            Ações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informações</span>
                <Badge className={getStatusColor(cobranca.status)}>{cobranca.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Cliente:</strong> {cobranca.clienteNome}
              </div>
              <div>
                <strong>Tipo:</strong> {cobranca.tipo}
              </div>
              <div>
                <strong>Valor:</strong> R$ {cobranca.valor.toFixed(2)}
              </div>
              <div>
                <strong>Vencimento:</strong> {new Date(cobranca.vencimento).toLocaleDateString("pt-BR")}
              </div>
              {cobranca.parcela && (
                <div>
                  <strong>Parcela:</strong> {cobranca.parcela}
                </div>
              )}
              <div>
                <strong>Data Emissão:</strong> {new Date(cobranca.dataEmissao).toLocaleDateString("pt-BR")}
              </div>
              {cobranca.dataEnvio && (
                <div>
                  <strong>Data Envio:</strong> {new Date(cobranca.dataEnvio).toLocaleDateString("pt-BR")}
                </div>
              )}
              {cobranca.dataPagamento && (
                <div>
                  <strong>Data Pagamento:</strong> {new Date(cobranca.dataPagamento).toLocaleDateString("pt-BR")}
                </div>
              )}
              {cobranca.valorPago && (
                <div>
                  <strong>Valor Pago:</strong> R$ {cobranca.valorPago.toFixed(2)}
                </div>
              )}
              {orcamento && (
                <div>
                  <strong>Orçamento:</strong> {orcamento.numero}
                </div>
              )}
              {cobranca.responsavel && (
                <div>
                  <strong>Responsável:</strong> {cobranca.responsavel}
                </div>
              )}
              {cobranca.observacoes && (
                <div>
                  <strong>Observações:</strong>
                  <p className="mt-1 text-muted-foreground">{cobranca.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {cliente && (
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Nome:</strong> {cliente.nome}
                </div>
                {cliente.telefone && (
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Telefone:</strong> {cliente.telefone}
                    </div>
                    <Button size="sm" variant="outline" onClick={handleEnviarWhatsApp}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {cliente.email && (
                  <div>
                    <strong>Email:</strong> {cliente.email}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                events={cobranca.historicoStatus.map((h) => ({
                  id: `${h.data}-${h.status}`,
                  date: new Date(h.data),
                  title: h.status,
                  description: h.obs,
                  user: h.usuario,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acoes" className="space-y-4">
          {cobranca.status === "A Gerar" && (
            <Card>
              <CardHeader>
                <CardTitle>Gerar Boleto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  A integração com a API do banco será implementada futuramente. Por enquanto, o status será atualizado para "Gerado".
                </p>
                <Button onClick={handleGerarBoleto} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Boleto (Placeholder)
                </Button>
              </CardContent>
            </Card>
          )}

          {(cobranca.status === "Gerado" || cobranca.status === "Enviado") && (
            <Card>
              <CardHeader>
                <CardTitle>Enviar Cobrança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleEnviarWhatsApp} className="w-full" variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar via WhatsApp
                </Button>
              </CardContent>
            </Card>
          )}

          {cobranca.status !== "Pago" && cobranca.status !== "Cancelado" && (
            <Card>
              <CardHeader>
                <CardTitle>Marcar como Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Valor Pago (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    placeholder={cobranca.valor.toFixed(2)}
                  />
                </div>
                <Button onClick={handleMarcarComoPago} className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Pagamento
                </Button>
              </CardContent>
            </Card>
          )}

          {cobranca.status !== "Pago" && cobranca.status !== "Cancelado" && (
            <Card>
              <CardHeader>
                <CardTitle>Cancelar Cobrança</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCancelar} variant="destructive" className="w-full">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Cobrança
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </SidePanel>
  );
}

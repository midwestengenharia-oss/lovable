import { Cliente } from "@/types/supabase";
import { useProjetos } from "@/hooks/useProjetos";
import { useCobrancas } from "@/hooks/useCobrancas";
import { useUsuarios } from "@/hooks/useUsuarios";
import { SidePanel } from "./SidePanel";
import { Timeline, TimelineEvent } from "@/components/shared/Timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, User, FileText } from "lucide-react";

interface ClienteDetailPanelProps {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
}

export function ClienteDetailPanel({ cliente, open, onClose }: ClienteDetailPanelProps) {
  const { projetos } = useProjetos();
  const { cobrancas } = useCobrancas();
  const { usuarios } = useUsuarios();

  if (!cliente) return null;

  const clienteProjetos = projetos.filter((p) => p.cliente_nome === cliente.nome);
  const clienteCobrancas = cobrancas.filter((c) => c.cliente_id === cliente.id);
  const vendedor = usuarios.find((u) => u.id === cliente.vendedor_id);

  const cobrancasPendentes = clienteCobrancas.filter((c) => c.status !== "Pago" && c.status !== "Cancelado");
  const cobrancasPagas = clienteCobrancas.filter((c) => c.status === "Pago");
  const valorPendente = cobrancasPendentes.reduce((sum, c) => sum + c.valor, 0);
  const valorPago = cobrancasPagas.reduce((sum, c) => sum + c.valor, 0);

  const getTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Cliente cadastrado
    events.push({
      id: `cliente-${cliente.id}`,
      title: "Cliente cadastrado",
      description: `Cliente cadastrado por ${vendedor?.nome || "Sistema"}`,
      date: new Date(cliente.data_cadastro || Date.now()),
      type: "info",
      user: vendedor?.nome,
    });

    // Projetos
    clienteProjetos.forEach((p) => {
      const responsavel = usuarios.find((u) => u.id === p.responsavel_id);
      events.push({
        id: `projeto-${p.id}`,
        title: `Projeto ${p.numero}`,
        description: `Projeto iniciado - Status: ${p.status}`,
        date: new Date(p.data_inicio || cliente.data_cadastro || Date.now()),
        type: "success",
        user: responsavel?.nome,
      });
    });

    // Cobranças mais recentes
    clienteCobrancas.slice(0, 3).forEach((c) => {
      events.push({
        id: `cobranca-${c.id}`,
        title: `Cobrança ${c.numero}`,
        description: `Vencimento: ${new Date(c.vencimento).toLocaleDateString("pt-BR")} - Status: ${c.status}`,
        date: new Date(c.created_at || Date.now()),
        type: c.status === "Pago" ? "success" : "warning",
        user: undefined,
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={cliente.nome}
      description={`Cliente desde ${new Date(cliente.data_cadastro || Date.now()).toLocaleDateString("pt-BR")}`}
      tabs={[
        {
          id: "informacoes",
          label: "Informações",
          content: (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Contato</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.telefone}</span>
                  </div>
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {(cliente.rua || cliente.cidade) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Endereço</h4>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {cliente.rua && (
                        <p>
                          {cliente.rua}
                          {cliente.numero && `, ${cliente.numero}`}
                        </p>
                      )}
                      {cliente.bairro && <p>{cliente.bairro}</p>}
                      {cliente.cidade && (
                        <p>
                          {cliente.cidade}/{cliente.estado}
                        </p>
                      )}
                      {cliente.cep && <p>CEP: {cliente.cep}</p>}
                    </div>
                  </div>
                </div>
              )}

              {cliente.cpf_cnpj && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Documento</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{cliente.cpf_cnpj}</span>
                    <Badge variant="outline">{cliente.cpf_cnpj.includes("-") ? "PF" : "PJ"}</Badge>
                  </div>
                </div>
              )}

              {vendedor && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Vendedor Responsável</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{vendedor.nome}</span>
                    <Badge>{vendedor.perfil}</Badge>
                  </div>
                </div>
              )}
            </div>
          ),
        },
        {
          id: "projetos",
          label: "Projetos",
          content: (
            <div className="space-y-4">
              {clienteProjetos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum projeto vinculado a este cliente
                </p>
              ) : (
                clienteProjetos.map((projeto) => {
                  const responsavel = usuarios.find((u) => u.id === projeto.responsavel_id);
                  return (
                    <Card key={projeto.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{projeto.numero}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge>{projeto.status}</Badge>
                        </div>
                        {projeto.valor_total && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-medium">R$ {projeto.valor_total.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Progresso:</span>
                          <span className="font-medium">{projeto.progresso}%</span>
                        </div>
                        {responsavel && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Responsável:</span>
                            <span className="font-medium">{responsavel.nome}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ),
        },
        {
          id: "cobrancas",
          label: "Cobranças",
          content: (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium">A Receber</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-yellow-600">
                      R$ {valorPendente.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium">Pago</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-green-600">R$ {valorPago.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      R$ {(valorPendente + valorPago).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Cobranças Recentes</h4>
                {clienteCobrancas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma cobrança registrada
                  </p>
                ) : (
                  clienteCobrancas.slice(0, 5).map((cobranca) => (
                    <Card key={cobranca.id}>
                      <CardContent className="pt-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{cobranca.numero}</span>
                          <Badge variant={cobranca.status === "Pago" ? "default" : "secondary"}>
                            {cobranca.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium">R$ {cobranca.valor.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vencimento:</span>
                          <span>{new Date(cobranca.vencimento).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {cobranca.tipo && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span>{cobranca.tipo}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {clienteCobrancas.length > 5 && (
                <Button variant="outline" className="w-full">
                  Ver Todas as Cobranças ({clienteCobrancas.length})
                </Button>
              )}
            </div>
          ),
        },
        {
          id: "historico",
          label: "Histórico",
          content: <Timeline events={getTimeline()} />,
        },
        {
          id: "documentos",
          label: "Documentos",
          content: (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Em breve: upload de documentos
              </p>
              <p className="text-xs text-muted-foreground">
                CPF, RG, comprovante de residência, etc.
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}

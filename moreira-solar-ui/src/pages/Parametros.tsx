import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEquipamentos, Equipamento, EquipamentoInput } from "@/hooks/useEquipamentos";
import { useParametros } from "@/hooks/useParametros";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Helper para converter entrada brasileira (vírgula) para formato numérico
const parseDecimalBR = (value: string): number => {
  if (!value) return 0;
  // Substitui vírgula por ponto e remove espaços
  const normalized = value.replace(',', '.').trim();
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper para formatar número para exibição (usando ponto)
const formatDecimal = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toString();
};

export default function Parametros() {
  const {
    equipamentos,
    isLoading: isLoadingEquipamentos,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    isAdding,
    isUpdating,
    isDeleting
  } = useEquipamentos();

  const {
    parametros,
    isLoading: isLoadingParametros,
    updateParametros,
    isUpdating: isUpdatingParametros
  } = useParametros();

  // Usar strings para manter vírgulas durante digitação
  const [paramsStr, setParamsStr] = useState({
    taxaJurosMes: '',
    tarifaComercial: '',
    tusd: '',
    te: '',
    fioB: '',
    reajusteMedio: '',
    geracaoKwp: '',
    overLoad: '',
    pisConfins: '',
    icms: '',
    adicionalEstrutSoloPorPlaca: '',
    taxaCompraEnergiaInvestimento: '',
    prazoContratoInvestimento: '',
    descontoVendaGC: '',
  });

  const [params, setParams] = useState(parametros);
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [equipTipo, setEquipTipo] = useState<"modulo" | "inversor">("modulo");
  const [equipEdit, setEquipEdit] = useState<Equipamento | null>(null);
  const [equipForm, setEquipForm] = useState<EquipamentoInput>({
    tipo: "modulo",
    nome: "",
    potenciaW: undefined,
    valor: 0,
    ativo: true,
  });

  // Atualizar params quando parametros são carregados
  useEffect(() => {
    if (!isLoadingParametros && parametros) {
      setParams(parametros);
      // Inicializar strings de exibição
      setParamsStr({
        taxaJurosMes: (parametros.taxaJurosMes * 100).toString(),
        tarifaComercial: parametros.tarifaComercial.toString(),
        tusd: parametros.tusd.toString(),
        te: parametros.te.toString(),
        fioB: parametros.fioB.toString(),
        reajusteMedio: (parametros.reajusteMedio * 100).toString(),
        geracaoKwp: parametros.geracaoKwp.toString(),
        overLoad: parametros.overLoad.toString(),
        pisConfins: (parametros.pisConfins * 100).toString(),
        icms: (parametros.icms * 100).toString(),
        adicionalEstrutSoloPorPlaca: parametros.adicionalEstrutSoloPorPlaca.toString(),
        taxaCompraEnergiaInvestimento: parametros.taxaCompraEnergiaInvestimento.toString(),
        prazoContratoInvestimento: parametros.prazoContratoInvestimento.toString(),
        descontoVendaGC: (parametros.descontoVendaGC * 100).toString(),
      });
    }
  }, [isLoadingParametros]);

  const handleSave = () => {
    updateParametros(params);
  };

  const handleOpenEquipDialog = (tipo: "modulo" | "inversor", equip?: Equipamento) => {
    setEquipTipo(tipo);
    if (equip) {
      setEquipEdit(equip);
      setEquipForm({
        tipo: equip.tipo,
        nome: equip.nome,
        potenciaW: equip.potenciaW,
        valor: equip.valor,
        ativo: equip.ativo
      });
    } else {
      setEquipEdit(null);
      setEquipForm({
        tipo,
        nome: "",
        potenciaW: tipo === "modulo" ? 0 : undefined,
        valor: 0,
        ativo: true,
      });
    }
    setEquipDialogOpen(true);
  };

  const handleSaveEquip = () => {
    if (!equipForm.nome || equipForm.valor <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (equipForm.tipo === "modulo" && (!equipForm.potenciaW || equipForm.potenciaW <= 0)) {
      toast.error("Informe a potência do módulo");
      return;
    }

    if (equipEdit) {
      updateEquipamento({ ...equipForm, id: equipEdit.id });
    } else {
      addEquipamento(equipForm);
    }
    setEquipDialogOpen(false);
  };

  const handleDeleteEquip = (id: string) => {
    if (confirm("Deseja realmente excluir este equipamento?")) {
      deleteEquipamento(id);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Parâmetros</h1>

      <Tabs defaultValue="gerais" className="w-full">
        <TabsList>
          <TabsTrigger value="gerais">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="gerais" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Globais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxaJurosMes">Taxa de Juros Mensal (%)</Label>
                  <Input
                    id="taxaJurosMes"
                    type="text"
                    value={paramsStr.taxaJurosMes}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, taxaJurosMes: e.target.value });
                      setParams({ ...params, taxaJurosMes: parseDecimalBR(e.target.value) / 100 });
                    }}
                    placeholder="2,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaComercial">Tarifa Comercial (R$/kWh)</Label>
                  <Input
                    id="tarifaComercial"
                    type="text"
                    value={paramsStr.tarifaComercial}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, tarifaComercial: e.target.value });
                      setParams({ ...params, tarifaComercial: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="1,10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tusd">TUSD (R$/kWh)</Label>
                  <Input
                    id="tusd"
                    type="text"
                    value={paramsStr.tusd}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, tusd: e.target.value });
                      setParams({ ...params, tusd: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="0,30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="te">TE (R$/kWh)</Label>
                  <Input
                    id="te"
                    type="text"
                    value={paramsStr.te}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, te: e.target.value });
                      setParams({ ...params, te: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="0,40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fioB">Fio B (R$/kWh)</Label>
                  <Input
                    id="fioB"
                    type="text"
                    value={paramsStr.fioB}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, fioB: e.target.value });
                      setParams({ ...params, fioB: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="0,05"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reajusteMedio">Reajuste Médio Anual (%)</Label>
                  <Input
                    id="reajusteMedio"
                    type="text"
                    value={paramsStr.reajusteMedio}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, reajusteMedio: e.target.value });
                      setParams({ ...params, reajusteMedio: parseDecimalBR(e.target.value) / 100 });
                    }}
                    placeholder="8,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geracaoKwp">Geração kWp (kWh/kWp/mês)</Label>
                  <Input
                    id="geracaoKwp"
                    type="text"
                    value={paramsStr.geracaoKwp}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, geracaoKwp: e.target.value });
                      setParams({ ...params, geracaoKwp: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="130"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overLoad">Over Load</Label>
                  <Input
                    id="overLoad"
                    type="text"
                    value={paramsStr.overLoad}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, overLoad: e.target.value });
                      setParams({ ...params, overLoad: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="1,35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pisConfins">PIS/COFINS (%)</Label>
                  <Input
                    id="pisConfins"
                    type="text"
                    value={paramsStr.pisConfins}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, pisConfins: e.target.value });
                      setParams({ ...params, pisConfins: parseDecimalBR(e.target.value) / 100 });
                    }}
                    placeholder="9,65"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icms">ICMS (%)</Label>
                  <Input
                    id="icms"
                    type="text"
                    value={paramsStr.icms}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, icms: e.target.value });
                      setParams({ ...params, icms: parseDecimalBR(e.target.value) / 100 });
                    }}
                    placeholder="18,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={params.uf}
                    onChange={(e) => setParams({ ...params, uf: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adicionalEstrutSoloPorPlaca">Adicional Estrutura Solo (R$/placa)</Label>
                  <Input
                    id="adicionalEstrutSoloPorPlaca"
                    type="text"
                    value={paramsStr.adicionalEstrutSoloPorPlaca}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, adicionalEstrutSoloPorPlaca: e.target.value });
                      setParams({ ...params, adicionalEstrutSoloPorPlaca: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="250,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroWhatsApp">Número WhatsApp</Label>
                  <Input
                    id="numeroWhatsApp"
                    value={params.numeroWhatsApp}
                    onChange={(e) => setParams({ ...params, numeroWhatsApp: e.target.value })}
                    placeholder="5511999999999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxaCompraInvest">Taxa Compra - Investimento (R$/kWh)</Label>
                  <Input
                    id="taxaCompraInvest"
                    type="text"
                    value={paramsStr.taxaCompraEnergiaInvestimento}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, taxaCompraEnergiaInvestimento: e.target.value });
                      setParams({ ...params, taxaCompraEnergiaInvestimento: parseDecimalBR(e.target.value) });
                    }}
                    placeholder="0,65"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazoContratoInvest">Prazo Contrato - Investimento (anos)</Label>
                  <Input
                    id="prazoContratoInvest"
                    type="text"
                    value={paramsStr.prazoContratoInvestimento}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, prazoContratoInvestimento: e.target.value });
                      setParams({ ...params, prazoContratoInvestimento: Math.floor(parseDecimalBR(e.target.value)) });
                    }}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descontoGC">Desconto Venda GC (%)</Label>
                  <Input
                    id="descontoGC"
                    type="text"
                    value={paramsStr.descontoVendaGC}
                    onChange={(e) => {
                      setParamsStr({ ...paramsStr, descontoVendaGC: e.target.value });
                      setParams({ ...params, descontoVendaGC: parseDecimalBR(e.target.value) / 100 });
                    }}
                    placeholder="20,00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazos de Financiamento (meses)</Label>
                <Input
                  value={params.prazos.join(", ")}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      prazos: e.target.value.split(",").map((p) => parseInt(p.trim()) || 0),
                    })
                  }
                  placeholder="36, 48, 60, 72"
                />
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleSave} size="lg" disabled={isUpdatingParametros}>
            {isUpdatingParametros ? "Salvando..." : "Salvar Parâmetros"}
          </Button>
        </TabsContent>

        <TabsContent value="equipamentos" className="space-y-6">
          <Tabs defaultValue="modulos">
            <TabsList>
              <TabsTrigger value="modulos">Módulos</TabsTrigger>
              <TabsTrigger value="inversores">Inversores</TabsTrigger>
            </TabsList>

            <TabsContent value="modulos" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Módulos Fotovoltaicos</CardTitle>
                  <Button onClick={() => handleOpenEquipDialog("modulo")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Módulo
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Potência (W)</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipamentos
                        .filter((e) => e.tipo === "modulo")
                        .map((equip) => (
                          <TableRow key={equip.id}>
                            <TableCell>{equip.nome}</TableCell>
                            <TableCell>{equip.potenciaW}W</TableCell>
                            <TableCell>R$ {equip.valor.toFixed(2)}</TableCell>
                            <TableCell>{equip.ativo ? "Sim" : "Não"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEquipDialog("modulo", equip)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteEquip(equip.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inversores" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Inversores</CardTitle>
                  <Button onClick={() => handleOpenEquipDialog("inversor")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Inversor
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipamentos
                        .filter((e) => e.tipo === "inversor")
                        .map((equip) => (
                          <TableRow key={equip.id}>
                            <TableCell>{equip.nome}</TableCell>
                            <TableCell>R$ {equip.valor.toFixed(2)}</TableCell>
                            <TableCell>{equip.ativo ? "Sim" : "Não"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEquipDialog("inversor", equip)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteEquip(equip.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {equipEdit ? "Editar" : "Adicionar"} {equipTipo === "modulo" ? "Módulo" : "Inversor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipNome">Nome</Label>
              <Input
                id="equipNome"
                value={equipForm.nome}
                onChange={(e) => setEquipForm({ ...equipForm, nome: e.target.value })}
              />
            </div>
            {equipTipo === "modulo" && (
              <div className="space-y-2">
                <Label htmlFor="equipPotencia">Potência (W)</Label>
                <Input
                  id="equipPotencia"
                  type="number"
                  value={equipForm.potenciaW || ""}
                  onChange={(e) =>
                    setEquipForm({ ...equipForm, potenciaW: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="equipValor">Valor (R$)</Label>
              <Input
                id="equipValor"
                type="number"
                step="0.01"
                value={equipForm.valor}
                onChange={(e) =>
                  setEquipForm({ ...equipForm, valor: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="equipAtivo"
                checked={equipForm.ativo}
                onCheckedChange={(c) => setEquipForm({ ...equipForm, ativo: c as boolean })}
              />
              <Label htmlFor="equipAtivo" className="cursor-pointer">
                Ativo
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEquipDialogOpen(false)} disabled={isAdding || isUpdating}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEquip} disabled={isAdding || isUpdating}>
                {isAdding || isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

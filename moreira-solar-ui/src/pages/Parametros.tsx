import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEquipamentos, Equipamento } from "@/hooks/useEquipamentos";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// TODO: Create mutations for useEquipamentos (add, update, delete)
// TODO: Create useParametros mutations for updating parameters

export default function Parametros() {
  const { equipamentos, isLoading: isLoadingEquipamentos } = useEquipamentos();

  // TODO: Replace with actual parametros from useParametros hook
  const defaultParams = {
    taxaJurosMes: 0.015,
    tarifaComercial: 0.89,
    tusd: 0.35,
    te: 0.45,
    fioB: 0.25,
    reajusteMedio: 0.08,
    geracaoKwp: 150,
    overLoad: 1.2,
    pisConfins: 0.0965,
    icms: 0.18,
    uf: "SP",
    adicionalEstrutSoloPorPlaca: 50,
    numeroWhatsApp: "5511999999999",
    taxaCompraEnergiaInvestimento: 0.45,
    prazoContratoInvestimento: 20,
    descontoVendaGC: 0.15,
    prazos: [36, 48, 60, 72, 84],
  };

  const [params, setParams] = useState(defaultParams);
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [equipTipo, setEquipTipo] = useState<"modulo" | "inversor">("modulo");
  const [equipEdit, setEquipEdit] = useState<Equipamento | null>(null);
  const [equipForm, setEquipForm] = useState<Omit<Equipamento, "id">>({
    tipo: "modulo",
    nome: "",
    potencia_w: undefined,
    valor: 0,
    ativo: true,
  });

  const handleSave = () => {
    // TODO: Implement updateParametros with Supabase
    console.log("TODO: Save parameters to Supabase", params);
    toast.info("Funcionalidade de salvar parâmetros em desenvolvimento");
  };

  const handleOpenEquipDialog = (tipo: "modulo" | "inversor", equip?: Equipamento) => {
    setEquipTipo(tipo);
    if (equip) {
      setEquipEdit(equip);
      setEquipForm(equip);
    } else {
      setEquipEdit(null);
      setEquipForm({
        tipo,
        nome: "",
        potencia_w: tipo === "modulo" ? 0 : undefined,
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
    if (equipForm.tipo === "modulo" && (!equipForm.potencia_w || equipForm.potencia_w <= 0)) {
      toast.error("Informe a potência do módulo");
      return;
    }

    // TODO: Implement equipment mutations
    if (equipEdit) {
      console.log("TODO: Update equipment", equipEdit.id, equipForm);
      toast.info("Funcionalidade de atualizar equipamento em desenvolvimento");
    } else {
      console.log("TODO: Add equipment", equipForm);
      toast.info("Funcionalidade de adicionar equipamento em desenvolvimento");
    }
    setEquipDialogOpen(false);
  };

  const handleDeleteEquip = (id: string) => {
    if (confirm("Deseja realmente excluir este equipamento?")) {
      // TODO: Implement equipment deletion
      console.log("TODO: Delete equipment", id);
      toast.info("Funcionalidade de excluir equipamento em desenvolvimento");
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
                    type="number"
                    step="0.01"
                    value={params.taxaJurosMes * 100}
                    onChange={(e) =>
                      setParams({ ...params, taxaJurosMes: parseFloat(e.target.value) / 100 || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tarifaComercial">Tarifa Comercial (R$/kWh)</Label>
                  <Input
                    id="tarifaComercial"
                    type="number"
                    step="0.01"
                    value={params.tarifaComercial}
                    onChange={(e) =>
                      setParams({ ...params, tarifaComercial: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tusd">TUSD (R$/kWh)</Label>
                  <Input
                    id="tusd"
                    type="number"
                    step="0.01"
                    value={params.tusd}
                    onChange={(e) => setParams({ ...params, tusd: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="te">TE (R$/kWh)</Label>
                  <Input
                    id="te"
                    type="number"
                    step="0.01"
                    value={params.te}
                    onChange={(e) => setParams({ ...params, te: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fioB">Fio B (R$/kWh)</Label>
                  <Input
                    id="fioB"
                    type="number"
                    step="0.01"
                    value={params.fioB}
                    onChange={(e) => setParams({ ...params, fioB: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reajusteMedio">Reajuste Médio Anual (%)</Label>
                  <Input
                    id="reajusteMedio"
                    type="number"
                    step="0.01"
                    value={params.reajusteMedio * 100}
                    onChange={(e) =>
                      setParams({ ...params, reajusteMedio: parseFloat(e.target.value) / 100 || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geracaoKwp">Geração kWp (kWh/kWp/mês)</Label>
                  <Input
                    id="geracaoKwp"
                    type="number"
                    step="0.01"
                    value={params.geracaoKwp}
                    onChange={(e) =>
                      setParams({ ...params, geracaoKwp: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overLoad">Over Load</Label>
                  <Input
                    id="overLoad"
                    type="number"
                    step="0.01"
                    value={params.overLoad}
                    onChange={(e) => setParams({ ...params, overLoad: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pisConfins">PIS/COFINS (%)</Label>
                  <Input
                    id="pisConfins"
                    type="number"
                    step="0.01"
                    value={params.pisConfins * 100}
                    onChange={(e) =>
                      setParams({ ...params, pisConfins: parseFloat(e.target.value) / 100 || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icms">ICMS (%)</Label>
                  <Input
                    id="icms"
                    type="number"
                    step="0.01"
                    value={params.icms * 100}
                    onChange={(e) =>
                      setParams({ ...params, icms: parseFloat(e.target.value) / 100 || 0 })
                    }
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
                    type="number"
                    step="0.01"
                    value={params.adicionalEstrutSoloPorPlaca}
                    onChange={(e) =>
                      setParams({
                        ...params,
                        adicionalEstrutSoloPorPlaca: parseFloat(e.target.value) || 0,
                      })
                    }
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
                    type="number"
                    step="0.01"
                    value={params.taxaCompraEnergiaInvestimento}
                    onChange={(e) =>
                      setParams({ ...params, taxaCompraEnergiaInvestimento: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prazoContratoInvest">Prazo Contrato - Investimento (anos)</Label>
                  <Input
                    id="prazoContratoInvest"
                    type="number"
                    value={params.prazoContratoInvestimento}
                    onChange={(e) =>
                      setParams({ ...params, prazoContratoInvestimento: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descontoGC">Desconto Venda GC (%)</Label>
                  <Input
                    id="descontoGC"
                    type="number"
                    step="0.01"
                    value={params.descontoVendaGC * 100}
                    onChange={(e) =>
                      setParams({ ...params, descontoVendaGC: parseFloat(e.target.value) / 100 || 0 })
                    }
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
          <Button onClick={handleSave} size="lg">
            Salvar Parâmetros
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
                            <TableCell>{equip.potencia_w}W</TableCell>
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
                  value={equipForm.potencia_w || ""}
                  onChange={(e) =>
                    setEquipForm({ ...equipForm, potencia_w: parseInt(e.target.value) || 0 })
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
              <Button variant="outline" onClick={() => setEquipDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEquip}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

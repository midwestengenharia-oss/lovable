import { usePropostas } from "@/hooks/usePropostas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalculadoraFinanciamento from "@/components/CalculadoraFinanciamento";
import CalculadoraManual from "@/components/CalculadoraManual";
import CalculadoraAssinatura from "@/components/CalculadoraAssinatura";
import CalculadoraInvestimento from "@/components/CalculadoraInvestimento";

export default function Financiamentos() {
  const { propostas, isLoading } = usePropostas();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financiamentos e Propostas</h1>

      <Tabs defaultValue="financiamento" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financiamento">Financiamento</TabsTrigger>
          <TabsTrigger value="manual">Proposta Manual</TabsTrigger>
          <TabsTrigger value="assinatura">Geração Compartilhada</TabsTrigger>
          <TabsTrigger value="investimento">Investimento</TabsTrigger>
        </TabsList>

        <TabsContent value="financiamento" className="mt-6">
          <CalculadoraFinanciamento />
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <CalculadoraManual />
        </TabsContent>

        <TabsContent value="assinatura" className="mt-6">
          <CalculadoraAssinatura />
        </TabsContent>

        <TabsContent value="investimento" className="mt-6">
          <CalculadoraInvestimento />
        </TabsContent>
      </Tabs>
    </div>
  );
}

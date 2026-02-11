import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";
import { TitularSelector } from "./TitularSelector";
import { UCPreviewTable } from "./UCPreviewTable";
import { ImportProgress } from "./ImportProgress";
import { toast } from "sonner";

const ENERGISA_API_BASE = "http://localhost:8000";

interface EnergisaWizardSimplificadoProps {
    onClose: () => void;
    onComplete: () => void;
}

export function EnergisaWizardSimplificado({
    onClose,
    onComplete
}: EnergisaWizardSimplificadoProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1 - Login
    const [cpf, setCpf] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Step 2 - SMS
    const [smsCode, setSmsCode] = useState("");

    // Step 3 - Titular
    const [titular, setTitular] = useState<any>(null);

    // Step 4 - Preview
    const [ucs, setUcs] = useState<any[]>([]);
    const [selectedUCs, setSelectedUCs] = useState<string[]>([]);

    // Step 5 - Import
    const [importProgress, setImportProgress] = useState({
        total: 0,
        processadas: 0,
        sucesso: 0,
        erros: 0,
        percentual: 0,
        logs: [] as any[],
    });

    // ============= FUNÇÕES =============

    const handleLogin = async () => {
        if (!cpf || cpf.length !== 11) {
            toast.error("CPF deve ter 11 dígitos");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${ENERGISA_API_BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpf }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Erro ao iniciar login");
            }

            setSessionId(data.session_id);
            toast.success("SMS enviado com sucesso!");
            setStep(2);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarSMS = async () => {
        if (!smsCode || smsCode.length !== 4) {
            toast.error("Código SMS deve ter 4 dígitos");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${ENERGISA_API_BASE}/api/sms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, codigo: smsCode }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Código SMS inválido");
            }

            toast.success("Autenticado com sucesso!");
            setStep(3);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTitularSelected = (titularData: any) => {
        setTitular(titularData);
        setStep(4);
        carregarUCs();
    };

    const carregarUCs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${ENERGISA_API_BASE}/api/ucs-full/${sessionId}`);
            const data = await res.json();

            const ucsProcessadas = (data.ucs || []).map((uc: any) => ({
                ...uc,
                numero_instalacao: uc.cdc || uc.numero_instalacao,
            }));

            setUcs(ucsProcessadas);
            setSelectedUCs(ucsProcessadas.map((uc: any) => uc.numero_instalacao));
            toast.success(`${ucsProcessadas.length} UCs encontradas!`);
        } catch (error: any) {
            toast.error("Erro ao carregar UCs");
        } finally {
            setLoading(false);
        }
    };

    const handleImportar = async () => {
        setStep(5);
        setLoading(true);

        const ucsToImport = ucs.filter(uc =>
            selectedUCs.includes(uc.numero_instalacao)
        );

        setImportProgress({
            total: ucsToImport.length,
            processadas: 0,
            sucesso: 0,
            erros: 0,
            percentual: 0,
            logs: [{
                timestamp: new Date(),
                tipo: 'info',
                mensagem: `Iniciando importação de ${ucsToImport.length} UCs`,
            }],
        });

        // Simular importação (você substituirá pelo código real)
        for (let i = 0; i < ucsToImport.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay

            setImportProgress(prev => ({
                ...prev,
                processadas: i + 1,
                sucesso: i + 1,
                percentual: Math.round(((i + 1) / ucsToImport.length) * 100),
                logs: [
                    ...prev.logs,
                    {
                        timestamp: new Date(),
                        tipo: 'success',
                        mensagem: `✅ UC ${ucsToImport[i].numero_instalacao} importada`,
                    },
                ],
            }));
        }

        setLoading(false);
        toast.success("Importação concluída!");

        setTimeout(() => {
            onComplete();
        }, 2000);
    };

    // ============= RENDER =============

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Importação Energisa - Step {step}/5</CardTitle>
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* STEP 1: LOGIN */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label>CPF do Gestor</Label>
                                    <Input
                                        placeholder="12345678900"
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                                        maxLength={11}
                                    />
                                </div>
                                <Button onClick={handleLogin} disabled={loading} className="w-full">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enviar SMS
                                </Button>
                            </div>
                        )}

                        {/* STEP 2: SMS */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Código SMS</Label>
                                    <Input
                                        placeholder="123456"
                                        value={smsCode}
                                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                                        maxLength={6}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep(1)}>
                                        Voltar
                                    </Button>
                                    <Button onClick={handleConfirmarSMS} disabled={loading} className="flex-1">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: TITULAR */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <TitularSelector
                                    cpfGestor={cpf}
                                    onTitularSelected={handleTitularSelected}
                                />
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    Voltar
                                </Button>
                            </div>
                        )}

                        {/* STEP 4: PREVIEW */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <UCPreviewTable
                                    ucs={ucs}
                                    selectedUCs={selectedUCs}
                                    onToggleSelect={setSelectedUCs}
                                />
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep(3)}>
                                        Voltar
                                    </Button>
                                    <Button
                                        onClick={handleImportar}
                                        disabled={selectedUCs.length === 0}
                                        className="flex-1"
                                    >
                                        Importar {selectedUCs.length} UCs
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: IMPORT */}
                        {step === 5 && (
                            <ImportProgress progress={importProgress} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
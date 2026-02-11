// components/faturas/EnergisaWizard.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    CheckCircle2,
    Circle,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Zap,
    Building2,
    Home
} from "lucide-react";
import { toast } from "sonner";
import { useEnergisaImport } from "@/hooks/useEnergisaImport";
import { useTitularMatcher } from "@/hooks/useTitularMatcher";
import { TitularSelector } from "./TitularSelector";
import { UCPreviewTable } from "./UCPreviewTable";
import { ImportProgress } from "./ImportProgress";
import { formatarCPF } from "@/lib/utils";

interface WizardStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}

const STEPS: WizardStep[] = [
    {
        id: "login",
        title: "Autenticação",
        description: "Login na Energisa",
        icon: <Circle className="h-5 w-5" />
    },
    {
        id: "sms",
        title: "Confirmação SMS",
        description: "Validar código",
        icon: <Circle className="h-5 w-5" />
    },
    {
        id: "titular",
        title: "Titular",
        description: "Associar responsável",
        icon: <Circle className="h-5 w-5" />
    },
    {
        id: "preview",
        title: "Pré-visualização",
        description: "Revisar dados",
        icon: <Circle className="h-5 w-5" />
    },
    {
        id: "import",
        title: "Importação",
        description: "Processando...",
        icon: <Circle className="h-5 w-5" />
    }
];

export function EnergisaWizard({ onClose, onComplete }: {
    onClose: () => void;
    onComplete: () => void;
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    const {
        sessionId,
        cpfGestor,
        titular,
        ucsEnergisa,
        gdInfo,
        importProgress,
        iniciarLogin,
        confirmarSMS,
        carregarDadosEnergisa,
        importarUCs,
        loading,
        error
    } = useEnergisaImport();

    const canGoNext = () => {
        switch (currentStep) {
            case 0: return sessionId !== null;
            case 1: return sessionId !== null && cpfGestor.length === 11;
            case 2: return titular !== null;
            case 3: return selectedUCs.length > 0;
            default: return false;
        }
    };

    const handleNext = async () => {
        if (currentStep === 3) {
            // Iniciar importação
            setCurrentStep(4);
            await importarUCs(selectedUCs);

            if (!error) {
                toast.success("Importação concluída com sucesso!");
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }
        } else {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <LoginStep />;
            case 1:
                return <SMSStep />;
            case 2:
                return <TitularStep />;
            case 3:
                return <PreviewStep />;
            case 4:
                return <ImportStep />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Importação Energisa</span>
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                ✕
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Importe suas unidades consumidoras diretamente da Energisa
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`
                        flex h-10 w-10 items-center justify-center rounded-full border-2
                        ${completedSteps.has(index)
                                                    ? 'border-green-500 bg-green-500 text-white'
                                                    : index === currentStep
                                                        ? 'border-primary bg-primary text-white'
                                                        : 'border-gray-300 bg-white text-gray-400'}
                      `}
                                        >
                                            {completedSteps.has(index) ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : (
                                                <span>{index + 1}</span>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs text-center max-w-[80px]">
                                            {step.title}
                                        </p>
                                    </div>

                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={`
                        h-[2px] w-12 mx-2
                        ${completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-300'}
                      `}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <Separator />

                        {/* Step Content */}
                        <div className="min-h-[400px]">
                            {renderStepContent()}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={currentStep === 0 ? onClose : handleBack}
                                disabled={loading || currentStep === 4}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {currentStep === 0 ? 'Cancelar' : 'Voltar'}
                            </Button>

                            <div className="text-sm text-muted-foreground">
                                Passo {currentStep + 1} de {STEPS.length}
                            </div>

                            <Button
                                onClick={handleNext}
                                disabled={!canGoNext() || loading || currentStep === 4}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {currentStep === 3 ? 'Importar' : 'Continuar'}
                                {!loading && <ChevronRight className="h-4 w-4 ml-1" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ============================================
// STEP 1: LOGIN
// ============================================
function LoginStep() {
    const [cpf, setCpf] = useState("");
    const { iniciarLogin, loading } = useEnergisaImport();

    const handleSubmit = async () => {
        if (cpf.length !== 11) {
            toast.error("CPF deve ter 11 dígitos");
            return;
        }

        await iniciarLogin(cpf);
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Autenticação na Energisa</h3>
                <p className="text-sm text-muted-foreground">
                    Informe o CPF do gestor responsável pelas faturas
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="cpf">CPF do Gestor</Label>
                    <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formatarCPF(cpf)}
                        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                        maxLength={14}
                        disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                        Este CPF será usado apenas para acessar as informações na Energisa
                    </p>
                </div>

                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={cpf.length !== 11 || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando SMS...
                        </>
                    ) : (
                        'Enviar código SMS'
                    )}
                </Button>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900">
                            Informações importantes
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                            <li>O SMS será enviado para o telefone cadastrado na Energisa</li>
                            <li>O código tem validade de 5 minutos</li>
                            <li>Você pode solicitar até 3 reenvios</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// STEP 2: SMS
// ============================================
function SMSStep() {
    const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { confirmarSMS, loading } = useEnergisaImport();

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCodigo = [...codigo];
        newCodigo[index] = value.slice(-1);
        setCodigo(newCodigo);

        // Auto-focus próximo input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit quando completo
        if (index === 5 && value) {
            const codigoCompleto = newCodigo.join("");
            if (codigoCompleto.length === 6) {
                confirmarSMS(codigoCompleto);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !codigo[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Confirmação SMS</h3>
                <p className="text-sm text-muted-foreground">
                    Digite o código de 6 dígitos enviado para seu telefone
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                {/* SMS Inputs */}
                <div className="flex justify-center gap-2">
                    {codigo.map((digit, index) => (
                        <Input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-lg font-semibold"
                            disabled={loading}
                        />
                    ))}
                </div>

                {/* Reenviar */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Não recebeu o código?
                    </p>
                    <Button variant="link" size="sm">
                        Reenviar código
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// STEP 3: TITULAR
// ============================================
function TitularStep() {
    const { cpfGestor } = useEnergisaImport();
    const { matches, suggestion } = useTitularMatcher(cpfGestor);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Associar Titular</h3>
                <p className="text-sm text-muted-foreground">
                    CPF do gestor: {formatarCPF(cpfGestor)}
                </p>
            </div>

            <TitularSelector
                cpfGestor={cpfGestor}
                matches={matches}
                suggestion={suggestion}
            />
        </div>
    );
}

// ============================================
// STEP 4: PREVIEW
// ============================================
function PreviewStep() {
    const { ucsEnergisa, titular, gdInfo } = useEnergisaImport();
    const [selectedUCs, setSelectedUCs] = useState<string[]>([]);

    const stats = {
        total: ucsEnergisa.length,
        novas: ucsEnergisa.filter(uc => !uc.existeNoBanco).length,
        atualizacao: ucsEnergisa.filter(uc => uc.existeNoBanco).length,
        geradoras: ucsEnergisa.filter(uc => uc.tipo_uc === 'geradora').length,
        beneficiarias: ucsEnergisa.filter(uc => uc.tipo_uc === 'beneficiaria').length,
    };

    useEffect(() => {
        // Selecionar todas por padrão
        setSelectedUCs(ucsEnergisa.map(uc => uc.numero_instalacao));
    }, [ucsEnergisa]);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Pré-visualização</h3>
                <p className="text-sm text-muted-foreground">
                    Revise os dados antes de importar
                </p>
            </div>

            {/* Titular Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Titular</p>
                            <p className="text-lg font-semibold">{titular?.nome}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatarCPF(titular?.cpfCnpj)}
                            </p>
                        </div>
                        <Badge variant="outline">
                            {stats.total} UCs encontradas
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.novas}</p>
                            <p className="text-xs text-muted-foreground mt-1">Novas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats.atualizacao}</p>
                            <p className="text-xs text-muted-foreground mt-1">Atualizar</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Zap className="h-4 w-4 text-green-600" />
                                <p className="text-2xl font-bold">{stats.geradoras}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Geradoras</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                <p className="text-2xl font-bold">{stats.beneficiarias}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Beneficiárias</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* UCs Table */}
            <UCPreviewTable
                ucs={ucsEnergisa}
                selectedUCs={selectedUCs}
                onToggleSelect={setSelectedUCs}
            />
        </div>
    );
}

// ============================================
// STEP 5: IMPORT
// ============================================
function ImportStep() {
    const { importProgress } = useEnergisaImport();

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Importando UCs</h3>
                <p className="text-sm text-muted-foreground">
                    Aguarde enquanto processamos suas unidades consumidoras
                </p>
            </div>

            <ImportProgress progress={importProgress} />
        </div>
    );
}
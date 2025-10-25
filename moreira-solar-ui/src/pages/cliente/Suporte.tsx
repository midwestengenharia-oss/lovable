import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Send,
    MessageSquare,
    Clock,
    Upload,
    X,
    Image as ImageIcon,
    Sun,
    Moon,
} from "lucide-react";
import { toast } from "sonner";

export default function Suporte() {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [chamados, setChamados] = useState<any[]>([]);
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        return localStorage.getItem("theme") === "dark";
    });

    // Formulário
    const [tipo, setTipo] = useState("Suporte");
    const [prioridade, setPrioridade] = useState("Média");
    const [descricao, setDescricao] = useState("");

    // Fotos
    const [fotos, setFotos] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);

    useEffect(() => {
        const clienteLogado = sessionStorage.getItem("cliente_logado");
        if (!clienteLogado) {
            toast.error("Você precisa fazer login!");
            navigate("/login-cliente");
            return;
        }

        const clienteData = JSON.parse(clienteLogado);
        setCliente(clienteData);
        carregarChamados(clienteData.id);
    }, [navigate]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const carregarChamados = async (clienteId: string) => {
        try {
            const { data, error } = await supabase
                .from("chamados")
                .select("*")
                .eq("cliente_id", clienteId)
                .order("created_at", { ascending: false });

            if (error && (error as any).code !== "PGRST116") {
                console.error("Erro ao carregar chamados:", error);
            }

            setChamados(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar chamados:", error);
        } finally {
            setLoading(false);
        }
    };

    const gerarNumero = () => {
        const ano = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0");
        return `CH-${ano}-${random}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (fotos.length + files.length > 5) {
            toast.error("Você pode enviar no máximo 5 fotos!");
            return;
        }

        const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            toast.error("Cada foto deve ter no máximo 5MB!");
            return;
        }

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const invalidTypes = files.filter((file) => !validTypes.includes(file.type));
        if (invalidTypes.length > 0) {
            toast.error("Apenas arquivos JPG, PNG e WEBP são permitidos!");
            return;
        }

        setFotos((prev) => [...prev, ...files]);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrls((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removerFoto = (index: number) => {
        setFotos((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadFotos = async (numeroChamado: string) => {
        if (fotos.length === 0) return [];
        setUploadingPhotos(true);
        const fotosUrls: string[] = [];

        try {
            for (let i = 0; i < fotos.length; i++) {
                const foto = fotos[i];
                const timestamp = Date.now();
                const fileName = `${numeroChamado}_${timestamp}_${i}.${foto.name.split(".").pop()
                    }`;
                const filePath = `${cliente.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("chamados-fotos")
                    .upload(filePath, foto);

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl },
                } = supabase.storage.from("chamados-fotos").getPublicUrl(filePath);

                fotosUrls.push(publicUrl);
            }
            return fotosUrls;
        } catch (error: any) {
            toast.error("Erro ao enviar fotos.");
            return [];
        } finally {
            setUploadingPhotos(false);
        }
    };

    const handleEnviarChamado = async () => {
        if (!descricao.trim()) {
            toast.error("Preencha a descrição do chamado!");
            return;
        }

        try {
            setEnviando(true);
            const numeroChamado = gerarNumero();
            const fotosUrls = await uploadFotos(numeroChamado);

            const { data: clienteData } = await supabase
                .from("clientes")
                .select("user_id, nome")
                .eq("id", cliente.id)
                .single();

            const { error } = await supabase.from("chamados").insert({
                numero: numeroChamado,
                cliente: clienteData?.nome || cliente.nome,
                cliente_id: cliente.id,
                tipo,
                prioridade,
                status: "Chamado",
                descricao,
                data: new Date().toISOString(),
                user_id: clienteData?.user_id,
                fotos: fotosUrls,
                historico: [
                    {
                        data: new Date().toISOString(),
                        acao: "Chamado criado pelo cliente",
                        usuario: cliente.nome,
                    },
                ],
            });

            if (error) throw error;

            toast.success("Chamado enviado com sucesso!");
            setDescricao("");
            setTipo("Suporte");
            setPrioridade("Média");
            setFotos([]);
            setPreviewUrls([]);
            carregarChamados(cliente.id);
        } catch (error: any) {
            toast.error("Erro ao enviar chamado: " + error.message);
        } finally {
            setEnviando(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Onboarding: "bg-purple-100 text-purple-800",
            Ativo: "bg-blue-100 text-blue-800",
            Manutenção: "bg-yellow-100 text-yellow-800",
            Chamado: "bg-orange-100 text-orange-800",
            Finalizado: "bg-green-100 text-green-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getPrioridadeColor = (prioridade: string) => {
        const colors: Record<string, string> = {
            Baixa: "bg-green-100 text-green-800",
            Média: "bg-yellow-100 text-yellow-800",
            Alta: "bg-red-100 text-red-800",
        };
        return colors[prioridade] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto space-y-6 py-8">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate("/area-cliente")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold dark:text-white">Suporte</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Precisa de ajuda? Estamos aqui para você!
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center gap-2"
                    >
                        {darkMode ? (
                            <>
                                <Sun className="w-4 h-4" /> Claro
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4" /> Escuro
                            </>
                        )}
                    </Button>
                </div>

                {/* Novo chamado */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <MessageSquare className="w-5 h-5" />
                            Abrir Novo Chamado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Tipo do Chamado</Label>
                                <Select value={tipo} onValueChange={setTipo}>
                                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Suporte">Suporte Técnico</SelectItem>
                                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                                        <SelectItem value="Garantia">Garantia</SelectItem>
                                        <SelectItem value="Limpeza">Limpeza</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Prioridade</Label>
                                <Select value={prioridade} onValueChange={setPrioridade}>
                                    <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Baixa">Baixa</SelectItem>
                                        <SelectItem value="Média">Média</SelectItem>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Descrição</Label>
                            <Textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Descreva sua solicitação ou problema..."
                                rows={6}
                                className="dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>

                        <div>
                            <Label>Fotos (opcional - até 5 fotos)</Label>
                            <div className="mt-2">
                                <input
                                    type="file"
                                    id="fotos-upload"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        (
                                            document.getElementById(
                                                "fotos-upload"
                                            ) as HTMLInputElement | null
                                        )?.click()
                                    }
                                    disabled={fotos.length >= 5}
                                    className="w-full"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {fotos.length > 0
                                        ? `Adicionar mais fotos (${fotos.length}/5)`
                                        : "Adicionar Fotos"}
                                </Button>
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded border dark:border-gray-600"
                                            />
                                            <button
                                                onClick={() => removerFoto(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remover foto"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleEnviarChamado}
                            disabled={enviando || uploadingPhotos}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {uploadingPhotos
                                ? "Fazendo upload das fotos..."
                                : enviando
                                    ? "Enviando..."
                                    : "Enviar Chamado"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Chamados */}
                {chamados.length > 0 && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="dark:text-white">Meus Chamados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {chamados.map((chamado) => {
                                    const created = chamado.created_at
                                        ? new Date(chamado.created_at)
                                        : null;
                                    return (
                                        <div
                                            key={chamado.id}
                                            className="p-4 border rounded-lg dark:border-gray-700 hover:shadow-md transition"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                                                        {chamado.numero}
                                                    </span>
                                                    <Badge className={getStatusColor(chamado.status)}>
                                                        {chamado.status}
                                                    </Badge>
                                                    {chamado.prioridade && (
                                                        <Badge
                                                            className={getPrioridadeColor(chamado.prioridade)}
                                                        >
                                                            {chamado.prioridade}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="font-semibold dark:text-white mb-1">
                                                {chamado.tipo}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                {chamado.descricao}
                                            </p>

                                            {Array.isArray(chamado.fotos) &&
                                                chamado.fotos.length > 0 && (
                                                    <div className="mt-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <ImageIcon className="w-4 h-4 text-gray-500" />
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                Fotos anexadas ({chamado.fotos.length})
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                            {chamado.fotos.map(
                                                                (fotoUrl: string, idx: number) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={fotoUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="block"
                                                                    >
                                                                        <img
                                                                            src={fotoUrl}
                                                                            alt={`Foto ${idx + 1}`}
                                                                            className="w-full h-20 object-cover rounded border dark:border-gray-600 hover:opacity-80 transition-opacity cursor-pointer"
                                                                        />
                                                                    </a>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                <Clock className="w-3 h-3" />
                                                {created
                                                    ? `${created.toLocaleDateString("pt-BR")} às ${created.toLocaleTimeString("pt-BR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}`
                                                    : "Data não disponível"}
                                            </div>

                                            {chamado.resolucao && (
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                                    <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                                                        Resolução:
                                                    </p>
                                                    <p className="text-sm text-green-700 dark:text-green-200">
                                                        {chamado.resolucao}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

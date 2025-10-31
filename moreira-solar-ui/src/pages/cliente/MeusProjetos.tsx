import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Supabase removido do front: usar BFF endpoints
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Zap, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export default function MeusProjetos() {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<any>(null);
    const [projetos, setProjetos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        return localStorage.getItem("theme") === "dark";
    });

    // 🔹 Efeito para carregar o cliente logado e buscar os projetos
    useEffect(() => { (async () => { try { const res = await fetch('/api/projetos', { credentials: 'include' }); if (res.status === 401) { toast.error('Fa�a login!'); navigate('/login-cliente'); return; } if (!res.ok) throw new Error('projetos_query_failed'); const data = await res.json(); setProjetos(data || []); } catch (e) { console.error(e); toast.error('Erro ao carregar projetos'); } finally { setLoading(false); } })(); }, [navigate]);

    // 🔹 Alternância de tema (dark/light)
    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    // 🔹 Carregar projetos do Supabase
    const carregarProjetos = async (clienteId: string) => {
        try {

            const { data, error } = await supabase
                .from("projetos")
                .select("*")
                .eq("cliente_id", clienteId)
                .order("created_at", { ascending: false });


            if (error) {
                console.error("❌ Erro Supabase:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn("⚠️ Nenhum projeto encontrado para esse cliente_id.");
            } else {
                data.forEach((p, i) => {
                });
            }

            setProjetos(data || []);
        } catch (error: any) {
            console.error("💥 Erro ao carregar projetos:", error);
            toast.error("Erro ao carregar projetos");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Cores e labels de status
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            em_andamento:
                "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            concluido:
                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            pendente:
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            cancelado:
                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        };
        return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            em_andamento: "Em Andamento",
            concluido: "Concluído",
            pendente: "Pendente",
            cancelado: "Cancelado",
        };
        return labels[status] || status;
    };

    // 🔹 Tela de carregamento
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Carregando projetos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-6xl mx-auto space-y-6 py-8">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/area-cliente")}
                            className="dark:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold dark:text-white">
                                Meus Projetos
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Acompanhe o status dos seus projetos solares
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

                {/* Projetos */}
                {projetos.length === 0 ? (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="py-12 text-center">
                            <Zap className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                Nenhum projeto encontrado
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Você ainda não possui projetos cadastrados.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {projetos.map((projeto) => (
                            <Card
                                key={projeto.id}
                                className="hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-all"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-xl font-semibold dark:text-white">
                                                    {projeto.nome || "Projeto Solar"}
                                                </h3>
                                                <Badge className={getStatusColor(projeto.status)}>
                                                    {getStatusLabel(projeto.status)}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                {projeto.endereco && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-300" />
                                                        <span>{projeto.endereco}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    <span>
                                                        Criado em{" "}
                                                        {new Date(
                                                            projeto.created_at
                                                        ).toLocaleDateString("pt-BR")}
                                                    </span>
                                                </div>

                                                {projeto.potencia && (
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-300" />
                                                        <span>
                                                            Potência: {projeto.potencia} kWp
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {projeto.observacoes && (
                                                <p className="mt-3 text-sm text-gray-700 dark:text-gray-400">
                                                    {projeto.observacoes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


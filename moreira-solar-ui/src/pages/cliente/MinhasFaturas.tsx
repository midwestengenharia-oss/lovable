import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Download,
    FileText,
    Moon,
    Sun,
} from "lucide-react";
import { toast } from "sonner";

export default function MinhasFaturas() {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<any>(null);
    const [faturas, setFaturas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        return localStorage.getItem("theme") === "dark";
    });

    useEffect(() => {
        const clienteLogado = sessionStorage.getItem("cliente_logado");
        if (!clienteLogado) {
            toast.error("Você precisa fazer login!");
            navigate("/login-cliente");
            return;
        }
        const clienteData = JSON.parse(clienteLogado);
        setCliente(clienteData);
        carregarFaturas(clienteData.id);
    }, [navigate]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const carregarFaturas = async (clienteId: string) => {
        try {
            const { data, error } = await supabase
                .from("cobrancas")
                .select("*")
                .eq("cliente_id", clienteId)
                .order("vencimento", { ascending: false });

            if (error) throw error;
            setFaturas(data || []);
        } catch (error: any) {
            console.error("Erro ao carregar faturas:", error);
            toast.error("Erro ao carregar faturas");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            paga: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            pendente:
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            atrasada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            cancelada:
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        };
        return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            paga: "Paga",
            pendente: "Pendente",
            atrasada: "Atrasada",
            cancelada: "Cancelada",
        };
        return labels[status] || status;
    };

    const formatarValor = (valor: number) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Carregando faturas...</p>
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
                                Minhas Faturas
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Consulte e baixe suas faturas
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

                {/* Faturas */}
                {faturas.length === 0 ? (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="py-12 text-center">
                            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                Nenhuma fatura encontrada
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Você ainda não possui faturas cadastradas.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {faturas.map((fatura) => (
                            <Card
                                key={fatura.id}
                                className="hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 transition-all"
                            >
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                <h3 className="text-xl font-semibold dark:text-white">
                                                    {fatura.descricao || "Fatura"}
                                                </h3>
                                                <Badge className={getStatusColor(fatura.status)}>
                                                    {getStatusLabel(fatura.status)}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            Valor
                                                        </p>
                                                        <p className="font-semibold text-lg dark:text-white">
                                                            {formatarValor(fatura.valor)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            Vencimento
                                                        </p>
                                                        <p className="font-semibold dark:text-white">
                                                            {new Date(
                                                                fatura.vencimento
                                                            ).toLocaleDateString("pt-BR")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {fatura.data_pagamento && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">
                                                                Pago em
                                                            </p>
                                                            <p className="font-semibold dark:text-white">
                                                                {new Date(
                                                                    fatura.data_pagamento
                                                                ).toLocaleDateString("pt-BR")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botão de ação */}
                                        {fatura.status === "pendente" && (
                                            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar Boleto
                                            </Button>
                                        )}
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

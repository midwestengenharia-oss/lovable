import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    FileText,
    DollarSign,
    User,
    MessageSquare,
    LogOut,
    Home,
    Sun,
    Moon,
} from "lucide-react";

export default function AreaCliente() {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState<any>(null);
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
        setCliente(JSON.parse(clienteLogado));
    }, [navigate]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const handleLogout = () => {
        sessionStorage.removeItem("cliente_logado");
        toast.success("Logout realizado com sucesso!");
        navigate("/login-cliente");
    };

    if (!cliente) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Carregando...</p>
            </div>
        );
    }

    const menuItems = [
        {
            title: "Meus Projetos",
            description: "Acompanhe o status dos seus projetos solares",
            icon: FileText,
            color: "cyan",
            route: "/cliente/projetos",
        },
        {
            title: "Minhas Faturas",
            description: "Consulte e baixe suas faturas",
            icon: DollarSign,
            color: "green",
            route: "/cliente/faturas",
        },
        {
            title: "Suporte",
            description: "Precisa de ajuda? Entre em contato",
            icon: MessageSquare,
            color: "blue",
            route: "/cliente/suporte",
        },
        {
            title: "Meu Perfil",
            description: "Atualize seus dados cadastrais",
            icon: User,
            color: "purple",
            route: "/cliente/perfil",
        },
    ];

    return (
        <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-6xl mx-auto space-y-6 py-8">
                {/* Header */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Home className="w-8 h-8 text-yellow-500" />
                            <div>
                                <CardTitle className="text-2xl dark:text-white">
                                    Moreira Solar ☀️
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Área do Cliente
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
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
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="text-red-600 border-red-300 hover:bg-red-100 dark:text-red-400 dark:border-red-500 dark:hover:bg-red-900/30"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-600 dark:to-blue-700 text-white p-6 rounded-lg shadow">
                            <h2 className="text-3xl font-bold mb-2">
                                Bem-vindo, {cliente.nome}!
                            </h2>
                            <p className="text-cyan-100">{cliente.email}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const colorBase = item.color;

                        return (
                            <Card
                                key={item.route}
                                className={`cursor-pointer dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-transform hover:-translate-y-1`}
                                onClick={() => navigate(item.route)}
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`p-3 rounded-lg bg-${colorBase}-100 dark:bg-${colorBase}-900/30`}
                                        >
                                            <Icon
                                                className={`w-6 h-6 text-${colorBase}-600 dark:text-${colorBase}-400`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-1 dark:text-white">
                                                {item.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                                {item.description}
                                            </p>
                                            <Button
                                                className={`bg-${colorBase}-500 hover:bg-${colorBase}-600 dark:bg-${colorBase}-600 dark:hover:bg-${colorBase}-500`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(item.route);
                                                }}
                                            >
                                                Acessar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Propostas from "./pages/Propostas";
import CRM from "./pages/CRM";
import Orcamentos from "./pages/Orcamentos";
import Projetos from "./pages/Projetos";
import PosVenda from "./pages/PosVenda";
import Cobrancas from "./pages/Cobrancas";
import Integracoes from "./pages/Integracoes";
import Parametros from "./pages/Parametros";
import Perfil from "./pages/Perfil";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import GestaoFaturas from "./pages/GestaoFaturas";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProtectedRoute modulo="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/propostas" element={<ProtectedRoute modulo="propostas"><Propostas /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute modulo="crm"><CRM /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute modulo="clientes"><Clientes /></ProtectedRoute>} />
        <Route path="/orcamentos" element={<ProtectedRoute modulo="orcamentos"><Orcamentos /></ProtectedRoute>} />
        <Route path="/projetos" element={<ProtectedRoute modulo="projetos"><Projetos /></ProtectedRoute>} />
        <Route path="/pos-venda" element={<ProtectedRoute modulo="pos-venda"><PosVenda /></ProtectedRoute>} />
        <Route path="/cobrancas" element={<ProtectedRoute modulo="cobrancas"><Cobrancas /></ProtectedRoute>} />
        <Route path="/gestao-faturas" element={<ProtectedRoute modulo="faturas"><GestaoFaturas /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute modulo="usuarios"><Usuarios /></ProtectedRoute>} />
        <Route path="/integracoes" element={<ProtectedRoute modulo="integracoes"><Integracoes /></ProtectedRoute>} />
        <Route path="/parametros" element={<ProtectedRoute modulo="parametros"><Parametros /></ProtectedRoute>} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

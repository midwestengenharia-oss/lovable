import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Login from "./pages/Login";
import ChooseAccess from "./pages/ChooseAccess";
import NotFound from "./pages/NotFound";
import GestaoFaturas from "./pages/GestaoFaturas";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminKanban from "@/pages/admin/Kanban/AdminKanban";
import AdminStageForms from "@/pages/admin/Kanban/AdminStageForms";
import Cadastro from "@/pages/CadastroCliente";
import LoginCliente from "@/pages/LoginCliente";
import AreaCliente from "@/pages/AreaCliente";
import MeusProjetos from "@/pages/cliente/MeusProjetos";
import MinhasFaturas from "@/pages/cliente/MinhasFaturas";
import MeuPerfil from "@/pages/cliente/MeuPerfil";
import Suporte from "@/pages/cliente/Suporte";

const queryClient = new QueryClient();

// Rotas autenticadas: delega verificação ao ProtectedRoute (BFF/SSO)
const AppRoutes = () => (
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
      <Route path="/admin/kanban" element={<ProtectedRoute modulo="parametros"><AdminKanban /></ProtectedRoute>} />
      <Route path="/admin/kanban/forms" element={<ProtectedRoute modulo="parametros"><AdminStageForms /></ProtectedRoute>} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas - Cadastro e Login */}
              <Route path="/login" element={<Login />} />
              <Route path="/acesso" element={<ChooseAccess />} />
              <Route path="/cadastroCliente" element={<Cadastro />} />
              <Route path="/login-cliente" element={<LoginCliente />} />

              {/* Rotas públicas - Área do Cliente */}
              <Route path="/area-cliente" element={<AreaCliente />} />
              <Route path="/cliente/projetos" element={<MeusProjetos />} />
              <Route path="/cliente/faturas" element={<MinhasFaturas />} />
              <Route path="/cliente/perfil" element={<MeuPerfil />} />
              <Route path="/cliente/suporte" element={<Suporte />} />

              {/* Rotas autenticadas */}
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


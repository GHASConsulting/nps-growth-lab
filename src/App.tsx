import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PasswordChangeChecker } from "./components/PasswordChangeChecker";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Responder from "./pages/Responder";
import PesquisaPage from "./pages/PesquisaPage";
import DashboardPage from "./pages/DashboardPage";
import ConfigPage from "./pages/ConfigPage";
import IntegracoesPage from "./pages/IntegracoesPage";
import AnaliseIndicadoresPage from "./pages/AnaliseIndicadoresPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PasswordChangeChecker />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/responder/:pesquisaId" element={<Responder />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/pesquisa" element={
              <ProtectedRoute>
                <Layout>
                  <PesquisaPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/config" element={
              <ProtectedRoute>
                <Layout>
                  <ConfigPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/integracoes" element={
              <ProtectedRoute>
                <Layout>
                  <IntegracoesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analise-indicadores" element={
              <ProtectedRoute>
                <Layout>
                  <AnaliseIndicadoresPage />
                </Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

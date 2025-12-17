import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">AVAlia - Dashboard Principal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gestão de Pesquisas</h2>
              <p className="text-gray-600 mb-4">Crie e gerencie suas pesquisas NPS</p>
              <Link to="/pesquisa">
                <Button className="w-full">
                  Acessar Pesquisas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
              <p className="text-gray-600 mb-4">Visualize as respostas e relatórios</p>
              <Link to="/dashboard">
                <Button className="w-full">
                  Ver Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Administração</h2>
              <p className="text-gray-600 mb-4">Configure o sistema e permissões</p>
              <Link to="/config">
                <Button className="w-full">
                  Configurações
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Integrações</h2>
              <p className="text-gray-600 mb-4">Conecte com outras ferramentas</p>
              <Link to="/integracoes">
                <Button className="w-full">
                  Ver Integrações
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;

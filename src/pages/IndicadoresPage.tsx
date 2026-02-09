import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardPage from "./DashboardPage";
import AnaliseIndicadoresPage from "./AnaliseIndicadoresPage";

const IndicadoresPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Indicadores</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analise">Análise de Indicadores</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardPage />
          </TabsContent>
          <TabsContent value="analise">
            <AnaliseIndicadoresPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IndicadoresPage;

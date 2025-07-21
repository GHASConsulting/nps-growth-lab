import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const IntegracoesPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testando, setTestando] = useState(false);
  const { toast } = useToast();

  const testarIntegracao = async () => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "URL do webhook é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setTestando(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teste: true,
          timestamp: new Date().toISOString(),
          message: 'Teste de integração do NPS GHAS'
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Integração testada com sucesso!",
        });
      } else {
        throw new Error('Falha na requisição');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao testar integração",
        variant: "destructive",
      });
    } finally {
      setTestando(false);
    }
  };

  const salvarIntegracoes = () => {
    localStorage.setItem('integracoes', JSON.stringify({
      apiKey,
      webhookUrl
    }));

    toast({
      title: "Sucesso",
      description: "Integrações salvas com sucesso!",
    });
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Integrações</h1>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Webhooks</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">URL do Webhook</label>
                  <Input 
                    placeholder="https://hooks.zapier.com/hooks/catch/..." 
                    value={webhookUrl} 
                    onChange={(e) => setWebhookUrl(e.target.value)} 
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Será chamado automaticamente quando uma nova resposta for recebida
                  </p>
                </div>
                <Button 
                  className="bg-[#5a89a3] text-white" 
                  onClick={testarIntegracao}
                  disabled={testando}
                >
                  {testando ? "Testando..." : "Testar Integração"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">APIs Externas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <Input 
                    type="password"
                    placeholder="Sua chave de API" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Conexões CRM/ERP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Salesforce</h4>
                  <p className="text-sm text-gray-600">Não conectado</p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Conectar
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">HubSpot</h4>
                  <p className="text-sm text-gray-600">Não conectado</p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Conectar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Plataformas de E-mail Marketing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Mailchimp</h4>
                  <p className="text-sm text-gray-600">Não conectado</p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Conectar
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">SendGrid</h4>
                  <p className="text-sm text-gray-600">Não conectado</p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Conectar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ferramentas de BI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Power BI</h4>
                  <p className="text-sm text-gray-600">Não conectado</p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Conectar
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Tableau</h4>
                  <p className="text-sm text-gray-600">Não conectado</p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Conectar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status das Integrações</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>Webhook Principal</span>
                  <span className="text-green-600 font-medium">Ativo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>Sincronização CRM</span>
                  <span className="text-gray-600 font-medium">Inativo</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>E-mail Marketing</span>
                  <span className="text-gray-600 font-medium">Inativo</span>
                </div>
              </div>
            </div>

            <Button className="w-full bg-[#5a89a3] text-white" onClick={salvarIntegracoes}>
              Salvar Integrações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IntegracoesPage;
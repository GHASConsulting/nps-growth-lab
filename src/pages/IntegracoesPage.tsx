import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bot, Webhook, Save, TestTube } from "lucide-react";

const IntegracoesPage = () => {
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [assistantId, setAssistantId] = useState("asst_u5n6X7Nfg26XLlNy2k0QK9Kr");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [testando, setTestando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const integracoes = localStorage.getItem('integracoes');
    if (integracoes) {
      try {
        const parsed = JSON.parse(integracoes);
        setN8nWebhookUrl(parsed.n8nWebhookUrl || parsed.webhookUrl || "");
        setAssistantId(parsed.assistantId || "asst_u5n6X7Nfg26XLlNy2k0QK9Kr");
        setOpenaiApiKey(parsed.openaiApiKey || "");
      } catch (e) {
        console.error('Erro ao carregar integrações:', e);
      }
    }
  }, []);

  const testarN8nWebhook = async () => {
    if (!n8nWebhookUrl) {
      toast({
        title: "Erro",
        description: "URL do webhook N8N é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setTestando(true);
    
    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          teste: true,
          timestamp: new Date().toISOString(),
          message: 'Teste de integração AVAlia - N8N'
        })
      });

      toast({
        title: "Enviado",
        description: "Requisição de teste enviada para o N8N",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao testar webhook N8N",
        variant: "destructive",
      });
    } finally {
      setTestando(false);
    }
  };

  const salvarIntegracoes = () => {
    localStorage.setItem('integracoes', JSON.stringify({
      n8nWebhookUrl,
      assistantId,
      openaiApiKey
    }));

    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso!",
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Integrações</h1>

        {/* N8N Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              N8N - Automação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n8nWebhookUrl">URL do Webhook N8N</Label>
              <Input 
                id="n8nWebhookUrl"
                placeholder="https://seu-n8n.com/webhook/..." 
                value={n8nWebhookUrl} 
                onChange={(e) => setN8nWebhookUrl(e.target.value)} 
              />
              <p className="text-sm text-muted-foreground">
                URL do webhook N8N que receberá os dados para processamento com GPT
              </p>
            </div>
            <Button 
              onClick={testarN8nWebhook}
              disabled={testando}
              variant="outline"
              size="sm"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {testando ? "Testando..." : "Testar Webhook"}
            </Button>
          </CardContent>
        </Card>

        {/* OpenAI Assistant Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              OpenAI Assistant (GPT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assistantId">Assistant ID</Label>
                <Input 
                  id="assistantId"
                  placeholder="asst_..." 
                  value={assistantId} 
                  onChange={(e) => setAssistantId(e.target.value)} 
                />
                <p className="text-sm text-muted-foreground">
                  ID do Assistant configurado no OpenAI Platform
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                <Input 
                  id="openaiApiKey"
                  type="password"
                  placeholder="sk-..." 
                  value={openaiApiKey} 
                  onChange={(e) => setOpenaiApiKey(e.target.value)} 
                />
                <p className="text-sm text-muted-foreground">
                  Chave de API da OpenAI para autenticação
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Configuração Necessária</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Acesse <a href="https://platform.openai.com/assistants" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/assistants</a></li>
                <li>O Assistant ID já está pré-configurado: <code className="bg-blue-100 px-1 rounded">asst_u5n6X7Nfg26XLlNy2k0QK9Kr</code></li>
                <li>Gere uma API Key em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                <li>Cole a API Key no campo acima</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                N8N Webhook
              </span>
              <span className={`font-medium ${n8nWebhookUrl ? 'text-green-600' : 'text-muted-foreground'}`}>
                {n8nWebhookUrl ? "Configurado" : "Não configurado"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                OpenAI Assistant
              </span>
              <span className={`font-medium ${openaiApiKey ? 'text-green-600' : 'text-muted-foreground'}`}>
                {openaiApiKey ? "Configurado" : "API Key pendente"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={salvarIntegracoes}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default IntegracoesPage;

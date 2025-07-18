import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Settings, Zap, Upload, Download, Calendar, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Pesquisa {
  id: string;
  nome: string;
  pergunta: string;
  agradecimento: string;
  followup: string;
  categoria: string;
  periodicidade: string;
  criadaEm: string;
}

interface Resposta {
  nota: string;
  total: number;
}

export default function LovableNPS() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [nome, setNome] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [agradecimento, setAgradecimento] = useState("");
  const [followup, setFollowup] = useState("");
  const [categoria, setCategoria] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("pesquisas");
    if (saved) setPesquisas(JSON.parse(saved));
    
    // Mock data for demonstration
    const mockRespostas = [
      { nota: "0", total: 2 },
      { nota: "1", total: 1 },
      { nota: "2", total: 2 },
      { nota: "3", total: 1 },
      { nota: "4", total: 3 },
      { nota: "5", total: 4 },
      { nota: "6", total: 2 },
      { nota: "7", total: 8 },
      { nota: "8", total: 12 },
      { nota: "9", total: 15 },
      { nota: "10", total: 20 },
    ];
    setRespostas(mockRespostas);
  }, []);

  useEffect(() => {
    localStorage.setItem("pesquisas", JSON.stringify(pesquisas));
  }, [pesquisas]);

  const salvarPesquisa = () => {
    if (!nome || !pergunta) {
      toast({
        title: "Erro",
        description: "Nome e pergunta são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const novaPesquisa: Pesquisa = {
      id: Date.now().toString(),
      nome,
      pergunta,
      agradecimento,
      followup,
      categoria,
      periodicidade,
      criadaEm: new Date().toLocaleDateString("pt-BR"),
    };
    
    setPesquisas([...pesquisas, novaPesquisa]);
    setNome("");
    setPergunta("");
    setAgradecimento("");
    setFollowup("");
    setCategoria("");
    setPeriodicidade("");
    
    toast({
      title: "Sucesso",
      description: "Pesquisa salva com sucesso!",
    });
  };

  const calcularNPS = () => {
    const total = respostas.reduce((acc, curr) => acc + curr.total, 0);
    const promotores = respostas.filter(r => parseInt(r.nota) >= 9).reduce((acc, curr) => acc + curr.total, 0);
    const detratores = respostas.filter(r => parseInt(r.nota) <= 6).reduce((acc, curr) => acc + curr.total, 0);
    
    if (total === 0) return 0;
    
    return Math.round(((promotores - detratores) / total) * 100);
  };

  const npsScore = calcularNPS();
  const total = respostas.reduce((acc, curr) => acc + curr.total, 0);
  const promotores = respostas.filter(r => parseInt(r.nota) >= 9).reduce((acc, curr) => acc + curr.total, 0);
  const neutros = respostas.filter(r => parseInt(r.nota) >= 7 && parseInt(r.nota) <= 8).reduce((acc, curr) => acc + curr.total, 0);
  const detratores = respostas.filter(r => parseInt(r.nota) <= 6).reduce((acc, curr) => acc + curr.total, 0);

  const pieData = [
    { name: "Detratores", value: detratores, color: "#ef4444" },
    { name: "Neutros", value: neutros, color: "#f59e0b" },
    { name: "Promotores", value: promotores, color: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Lovable NPS
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistema completo de gestão de Net Promoter Score
          </p>
        </div>

        {/* NPS Score Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">NPS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{npsScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {npsScore >= 70 ? "Excelente" : npsScore >= 50 ? "Muito Bom" : npsScore >= 30 ? "Bom" : npsScore >= 0 ? "Regular" : "Crítico"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Respostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Promotores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{promotores}</div>
              <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((promotores/total)*100) : 0}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Detratores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{detratores}</div>
              <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((detratores/total)*100) : 0}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pesquisa" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pesquisa" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pesquisas
            </TabsTrigger>
            <TabsTrigger value="respostas" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Administração
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pesquisa" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Criar Nova Pesquisa */}
              <Card>
                <CardHeader>
                  <CardTitle>Criar Nova Pesquisa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="Nome da Pesquisa" 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                  />
                  <Textarea 
                    placeholder="Pergunta NPS (ex: Em uma escala de 0 a 10, o quanto você recomendaria nossa empresa?)" 
                    value={pergunta} 
                    onChange={(e) => setPergunta(e.target.value)} 
                  />
                  <Textarea 
                    placeholder="Mensagem de Agradecimento" 
                    value={agradecimento} 
                    onChange={(e) => setAgradecimento(e.target.value)} 
                  />
                  <Textarea 
                    placeholder="Pergunta de Follow-up (opcional)" 
                    value={followup} 
                    onChange={(e) => setFollowup(e.target.value)} 
                  />
                  <Input 
                    placeholder="Categoria / Setor" 
                    value={categoria} 
                    onChange={(e) => setCategoria(e.target.value)} 
                  />
                  <Select value={periodicidade} onValueChange={setPeriodicidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Periodicidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unica">Única</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={salvarPesquisa}>
                    Salvar Pesquisa
                  </Button>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Importar Contatos (CSV)
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Agendar Disparo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Pesquisas */}
              <Card>
                <CardHeader>
                  <CardTitle>Pesquisas Criadas ({pesquisas.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pesquisas.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhuma pesquisa criada ainda
                      </p>
                    ) : (
                      pesquisas.map((pesquisa) => (
                        <div key={pesquisa.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{pesquisa.nome}</h3>
                            <Badge variant="secondary">{pesquisa.periodicidade}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pesquisa.pergunta}</p>
                          {pesquisa.categoria && (
                            <Badge variant="outline">{pesquisa.categoria}</Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Criada em {pesquisa.criadaEm}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="respostas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={respostas}>
                      <XAxis 
                        dataKey="nota" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico Pizza */}
              <Card>
                <CardHeader>
                  <CardTitle>Categorização NPS</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Detratores (0-6):</span>
                      <span className="font-medium">{detratores} pessoas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Neutros (7-8):</span>
                      <span className="font-medium">{neutros} pessoas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Promotores (9-10):</span>
                      <span className="font-medium">{promotores} pessoas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Relatório Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Logotipo da empresa (URL)" />
                <Input placeholder="Cores principais (hex)" />
                <Textarea placeholder="Mensagem final personalizada" />
                <Input placeholder="Domínio personalizado (ex: pesquisa.suaempresa.com)" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Função do Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="leitura">Somente Leitura</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Chave da API para integração com ERP" />
                <Input placeholder="URL de Webhook (ex: Zapier/Make)" />
                <Input placeholder="Token do Slack para notificações" />
                <Input placeholder="API Key do Google Sheets" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Testar Integração
                  </Button>
                  <Button variant="outline">
                    Configurar Notificações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
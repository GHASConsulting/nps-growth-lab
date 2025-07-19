import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LogOut, Copy, Plus, Trash2 } from "lucide-react";

interface Pesquisa {
  id: string;
  nome: string;
  descricao?: string;
  periodicidade: string;
  ativa: boolean;
  created_at: string;
}

interface Pergunta {
  id?: string;
  pesquisa_id?: string;
  texto: string;
  tipo_resposta: 'numero' | 'campo' | 'data';
  ordem: number;
}

export default function LovableNPS() {
  const { user, signOut } = useAuth();
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [respostas, setRespostas] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const [perguntas, setPerguntas] = useState<Pergunta[]>([
    { texto: "", tipo_resposta: 'numero', ordem: 1 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      carregarPesquisas();
      carregarRespostas();
    }
  }, [user]);

  const carregarPesquisas = async () => {
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar pesquisas",
          variant: "destructive",
        });
        return;
      }

      setPesquisas(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pesquisas",
        variant: "destructive",
      });
    }
  };

  const carregarRespostas = async () => {
    try {
      const { data, error } = await supabase
        .from('respostas')
        .select(`
          valor_numero,
          pesquisa_id,
          pesquisas!inner(user_id)
        `)
        .eq('pesquisas.user_id', user?.id)
        .not('valor_numero', 'is', null);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar respostas",
          variant: "destructive",
        });
        return;
      }

      // Agrupar respostas por nota (só as que têm valor_numero)
      const respostasAgrupadas = [];
      for (let i = 0; i <= 10; i++) {
        const total = data?.filter(r => r.valor_numero === i).length || 0;
        respostasAgrupadas.push({ nota: i.toString(), total });
      }

      setRespostas(respostasAgrupadas);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar respostas",
        variant: "destructive",
      });
    }
  };

  const adicionarPergunta = () => {
    setPerguntas([...perguntas, { 
      texto: "", 
      tipo_resposta: 'numero', 
      ordem: perguntas.length + 1 
    }]);
  };

  const removerPergunta = (index: number) => {
    if (perguntas.length > 1) {
      const novasPerguntas = perguntas.filter((_, i) => i !== index);
      // Reordenar
      const perguntasReordenadas = novasPerguntas.map((p, i) => ({ ...p, ordem: i + 1 }));
      setPerguntas(perguntasReordenadas);
    }
  };

  const atualizarPergunta = (index: number, campo: keyof Pergunta, valor: any) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index] = { ...novasPerguntas[index], [campo]: valor };
    setPerguntas(novasPerguntas);
  };

  const salvarPesquisa = async () => {
    if (!nome || perguntas.some(p => !p.texto)) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome da pesquisa e todas as perguntas são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Salvar pesquisa
      const { data: pesquisaData, error: pesquisaError } = await supabase
        .from('pesquisas')
        .insert({
          user_id: user?.id,
          nome,
          descricao,
          periodicidade,
          ativa: true
        })
        .select()
        .single();

      if (pesquisaError) {
        toast({
          title: "Erro",
          description: "Erro ao salvar pesquisa",
          variant: "destructive",
        });
        return;
      }

      // Salvar perguntas
      const perguntasParaSalvar = perguntas.map(p => ({
        pesquisa_id: pesquisaData.id,
        texto: p.texto,
        tipo_resposta: p.tipo_resposta,
        ordem: p.ordem
      }));

      const { error: perguntasError } = await supabase
        .from('perguntas')
        .insert(perguntasParaSalvar);

      if (perguntasError) {
        toast({
          title: "Erro",
          description: "Erro ao salvar perguntas",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Pesquisa e perguntas salvas com sucesso!",
      });

      // Limpar campos
      setNome("");
      setDescricao("");
      setPeriodicidade("");
      setPerguntas([{ texto: "", tipo_resposta: 'numero', ordem: 1 }]);

      // Recarregar pesquisas
      carregarPesquisas();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar pesquisa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = (pesquisaId: string) => {
    const link = `${window.location.origin}/responder/${pesquisaId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Link da pesquisa foi copiado para a área de transferência",
    });
  };

  const calcularNPS = () => {
    const totalRespostas = respostas.reduce((acc, r) => acc + r.total, 0);
    if (totalRespostas === 0) return 0;

    const promotores = respostas.filter(r => parseInt(r.nota) >= 9).reduce((acc, r) => acc + r.total, 0);
    const detratores = respostas.filter(r => parseInt(r.nota) <= 6).reduce((acc, r) => acc + r.total, 0);

    return Math.round(((promotores - detratores) / totalRespostas) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">NPS GHAS</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pesquisa" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pesquisa">Gestão de Pesquisas</TabsTrigger>
          <TabsTrigger value="respostas">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Administração</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="pesquisa">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Input 
                placeholder="Nome da Pesquisa" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
              />
              <Textarea 
                placeholder="Descrição da pesquisa (opcional)" 
                value={descricao} 
                onChange={(e) => setDescricao(e.target.value)} 
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Perguntas</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={adicionarPergunta}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </div>

                {perguntas.map((pergunta, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pergunta {index + 1}</span>
                      {perguntas.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removerPergunta(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Digite sua pergunta"
                      value={pergunta.texto}
                      onChange={(e) => atualizarPergunta(index, 'texto', e.target.value)}
                    />
                    <Select
                      value={pergunta.tipo_resposta}
                      onValueChange={(value) => atualizarPergunta(index, 'tipo_resposta', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de resposta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numero">Número (0-10)</SelectItem>
                        <SelectItem value="campo">Campo de texto</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={salvarPesquisa} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Pesquisa'}
              </Button>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Pesquisas Criadas</h3>
                <div className="space-y-3">
                  {pesquisas.length === 0 ? (
                    <p className="text-muted-foreground">Nenhuma pesquisa criada ainda.</p>
                  ) : (
                    pesquisas.map((pesquisa) => (
                      <div key={pesquisa.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{pesquisa.nome}</h4>
                            {pesquisa.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {pesquisa.descricao}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Periodicidade: {pesquisa.periodicidade || 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copiarLink(pesquisa.id)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respostas">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {calcularNPS()}
                  </div>
                  <div className="text-lg font-semibold">NPS Score</div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-4">Distribuição de Notas</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={respostas}>
                  <XAxis dataKey="nota" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 text-sm text-muted-foreground">
                Detratores: 0-6 | Neutros: 7-8 | Promotores: 9-10
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <div className="text-lg font-semibold text-destructive">
                    {respostas.filter(r => parseInt(r.nota) <= 6).reduce((acc, r) => acc + r.total, 0)}
                  </div>
                  <div className="text-sm">Detratores</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-lg font-semibold">
                    {respostas.filter(r => parseInt(r.nota) >= 7 && parseInt(r.nota) <= 8).reduce((acc, r) => acc + r.total, 0)}
                  </div>
                  <div className="text-sm">Neutros</div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="text-lg font-semibold text-primary">
                    {respostas.filter(r => parseInt(r.nota) >= 9).reduce((acc, r) => acc + r.total, 0)}
                  </div>
                  <div className="text-sm">Promotores</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Input placeholder="Logotipo da empresa (URL)" />
              <Input placeholder="Cores principais (hex)" />
              <Input placeholder="Mensagem final personalizada" />
              <Input placeholder="Domínio personalizado (ex: pesquisa.suaempresa.com)" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Função do Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="leitura">Leitura</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full">Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Input placeholder="Chave da API para integração com ERP" />
              <Input placeholder="URL de Webhook (ex: Zapier/Make)" />
              <Button className="w-full">Testar Integração</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
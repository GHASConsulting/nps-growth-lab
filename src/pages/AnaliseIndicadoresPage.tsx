import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2 } from "lucide-react";

interface Pesquisa {
  id: string;
  nome: string;
}

interface Pergunta {
  id: string;
  texto: string;
  tipo_resposta: string;
  is_nome_responsavel: boolean;
  is_instituicao: boolean;
}

interface Resposta {
  id: string;
  pesquisa_id: string;
  pergunta_id: string;
  valor_texto: string | null;
  valor_numero: number | null;
  valor_data: string | null;
  respondido_em: string;
  resposta_grupo_id: string;
}

interface RespostaAgrupada {
  resposta_grupo_id: string;
  respondido_em: string;
  respostas: {
    pergunta: Pergunta;
    resposta: Resposta;
  }[];
  nome_respondente?: string;
  empresa?: string;
}

const AnaliseIndicadoresPage = () => {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [pesquisaSelecionada, setPesquisaSelecionada] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [respostasAgrupadas, setRespostasAgrupadas] = useState<RespostaAgrupada[]>([]);
  const [perguntasGpt, setPerguntasGpt] = useState<Pergunta[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviandoIds, setEnviandoIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    buscarPesquisas();
  }, []);

  useEffect(() => {
    if (pesquisaSelecionada && dataFiltro) {
      buscarRespostas();
    } else {
      setRespostasAgrupadas([]);
      setPerguntasGpt([]);
    }
  }, [pesquisaSelecionada, dataFiltro]);

  const buscarPesquisas = async () => {
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setPesquisas(data || []);
    } catch (error) {
      console.error('Erro ao buscar pesquisas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pesquisas",
        variant: "destructive",
      });
    }
  };

  const buscarRespostas = async () => {
    setCarregando(true);
    try {
      // Buscar perguntas com enviar_para_gpt = true
      const { data: perguntasData, error: perguntasError } = await supabase
        .from('perguntas')
        .select('*')
        .eq('pesquisa_id', pesquisaSelecionada)
        .eq('enviar_para_gpt', true);

      if (perguntasError) throw perguntasError;

      if (!perguntasData || perguntasData.length === 0) {
        setPerguntasGpt([]);
        setRespostasAgrupadas([]);
        toast({
          title: "Informação",
          description: "Nenhuma pergunta marcada para envio ao GPT nesta pesquisa",
        });
        setCarregando(false);
        return;
      }

      setPerguntasGpt(perguntasData);

      // Buscar todas as perguntas para identificar nome_responsavel e instituicao
      const { data: todasPerguntas, error: todasPerguntasError } = await supabase
        .from('perguntas')
        .select('*')
        .eq('pesquisa_id', pesquisaSelecionada);

      if (todasPerguntasError) throw todasPerguntasError;

      // Buscar respostas filtradas por data
      const dataInicio = new Date(dataFiltro);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(dataFiltro);
      dataFim.setHours(23, 59, 59, 999);

      const { data: respostasData, error: respostasError } = await supabase
        .from('respostas')
        .select('*')
        .eq('pesquisa_id', pesquisaSelecionada)
        .gte('respondido_em', dataInicio.toISOString())
        .lte('respondido_em', dataFim.toISOString());

      if (respostasError) throw respostasError;

      if (!respostasData || respostasData.length === 0) {
        setRespostasAgrupadas([]);
        toast({
          title: "Informação",
          description: "Nenhuma resposta encontrada para esta data",
        });
        setCarregando(false);
        return;
      }

      // Agrupar respostas por resposta_grupo_id
      const grupos = new Map<string, RespostaAgrupada>();

      for (const resposta of respostasData) {
        if (!grupos.has(resposta.resposta_grupo_id)) {
          grupos.set(resposta.resposta_grupo_id, {
            resposta_grupo_id: resposta.resposta_grupo_id,
            respondido_em: resposta.respondido_em,
            respostas: [],
          });
        }

        const pergunta = todasPerguntas?.find(p => p.id === resposta.pergunta_id);
        if (pergunta) {
          const grupo = grupos.get(resposta.resposta_grupo_id)!;
          
          // Verificar se é nome do responsável ou instituição
          if (pergunta.is_nome_responsavel) {
            grupo.nome_respondente = resposta.valor_texto || undefined;
          }
          if (pergunta.is_instituicao) {
            grupo.empresa = resposta.valor_texto || undefined;
          }

          // Adicionar apenas respostas de perguntas marcadas para GPT
          if (pergunta.enviar_para_gpt) {
            grupo.respostas.push({
              pergunta,
              resposta,
            });
          }
        }
      }

      // Filtrar grupos que têm pelo menos uma resposta de pergunta GPT
      const gruposFiltrados = Array.from(grupos.values())
        .filter(g => g.respostas.length > 0)
        .sort((a, b) => new Date(b.respondido_em).getTime() - new Date(a.respondido_em).getTime());

      setRespostasAgrupadas(gruposFiltrados);
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar respostas",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const solicitarAvaliacao = async (grupo: RespostaAgrupada, respostaItem: { pergunta: Pergunta; resposta: Resposta }) => {
    const chave = `${grupo.resposta_grupo_id}-${respostaItem.resposta.id}`;
    
    // Buscar webhook URL do localStorage
    const integracoes = localStorage.getItem('integracoes');
    let webhookUrl = '';
    
    if (integracoes) {
      try {
        const parsed = JSON.parse(integracoes);
        webhookUrl = parsed.webhookUrl || '';
      } catch (e) {
        console.error('Erro ao parsear integrações:', e);
      }
    }

    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Configure o Webhook na aba Integração antes de solicitar avaliação",
        variant: "destructive",
      });
      return;
    }

    setEnviandoIds(prev => new Set(prev).add(chave));

    try {
      const payload = {
        resposta_id: respostaItem.resposta.id,
        pergunta_id: respostaItem.pergunta.id,
        resposta_texto: respostaItem.resposta.valor_texto || 
                       respostaItem.resposta.valor_numero?.toString() || 
                       respostaItem.resposta.valor_data || '',
        nome_respondente: grupo.nome_respondente || '',
        empresa: grupo.empresa || '',
        pesquisa_id: pesquisaSelecionada,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(payload),
      });

      toast({
        title: "Enviado",
        description: "Solicitação enviada para avaliação do GPT",
      });
    } catch (error) {
      console.error('Erro ao enviar para webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar solicitação",
        variant: "destructive",
      });
    } finally {
      setEnviandoIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(chave);
        return newSet;
      });
    }
  };

  const formatarResposta = (resposta: Resposta) => {
    if (resposta.valor_texto) return resposta.valor_texto;
    if (resposta.valor_numero !== null) return resposta.valor_numero.toString();
    if (resposta.valor_data) return new Date(resposta.valor_data).toLocaleDateString('pt-BR');
    return '-';
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Análise de Indicadores</h1>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pesquisa</label>
                <Select value={pesquisaSelecionada} onValueChange={setPesquisaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pesquisa" />
                  </SelectTrigger>
                  <SelectContent>
                    {pesquisas.map((pesquisa) => (
                      <SelectItem key={pesquisa.id} value={pesquisa.id}>
                        {pesquisa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <Input
                  type="date"
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!pesquisaSelecionada || !dataFiltro ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Selecione uma pesquisa e uma data para visualizar as respostas
              </p>
            </CardContent>
          </Card>
        ) : carregando ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando respostas...</span>
              </div>
            </CardContent>
          </Card>
        ) : respostasAgrupadas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground py-8">
                Nenhuma resposta encontrada com perguntas marcadas para GPT
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {respostasAgrupadas.length} resposta(s) encontrada(s) • 
              {perguntasGpt.length} pergunta(s) marcada(s) para análise GPT
            </p>

            {respostasAgrupadas.map((grupo) => (
              <Card key={grupo.resposta_grupo_id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {grupo.nome_respondente || 'Respondente não identificado'}
                      </CardTitle>
                      {grupo.empresa && (
                        <p className="text-sm text-muted-foreground">{grupo.empresa}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(grupo.respondido_em).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {grupo.respostas.map(({ pergunta, resposta }) => {
                    const chave = `${grupo.resposta_grupo_id}-${resposta.id}`;
                    const enviando = enviandoIds.has(chave);

                    return (
                      <div key={resposta.id} className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          {pergunta.texto}
                        </p>
                        <p className="text-base mb-3">{formatarResposta(resposta)}</p>
                        <Button
                          size="sm"
                          onClick={() => solicitarAvaliacao(grupo, { pergunta, resposta })}
                          disabled={enviando}
                        >
                          {enviando ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Solicitar Avaliação
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaliseIndicadoresPage;

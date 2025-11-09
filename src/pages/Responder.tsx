import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Pesquisa {
  id: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
}

interface Pergunta {
  id: string;
  pesquisa_id: string;
  texto: string;
  tipo_resposta: 'numero' | 'campo' | 'data' | 'texto_numerico';
  ordem: number;
}

export default function Responder() {
  const { pesquisaId } = useParams<{ pesquisaId: string }>();
  const { toast } = useToast();
  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (pesquisaId) {
      buscarPesquisaEPerguntas();
    }
  }, [pesquisaId]);

  const buscarPesquisaEPerguntas = async () => {
    try {
      // Buscar pesquisa
      const { data: pesquisaData, error: pesquisaError } = await supabase
        .from('pesquisas')
        .select('id, nome, descricao, ativa')
        .eq('id', pesquisaId)
        .eq('ativa', true)
        .single();

      if (pesquisaError || !pesquisaData) {
        toast({
          title: "Erro",
          description: "Pesquisa não encontrada",
          variant: "destructive",
        });
        return;
      }

      setPesquisa(pesquisaData);

      // Buscar perguntas
      const { data: perguntasData, error: perguntasError } = await supabase
        .from('perguntas')
        .select('*')
        .eq('pesquisa_id', pesquisaId)
        .order('ordem', { ascending: true });

      if (perguntasError) {
        toast({
          title: "Erro",
          description: "Erro ao carregar perguntas",
          variant: "destructive",
        });
        return;
      }

      setPerguntas((perguntasData || []) as Pergunta[]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar pesquisa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarResposta = (perguntaId: string, valor: any) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: valor
    }));
  };

  const validarRespostas = () => {
    for (const pergunta of perguntas) {
      const resposta = respostas[pergunta.id];
      if (!resposta && pergunta.tipo_resposta !== 'campo') {
        return false;
      }
      if (pergunta.tipo_resposta === 'numero') {
        const numero = parseInt(resposta);
        if (isNaN(numero) || numero < 0 || numero > 10) {
          return false;
        }
      }
    }
    return true;
  };

  const enviarRespostas = async () => {
    if (!validarRespostas()) {
      toast({
        title: "Atenção",
        description: "Por favor, responda todas as perguntas obrigatórias",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const respostasParaEnviar = perguntas.map(pergunta => {
        const valor = respostas[pergunta.id];
        const resposta: any = {
          pesquisa_id: pesquisaId,
          pergunta_id: pergunta.id,
          canal: 'web'
        };

        switch (pergunta.tipo_resposta) {
          case 'numero':
            resposta.valor_numero = parseInt(valor) || null;
            break;
          case 'campo':
            resposta.valor_texto = valor || null;
            break;
          case 'texto_numerico':
            resposta.valor_texto = valor || null;
            break;
          case 'data':
            resposta.valor_data = valor || null;
            break;
        }

        return resposta;
      });

      const { error } = await supabase
        .from('respostas')
        .insert(respostasParaEnviar);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao enviar respostas",
          variant: "destructive",
        });
        return;
      }

      setEnviado(true);
      toast({
        title: "Obrigado!",
        description: "Suas respostas foram enviadas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar respostas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderizarCampoPergunta = (pergunta: Pergunta) => {
    const valor = respostas[pergunta.id] || '';

    switch (pergunta.tipo_resposta) {
      case 'numero':
        return (
          <div>
            <div className="flex justify-center space-x-2 mb-6">
              {Array.from({ length: 11 }, (_, i) => (
                <Button
                  key={i}
                  variant={parseInt(valor) === i ? "default" : "outline"}
                  className="w-12 h-12"
                  onClick={() => atualizarResposta(pergunta.id, i.toString())}
                >
                  {i}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mb-6">
              <span>Muito improvável</span>
              <span>Muito provável</span>
            </div>
          </div>
        );
      
      case 'campo':
        return (
          <Textarea
            placeholder="Sua resposta (opcional)"
            value={valor}
            onChange={(e) => atualizarResposta(pergunta.id, e.target.value)}
            className="min-h-[100px]"
          />
        );
      
      case 'texto_numerico':
        return (
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Digite apenas números"
            value={valor}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^0-9]/g, '');
              atualizarResposta(pergunta.id, numericValue);
            }}
          />
        );
      
      case 'data':
        return (
          <Input
            type="date"
            value={valor}
            onChange={(e) => atualizarResposta(pergunta.id, e.target.value)}
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!pesquisa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Pesquisa não encontrada</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Obrigado!</h2>
            <p>Suas respostas foram registradas com sucesso.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">{pesquisa.nome}</CardTitle>
          {pesquisa.descricao && (
            <p className="text-center text-muted-foreground">{pesquisa.descricao}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {perguntas.map((pergunta, index) => (
            <div key={pergunta.id}>
              <h3 className="text-lg font-medium mb-4">
                {index + 1}. {pergunta.texto}
              </h3>
              {renderizarCampoPergunta(pergunta)}
            </div>
          ))}

          <Button 
            onClick={enviarRespostas} 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar Respostas'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logoAva from '@/assets/logo-ava.png';
import logoGhas from '@/assets/logo-ghas.png';

interface Pesquisa {
  id: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
  categoria?: string;
}

interface Pergunta {
  id: string;
  pesquisa_id: string;
  texto: string;
  tipo_resposta: 'numero' | 'campo' | 'data' | 'texto_numerico' | 'radio' | 'checkbox';
  ordem: number;
  opcoes?: string[];
  obrigatoria: boolean;
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
        .select('id, nome, descricao, ativa, categoria')
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
      
      // Se a pergunta é obrigatória, verificar se há resposta
      if (pergunta.obrigatoria) {
        if (!resposta || (Array.isArray(resposta) && resposta.length === 0)) {
          return false;
        }
      }
      
      // Validação específica para tipo número
      if (pergunta.tipo_resposta === 'numero' && resposta) {
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
          case 'radio':
            resposta.valor_texto = valor || null;
            break;
          case 'checkbox':
            resposta.valor_texto = Array.isArray(valor) ? valor.join(', ') : null;
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

  const getNpsColor = (index: number) => {
    const colors = [
      'hsl(0, 70%, 45%)',    // 0 - Vermelho escuro
      'hsl(10, 75%, 50%)',   // 1 - Vermelho
      'hsl(20, 80%, 55%)',   // 2 - Laranja avermelhado
      'hsl(30, 85%, 55%)',   // 3 - Laranja
      'hsl(40, 90%, 55%)',   // 4 - Laranja amarelado
      'hsl(48, 95%, 55%)',   // 5 - Amarelo
      'hsl(54, 95%, 60%)',   // 6 - Amarelo claro
      'hsl(65, 70%, 65%)',   // 7 - Amarelo esverdeado claro
      'hsl(75, 60%, 60%)',   // 8 - Verde amarelado
      'hsl(85, 55%, 55%)',   // 9 - Verde claro
      'hsl(95, 50%, 50%)',   // 10 - Verde
    ];
    return colors[index];
  };

  const renderizarCampoPergunta = (pergunta: Pergunta) => {
    const valor = respostas[pergunta.id] || '';
    const isNPS = pesquisa?.categoria?.toLowerCase().includes('nps');

    switch (pergunta.tipo_resposta) {
      case 'numero':
        return (
          <div>
            <div className="flex justify-center space-x-2 mb-6">
              {Array.from({ length: 11 }, (_, i) => {
                const isSelected = parseInt(valor) === i;
                const npsColor = isNPS ? getNpsColor(i) : undefined;
                
                return (
                  <Button
                    key={i}
                    variant={isSelected ? "default" : "outline"}
                    className="w-12 h-12 font-bold text-white border-2"
                    style={isNPS && !isSelected ? {
                      backgroundColor: npsColor,
                      borderColor: npsColor,
                      color: 'white'
                    } : isNPS && isSelected ? {
                      backgroundColor: npsColor,
                      borderColor: 'hsl(var(--foreground))',
                      color: 'white',
                      boxShadow: '0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--foreground))'
                    } : undefined}
                    onClick={() => atualizarResposta(pergunta.id, i.toString())}
                  >
                    {i}
                  </Button>
                );
              })}
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
      
      case 'radio':
        return (
          <RadioGroup value={valor} onValueChange={(value) => atualizarResposta(pergunta.id, value)}>
            <div className="space-y-3">
              {(pergunta.opcoes || []).map((opcao, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={opcao} id={`${pergunta.id}-${index}`} />
                  <Label htmlFor={`${pergunta.id}-${index}`} className="cursor-pointer">
                    {opcao}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );
      
      case 'checkbox':
        const checkboxValues = Array.isArray(valor) ? valor : [];
        return (
          <div className="space-y-3">
            {(pergunta.opcoes || []).map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${pergunta.id}-${index}`}
                  checked={checkboxValues.includes(opcao)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, opcao]
                      : checkboxValues.filter((v: string) => v !== opcao);
                    atualizarResposta(pergunta.id, newValues);
                  }}
                />
                <Label htmlFor={`${pergunta.id}-${index}`} className="cursor-pointer">
                  {opcao}
                </Label>
              </div>
            ))}
          </div>
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
    <div className="min-h-screen bg-background p-4">
      {/* Logo GHAS no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-50">
        <img src={logoGhas} alt="GHAS Tecnologia" className="h-12 md:h-16" />
      </div>
      
      <div className="flex justify-center py-6">
        <img src={logoAva} alt="AVA - Assistente Virtual de Atendimento" className="h-16" />
      </div>
      <div className="flex items-center justify-center">
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
                {pergunta.obrigatoria && <span className="text-red-600 ml-1 font-bold">*</span>}
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
    </div>
  );
}
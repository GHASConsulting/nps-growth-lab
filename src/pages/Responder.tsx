import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Pesquisa {
  id: string;
  nome: string;
  pergunta: string;
  agradecimento: string;
  followup: string;
  ativa: boolean;
}

export default function Responder() {
  const { pesquisaId } = useParams<{ pesquisaId: string }>();
  const [pesquisa, setPesquisa] = useState<Pesquisa | null>(null);
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (pesquisaId) {
      buscarPesquisa();
    }
  }, [pesquisaId]);

  const buscarPesquisa = async () => {
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('id, nome, pergunta, agradecimento, followup, ativa')
        .eq('id', pesquisaId)
        .eq('ativa', true)
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Pesquisa não encontrada",
          variant: "destructive",
        });
        return;
      }

      setPesquisa(data);
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

  const enviarResposta = async () => {
    if (nota === null) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione uma nota",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('respostas')
        .insert({
          pesquisa_id: pesquisaId,
          nota: nota,
          comentario: comentario || null,
          canal: 'web'
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao enviar resposta",
          variant: "destructive",
        });
        return;
      }

      setEnviado(true);
      toast({
        title: "Obrigado!",
        description: "Sua resposta foi enviada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <p>{pesquisa.agradecimento || 'Sua resposta foi registrada com sucesso.'}</p>
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{pesquisa.pergunta}</h3>
            
            <div className="flex justify-center space-x-2 mb-6">
              {Array.from({ length: 11 }, (_, i) => (
                <Button
                  key={i}
                  variant={nota === i ? "default" : "outline"}
                  className="w-12 h-12"
                  onClick={() => setNota(i)}
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

          {pesquisa.followup && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {pesquisa.followup}
              </label>
              <Textarea
                placeholder="Seu comentário (opcional)"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <Button 
            onClick={enviarResposta} 
            className="w-full"
            disabled={loading || nota === null}
          >
            {loading ? 'Enviando...' : 'Enviar Resposta'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
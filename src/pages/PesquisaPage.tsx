import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

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
  tipo_resposta: string;
  ordem: number;
}

interface Categoria {
  id: string;
  nome: string;
  is_nps: boolean;
}

const PesquisaPage = () => {
  const [nome, setNome] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [agradecimento, setAgradecimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");
  const [perguntaTexto, setPerguntaTexto] = useState("");
  const [tipoPergunta, setTipoPergunta] = useState("numero");
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const [novaOpcao, setNovaOpcao] = useState("");
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [pesquisaSelecionada, setPesquisaSelecionada] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editandoPerguntaId, setEditandoPerguntaId] = useState<string | null>(null);
  const [filtroNome, setFiltroNome] = useState("");
  const [mostrarCriarPesquisa, setMostrarCriarPesquisa] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    buscarPesquisas();
    buscarCategorias();
  }, []);

  const buscarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  useEffect(() => {
    if (pesquisaSelecionada) {
      buscarPerguntas(pesquisaSelecionada);
    }
  }, [pesquisaSelecionada]);

  const buscarPesquisas = async () => {
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('*')
        .order('created_at', { ascending: false });

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

  const buscarPerguntas = async (pesquisaId: string) => {
    try {
      const { data, error } = await supabase
        .from('perguntas')
        .select('*')
        .eq('pesquisa_id', pesquisaId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setPerguntas(data || []);
    } catch (error) {
      console.error('Erro ao buscar perguntas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perguntas",
        variant: "destructive",
      });
    }
  };

  const criarPesquisa = async () => {
    if (!nome) {
      toast({
        title: "Erro",
        description: "Nome da pesquisa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .insert({
          nome,
          categoria,
          descricao: agradecimento,
          periodicidade,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setPesquisas([data, ...pesquisas]);
      setNome("");
      setCategoria("");
      setAgradecimento("");
      setPeriodicidade("");
      
      toast({
        title: "Sucesso",
        description: "Pesquisa criada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar pesquisa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pesquisa",
        variant: "destructive",
      });
    }
  };

  const adicionarOpcao = () => {
    if (!novaOpcao.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma opção",
        variant: "destructive",
      });
      return;
    }
    setOpcoes([...opcoes, novaOpcao.trim()]);
    setNovaOpcao("");
  };

  const removerOpcao = (index: number) => {
    setOpcoes(opcoes.filter((_, i) => i !== index));
  };

  const adicionarPergunta = async () => {
    if (!perguntaTexto || !pesquisaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma pesquisa e digite a pergunta",
        variant: "destructive",
      });
      return;
    }

    if ((tipoPergunta === 'radio' || tipoPergunta === 'checkbox') && opcoes.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma opção para este tipo de pergunta",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editandoPerguntaId) {
        // Atualizar pergunta existente
        const { data, error } = await supabase
          .from('perguntas')
          .update({
            texto: perguntaTexto,
            tipo_resposta: tipoPergunta,
            opcoes: (tipoPergunta === 'radio' || tipoPergunta === 'checkbox') ? opcoes : []
          })
          .eq('id', editandoPerguntaId)
          .select()
          .single();

        if (error) throw error;

        setPerguntas(perguntas.map(p => p.id === editandoPerguntaId ? data : p));
        toast({
          title: "Sucesso",
          description: "Pergunta atualizada com sucesso!",
        });
      } else {
        // Adicionar nova pergunta
        const { data, error } = await supabase
          .from('perguntas')
          .insert({
            pesquisa_id: pesquisaSelecionada,
            texto: perguntaTexto,
            tipo_resposta: tipoPergunta,
            ordem: perguntas.length + 1,
            opcoes: (tipoPergunta === 'radio' || tipoPergunta === 'checkbox') ? opcoes : []
          })
          .select()
          .single();

        if (error) throw error;

        setPerguntas([...perguntas, data]);
        toast({
          title: "Sucesso",
          description: "Pergunta adicionada com sucesso!",
        });
      }

      setPerguntaTexto("");
      setOpcoes([]);
      setEditandoPerguntaId(null);
    } catch (error) {
      console.error('Erro ao salvar pergunta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pergunta",
        variant: "destructive",
      });
    }
  };

  const prepararEdicao = (pergunta: Pergunta) => {
    setPerguntaTexto(pergunta.texto);
    setTipoPergunta(pergunta.tipo_resposta);
    setOpcoes((pergunta as any).opcoes || []);
    setEditandoPerguntaId(pergunta.id);
  };

  const cancelarEdicao = () => {
    setPerguntaTexto("");
    setOpcoes([]);
    setEditandoPerguntaId(null);
    setTipoPergunta("numero");
  };

  const deletarPergunta = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta pergunta?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('perguntas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPerguntas(perguntas.filter(p => p.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Pergunta deletada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar pergunta:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar pergunta",
        variant: "destructive",
      });
    }
  };

  const deletarPesquisa = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta pesquisa e todas as suas perguntas?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pesquisas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPesquisas(pesquisas.filter(p => p.id !== id));
      if (pesquisaSelecionada === id) {
        setPesquisaSelecionada("");
        setPerguntas([]);
      }
      
      toast({
        title: "Sucesso",
        description: "Pesquisa deletada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao deletar pesquisa:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar pesquisa",
        variant: "destructive",
      });
    }
  };

  const pesquisasFiltradas = pesquisas.filter(p => 
    p.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  const copiarLinkResposta = () => {
    if (!pesquisaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma pesquisa primeiro",
        variant: "destructive",
      });
      return;
    }

    const link = `${window.location.origin}/responder/${pesquisaSelecionada}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Sucesso",
      description: "Link copiado para a área de transferência!",
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Gestão de Pesquisas</h1>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pesquisas Cadastradas</h2>
              <Button 
                onClick={() => setMostrarCriarPesquisa(!mostrarCriarPesquisa)}
              >
                {mostrarCriarPesquisa ? "Ver Pesquisas" : "Criar Nova Pesquisa"}
              </Button>
            </div>

            {!mostrarCriarPesquisa ? (
              <div className="space-y-4">
                <Input 
                  placeholder="Filtrar por nome..." 
                  value={filtroNome} 
                  onChange={(e) => setFiltroNome(e.target.value)} 
                />
                
                {pesquisasFiltradas.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma pesquisa encontrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pesquisasFiltradas.map((pesquisa) => (
                      <div key={pesquisa.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-semibold">{pesquisa.nome}</p>
                          {pesquisa.descricao && (
                            <p className="text-sm text-muted-foreground">{pesquisa.descricao}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Status: {pesquisa.ativa ? "Ativa" : "Inativa"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPesquisaSelecionada(pesquisa.id);
                              toast({
                                title: "Pesquisa selecionada",
                                description: "Agora você pode adicionar perguntas a esta pesquisa",
                              });
                            }}
                          >
                            Selecionar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deletarPesquisa(pesquisa.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Criar Nova Pesquisa</h3>
                <Input placeholder="Nome da Pesquisa" value={nome} onChange={(e) => setNome(e.target.value)} />
                <Textarea placeholder="Pergunta de Follow-up" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
                <Textarea placeholder="Mensagem de Agradecimento" value={agradecimento} onChange={(e) => setAgradecimento(e.target.value)} />
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.nome} {cat.is_nps && '(NPS)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={periodicidade} onValueChange={setPeriodicidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Periodicidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => {
                  criarPesquisa();
                  setMostrarCriarPesquisa(false);
                }}>Criar Pesquisa</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold">Adicionar Perguntas</h2>
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
            <Input placeholder="Texto da Pergunta" value={perguntaTexto} onChange={(e) => setPerguntaTexto(e.target.value)} />
            <Select value={tipoPergunta} onValueChange={(valor) => {
              setTipoPergunta(valor);
              setOpcoes([]);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Resposta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numero">Número (0-10)</SelectItem>
                <SelectItem value="campo">Texto</SelectItem>
                <SelectItem value="texto_numerico">Texto Numérico</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="radio">Seleção Única (Radio)</SelectItem>
                <SelectItem value="checkbox">Seleção Múltipla (Checkbox)</SelectItem>
              </SelectContent>
            </Select>

            {(tipoPergunta === 'radio' || tipoPergunta === 'checkbox') && (
              <div className="space-y-2 p-4 border rounded-lg">
                <h3 className="font-semibold">Alternativas</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma alternativa"
                    value={novaOpcao}
                    onChange={(e) => setNovaOpcao(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && adicionarOpcao()}
                  />
                  <Button type="button" onClick={adicionarOpcao} variant="outline">
                    Adicionar
                  </Button>
                </div>
                {opcoes.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {opcoes.map((opcao, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{opcao}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerOpcao(index)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={adicionarPergunta}>
                {editandoPerguntaId ? "Atualizar Pergunta" : "Adicionar Pergunta"}
              </Button>
              {editandoPerguntaId && (
                <Button variant="outline" onClick={cancelarEdicao}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold">Link de Resposta</h2>
            <Button onClick={copiarLinkResposta} disabled={!pesquisaSelecionada}>
              Copiar Link de Resposta
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold">Perguntas da Pesquisa</h2>
            {perguntas.map((pergunta) => (
              <div key={pergunta.id} className="p-4 border rounded-lg flex justify-between items-start">
                <div className="flex-1">
                  <p><strong>Pergunta:</strong> {pergunta.texto}</p>
                  <p><strong>Tipo:</strong> {pergunta.tipo_resposta}</p>
                  <p><strong>Ordem:</strong> {pergunta.ordem}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => prepararEdicao(pergunta)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deletarPergunta(pergunta.id)}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PesquisaPage;
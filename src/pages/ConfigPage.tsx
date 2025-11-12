import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

interface Categoria {
  id: string;
  nome: string;
  is_nps: boolean;
}

const ConfigPage = () => {
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#5a89a3");
  const [corSecundaria, setCorSecundaria] = useState("#ffffff");
  const [mensagemFinal, setMensagemFinal] = useState("");
  const [permissaoUsuario, setPermissaoUsuario] = useState("");
  const [dominioPersonalizado, setDominioPersonalizado] = useState("");
  
  // Estados para categorias
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [isNPS, setIsNPS] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    buscarCategorias();
  }, []);

  const buscarCategorias = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
    } else {
      setCategorias(data || []);
    }
  };

  const criarCategoria = async () => {
    if (!nomeCategoria.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório!",
        variant: "destructive",
      });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado!",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('categorias')
      .insert([{
        nome: nomeCategoria,
        is_nps: isNPS,
        user_id: userData.user.id
      }]);

    if (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria!",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
      setNomeCategoria("");
      setIsNPS(false);
      buscarCategorias();
    }
  };

  const excluirCategoria = async (id: string) => {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria!",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });
      buscarCategorias();
    }
  };

  const salvarConfiguracoes = () => {
    // Aqui você pode implementar a lógica para salvar as configurações no Supabase
    localStorage.setItem('config', JSON.stringify({
      logoUrl,
      corPrimaria,
      corSecundaria,
      mensagemFinal,
      permissaoUsuario,
      dominioPersonalizado
    }));

    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso!",
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Administração</h1>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">URL do Logotipo</label>
                  <Input 
                    placeholder="https://exemplo.com/logo.png" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Domínio Personalizado</label>
                  <Input 
                    placeholder="pesquisa.minhaempresa.com" 
                    value={dominioPersonalizado} 
                    onChange={(e) => setDominioPersonalizado(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personalização Visual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cor Primária</label>
                  <Input 
                    type="color" 
                    value={corPrimaria} 
                    onChange={(e) => setCorPrimaria(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cor Secundária</label>
                  <Input 
                    type="color" 
                    value={corSecundaria} 
                    onChange={(e) => setCorSecundaria(e.target.value)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mensagem Final Personalizada</label>
                <Textarea 
                  placeholder="Obrigado por participar da nossa pesquisa!" 
                  value={mensagemFinal} 
                  onChange={(e) => setMensagemFinal(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gerenciamento de Usuários</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Permissão de Usuário</label>
                <Select value={permissaoUsuario} onValueChange={setPermissaoUsuario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Somente Leitura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cadastro de Categorias</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome da Categoria</label>
                    <Input 
                      placeholder="Nome da categoria" 
                      value={nomeCategoria} 
                      onChange={(e) => setNomeCategoria(e.target.value)} 
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox 
                      id="isNPS" 
                      checked={isNPS} 
                      onCheckedChange={(checked) => setIsNPS(checked as boolean)} 
                    />
                    <label htmlFor="isNPS" className="text-sm font-medium">
                      Categoria NPS
                    </label>
                  </div>
                </div>
                <Button onClick={criarCategoria}>
                  Adicionar Categoria
                </Button>
                
                {categorias.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Categorias Cadastradas:</h4>
                    <div className="space-y-2">
                      {categorias.map((categoria) => (
                        <div key={categoria.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span>{categoria.nome}</span>
                            {categoria.is_nps && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                NPS
                              </span>
                            )}
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => excluirCategoria(categoria.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações de Notificação</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Notificar por e-mail quando receber novas respostas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Relatório semanal de pesquisas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Alertas de baixo NPS</span>
                </label>
              </div>
            </div>

            <Button className="w-full" onClick={salvarConfiguracoes}>
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigPage;
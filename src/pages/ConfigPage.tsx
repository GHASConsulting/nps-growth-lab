import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Trash2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Categoria {
  id: string;
  nome: string;
  is_nps: boolean;
}

interface Usuario {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

const ConfigPage = () => {
  // Estados para categorias
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [isNPS, setIsNPS] = useState(false);
  
  // Estados para usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [buscarNome, setBuscarNome] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [senhaUsuario, setSenhaUsuario] = useState("");
  const [permissaoUsuario, setPermissaoUsuario] = useState<'admin' | 'user'>('user');
  
  const { toast } = useToast();

  useEffect(() => {
    buscarCategorias();
    buscarUsuarios();
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

  const buscarUsuarios = async () => {
    // Buscar profiles com seus roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        created_at,
        user_roles (
          role
        )
      `);

    if (profilesError) {
      console.error('Erro ao buscar profiles:', profilesError);
      toast({
        title: "Erro",
        description: "Erro ao buscar usuários!",
        variant: "destructive",
      });
      return;
    }

    // Para cada profile, buscar o email do usuário
    const usuariosCompletos: Usuario[] = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: user?.email || '',
          role: profile.user_roles?.[0]?.role || 'user',
          created_at: profile.created_at
        };
      })
    );

    setUsuarios(usuariosCompletos);
  };

  const criarUsuario = async () => {
    if (!nomeUsuario.trim() || !emailUsuario.trim() || !senhaUsuario.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios!",
        variant: "destructive",
      });
      return;
    }

    // Chamar edge function para criar usuário
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: emailUsuario,
        password: senhaUsuario,
        full_name: nomeUsuario,
        role: permissaoUsuario
      }
    });

    if (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário!",
        variant: "destructive",
      });
      return;
    }

    if (data?.error) {
      toast({
        title: "Erro",
        description: data.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso!",
    });

    setNomeUsuario("");
    setEmailUsuario("");
    setSenhaUsuario("");
    setPermissaoUsuario('user');
    buscarUsuarios();
  };

  const excluirUsuario = async (id: string) => {
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário!",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
      buscarUsuarios();
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.full_name.toLowerCase().includes(buscarNome.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-primary text-primary-foreground py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Administração</h1>
          <Link to="/">
            <Button variant="secondary">Voltar</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Gestão de Usuários */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Cadastro de Usuários
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Usuário</label>
                  <Input 
                    placeholder="João Silva" 
                    value={nomeUsuario} 
                    onChange={(e) => setNomeUsuario(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">E-mail</label>
                  <Input 
                    type="email"
                    placeholder="usuario@exemplo.com" 
                    value={emailUsuario} 
                    onChange={(e) => setEmailUsuario(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Senha</label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={senhaUsuario} 
                    onChange={(e) => setSenhaUsuario(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Permissão</label>
                  <Select value={permissaoUsuario} onValueChange={(value: 'admin' | 'user') => setPermissaoUsuario(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={criarUsuario} className="w-full md:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Usuário
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Search className="w-5 h-5" />
                Usuários Cadastrados
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome..." 
                  value={buscarNome} 
                  onChange={(e) => setBuscarNome(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuariosFiltrados.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">{usuario.full_name}</TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usuario.role === 'admin' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-secondary/50 text-secondary-foreground'
                            }`}>
                              {usuario.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirUsuario(usuario.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cadastro de Categorias */}
        <Card>
          <CardContent className="space-y-6 pt-6">
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
                    <label 
                      htmlFor="isNPS" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Categoria NPS
                    </label>
                  </div>
                </div>
                <Button onClick={criarCategoria} className="w-full md:w-auto">
                  Criar Categoria
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-semibold mb-4">Categorias Cadastradas</h4>
                {categorias.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma categoria cadastrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {categorias.map((categoria) => (
                      <div 
                        key={categoria.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div>
                          <span className="font-medium">{categoria.nome}</span>
                          {categoria.is_nps && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              NPS
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => excluirCategoria(categoria.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigPage;
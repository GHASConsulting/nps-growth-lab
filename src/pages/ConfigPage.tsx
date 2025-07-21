import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ConfigPage = () => {
  const [logoUrl, setLogoUrl] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#5a89a3");
  const [corSecundaria, setCorSecundaria] = useState("#ffffff");
  const [mensagemFinal, setMensagemFinal] = useState("");
  const [permissaoUsuario, setPermissaoUsuario] = useState("");
  const [dominioPersonalizado, setDominioPersonalizado] = useState("");
  const { toast } = useToast();

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
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <nav className="flex space-x-6 mb-8 border-b pb-4">
          <Link to="/pesquisas" className="text-black hover:underline hover:text-gray-600">
            Gestão de Pesquisa
          </Link>
          <Link to="/dashboard" className="text-black hover:underline hover:text-gray-600">
            Dashboard
          </Link>
          <Link to="/integracoes" className="text-black hover:underline hover:text-gray-600">
            Integração
          </Link>
        </nav>
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

            <Button className="w-full bg-[#5a89a3] text-white" onClick={salvarConfiguracoes}>
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigPage;
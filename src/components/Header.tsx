import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoAva from "@/assets/logo-ava.png";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/auth");
  };

  return (
    <header className="bg-white border-b border-border py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img src={logoAva} alt="AVA - Assistente Virtual de Atendimento" className="h-12" />
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link to="/pesquisas" className="text-foreground hover:text-primary transition-colors">
            Gestão de Pesquisa
          </Link>
          <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link to="/config" className="text-foreground hover:text-primary transition-colors">
            Administração
          </Link>
          <Link to="/integracoes" className="text-foreground hover:text-primary transition-colors">
            Integração
          </Link>
          
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

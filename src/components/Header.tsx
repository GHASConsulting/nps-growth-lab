import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

interface MenuGroup {
  id: string;
  label: string;
  defaultPath: string;
  paths: string[];
}

const menuGroups: MenuGroup[] = [
  {
    id: "gestao-pesquisa",
    label: "Gestão de Pesquisa",
    defaultPath: "/pesquisa",
    paths: ["/pesquisa", "/dashboard"],
  },
  {
    id: "administracao",
    label: "Administração",
    defaultPath: "/config",
    paths: ["/config", "/integracoes"],
  },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/auth");
  };

  const handleMenuClick = (group: MenuGroup) => {
    // Verificar se já estamos em alguma rota deste grupo
    const isInGroup = group.paths.some(path => location.pathname.startsWith(path));
    
    if (isInGroup) {
      // Se já estamos no grupo, não fazer nada (a SecondaryNav já está visível)
      return;
    }
    
    // Recuperar último submenu usado deste grupo
    const lastSubTab = localStorage.getItem(`lastSubTab:${group.id}`);
    
    // Navegar para o último submenu usado ou para o primeiro item
    const targetPath = lastSubTab || group.defaultPath;
    navigate(targetPath);
  };

  const isGroupActive = (group: MenuGroup) => {
    return group.paths.some(path => location.pathname.startsWith(path));
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Logo linkTo="/" size="md" />
        
        <nav className="flex items-center gap-6">
          {menuGroups.map(group => (
            <button
              key={group.id}
              onClick={() => handleMenuClick(group)}
              className={`text-sm font-medium transition-colors ${
                isGroupActive(group)
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
              }`}
            >
              {group.label}
            </button>
          ))}
          
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

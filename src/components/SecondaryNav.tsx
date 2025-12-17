import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface SubMenuItem {
  label: string;
  path: string;
}

interface MenuGroup {
  id: string;
  label: string;
  items: SubMenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: "gestao-pesquisa",
    label: "Gestão de Pesquisa",
    items: [
      { label: "Cadastro de Pesquisa", path: "/pesquisa" },
      { label: "Dashboard", path: "/dashboard" },
      { label: "Análise de Indicadores", path: "/analise-indicadores" },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    items: [
      { label: "Administração", path: "/config" },
      { label: "Integração", path: "/integracoes" },
    ],
  },
];

const SecondaryNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState<MenuGroup | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  // Detectar grupo ativo baseado na URL
  useEffect(() => {
    const currentPath = location.pathname;
    
    for (const group of menuGroups) {
      const matchingItem = group.items.find(item => currentPath.startsWith(item.path));
      if (matchingItem) {
        setActiveGroup(group);
        setActiveTab(matchingItem.path);
        // Salvar último submenu usado deste grupo
        localStorage.setItem(`lastSubTab:${group.id}`, matchingItem.path);
        return;
      }
    }
    
    setActiveGroup(null);
    setActiveTab("");
  }, [location.pathname]);

  // Handler de navegação para submenu
  const handleTabClick = (path: string, groupId: string) => {
    localStorage.setItem(`lastSubTab:${groupId}`, path);
    setActiveTab(path);
    navigate(path);
  };

  // Handler de teclado para acessibilidade
  const handleKeyDown = (e: React.KeyboardEvent, items: SubMenuItem[], currentIndex: number, groupId: string) => {
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      const prevItem = items[currentIndex - 1];
      handleTabClick(prevItem.path, groupId);
      // Focar no elemento anterior
      const prevButton = document.querySelector(`[data-tab="${prevItem.path}"]`) as HTMLButtonElement;
      prevButton?.focus();
    } else if (e.key === "ArrowRight" && currentIndex < items.length - 1) {
      e.preventDefault();
      const nextItem = items[currentIndex + 1];
      handleTabClick(nextItem.path, groupId);
      // Focar no próximo elemento
      const nextButton = document.querySelector(`[data-tab="${nextItem.path}"]`) as HTMLButtonElement;
      nextButton?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(items[currentIndex].path, groupId);
    }
  };

  if (!activeGroup) return null;

  return (
    <div className="sticky top-[81px] z-40 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <nav role="tablist" className="flex gap-1 py-2">
          {activeGroup.items.map((item, index) => {
            const isActive = activeTab === item.path;
            return (
              <button
                key={item.path}
                data-tab={item.path}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(item.path, activeGroup.id)}
                onKeyDown={(e) => handleKeyDown(e, activeGroup.items, index, activeGroup.id)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                `}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SecondaryNav;

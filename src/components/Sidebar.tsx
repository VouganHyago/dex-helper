import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Search, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  username: string;
  onLogout: () => void;
}

export function Sidebar({ username, onLogout }: SidebarProps) {
  const router = useRouter();

  const navItems = [
    { 
      label: "Dashboard", 
      icon: LayoutDashboard, 
      path: "/dashboard",
      gradient: "from-blue-600 to-purple-600"
    },
    { 
      label: "Clientes", 
      icon: Users, 
      path: "/clientes",
      gradient: "from-blue-600 to-indigo-600"
    },
    { 
      label: "Buscas", 
      icon: Search, 
      path: "/buscas",
      gradient: "from-purple-600 to-pink-600"
    },
    { 
      label: "Top Rejeitados", 
      icon: AlertTriangle, 
      path: "/rejeicoes",
      gradient: "from-red-600 to-orange-600"
    },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          DexBuscas
        </h1>
        <p className="text-sm text-slate-600 mt-1">Intranet Admin</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                active 
                  ? "bg-gradient-to-r text-white shadow-lg" 
                  : "text-slate-700 hover:bg-slate-100",
                active && item.gradient
              )}
            >
              <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-500")} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="px-4 py-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">Logado como</p>
          <p className="text-sm font-semibold text-slate-900">{username}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
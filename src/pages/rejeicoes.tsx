import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { GetServerSideProps } from "next";
import { SEO } from "@/components/SEO";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TopRejected {
  user_id: number;
  user_name: string;
  user_email: string;
  total_rejected: number;
  last_rejection: string;
  rejection_reasons: string[];
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      username: session.username || "Admin",
    },
  };
};

export default function Rejeicoes({ username }: { username: string }) {
  const router = useRouter();
  const [topRejected, setTopRejected] = useState<TopRejected[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRejected();
  }, []);

  const fetchTopRejected = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/buscas/top-rejected");
      const data = await response.json();
      
      if (response.ok) {
        setTopRejected(data);
      }
    } catch (error) {
      console.error("Erro ao buscar top rejeitados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const formatDate = (date: string) => {
    if (!date) return "Data não disponível";
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return "Data inválida";
      }
      return format(parsedDate, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}º`;
  };

  return (
    <>
      <SEO 
        title="Top Rejeitados - DexBuscas Admin"
        description="Usuários com mais buscas rejeitadas"
      />
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-red-50">
        <Sidebar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <div className="px-8 py-6">
              <h2 className="text-3xl font-bold text-slate-900">Top Usuários Rejeitados</h2>
              <p className="text-slate-600 mt-1">Usuários com mais buscas rejeitadas que podem precisar de suporte</p>
            </div>
          </header>

          <div className="p-8">
            <Card className="mb-6 border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">
                      Atenção: Estes usuários estão tendo dificuldades
                    </p>
                    <p className="text-sm text-red-700">
                      Entre em contato para oferecer suporte ou ajustar seus planos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600">Carregando dados...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {topRejected.map((user, index) => (
                  <Card 
                    key={user.user_id} 
                    className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-4xl">{getMedalEmoji(index)}</div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-slate-900">{user.user_name}</h3>
                              <p className="text-sm text-slate-600">{user.user_email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-5 h-5 text-red-600" />
                              <div>
                                <p className="text-sm text-slate-600">Total Rejeitado</p>
                                <p className="text-2xl font-bold text-red-600">{user.total_rejected}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-slate-500" />
                              <div>
                                <p className="text-sm text-slate-600">Última Rejeição</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatDate(user.last_rejection)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-700 mb-2">Motivos de Rejeição:</p>
                            <div className="flex flex-wrap gap-2">
                              {user.rejection_reasons && user.rejection_reasons.length > 0 ? (
                                user.rejection_reasons.map((reason, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="border-red-300 text-red-800"
                                  >
                                    {reason}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">Nenhum motivo registrado</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user.user_name && user.user_name.length > 0 
                              ? user.user_name.charAt(0).toUpperCase() 
                              : "?"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {topRejected.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Nenhum usuário com rejeições encontrado</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
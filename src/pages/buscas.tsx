import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { GetServerSideProps } from "next";
import { SEO } from "@/components/SEO";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Calendar, User, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Busca {
  id: number;
  user_name: string;
  user_email: string;
  requested_at: string;
  status: string;
  reject_reason: string | null;
  quota_used_before: number | null;
  quota_used_after: number | null;
}

interface BuscasStats {
  total: number;
  accepted: number;
  rejected: number;
  error: number;
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

export default function Buscas({ username }: { username: string }) {
  const router = useRouter();
  const [buscas, setBuscas] = useState<Busca[]>([]);
  const [stats, setStats] = useState<BuscasStats>({ total: 0, accepted: 0, rejected: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "accepted" | "rejected" | "error">("all");

  useEffect(() => {
    fetchBuscas();
  }, [filter]);

  const fetchBuscas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/buscas/list?status=${filter}`);
      const data = await response.json();
      
      if (response.ok) {
        setBuscas(data.buscas || []);
        setStats(data.stats || { total: 0, accepted: 0, rejected: 0, error: 0 });
      } else {
        setError(data.error || "Erro ao carregar dados");
      }
    } catch (error) {
      console.error("Erro ao buscar buscas:", error);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getStatusIcon = (status: string) => {
    if (status === "accepted") return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === "rejected") return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "accepted") {
      return <Badge className="bg-green-100 text-green-800 border-green-300">✓ Aceita</Badge>;
    }
    if (status === "rejected") {
      return <Badge className="bg-red-100 text-red-800 border-red-300">✗ Rejeitada</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⚠ Erro</Badge>;
  };

  return (
    <>
      <SEO 
        title="Buscas - DexBuscas Admin"
        description="Histórico de buscas realizadas"
      />
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
        <Sidebar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <div className="px-8 py-6">
              <h2 className="text-3xl font-bold text-slate-900">Histórico de Buscas</h2>
              <p className="text-slate-600 mt-1">Visualize todas as buscas realizadas na plataforma</p>
            </div>
          </header>

          <div className="p-8">
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card className="hover:shadow-lg transition-all border-l-4 border-l-slate-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Total de Buscas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Aceitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Rejeitadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Erros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.error}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-center">
                  <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as buscas</SelectItem>
                      <SelectItem value="accepted">✓ Aceitas</SelectItem>
                      <SelectItem value="rejected">✗ Rejeitadas</SelectItem>
                      <SelectItem value="error">⚠ Com erro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="mb-6 border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-800 font-semibold">⚠️ {error}</p>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600">Carregando buscas...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {buscas.map((busca) => (
                  <Card 
                    key={busca.id} 
                    className="hover:shadow-lg transition-all duration-300 border-l-4"
                    style={{
                      borderLeftColor: 
                        busca.status === "accepted" ? "#10b981" : 
                        busca.status === "rejected" ? "#ef4444" : "#eab308"
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusIcon(busca.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold text-slate-900">{busca.user_name}</span>
                              </div>
                              <p className="text-sm text-slate-600">{busca.user_email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-600">{formatDate(busca.requested_at)}</span>
                            </div>
                            
                            {busca.quota_used_before !== null && busca.quota_used_after !== null && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">
                                  Cota: {busca.quota_used_before} → {busca.quota_used_after}
                                </span>
                              </div>
                            )}
                          </div>

                          {busca.reject_reason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm font-semibold text-red-800">
                                Motivo da rejeição: {busca.reject_reason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div>
                          {getStatusBadge(busca.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {buscas.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-slate-600">Nenhuma busca encontrada</p>
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
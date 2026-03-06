import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Search, 
  Ticket,
  TrendingUp,
  Activity,
  Clock,
  Calendar,
  X,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export async function getServerSideProps({ req, res }: any) {
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
}

interface MetricsData {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalSearches: number;
  totalTickets: number;
  newUsersThisPeriod: number;
  revenueThisPeriod: number;
  searchesThisPeriod: number;
  ticketsThisPeriod: number;
  freemiumUsers: number;
  freemiumUsersDetails: Array<{
    id: number;
    name: string;
    email: string;
    phone_number: string | null;
    created_at: string;
    total_searches: number;
    total_tickets: number;
    last_search: string | null;
    last_search_status: string | null;
    last_search_origin: string | null;
    last_search_destination: string | null;
    last_search_departure_date: string | null;
  }>;
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    created_at: string;
  }>;
  subscriptionsByPlan: Array<{
    plan_name: string;
    count: number;
  }>;
  searchesByStatus: Array<{
    status: string;
    count: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  userGrowthByMonth: Array<{
    month: string;
    count: number;
  }>;
  searchesByMonth: Array<{
    month: string;
    count: number;
  }>;
  ticketsByMonth: Array<{
    month: string;
    count: number;
  }>;
  subscriptionsByStatus: Array<{
    status: string;
    count: number;
  }>;
  topPlans: Array<{
    plan_name: string;
    revenue: number;
  }>;
}

export default function Dashboard({ username }: { username: string }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [selectedUser, setSelectedUser] = useState<MetricsData['freemiumUsersDetails'][0] | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      let url = "/api/dashboard/metrics";
      
      if (period !== "all") {
        const now = new Date();
        let startDate, endDate;
        
        if (period === "thisMonth") {
          startDate = format(startOfMonth(now), "yyyy-MM-dd");
          endDate = format(endOfMonth(now), "yyyy-MM-dd");
        } else if (period === "lastMonth") {
          const lastMonth = subMonths(now, 1);
          startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd");
          endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd");
        } else if (period === "last3Months") {
          startDate = format(subMonths(now, 3), "yyyy-MM-dd");
          endDate = format(now, "yyyy-MM-dd");
        } else if (period === "last6Months") {
          startDate = format(subMonths(now, 6), "yyyy-MM-dd");
          endDate = format(now, "yyyy-MM-dd");
        } else if (period === "thisYear") {
          startDate = format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd");
          endDate = format(now, "yyyy-MM-dd");
        }
        
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleUserClick = (user: MetricsData['freemiumUsersDetails'][0]) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  return (
    <>
      <SEO title="Dashboard - DexBuscas Intranet" description="Painel administrativo com métricas e estatísticas" />
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <Sidebar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
                  <p className="text-slate-600 mt-1">Visão geral das métricas da plataforma</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[200px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tempos</SelectItem>
                    <SelectItem value="thisMonth">Este mês</SelectItem>
                    <SelectItem value="lastMonth">Mês passado</SelectItem>
                    <SelectItem value="last3Months">Últimos 3 meses</SelectItem>
                    <SelectItem value="last6Months">Últimos 6 meses</SelectItem>
                    <SelectItem value="thisYear">Este ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          <div className="p-8">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : metrics ? (
              <div className="space-y-8">
                {/* Cards principais */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total de Usuários
                      </CardTitle>
                      <Users className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900">
                        {metrics.totalUsers.toLocaleString("pt-BR")}
                      </div>
                      {period !== "all" && (
                        <p className="text-xs text-slate-600 mt-2">
                          +{metrics.newUsersThisPeriod} no período
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Assinaturas Ativas
                      </CardTitle>
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900">
                        {metrics.activeSubscriptions.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Verificadas por validade
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Usuários Freemium
                      </CardTitle>
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900">
                        {metrics.freemiumUsers.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-xs text-orange-600 mt-2 font-semibold">
                        💡 Potencial de conversão
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Receita Total
                      </CardTitle>
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900">
                        {formatCurrency(metrics.totalRevenue)}
                      </div>
                      {period !== "all" && (
                        <p className="text-xs text-slate-600 mt-2">
                          {formatCurrency(metrics.revenueThisPeriod)} no período
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Buscas Realizadas
                      </CardTitle>
                      <Search className="h-5 w-5 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900">
                        {metrics.totalSearches.toLocaleString("pt-BR")}
                      </div>
                      {period !== "all" && (
                        <p className="text-xs text-slate-600 mt-2">
                          +{metrics.searchesThisPeriod} no período
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos principais */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Crescimento de Usuários
                      </CardTitle>
                      <CardDescription>Novos cadastros por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Line
                        data={{
                          labels: metrics.userGrowthByMonth.map(m => {
                            const [year, month] = m.month.split("-");
                            return format(new Date(parseInt(year), parseInt(month) - 1), "MMM/yy", { locale: ptBR });
                          }),
                          datasets: [
                            {
                              label: "Novos Usuários",
                              data: metrics.userGrowthByMonth.map(m => m.count),
                              borderColor: "rgb(59, 130, 246)",
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              fill: true,
                              tension: 0.4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Receita Mensal
                      </CardTitle>
                      <CardDescription>Faturamento por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Bar
                        data={{
                          labels: metrics.revenueByMonth.map(m => {
                            const [year, month] = m.month.split("-");
                            return format(new Date(parseInt(year), parseInt(month) - 1), "MMM/yy", { locale: ptBR });
                          }),
                          datasets: [
                            {
                              label: "Receita",
                              data: metrics.revenueByMonth.map(m => m.revenue),
                              backgroundColor: "rgba(34, 197, 94, 0.8)",
                              borderColor: "rgb(34, 197, 94)",
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => formatCurrency(context.parsed.y),
                              },
                            },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-purple-600" />
                        Buscas por Mês
                      </CardTitle>
                      <CardDescription>Volume de pesquisas aceitas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Line
                        data={{
                          labels: metrics.searchesByMonth.map(m => {
                            const [year, month] = m.month.split("-");
                            return format(new Date(parseInt(year), parseInt(month) - 1), "MMM/yy", { locale: ptBR });
                          }),
                          datasets: [
                            {
                              label: "Buscas",
                              data: metrics.searchesByMonth.map(m => m.count),
                              borderColor: "rgb(168, 85, 247)",
                              backgroundColor: "rgba(168, 85, 247, 0.1)",
                              fill: true,
                              tension: 0.4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-pink-600" />
                        Tickets Emitidos
                      </CardTitle>
                      <CardDescription>Passagens por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Bar
                        data={{
                          labels: metrics.ticketsByMonth.map(m => {
                            const [year, month] = m.month.split("-");
                            return format(new Date(parseInt(year), parseInt(month) - 1), "MMM/yy", { locale: ptBR });
                          }),
                          datasets: [
                            {
                              label: "Tickets",
                              data: metrics.ticketsByMonth.map(m => m.count),
                              backgroundColor: "rgba(236, 72, 153, 0.8)",
                              borderColor: "rgb(236, 72, 153)",
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos de distribuição */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Assinaturas por Plano
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metrics.subscriptionsByPlan.length > 0 ? (
                        <Doughnut
                          data={{
                            labels: metrics.subscriptionsByPlan.map(p => p.plan_name),
                            datasets: [
                              {
                                data: metrics.subscriptionsByPlan.map(p => p.count),
                                backgroundColor: [
                                  "rgba(59, 130, 246, 0.8)",
                                  "rgba(34, 197, 94, 0.8)",
                                  "rgba(234, 179, 8, 0.8)",
                                  "rgba(168, 85, 247, 0.8)",
                                  "rgba(236, 72, 153, 0.8)",
                                ],
                                borderWidth: 2,
                                borderColor: "#fff",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { position: "bottom" },
                            },
                          }}
                        />
                      ) : (
                        <p className="text-slate-500 text-center py-8">Sem dados</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Status de Buscas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Doughnut
                        data={{
                          labels: metrics.searchesByStatus.map(s => s.status),
                          datasets: [
                            {
                              data: metrics.searchesByStatus.map(s => s.count),
                              backgroundColor: [
                                "rgba(34, 197, 94, 0.8)",
                                "rgba(239, 68, 68, 0.8)",
                                "rgba(234, 179, 8, 0.8)",
                              ],
                              borderWidth: 2,
                              borderColor: "#fff",
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: "bottom" },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        Status de Assinaturas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Doughnut
                        data={{
                          labels: metrics.subscriptionsByStatus.map(s => s.status),
                          datasets: [
                            {
                              data: metrics.subscriptionsByStatus.map(s => s.count),
                              backgroundColor: [
                                "rgba(34, 197, 94, 0.8)",
                                "rgba(234, 179, 8, 0.8)",
                                "rgba(239, 68, 68, 0.8)",
                                "rgba(148, 163, 184, 0.8)",
                              ],
                              borderWidth: 2,
                              borderColor: "#fff",
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: "bottom" },
                          },
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Top Planos e Usuários Recentes */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-yellow-600" />
                        Top Planos por Receita
                      </CardTitle>
                      <CardDescription>Planos que mais geraram receita</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {metrics.topPlans.map((plan, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <span className="font-semibold text-slate-700">{plan.plan_name}</span>
                            </div>
                            <span className="text-xl font-bold text-yellow-600">
                              {formatCurrency(plan.revenue)}
                            </span>
                          </div>
                        ))}
                        {metrics.topPlans.length === 0 && (
                          <p className="text-slate-500 text-center py-4">Sem dados de receita</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-xl transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Usuários Recentes
                      </CardTitle>
                      <CardDescription>Últimos 10 cadastros</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {metrics.recentUsers.map((user) => (
                          <div key={user.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-slate-900">{user.name}</p>
                                <p className="text-sm text-slate-600">{user.email}</p>
                              </div>
                              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
                                {formatDate(user.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Seção Freemium - ALTA PRIORIDADE */}
                <Card className="hover:shadow-xl transition-all border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                          <TrendingUp className="h-6 w-6 text-orange-600" />
                          Usuários Freemium (free_daily) - Oportunidade de Conversão
                        </CardTitle>
                        <CardDescription className="text-orange-700 mt-2">
                          {metrics.freemiumUsers} usuários no plano gratuito. Entre em contato para oferecer planos pagos! 💰
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {metrics.freemiumUsersDetails.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {metrics.freemiumUsersDetails.map((user) => (
                          <div key={user.id} className="p-4 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <button
                                      onClick={() => handleUserClick(user)}
                                      className="font-semibold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer text-left underline decoration-dotted"
                                    >
                                      {user.name}
                                    </button>
                                    <p className="text-sm text-slate-600">{user.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <span className="text-slate-600">
                                      Desde {formatDate(user.created_at)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Search className="h-4 w-4 text-purple-500" />
                                    <span className="text-slate-700 font-semibold">
                                      {user.total_searches} buscas
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Ticket className="h-4 w-4 text-pink-500" />
                                    <span className="text-slate-700 font-semibold">
                                      {user.total_tickets} tickets
                                    </span>
                                  </div>
                                  {user.last_search && (
                                    <div className="flex items-center gap-1">
                                      <Activity className="h-4 w-4 text-blue-500" />
                                      <span className="text-slate-600">
                                        Última: {formatDate(user.last_search)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {user.total_searches > 10 ? (
                                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                                    🔥 Alta atividade
                                  </div>
                                ) : user.total_searches > 5 ? (
                                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                                    ⚡ Ativo
                                  </div>
                                ) : (
                                  <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                                    💤 Baixa atividade
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">Nenhum usuário freemium encontrado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Modal de Detalhes do Usuário */}
                <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {selectedUser?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xl">{selectedUser?.name}</div>
                          <div className="text-sm font-normal text-slate-600">{selectedUser?.email}</div>
                        </div>
                      </DialogTitle>
                      <DialogDescription>
                        Detalhes completos do usuário Freemium
                      </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                      <div className="space-y-6 mt-4">
                        {/* Informações Básicas */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <User className="h-5 w-5 text-blue-600" />
                              Informações Básicas
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-semibold text-slate-700">Email:</span>
                              <span className="text-sm text-slate-600">{selectedUser.email}</span>
                            </div>
                            {selectedUser.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-semibold text-slate-700">Telefone:</span>
                                <span className="text-sm text-slate-600">{selectedUser.phone_number}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-semibold text-slate-700">Cadastrado em:</span>
                              <span className="text-sm text-slate-600">{formatDate(selectedUser.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-semibold text-slate-700">Plano:</span>
                              <span className="text-sm text-orange-600 font-semibold">free_daily (Freemium)</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Estatísticas de Uso */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Activity className="h-5 w-5 text-purple-600" />
                              Estatísticas de Uso
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Search className="h-5 w-5 text-purple-600" />
                                  <span className="text-sm font-semibold text-slate-700">Total de Buscas</span>
                                </div>
                                <div className="text-3xl font-bold text-purple-600">
                                  {selectedUser.total_searches}
                                </div>
                              </div>

                              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Ticket className="h-5 w-5 text-pink-600" />
                                  <span className="text-sm font-semibold text-slate-700">Tickets Emitidos</span>
                                </div>
                                <div className="text-3xl font-bold text-pink-600">
                                  {selectedUser.total_tickets}
                                </div>
                              </div>
                            </div>

                            {selectedUser.last_search && (
                              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                  <span className="text-sm font-semibold text-slate-700">Última Busca:</span>
                                  <span className="text-sm text-slate-600">{formatDate(selectedUser.last_search)}</span>
                                </div>
                                
                                {(selectedUser.last_search_origin || selectedUser.last_search_destination) && (
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="font-semibold text-slate-700">Rota:</span>
                                      <span className="text-slate-600">
                                        {selectedUser.last_search_origin || "N/A"} → {selectedUser.last_search_destination || "N/A"}
                                      </span>
                                    </div>
                                    {selectedUser.last_search_departure_date && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-slate-700">Data da viagem:</span>
                                        <span className="text-slate-600">{formatDate(selectedUser.last_search_departure_date)}</span>
                                      </div>
                                    )}
                                    {selectedUser.last_search_status && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-slate-700">Status:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                          selectedUser.last_search_status === 'accepted' 
                                            ? 'bg-green-100 text-green-800' 
                                            : selectedUser.last_search_status === 'rejected'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {selectedUser.last_search_status === 'accepted' ? 'Aceita' : 
                                           selectedUser.last_search_status === 'rejected' ? 'Rejeitada' : 'Erro'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Nível de Atividade */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                              Nível de Atividade
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedUser.total_searches > 10 ? (
                              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                                <div className="flex items-center gap-3">
                                  <div className="text-4xl">🔥</div>
                                  <div>
                                    <div className="font-bold text-green-800 text-lg">Alta Atividade</div>
                                    <p className="text-sm text-green-700 mt-1">
                                      Usuário muito engajado! Excelente candidato para conversão em plano pago.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : selectedUser.total_searches > 5 ? (
                              <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                                <div className="flex items-center gap-3">
                                  <div className="text-4xl">⚡</div>
                                  <div>
                                    <div className="font-bold text-yellow-800 text-lg">Ativo</div>
                                    <p className="text-sm text-yellow-700 mt-1">
                                      Usuário com uso moderado. Bom potencial de conversão.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-50 rounded-lg border-2 border-slate-300">
                                <div className="flex items-center gap-3">
                                  <div className="text-4xl">💤</div>
                                  <div>
                                    <div className="font-bold text-slate-800 text-lg">Baixa Atividade</div>
                                    <p className="text-sm text-slate-700 mt-1">
                                      Usuário com pouco engajamento. Considere estratégias de reativação.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Ações Sugeridas */}
                        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                              <DollarSign className="h-5 w-5 text-orange-600" />
                              Oportunidade de Conversão
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <p className="text-sm text-orange-800 font-semibold">
                                💡 Ações Recomendadas:
                              </p>
                              <ul className="space-y-2 text-sm text-slate-700">
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 font-bold">•</span>
                                  <span>Entre em contato oferecendo upgrade para plano premium</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 font-bold">•</span>
                                  <span>Destaque os benefícios de buscas ilimitadas e suporte prioritário</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 font-bold">•</span>
                                  <span>Considere oferecer um desconto especial para conversão</span>
                                </li>
                                {selectedUser.phone_number && (
                                  <li className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">•</span>
                                    <span>Contato via WhatsApp: <strong>{selectedUser.phone_number}</strong></span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-slate-500">Erro ao carregar métricas</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
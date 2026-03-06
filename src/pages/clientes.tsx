import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { GetServerSideProps } from "next";
import { SEO } from "@/components/SEO";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, DollarSign, FileText, Calendar, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Cliente {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  subscription_status: string | null;
  plan_name: string | null;
  current_period_end: string | null;
  total_searches: number;
  total_tickets: number;
  total_spent: number;
  is_active: boolean;
}

interface ClienteDetalhes {
  cliente: any;
  subscription: any;
  payments: any[];
  searches: any[];
  tickets: any[];
  stats: {
    total_accepted_searches: number;
    total_rejected_searches: number;
    total_tickets: number;
    total_spent: number;
  };
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

export default function Clientes({ username }: { username: string }) {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "freemium" | "paid">("all");
  const [selectedCliente, setSelectedCliente] = useState<ClienteDetalhes | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, [filterType]);

  const fetchClientes = async (search?: string) => {
    setLoading(true);
    try {
      let url = "/api/clientes/list?";
      
      if (search) {
        url += `search=${encodeURIComponent(search)}&`;
      }
      
      if (filterType !== "all") {
        url += `filterType=${filterType}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setClientes(data);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClienteDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/clientes/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedCliente(data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchClientes(searchTerm);
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

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  return (
    <>
      <SEO 
        title="Clientes - DexBuscas Admin"
        description="Gerenciamento de clientes"
      />
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar username={username} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto">
          <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <div className="px-8 py-6">
              <h2 className="text-3xl font-bold text-slate-900">Clientes</h2>
              <p className="text-slate-600 mt-1">Gerencie e visualize informações detalhadas dos clientes</p>
            </div>
          </header>

          <div className="p-8">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[300px]">
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Select value={filterType} onValueChange={(value: "all" | "freemium" | "paid") => setFilterType(value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Tipo de plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      <SelectItem value="freemium">🆓 Freemium (free_daily)</SelectItem>
                      <SelectItem value="paid">💳 Planos Pagos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                    fetchClientes();
                  }}>
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600">Carregando clientes...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {clientes.map((cliente) => (
                  <Card 
                    key={cliente.id} 
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4"
                    style={{
                      borderLeftColor: cliente.is_active ? "#10b981" : "#ef4444"
                    }}
                    onClick={() => fetchClienteDetails(cliente.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                              {cliente.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{cliente.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="w-4 h-4" />
                                {cliente.email}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-600">
                                {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            {cliente.phone_number && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">{cliente.phone_number}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Search className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-600">{cliente.total_searches} buscas</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-600">{cliente.total_tickets} tickets</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {cliente.is_active ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                ✓ Assinatura Ativa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-300 text-red-800">
                                ✗ Sem Assinatura Ativa
                              </Badge>
                            )}
                            {cliente.plan_name && (
                              <Badge variant="outline" className="border-blue-300 text-blue-800">
                                {cliente.plan_name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">
                              {formatCurrency(cliente.total_spent)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Total gasto</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {clientes.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Nenhum cliente encontrado</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Carregando detalhes...</p>
            </div>
          ) : selectedCliente && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Nome</p>
                      <p className="font-semibold">{selectedCliente.cliente.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold">{selectedCliente.cliente.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Telefone</p>
                      <p className="font-semibold">{selectedCliente.cliente.phone_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Data de Cadastro</p>
                      <p className="font-semibold">{formatDate(selectedCliente.cliente.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedCliente.subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assinatura Atual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Plano</p>
                        <p className="font-semibold">{selectedCliente.subscription.plan_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <Badge className={selectedCliente.subscription.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {selectedCliente.subscription.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Valor</p>
                        <p className="font-semibold">{formatCurrency(selectedCliente.subscription.price_cents)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Cota de Buscas</p>
                        <p className="font-semibold">{selectedCliente.subscription.search_quota}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Fim do Período</p>
                        <p className="font-semibold">{formatDate(selectedCliente.subscription.current_period_end)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Gateway</p>
                        <p className="font-semibold">{selectedCliente.subscription.gateway}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedCliente.stats.total_accepted_searches}</p>
                      <p className="text-sm text-slate-600">Buscas Aceitas</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{selectedCliente.stats.total_rejected_searches}</p>
                      <p className="text-sm text-slate-600">Buscas Rejeitadas</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{selectedCliente.stats.total_tickets}</p>
                      <p className="text-sm text-slate-600">Tickets Emitidos</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCliente.stats.total_spent)}</p>
                      <p className="text-sm text-slate-600">Total Gasto</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos ({selectedCliente.payments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCliente.payments.slice(0, 10).map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{formatCurrency(payment.amount_cents)}</p>
                          <p className="text-sm text-slate-600">{formatDate(payment.created_at)}</p>
                        </div>
                        <Badge className={
                          payment.status === "paid" ? "bg-green-100 text-green-800" :
                          payment.status === "failed" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {payment.status === "paid" ? "Pago" : payment.status === "failed" ? "Falhou" : "Reembolsado"}
                        </Badge>
                      </div>
                    ))}
                    {selectedCliente.payments.length === 0 && (
                      <p className="text-center text-slate-500 py-4">Nenhum pagamento registrado</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Últimas Buscas ({selectedCliente.searches.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCliente.searches.slice(0, 10).map((search: any) => (
                      <div key={search.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm text-slate-600">{formatDate(search.requested_at)}</p>
                          {search.reject_reason && (
                            <p className="text-xs text-red-600 mt-1">Motivo: {search.reject_reason}</p>
                          )}
                        </div>
                        <Badge className={
                          search.status === "accepted" ? "bg-green-100 text-green-800" :
                          search.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {search.status === "accepted" ? "Aceita" : search.status === "rejected" ? "Rejeitada" : "Erro"}
                        </Badge>
                      </div>
                    ))}
                    {selectedCliente.searches.length === 0 && (
                      <p className="text-center text-slate-500 py-4">Nenhuma busca registrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets Emitidos ({selectedCliente.tickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCliente.tickets.slice(0, 10).map((ticket: any) => (
                      <div key={ticket.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{ticket.booking_reference || "N/A"}</p>
                            <p className="text-sm text-slate-600">{ticket.company}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(ticket.created_at)}</p>
                          </div>
                          <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {selectedCliente.tickets.length === 0 && (
                      <p className="text-center text-slate-500 py-4">Nenhum ticket emitido</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { query } from "@/lib/db";

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

export default async function metricsRoute(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const { startDate, endDate } = req.query;
    
    console.log("=== METRICS API DEBUG ===");
    console.log("Filters:", { startDate, endDate });
    
    // Construir filtros de data para cada tipo de tabela
    const hasDateFilter = startDate && endDate;
    
    // Filtro para tabela user (created_at)
    const userDateFilter = hasDateFilter 
      ? `AND created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`
      : '';
    
    // Filtro para tabela search_requests (requested_at)
    const searchDateFilter = hasDateFilter
      ? `AND requested_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`
      : '';
    
    // Filtro para tabela transactions (paid_at)
    const transactionDateFilter = hasDateFilter
      ? `AND paid_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`
      : '';
    
    // Filtro para tabela ticket (created_at)
    const ticketDateFilter = hasDateFilter
      ? `AND created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`
      : '';

    console.log("Starting queries...");

    // Total de usuários
    console.log("Query 1: Total users");
    const totalUsersResult = await query<Array<{ total: number }>>(
      "SELECT COUNT(*) as total FROM user"
    );
    console.log("Total users result:", totalUsersResult);

    // Assinaturas ativas (verifica current_period_end)
    console.log("Query 2: Active subscriptions");
    const activeSubsResult = await query<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM subscriptions 
       WHERE status = 'active' AND current_period_end > NOW()`
    );
    console.log("Active subs result:", activeSubsResult);

    // Receita total
    console.log("Query 3: Total revenue");
    const totalRevenueResult = await query<Array<{ total: number | null }>>(
      "SELECT SUM(amount_cents) as total FROM transactions WHERE status = 'paid'"
    );
    console.log("Total revenue result:", totalRevenueResult);

    // Total de buscas aceitas
    console.log("Query 4: Total searches");
    const totalSearchesResult = await query<Array<{ total: number }>>(
      "SELECT COUNT(*) as total FROM search_requests WHERE status = 'accepted'"
    );
    console.log("Total searches result:", totalSearchesResult);

    // Total de tickets
    console.log("Query 5: Total tickets");
    const totalTicketsResult = await query<Array<{ total: number }>>(
      "SELECT COUNT(*) as total FROM ticket"
    );
    console.log("Total tickets result:", totalTicketsResult);

    // Novos usuários no período
    console.log("Query 6: New users in period");
    const newUsersResult = await query<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM user WHERE 1=1 ${userDateFilter}`
    );
    console.log("New users result:", newUsersResult);

    // Receita no período
    console.log("Query 7: Revenue in period");
    const revenuePeriodResult = await query<Array<{ total: number | null }>>(
      `SELECT SUM(amount_cents) as total FROM transactions 
       WHERE status = 'paid' ${transactionDateFilter}`
    );
    console.log("Revenue period result:", revenuePeriodResult);

    // Buscas no período
    console.log("Query 8: Searches in period");
    const searchesPeriodResult = await query<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM search_requests 
       WHERE status = 'accepted' ${searchDateFilter}`
    );
    console.log("Searches period result:", searchesPeriodResult);

    // Tickets no período
    console.log("Query 9: Tickets in period");
    const ticketsPeriodResult = await query<Array<{ total: number }>>(
      `SELECT COUNT(*) as total FROM ticket WHERE 1=1 ${ticketDateFilter}`
    );
    console.log("Tickets period result:", ticketsPeriodResult);

    // Usuários recentes
    console.log("Query 10: Recent users");
    const recentUsers = await query<Array<{
      id: number;
      name: string;
      email: string;
      created_at: string;
    }>>(
      "SELECT id, name, email, created_at FROM user ORDER BY created_at DESC LIMIT 10"
    );
    console.log("Recent users result:", recentUsers);

    // Assinaturas por plano
    console.log("Query 11: Subscriptions by plan");
    const subscriptionsByPlan = await query<Array<{
      plan_name: string;
      count: number;
    }>>(
      `SELECT p.name as plan_name, COUNT(*) as count 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.id 
       WHERE s.status = 'active' AND s.current_period_end > NOW()
       GROUP BY p.name`
    );
    console.log("Subscriptions by plan result:", subscriptionsByPlan);

    // Status de buscas
    console.log("Query 12: Searches by status");
    const searchesByStatus = await query<Array<{
      status: string;
      count: number;
    }>>(
      "SELECT status, COUNT(*) as count FROM search_requests GROUP BY status"
    );
    console.log("Searches by status result:", searchesByStatus);

    // Receita por mês (últimos 12 meses)
    console.log("Query 13: Revenue by month");
    const revenueByMonth = await query<Array<{
      month: string;
      revenue: number | null;
    }>>(
      `SELECT 
        DATE_FORMAT(paid_at, '%Y-%m') as month,
        SUM(amount_cents) as revenue
       FROM transactions 
       WHERE status = 'paid' AND paid_at IS NOT NULL
       GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );
    console.log("Revenue by month result:", revenueByMonth);

    // Crescimento de usuários por mês (últimos 12 meses)
    console.log("Query 14: User growth by month");
    const userGrowthByMonth = await query<Array<{
      month: string;
      count: number;
    }>>(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
       FROM user
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );
    console.log("User growth by month result:", userGrowthByMonth);

    // Buscas por mês (últimos 12 meses)
    console.log("Query 15: Searches by month");
    const searchesByMonth = await query<Array<{
      month: string;
      count: number;
    }>>(
      `SELECT 
        DATE_FORMAT(requested_at, '%Y-%m') as month,
        COUNT(*) as count
       FROM search_requests
       WHERE status = 'accepted'
       GROUP BY DATE_FORMAT(requested_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );
    console.log("Searches by month result:", searchesByMonth);

    // Tickets por mês (últimos 12 meses)
    console.log("Query 16: Tickets by month");
    const ticketsByMonth = await query<Array<{
      month: string;
      count: number;
    }>>(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
       FROM ticket
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );
    console.log("Tickets by month result:", ticketsByMonth);

    // Assinaturas por status
    console.log("Query 17: Subscriptions by status");
    const subscriptionsByStatus = await query<Array<{
      status: string;
      count: number;
    }>>(
      `SELECT 
        CASE 
          WHEN status = 'active' AND current_period_end > NOW() THEN 'active'
          WHEN status = 'active' AND current_period_end <= NOW() THEN 'expired'
          ELSE status
        END as status,
        COUNT(*) as count
       FROM subscriptions
       GROUP BY CASE 
          WHEN status = 'active' AND current_period_end > NOW() THEN 'active'
          WHEN status = 'active' AND current_period_end <= NOW() THEN 'expired'
          ELSE status
        END`
    );
    console.log("Subscriptions by status result:", subscriptionsByStatus);

    // Top planos por receita
    console.log("Query 18: Top plans by revenue");
    const topPlans = await query<Array<{
      plan_name: string;
      revenue: number | null;
    }>>(
      `SELECT 
        p.name as plan_name,
        SUM(t.amount_cents) as revenue
       FROM transactions t
       JOIN subscriptions s ON t.subscription_id = s.id
       JOIN plans p ON s.plan_id = p.id
       WHERE t.status = 'paid'
       GROUP BY p.name
       ORDER BY revenue DESC`
    );
    console.log("Top plans result:", topPlans);

    // Total de usuários freemium (free_daily)
    console.log("Query 19: Freemium users count");
    const freemiumUsersCount = await query<Array<{ total: number }>>(
      `SELECT COUNT(DISTINCT s.user_id) as total 
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       JOIN user u ON s.user_id = u.id
       WHERE p.name = 'free_daily' 
       AND s.status = 'active' 
       AND s.current_period_end > NOW()
       AND u.parent_user_id IS NULL`
    );
    console.log("Freemium users count result:", freemiumUsersCount);

    // Detalhes dos usuários freemium
    console.log("Query 20: Freemium users details");
    const freemiumUsersDetails = await query<Array<{
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
    }>>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone_number,
        u.created_at,
        COALESCE(searches.total, 0) as total_searches,
        COALESCE(tickets.total, 0) as total_tickets,
        searches.last_search,
        searches.last_search_status,
        searches.last_search_origin,
        searches.last_search_destination,
        searches.last_search_departure_date
       FROM user u
       JOIN subscriptions s ON u.id = s.user_id
       JOIN plans p ON s.plan_id = p.id
       LEFT JOIN (
         SELECT 
           user_id, 
           COUNT(*) as total, 
           MAX(requested_at) as last_search,
           (SELECT status FROM search_requests WHERE user_id = sr.user_id ORDER BY requested_at DESC LIMIT 1) as last_search_status,
           (SELECT JSON_UNQUOTE(JSON_EXTRACT(query_params, '$.origin')) FROM search_requests WHERE user_id = sr.user_id ORDER BY requested_at DESC LIMIT 1) as last_search_origin,
           (SELECT JSON_UNQUOTE(JSON_EXTRACT(query_params, '$.destination')) FROM search_requests WHERE user_id = sr.user_id ORDER BY requested_at DESC LIMIT 1) as last_search_destination,
           (SELECT JSON_UNQUOTE(JSON_EXTRACT(query_params, '$.departureDate')) FROM search_requests WHERE user_id = sr.user_id ORDER BY requested_at DESC LIMIT 1) as last_search_departure_date
         FROM search_requests sr
         WHERE status = 'accepted'
         GROUP BY user_id
       ) searches ON u.id = searches.user_id
       LEFT JOIN (
         SELECT user_id, COUNT(*) as total
         FROM ticket
         GROUP BY user_id
       ) tickets ON u.id = tickets.user_id
       WHERE p.name = 'free_daily' 
       AND s.status = 'active' 
       AND s.current_period_end > NOW()
       AND u.parent_user_id IS NULL
       ORDER BY total_searches DESC, u.created_at DESC
       LIMIT 50`
    );
    console.log("Freemium users details result:", freemiumUsersDetails);

    console.log("All queries completed successfully!");

    const metrics: MetricsData = {
      totalUsers: totalUsersResult[0]?.total || 0,
      activeSubscriptions: activeSubsResult[0]?.total || 0,
      totalRevenue: (totalRevenueResult[0]?.total || 0) / 100,
      totalSearches: totalSearchesResult[0]?.total || 0,
      totalTickets: totalTicketsResult[0]?.total || 0,
      newUsersThisPeriod: newUsersResult[0]?.total || 0,
      revenueThisPeriod: (revenuePeriodResult[0]?.total || 0) / 100,
      searchesThisPeriod: searchesPeriodResult[0]?.total || 0,
      ticketsThisPeriod: ticketsPeriodResult[0]?.total || 0,
      freemiumUsers: freemiumUsersCount[0]?.total || 0,
      freemiumUsersDetails: freemiumUsersDetails || [],
      recentUsers: recentUsers || [],
      subscriptionsByPlan: subscriptionsByPlan || [],
      searchesByStatus: searchesByStatus || [],
      revenueByMonth: (revenueByMonth || []).map(r => ({
        month: r.month,
        revenue: (r.revenue || 0) / 100
      })).reverse(),
      userGrowthByMonth: (userGrowthByMonth || []).reverse(),
      searchesByMonth: (searchesByMonth || []).reverse(),
      ticketsByMonth: (ticketsByMonth || []).reverse(),
      subscriptionsByStatus: subscriptionsByStatus || [],
      topPlans: (topPlans || []).map(p => ({
        plan_name: p.plan_name,
        revenue: (p.revenue || 0) / 100
      })),
    };

    console.log("Metrics compiled successfully!");
    return res.status(200).json(metrics);
  } catch (error) {
    console.error("=== ERROR IN METRICS API ===");
    console.error("Error details:", error);
    console.error("Error message:", (error as Error).message);
    console.error("Error stack:", (error as Error).stack);
    return res.status(500).json({ 
      error: "Erro ao buscar métricas",
      details: (error as Error).message 
    });
  }
}
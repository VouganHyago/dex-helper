import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { query } from "@/lib/db";

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
  is_active: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const { search, filterType } = req.query;
    
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    
    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    let planFilter = "";
    if (filterType === "freemium") {
      planFilter = " AND p.name = 'free_daily'";
    } else if (filterType === "paid") {
      planFilter = " AND p.name != 'free_daily'";
    }

    const clientes = await query<Array<{
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
      is_active: number;
    }>>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone_number,
        u.created_at,
        s.status as subscription_status,
        p.name as plan_name,
        s.current_period_end,
        COALESCE(searches.total, 0) as total_searches,
        COALESCE(tickets.total, 0) as total_tickets,
        COALESCE(payments.total, 0) as total_spent,
        CASE 
          WHEN s.status = 'active' AND s.current_period_end > NOW() THEN 1
          ELSE 0
        END as is_active
       FROM user u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       LEFT JOIN plans p ON s.plan_id = p.id
       LEFT JOIN (
         SELECT user_id, COUNT(*) as total
         FROM search_requests
         WHERE status = 'accepted'
         GROUP BY user_id
       ) searches ON u.id = searches.user_id
       LEFT JOIN (
         SELECT user_id, COUNT(*) as total
         FROM ticket
         GROUP BY user_id
       ) tickets ON u.id = tickets.user_id
       LEFT JOIN (
         SELECT user_id, SUM(amount_cents) as total
         FROM transactions
         WHERE status = 'paid'
         GROUP BY user_id
       ) payments ON u.id = payments.user_id
       ${whereClause}
       ${planFilter}
       ORDER BY u.created_at DESC
       LIMIT 100`,
      params
    );

    const formattedClientes = clientes.map(c => ({
      ...c,
      total_spent: (c.total_spent || 0) / 100,
      is_active: c.is_active === 1
    }));

    return res.status(200).json(formattedClientes);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return res.status(500).json({ error: "Erro ao buscar clientes" });
  }
}
import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function getClienteDetails(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const { id } = req.query;

    // Dados básicos do cliente
    const [cliente] = await query<any[]>(`
      SELECT * FROM user WHERE id = ?
    `, [id]);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    // Assinatura atual
    const [subscription] = await query<any[]>(`
      SELECT 
        s.*,
        p.name as plan_name,
        p.price_cents,
        p.search_quota
      FROM subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [id]);

    // Histórico de pagamentos
    const payments = await query<any[]>(`
      SELECT 
        t.*,
        s.gateway_subscription_id
      FROM transactions t
      LEFT JOIN subscriptions s ON t.subscription_id = s.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [id]);

    // Histórico de buscas
    const searches = await query<any[]>(`
      SELECT *
      FROM search_requests
      WHERE user_id = ?
      ORDER BY requested_at DESC
      LIMIT 50
    `, [id]);

    // Tickets emitidos
    const tickets = await query<any[]>(`
      SELECT *
      FROM ticket
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [id]);

    // Estatísticas
    const [stats] = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM search_requests WHERE user_id = ? AND status = 'accepted') as total_accepted_searches,
        (SELECT COUNT(*) FROM search_requests WHERE user_id = ? AND status = 'rejected') as total_rejected_searches,
        (SELECT COUNT(*) FROM ticket WHERE user_id = ?) as total_tickets,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM transactions WHERE user_id = ? AND status = 'paid') as total_spent
    `, [id, id, id, id]);

    return res.status(200).json({
      cliente,
      subscription: subscription ? {
        ...subscription,
        price_cents: subscription.price_cents / 100,
        is_active: subscription.status === 'active' && new Date(subscription.current_period_end) > new Date()
      } : null,
      payments: payments.map(p => ({
        ...p,
        amount_cents: p.amount_cents / 100
      })),
      searches,
      tickets,
      stats: {
        ...stats,
        total_spent: stats.total_spent / 100
      }
    });
  } catch (error) {
    console.error("Error fetching cliente details:", error);
    return res.status(500).json({ error: "Erro ao buscar detalhes do cliente" });
  }
}
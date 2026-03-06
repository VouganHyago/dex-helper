import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function topRejected(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const topUsers = await query<any[]>(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(*) as total_rejected,
        MAX(sr.requested_at) as last_rejection,
        GROUP_CONCAT(DISTINCT sr.reject_reason SEPARATOR '|||') as rejection_reasons
      FROM search_requests sr
      LEFT JOIN user u ON sr.user_id = u.id
      WHERE sr.status = 'rejected' AND u.name IS NOT NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY total_rejected DESC
      LIMIT 50
    `);

    const formattedData = topUsers.map(user => ({
      user_id: user.user_id,
      user_name: user.user_name || "Nome não disponível",
      user_email: user.user_email || "Email não disponível",
      total_rejected: user.total_rejected,
      last_rejection: user.last_rejection,
      rejection_reasons: user.rejection_reasons 
        ? user.rejection_reasons.split('|||').filter(Boolean)
        : []
    }));

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching top rejected:", error);
    return res.status(500).json({ error: "Erro ao buscar top rejeitados" });
  }
}
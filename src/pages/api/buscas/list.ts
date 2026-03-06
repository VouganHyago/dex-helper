import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function listBuscas(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const { status, limit = '100' } = req.query;
    
    let statusFilter = "";
    if (status && typeof status === "string" && status !== "all") {
      statusFilter = `WHERE sr.status = '${status}'`;
    }

    // Buscar as buscas
    const buscas = await query<any[]>(`
      SELECT 
        sr.*,
        u.name as user_name,
        u.email as user_email
      FROM search_requests sr
      LEFT JOIN user u ON sr.user_id = u.id
      ${statusFilter}
      ORDER BY sr.requested_at DESC
      LIMIT ${parseInt(limit as string)}
    `);

    // Calcular estatísticas
    const statsResult = await query<any[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
      FROM search_requests
    `);

    const stats = {
      total: parseInt(statsResult[0]?.total || 0),
      accepted: parseInt(statsResult[0]?.accepted || 0),
      rejected: parseInt(statsResult[0]?.rejected || 0),
      error: parseInt(statsResult[0]?.error || 0)
    };

    return res.status(200).json({
      buscas,
      stats
    });
  } catch (error) {
    console.error("Error fetching buscas:", error);
    return res.status(500).json({ error: "Erro ao buscar buscas" });
  }
}
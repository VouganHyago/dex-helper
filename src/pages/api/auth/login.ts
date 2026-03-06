import { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Dextino123@";

export default async function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    session.isLoggedIn = true;
    session.username = username;
    await session.save();
    
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: "Credenciais inválidas" });
}
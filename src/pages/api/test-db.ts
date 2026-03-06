import { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function testDb(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Testing database connection...");
    
    // Teste simples: contar usuários
    const result = await query<Array<{ total: number }>>(
      "SELECT COUNT(*) as total FROM user"
    );
    
    console.log("Query result:", result);
    
    return res.status(200).json({ 
      success: true, 
      userCount: result[0]?.total,
      message: "Conexão com banco OK!" 
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ 
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
  }
}
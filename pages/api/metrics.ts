// pages/api/metrics.ts
import { NextApiRequest, NextApiResponse } from "next";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await open({ filename: "./recognition-app.db", driver: sqlite3.Database });

  const recognitions = await db.all(`
    SELECT r.*, 
           s.name AS sender_name, s.avatar_url AS sender_avatar,
           rs.name AS recipient_name, rs.avatar_url AS recipient_avatar,
           v.name AS value_name,
           d.name AS sender_department, ad.name AS sender_area, td.name AS sender_team, bd.name AS sender_branch,
           dr.name AS recipient_department, ar.name AS recipient_area, tr.name AS recipient_team, br.name AS recipient_branch
    FROM recognitions r
    LEFT JOIN users s ON r.sender_id = s.id
    LEFT JOIN users rs ON r.recipient_id = rs.id
    LEFT JOIN values v ON r.value_id = v.id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN areas ad ON s.area_id = ad.id
    LEFT JOIN teams td ON s.team_id = td.id
    LEFT JOIN branches bd ON s.branch_id = bd.id
    LEFT JOIN departments dr ON rs.department_id = dr.id
    LEFT JOIN areas ar ON rs.area_id = ar.id
    LEFT JOIN teams tr ON rs.team_id = tr.id
    LEFT JOIN branches br ON rs.branch_id = br.id
  `);

  res.status(200).json({ recognitions });
}

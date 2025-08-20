import Database from "better-sqlite3";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "crypto";

const db = new Database("recognition-app.db");

// Inicializar base de datos con el esquema completo
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      area_id INTEGER NOT NULL,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      birthday DATE,
      position TEXT,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      branch_id INTEGER,
      area_id INTEGER,
      department_id INTEGER,
      team_id INTEGER,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS organization_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS recognitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      value_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id),
      FOREIGN KEY (value_id) REFERENCES organization_values(id)
    );
    CREATE TABLE IF NOT EXISTS recognition_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recognition_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recognition_id) REFERENCES recognitions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Insertar valores por defecto solo si no existen
  const existingValues = db.prepare("SELECT COUNT(*) as count FROM organization_values").get() as { count: number };

  if (existingValues.count === 0) {
    const insertValue = db.prepare(`
      INSERT INTO organization_values (name, description, icon, color) 
      VALUES (?, ?, ?, ?)
    `);

    const valuesData = [
      ["Innovación", "Buscar nuevas formas de hacer las cosas", "💡", "#3B82F6"],
      ["Colaboración", "Trabajar juntos hacia objetivos comunes", "🤝", "#10B981"],
      ["Excelencia", "Buscar la calidad en todo lo que hacemos", "⭐", "#F59E0B"],
      ["Integridad", "Actuar con honestidad y transparencia", "🛡️", "#8B5CF6"],
      ["Liderazgo", "Inspirar y guiar a otros", "👑", "#EF4444"],
      ["Compromiso", "Dedicación y responsabilidad", "💪", "#06B6D4"],
    ];

    for (const valueData of valuesData) {
      insertValue.run(...valueData);
    }
    insertValue.finalize();
  }
}

// Ejecutar inicialización
initializeDatabase();

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string | null;
  birthday?: string | null;
  position?: string | null;
  is_admin?: boolean;
  created_at: string;
  branch?: string | null;
  area?: string | null;
  department?: string | null;
  team?: string | null;
}

export interface Value {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface Recognition {
  id: number;
  sender_id: number;
  recipient_id: number;
  value_id: number;
  message: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
  sender_branch?: string | null;
  sender_area?: string | null;
  sender_department?: string | null;
  sender_team?: string | null;
  recipient_name?: string;
  recipient_avatar?: string | null;
  recipient_branch?: string | null;
  recipient_area?: string | null;
  recipient_department?: string | null;
  recipient_team?: string | null;
  value_name?: string;
  value_icon?: string;
  value_color?: string;
  likes?: number;
  comments?: Interaction[];
}

export interface Interaction {
  id: number;
  user_id: number;
  recognition_id: number;
  type: "like" | "comment";
  content?: string;
  created_at: string;
  user?: User;
}

// Funciones de autenticación
export async function createUser(
  email: string,
  password: string,
  name: string,
  position?: string,
  branch_id?: number,
  area_id?: number,
  department_id?: number,
  team_id?: number,
) {
  const hashedPassword = await hash(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (email, password, name, position, branch_id, area_id, department_id, team_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = stmt.run(email, hashedPassword, name, position, branch_id, area_id, department_id, team_id);
    return { id: result.lastInsertRowid, email, name, position, branch_id, area_id, department_id, team_id };
  } catch (error) {
    throw new Error("Email already exists");
  }
}

export async function authenticateUser(email: string, password: string) {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  const user = stmt.get(email) as any;

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function createSession(userId: number) {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `);

  stmt.run(sessionId, userId, expiresAt.toISOString());
  return sessionId;
}

export function getSessionUser(sessionId: string) {
  const stmt = db.prepare(`
    SELECT u.* FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `);

  const user = stmt.get(sessionId) as any;
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function deleteSession(sessionId: string) {
  const stmt = db.prepare("DELETE FROM sessions WHERE id = ?");
  stmt.run(sessionId);
}

// Funciones de datos
export function getAllUsers(): User[] {
  const stmt = db.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.avatar_url, 
      u.birthday, 
      u.position, 
      u.is_admin, 
      u.created_at,
      b.name AS branch,
      a.name AS area,
      d.name AS department,
      t.name AS team
    FROM users u
    LEFT JOIN branches b ON u.branch_id = b.id
    LEFT JOIN areas a ON u.area_id = a.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN teams t ON u.team_id = t.id
    ORDER BY u.name
  `);
  return stmt.all() as User[];
}

export function getAllValues(): Value[] {
  const stmt = db.prepare("SELECT * FROM organization_values ORDER BY name");
  return stmt.all() as Value[];
}

export function createRecognition(senderId: number, recipientId: number, valueId: number, message: string) {
  const stmt = db.prepare(`
    INSERT INTO recognitions (sender_id, recipient_id, value_id, message)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(senderId, recipientId, valueId, message);
  return result.lastInsertRowid;
}

export function getRecognitions(): Recognition[] {
  try {
    const stmt = db.prepare(`
      SELECT
        r.*,
        s.name AS sender_name, 
        s.avatar_url AS sender_avatar,
        s_branch.name AS sender_branch,
        s_area.name AS sender_area,
        s_dept.name AS sender_department,
        s_team.name AS sender_team,
        rec.name AS recipient_name, 
        rec.avatar_url AS recipient_avatar,
        r_branch.name AS recipient_branch,
        r_area.name AS recipient_area,
        r_dept.name AS recipient_department,
        r_team.name AS recipient_team,
        v.name AS value_name, 
        v.icon AS value_icon, 
        v.color AS value_color,
        COUNT(i.id) AS likes
      FROM recognitions r
      JOIN users s ON r.sender_id = s.id
      JOIN users rec ON r.recipient_id = rec.id
      JOIN organization_values v ON r.value_id = v.id
      LEFT JOIN branches s_branch ON s.branch_id = s_branch.id
      LEFT JOIN areas s_area ON s.area_id = s_area.id
      LEFT JOIN departments s_dept ON s.department_id = s_dept.id
      LEFT JOIN teams s_team ON s.team_id = s_team.id
      LEFT JOIN branches r_branch ON rec.branch_id = r_branch.id
      LEFT JOIN areas r_area ON rec.area_id = r_area.id
      LEFT JOIN departments r_dept ON rec.department_id = r_dept.id
      LEFT JOIN teams r_team ON rec.team_id = r_team.id
      LEFT JOIN recognition_interactions i ON r.id = i.recognition_id AND i.type = 'like'
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    return stmt.all() as Recognition[];
  } catch (error) {
    console.error("Error in getRecognitions:", error);
    throw error;
  }
}

export function addInteraction(userId: number, recognitionId: number, type: "like" | "comment", content?: string) {
  const stmt = db.prepare(`
    INSERT INTO recognition_interactions (user_id, recognition_id, type, content)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(userId, recognitionId, type, content);
  return result.lastInsertRowid;
}

export function getRecognitionStats() {
  const totalRecognitions = db.prepare("SELECT COUNT(*) as count FROM recognitions").get() as { count: number };
  const thisMonth = db
    .prepare(`
    SELECT COUNT(*) as count FROM recognitions 
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `)
    .get() as { count: number };

  const topRecipients = db
    .prepare(`
    SELECT u.name, u.avatar_url, COUNT(r.id) as count
    FROM users u
    JOIN recognitions r ON u.id = r.recipient_id
    GROUP BY u.id
    ORDER BY count DESC
    LIMIT 5
  `)
    .all();

  return {
    total: totalRecognitions.count,
    thisMonth: thisMonth.count,
    topRecipients,
  };
}

export default db;
import Database from "better-sqlite3";
import { hash } from "bcryptjs";
// Importaciones de initializeDatabase si son necesarias y no están ya
// import { randomBytes } from "crypto" // <-- Esta importación está en lib/database.ts, pero no parece usarse en initializeDatabase

const db = new Database("recognition-app.db");

// Función initializeDatabase copiada de lib/database.ts
function initializeDatabase() {
  // Crear tablas
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      birthday DATE,
      department TEXT, -- Mantener por compatibilidad
      position TEXT,
      area TEXT, -- Nueva columna para área
      team TEXT, -- Nueva columna para equipo
      is_admin BOOLEAN DEFAULT 0, -- Nueva columna para administradores
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS organization_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
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
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS recognition_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recognition_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
      content TEXT, -- Para comentarios
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recognition_id) REFERENCES recognitions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Insertar valores por defecto solo si no existen
  const existingValues = db.prepare("SELECT COUNT(*) as count FROM organization_values").get();


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
  }
}

async function populateDatabase() {
  initializeDatabase(); // Llamada a la función copiada localmente
  console.log("🚀 Poblando base de datos con datos de ejemplo...");

  try {
    // Limpiar datos existentes (opcional)
    // db.exec('DELETE FROM users WHERE id > 1');
    // db.exec('DELETE FROM recognitions');

    // Crear usuarios de ejemplo con fechas de cumpleaños
    const users = [
      {
        email: "admin@company.com",
        password: await hash("admin123", 10),
        name: "Administrador Sistema",
        department: "IT",
        position: "System Admin",
        area: "Tecnología",
        team: "Arquitectura",
        birthday: "1985-03-15",
        is_admin: 1,
      },
      {
        email: "maria.garcia@company.com",
        password: await hash("password123", 10),
        name: "María García",
        department: "IT",
        position: "Desarrolladora Senior",
        area: "Tecnología",
        team: "Desarrollo",
        birthday: "1990-12-25", // Navidad
        is_admin: 0,
      },
      {
        email: "carlos.lopez@company.com",
        password: await hash("password123", 10),
        name: "Carlos López",
        department: "Ventas",
        position: "Gerente de Ventas",
        area: "Comercial",
        team: "Ventas Norte",
        birthday: "1988-01-01", // Año nuevo
        is_admin: 0,
      },
      {
        email: "ana.martinez@company.com",
        password: await hash("password123", 10),
        name: "Ana Martínez",
        department: "Marketing",
        position: "Especialista en Marketing",
        area: "Comercial",
        team: "Marketing Digital",
        birthday: "1992-07-20",
        is_admin: 0,
      },
      {
        email: "luis.rodriguez@company.com",
        password: await hash("password123", 10),
        name: "Luis Rodríguez",
        department: "IT",
        position: "DevOps Engineer",
        area: "Tecnología",
        team: "Infraestructura",
        birthday: "1987-11-30",
        is_admin: 0,
      },
      {
        email: "sofia.hernandez@company.com",
        password: await hash("password123", 10),
        name: "Sofía Hernández",
        department: "RRHH",
        position: "Coordinadora de RRHH",
        area: "Recursos Humanos",
        team: "Gestión de Talento",
        birthday: "1991-06-15",
        is_admin: 0,
      },
    ];

    // Insertar usuarios
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (email, password, name, department, position, area, team, birthday, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const user of users) {
      insertUser.run(
        user.email,
        user.password,
        user.name,
        user.department,
        user.position,
        user.area,
        user.team,
        user.birthday,
        user.is_admin,
      );
      console.log(`✅ Usuario creado: ${user.name}`);
    }

    // Crear reconocimientos de ejemplo
    const recognitions = [
      {
        sender_id: 2, // María
        recipient_id: 3, // Carlos
        value_id: 2, // Colaboración
        message: "Excelente trabajo en el proyecto de la nueva plataforma. Tu colaboración fue clave para el éxito.",
      },
      {
        sender_id: 3, // Carlos
        recipient_id: 4, // Ana
        value_id: 1, // Innovación
        message: "Tu propuesta de automatización ahorró muchas horas de trabajo manual.",
      },
      {
        sender_id: 4, // Ana
        recipient_id: 5, // Luis
        value_id: 2, // Colaboración
        message: "Siempre dispuesto a ayudar al equipo cuando más lo necesitamos.",
      },
      {
        sender_id: 5, // Luis
        recipient_id: 2, // María
        value_id: 3, // Excelencia
        message: "Tu código siempre es impecable y bien documentado.",
      },
      {
        sender_id: 6, // Sofía
        recipient_id: 3, // Carlos
        value_id: 5, // Liderazgo
        message: "Excelente liderazgo durante la crisis del proyecto Q4.",
      },
    ];

    const insertRecognition = db.prepare(`
      INSERT INTO recognitions (sender_id, recipient_id, value_id, message)
      VALUES (?, ?, ?, ?)
    `);

    for (const recognition of recognitions) {
      insertRecognition.run(recognition.sender_id, recognition.recipient_id, recognition.value_id, recognition.message);
      console.log(`🏆 Reconocimiento creado`);
    }

    console.log("✨ Base de datos poblada exitosamente!");
    console.log("\n📋 Usuarios creados:")
    console.log("- admin@company.com / admin123 (ADMINISTRADOR)");
    console.log("- maria.garcia@company.com / password123");
    console.log("- carlos.lopez@company.com / password123");
    console.log("- ana.martinez@company.com / password123");
    console.log("- luis.rodriguez@company.com / password123");
    console.log("- sofia.hernandez@company.com / password123");
  } catch (error) {
    console.error("❌ Error poblando la base de datos:", error);
  } finally {
    db.close();
  }
}

populateDatabase();

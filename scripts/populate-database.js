import Database from "better-sqlite3"
import { hash } from "bcryptjs"

const db = new Database("recognition-app.db")

async function populateDatabase() {
  console.log("🚀 Poblando base de datos con datos de ejemplo...")

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
    ]

    // Insertar usuarios
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (email, password, name, department, position, area, team, birthday, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

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
      )
      console.log(`✅ Usuario creado: ${user.name}`)
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
    ]

    const insertRecognition = db.prepare(`
      INSERT INTO recognitions (sender_id, recipient_id, value_id, message)
      VALUES (?, ?, ?, ?)
    `)

    for (const recognition of recognitions) {
      insertRecognition.run(recognition.sender_id, recognition.recipient_id, recognition.value_id, recognition.message)
      console.log(`🏆 Reconocimiento creado`)
    }

    console.log("✨ Base de datos poblada exitosamente!")
    console.log("\n📋 Usuarios creados:")
    console.log("- admin@company.com / admin123 (ADMINISTRADOR)")
    console.log("- maria.garcia@company.com / password123")
    console.log("- carlos.lopez@company.com / password123")
    console.log("- ana.martinez@company.com / password123")
    console.log("- luis.rodriguez@company.com / password123")
    console.log("- sofia.hernandez@company.com / password123")
  } catch (error) {
    console.error("❌ Error poblando la base de datos:", error)
  } finally {
    db.close()
  }
}

populateDatabase()

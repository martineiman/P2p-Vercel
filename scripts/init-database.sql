-- Crear tablas para la aplicación de reconocimientos

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  birthday DATE,
  department TEXT,
  position TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de valores organizacionales
CREATE TABLE IF NOT EXISTS values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reconocimientos
CREATE TABLE IF NOT EXISTS recognitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  value_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (value_id) REFERENCES values(id)
);

-- Tabla de interacciones (likes, comentarios)
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  recognition_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
  content TEXT, -- Para comentarios
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (recognition_id) REFERENCES recognitions(id)
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insertar valores por defecto
INSERT OR IGNORE INTO values (name, description, icon, color) VALUES
('Innovación', 'Buscar nuevas formas de hacer las cosas', '💡', '#3B82F6'),
('Colaboración', 'Trabajar juntos hacia objetivos comunes', '🤝', '#10B981'),
('Excelencia', 'Buscar la calidad en todo lo que hacemos', '⭐', '#F59E0B'),
('Integridad', 'Actuar con honestidad y transparencia', '🛡️', '#8B5CF6'),
('Liderazgo', 'Inspirar y guiar a otros', '👑', '#EF4444'),
('Compromiso', 'Dedicación y responsabilidad', '💪', '#06B6D4');

-- Insertar usuario administrador por defecto
INSERT OR IGNORE INTO users (email, password, name, department, position) VALUES
('admin@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'IT', 'System Admin');

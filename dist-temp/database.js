"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.authenticateUser = authenticateUser;
exports.createSession = createSession;
exports.getSessionUser = getSessionUser;
exports.deleteSession = deleteSession;
exports.getAllUsers = getAllUsers;
exports.getAllValues = getAllValues;
exports.createRecognition = createRecognition;
exports.getRecognitions = getRecognitions;
exports.addInteraction = addInteraction;
exports.getRecognitionStats = getRecognitionStats;
var better_sqlite3_1 = require("better-sqlite3");
var bcryptjs_1 = require("bcryptjs");
var crypto_1 = require("crypto");
var db = new better_sqlite3_1.default("recognition-app.db");
// Inicializar base de datos con nombres de tabla seguros
function initializeDatabase() {
    // Crear tablas
    db.exec("\n    CREATE TABLE IF NOT EXISTS users (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      email TEXT UNIQUE NOT NULL,\n      password TEXT NOT NULL,\n      name TEXT NOT NULL,\n      avatar_url TEXT,\n      birthday DATE,\n      department TEXT, -- Mantener por compatibilidad\n      position TEXT,\n      area TEXT, -- Nueva columna para \u00E1rea\n      team TEXT, -- Nueva columna para equipo\n      is_admin BOOLEAN DEFAULT 0, -- Nueva columna para administradores\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n  ");
    db.exec("\n    CREATE TABLE IF NOT EXISTS organization_values (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      name TEXT NOT NULL,\n      description TEXT,\n      icon TEXT,\n      color TEXT,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    );\n  ");
    db.exec("\n    CREATE TABLE IF NOT EXISTS recognitions (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      sender_id INTEGER NOT NULL,\n      recipient_id INTEGER NOT NULL,\n      value_id INTEGER NOT NULL,\n      message TEXT NOT NULL,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (sender_id) REFERENCES users(id),\n      FOREIGN KEY (recipient_id) REFERENCES users(id),\n      FOREIGN KEY (value_id) REFERENCES organization_values(id)\n    );\n  ");
    db.exec("\n    CREATE TABLE IF NOT EXISTS recognition_interactions (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      recognition_id INTEGER NOT NULL,\n      user_id INTEGER NOT NULL,\n      type TEXT NOT NULL CHECK (type IN ('like', 'comment')),\n      content TEXT, -- Para comentarios\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (recognition_id) REFERENCES recognitions(id),\n      FOREIGN KEY (user_id) REFERENCES users(id)\n    );\n  ");
    db.exec("\n    CREATE TABLE IF NOT EXISTS sessions (\n      id TEXT PRIMARY KEY,\n      user_id INTEGER NOT NULL,\n      expires_at DATETIME NOT NULL,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      FOREIGN KEY (user_id) REFERENCES users(id)\n    );\n  ");
    // Insertar valores por defecto solo si no existen
    var existingValues = db.prepare("SELECT COUNT(*) as count FROM organization_values").get();
    if (existingValues.count === 0) {
        var insertValue = db.prepare("\n      INSERT INTO organization_values (name, description, icon, color) \n      VALUES (?, ?, ?, ?)\n    ");
        var valuesData = [
            ["Innovación", "Buscar nuevas formas de hacer las cosas", "💡", "#3B82F6"],
            ["Colaboración", "Trabajar juntos hacia objetivos comunes", "🤝", "#10B981"],
            ["Excelencia", "Buscar la calidad en todo lo que hacemos", "⭐", "#F59E0B"],
            ["Integridad", "Actuar con honestidad y transparencia", "🛡️", "#8B5CF6"],
            ["Liderazgo", "Inspirar y guiar a otros", "👑", "#EF4444"],
            ["Compromiso", "Dedicación y responsabilidad", "💪", "#06B6D4"],
        ];
        for (var _i = 0, valuesData_1 = valuesData; _i < valuesData_1.length; _i++) {
            var valueData = valuesData_1[_i];
            insertValue.run.apply(insertValue, valueData);
        }
    }
}
// Ejecutar inicialización
initializeDatabase();
// Funciones de autenticación
function createUser(email, password, name, department, position) {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, stmt, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, bcryptjs_1.hash)(password, 10)];
                case 1:
                    hashedPassword = _a.sent();
                    stmt = db.prepare("\n    INSERT INTO users (email, password, name, department, position)\n    VALUES (?, ?, ?, ?, ?)\n  ");
                    try {
                        result = stmt.run(email, hashedPassword, name, department, position);
                        return [2 /*return*/, { id: result.lastInsertRowid, email: email, name: name, department: department, position: position }];
                    }
                    catch (error) {
                        throw new Error("Email already exists");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function authenticateUser(email, password) {
    return __awaiter(this, void 0, void 0, function () {
        var stmt, user, isValid, _, userWithoutPassword;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stmt = db.prepare("SELECT * FROM users WHERE email = ?");
                    user = stmt.get(email);
                    if (!user) {
                        throw new Error("User not found");
                    }
                    return [4 /*yield*/, (0, bcryptjs_1.compare)(password, user.password)];
                case 1:
                    isValid = _a.sent();
                    if (!isValid) {
                        throw new Error("Invalid password");
                    }
                    _ = user.password, userWithoutPassword = __rest(user, ["password"]);
                    return [2 /*return*/, userWithoutPassword];
            }
        });
    });
}
function createSession(userId) {
    var sessionId = (0, crypto_1.randomBytes)(32).toString("hex");
    var expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    var stmt = db.prepare("\n    INSERT INTO sessions (id, user_id, expires_at)\n    VALUES (?, ?, ?)\n  ");
    stmt.run(sessionId, userId, expiresAt.toISOString());
    return sessionId;
}
function getSessionUser(sessionId) {
    var stmt = db.prepare("\n    SELECT u.* FROM users u\n    JOIN sessions s ON u.id = s.user_id\n    WHERE s.id = ? AND s.expires_at > datetime('now')\n  ");
    var user = stmt.get(sessionId);
    if (!user)
        return null;
    var _ = user.password, userWithoutPassword = __rest(user, ["password"]);
    return userWithoutPassword;
}
function deleteSession(sessionId) {
    var stmt = db.prepare("DELETE FROM sessions WHERE id = ?");
    stmt.run(sessionId);
}
// Funciones de datos
function getAllUsers() {
    var stmt = db.prepare("SELECT id, email, name, avatar_url, birthday, department, position, created_at FROM users ORDER BY name");
    return stmt.all();
}
function getAllValues() {
    var stmt = db.prepare("SELECT * FROM organization_values ORDER BY name");
    return stmt.all();
}
function createRecognition(senderId, recipientId, valueId, message) {
    var stmt = db.prepare("\n    INSERT INTO recognitions (sender_id, recipient_id, value_id, message)\n    VALUES (?, ?, ?, ?)\n  ");
    var result = stmt.run(senderId, recipientId, valueId, message);
    return result.lastInsertRowid;
}
function getRecognitions() {
    var stmt = db.prepare("\n    SELECT \n      r.*,\n      s.name as sender_name, s.avatar_url as sender_avatar,\n      rec.name as recipient_name, rec.avatar_url as recipient_avatar,\n      v.name as value_name, v.icon as value_icon, v.color as value_color,\n      COUNT(i.id) as likes\n    FROM recognitions r\n    JOIN users s ON r.sender_id = s.id\n    JOIN users rec ON r.recipient_id = rec.id\n    JOIN organization_values v ON r.value_id = v.id\n    LEFT JOIN interactions i ON r.id = i.recognition_id AND i.type = 'like'\n    GROUP BY r.id\n    ORDER BY r.created_at DESC\n  ");
    return stmt.all();
}
function addInteraction(userId, recognitionId, type, content) {
    var stmt = db.prepare("\n    INSERT INTO recognition_interactions (user_id, recognition_id, type, content)\n    VALUES (?, ?, ?, ?)\n  ");
    var result = stmt.run(userId, recognitionId, type, content);
    return result.lastInsertRowid;
}
function getRecognitionStats() {
    var totalRecognitions = db.prepare("SELECT COUNT(*) as count FROM recognitions").get();
    var thisMonth = db
        .prepare("\n    SELECT COUNT(*) as count FROM recognitions \n    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')\n  ")
        .get();
    var topRecipients = db
        .prepare("\n    SELECT u.name, u.avatar_url, COUNT(r.id) as count\n    FROM users u\n    JOIN recognitions r ON u.id = r.recipient_id\n    GROUP BY u.id\n    ORDER BY count DESC\n    LIMIT 5\n  ")
        .all();
    return {
        total: totalRecognitions.count,
        thisMonth: thisMonth.count,
        topRecipients: topRecipients,
    };
}
exports.default = db;

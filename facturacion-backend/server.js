// Importación de módulos necesarios
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// ************************************************
// 1. CONFIGURACIÓN DEL MIDDLEWARE
// ************************************************

// Habilita CORS para permitir que el frontend (Live Server) se conecte
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Middleware para parsear JSON
app.use(express.json());

// ************************************************
// 2. CONFIGURACIÓN DE LA BASE DE DATOS
// ************************************************

const db = new sqlite3.Database('./SQLite.db', (err) => {
    console.log("Usando base de datos:", require("path").resolve("./SQLite.db"));

    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');

        // Crear la tabla si no existe
        db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                contraseña_hash TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Error al crear la tabla de usuarios:", err.message);
            } else {
                console.log("Tabla 'usuarios' verificada o creada correctamente.");
            }
        });
    }
});

// ************************************************
// 3. RUTAS DE LA API
// ************************************************

// REGISTRO
app.post('/registrar', async (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({ error: 'Faltan nombre de empresa o contraseña.' });
    }

    try {
        const contraseña_hash = await bcrypt.hash(contraseña, SALT_ROUNDS);

        db.run(
            'INSERT INTO usuarios (nombre, contraseña_hash) VALUES (?, ?)',
            [nombre, contraseña_hash],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'El nombre de empresa ya está registrado.' });
                    }
                    console.error("Error en el registro:", err.message);
                    return res.status(500).json({ error: 'Error interno del servidor al registrar.' });
                }

                res.status(201).json({
                    mensaje: 'Usuario registrado con éxito',
                    id: this.lastID
                });
            }
        );
    } catch (error) {
        console.error("Error de hasheo:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// LOGIN
app.post('/iniciar-sesion', (req, res) => {
    const { nombre, contraseña } = req.body;

    if (!nombre || !contraseña) {
        return res.status(400).json({ error: 'Faltan usuario o contraseña.' });
    }

    db.get('SELECT * FROM usuarios WHERE nombre = ?', [nombre], async (err, user) => {
        if (err) {
            console.error("Error en la consulta:", err.message);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        try {
            const match = await bcrypt.compare(contraseña, user.contraseña_hash);

            if (match) {
                res.status(200).json({
                    mensaje: 'Inicio de sesión exitoso',
                    nombre: user.nombre
                });
            } else {
                res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
            }
        } catch (error) {
            console.error("Error al comparar contraseñas:", error);
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    });
});

// ************************************************
// 4. INICIO DEL SERVIDOR
// ************************************************

app.listen(PORT, () => {
    console.log(`\nServidor backend corriendo en: http://localhost:${PORT}`);
    console.log('Frontend debe correr en Live Server (http://127.0.0.1:5500)');
});


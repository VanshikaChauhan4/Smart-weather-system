import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import dotenv from 'dotenv';

import twilio from 'twilio';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'skyguard-super-secret';

// Initialize Twilio
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('Twilio client initialized');
  } catch (err) {
    console.error('Failed to initialize Twilio:', err);
  }
}

// Database Setup
const db = new Database('skyguard.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    lat REAL,
    lng REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // Middleware to check auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
      console.warn('Unauthorized access attempt: No token');
      return res.status(401).json({ error: 'Unauthorized: Please login' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        console.warn('Unauthorized access attempt: Invalid token');
        return res.status(403).json({ error: 'Invalid or expired session' });
      }
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
      if (!name || !email || !password) throw new Error('Missing fields');
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hashedPassword);
      const token = jwt.sign({ id: info.lastInsertRowid, email, name }, JWT_SECRET);
      res.cookie('token', token, { 
        httpOnly: true, 
        sameSite: 'none', 
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.json({ id: info.lastInsertRowid, name, email });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(400).json({ error: error.message === 'Missing fields' ? 'All fields are required' : 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email, name: user.name }, JWT_SECRET);
    res.cookie('token', token, { 
      httpOnly: true, 
      sameSite: 'none', 
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({ id: user.id, name: user.name, email });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // Contacts Routes
  app.get('/api/contacts', authenticateToken, (req: any, res) => {
    const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ?').all(req.user.id);
    res.json(contacts);
  });

  app.post('/api/contacts', authenticateToken, (req: any, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and Phone are required' });
    
    const existing = db.prepare('SELECT count(*) as count FROM contacts WHERE user_id = ?').get(req.user.id) as any;
    if (existing.count >= 5) return res.status(400).json({ error: 'Max 5 contacts allowed' });
    
    try {
      const info = db.prepare('INSERT INTO contacts (user_id, name, phone) VALUES (?, ?, ?)').run(req.user.id, name, phone);
      res.json({ id: info.lastInsertRowid, name, phone });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save contact. Please check your data.' });
    }
  });

  app.delete('/api/contacts/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Timer/SOS Routes
  app.post('/api/session/start', authenticateToken, (req: any, res) => {
    const { duration, lat, lng } = req.body;
    if (!duration) return res.status(400).json({ error: 'Duration is required' });

    const startTime = new Date().toISOString();
    db.prepare("UPDATE sessions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'").run(req.user.id);
    const info = db.prepare("INSERT INTO sessions (user_id, start_time, duration, lat, lng, status) VALUES (?, ?, ?, ?, ?, 'active')").run(req.user.id, startTime, duration, lat, lng);
    res.json({ id: info.lastInsertRowid, start_time: startTime, duration });
  });

  app.post('/api/session/checkin', authenticateToken, (req: any, res) => {
    db.prepare("UPDATE sessions SET status = 'completed' WHERE user_id = ? AND status = 'active'").run(req.user.id);
    res.json({ success: true });
  });

  app.get('/api/session/active', authenticateToken, (req: any, res) => {
    const session = db.prepare("SELECT * FROM sessions WHERE user_id = ? AND status = 'active' ORDER BY start_time DESC LIMIT 1").get(req.user.id);
    res.json(session || null);
  });

  // Weather Proxy
  app.get('/api/weather', async (req, res) => {
    try {
      const { lat, lon, city } = req.query;
      const API_KEY = process.env.OPENWEATHER_API_KEY;
      if (!API_KEY) throw new Error('Weather API key missing');

      let url = `https://api.openweathermap.org/data/2.5/weather?appid=${API_KEY}&units=metric`;
      if (city) url += `&q=${city}`;
      else url += `&lat=${lat}&lon=${lon}`;

      const response = await axios.get(url);
      
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?appid=${API_KEY}&units=metric&${city ? `q=${city}` : `lat=${lat}&lon=${lon}`}`;
      const forecastResponse = await axios.get(forecastUrl);

      res.json({
        current: response.data,
        forecast: forecastResponse.data
      });
    } catch (error: any) {
      console.error('Weather error:', error.message);
      res.status(500).json({ error: 'Weather data unavailable. Please try again later.' });
    }
  });

  // Background SOS Monitor
  setInterval(async () => {
    const activeSessions = db.prepare("SELECT * FROM sessions WHERE status = 'active'").all() as any[];
    const now = new Date().getTime();

    for (const session of activeSessions) {
      const startTime = new Date(session.start_time).getTime();
      const expirationTime = startTime + session.duration * 1000;

      if (now > expirationTime) {
        console.log(`[SOS] Triggered for Session ${session.id} (User ID: ${session.user_id})`);
        db.prepare("UPDATE sessions SET status = 'expired' WHERE id = ?").run(session.id);
        
        const contacts = db.prepare('SELECT * FROM contacts WHERE user_id = ?').all(session.user_id) as any[];
        const user: any = db.prepare('SELECT name FROM users WHERE id = ?').get(session.user_id);
        
        const mapsLink = `https://www.google.com/maps?q=${session.lat},${session.lng}`;
        const messageBody = `SKYGUARD SOS: ${user.name} didn't check in and may be in danger. Last location: ${mapsLink}`;

        console.log(`[SOS] Sending alerts to ${contacts.length} contacts...`);
        
        for (const contact of contacts) {
          console.log(`[SMS] To ${contact.name} (${contact.phone}): ${messageBody}`);
          
          if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            try {
              await twilioClient.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: contact.phone
              });
              console.log(`[SMS] Successfully sent to ${contact.phone}`);
            } catch (err: any) {
              console.error(`[SMS] Failed to send to ${contact.phone}:`, err.message);
            }
          } else {
            console.warn(`[SMS] Twilio not configured. Alert logged only.`);
          }
        }
      }
    }
  }, 5000); // Check every 5 seconds for better responsiveness

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

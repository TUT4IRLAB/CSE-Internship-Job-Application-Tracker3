
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in server/.env');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from server/.env');
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CORS - allow frontend on ports 3000 and 3001
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CareerTrack backend is running'
  });
});

// AUTHENTICATION MIDDLEWARE
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Please log in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = Number(payload.id);

    if (!Number.isInteger(req.userId)) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    next();
  } catch {
    return res.status(401).json({
      error: 'Your session has expired. Please log in again.'
    });
  }
}

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;

    if (!name || !email || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Name, email and password are required.'
      });
    }

    if (
      name.length > 100 ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        error: 'Please enter a valid name and email.'
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        error: 'Password must be between 8 and 128 characters.'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hash]
    );

    res.status(201).json({
      message: 'Account created successfully.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'This email is already registered.'
      });
    }

    res.status(500).json({ error: 'Registration failed.' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;

    if (!email || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Email and password are required.'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        error: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// CURRENT USER
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: 'Could not load profile.' });
  }
});

// GET APPLICATIONS
app.get('/api/applications', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, company, role, applied_on, status, url, notes
       FROM applications
       WHERE user_id = $1
       ORDER BY applied_on DESC, id DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Applications error:', error.message);
    res.status(500).json({ error: 'Could not load applications.' });
  }
});

// ADD APPLICATION
app.post('/api/applications', authenticate, async (req, res) => {
  try {
    const {
      company, role, applied_on, status, url, notes
    } = req.body;

    if (!company || !role || !applied_on) {
      return res.status(400).json({
        error: 'Company, role and date are required.'
      });
    }

    const allowed = ['applied', 'interview', 'offer', 'rejected'];

    if (!allowed.includes(status || 'applied')) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const result = await pool.query(
      `INSERT INTO applications
       (company, role, applied_on, status, url, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        company,
        role,
        applied_on,
        status || 'applied',
        url || '',
        notes || '',
        req.userId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Save error:', error.message);
    res.status(500).json({ error: 'Could not save application.' });
  }
});

// UPDATE APPLICATION
app.put('/api/applications/:id', authenticate, async (req, res) => {
  try {
    const {
      company, role, applied_on, status, url, notes
    } = req.body;

    const allowed = ['applied', 'interview', 'offer', 'rejected'];

    if (!company || !role || !applied_on || !allowed.includes(status)) {
      return res.status(400).json({
        error: 'Please provide valid application details.'
      });
    }

    const result = await pool.query(
      `UPDATE applications
       SET company = $1,
           role = $2,
           applied_on = $3,
           status = $4,
           url = $5,
           notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        company,
        role,
        applied_on,
        status,
        url || '',
        notes || '',
        req.params.id,
        req.userId
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Application not found.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update error:', error.message);
    res.status(500).json({ error: 'Could not update application.' });
  }
});

// DELETE APPLICATION
app.delete('/api/applications/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM applications
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Application not found.'
      });
    }

    res.json({ message: 'Application deleted.' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Could not delete application.' });
  }
});

// SEARCH ONLINE JOB OPPORTUNITIES
app.get('/api/jobs', async (req, res) => {
  try {
    const search = String(req.query.search || '').slice(0, 100);

    const response = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}&limit=30`
    );

    if (!response.ok) {
      throw new Error('Job service unavailable.');
    }

    const data = await response.json();

    const jobs = (data.jobs || []).map(job => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      url: job.url,
      posted: job.publication_date
    }));

    res.json({ jobs });
  } catch (error) {
    console.error('Job search error:', error.message);

    res.status(502).json({
      error: 'Job search is temporarily unavailable.'
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`CareerTrack backend running on http://localhost:${PORT}`);
});


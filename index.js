require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(limiter);

const JWT_SECRET = process.env.JWT_SECRET;

const db = new Client({
  user: process.env.PGUSER,
  host: 'database',
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [username, email, hashedPassword]
    );
    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0)
    return res.status(400).json({ message: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!validPassword)
    return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET);
  res.json({ token });
});

const verifyJWT = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

app.get('/getItems/:uid', verifyJWT, async (req, res) => {
  const { uid } = req.params;
  const item = await db.query('SELECT * FROM items WHERE uid = $1', [uid]);
  if (item.rows.length === 0)
    return res.status(404).json({ message: 'No items found for this user' });
  res.json(item.rows[0]);
});

app.get('/getItems/:uid', verifyJWT, async (req, res) => {
  const { uid } = req.params;
  const item = await db.query('SELECT * FROM items WHERE uid = $1', [uid]);
  if (item.rows.length === 0)
    return res.status(404).json({ message: 'No items found for this user' });
  res.json(item.rows[0]);
});

app.post('/createItem/:uid', verifyJWT, async (req, res) => {
  const { uid } = req.params;
  const { name, price, quantity } = req.body;
  try {
    await db.query(
      'INSERT INTO items (name, price, quantity, uid) VALUES ($1, $2, $3, $4)',
      [name, price, quantity, uid]
    );
    res.status(201).json({ message: 'Item created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/updateItem/:id/:uid', verifyJWT, async (req, res) => {
  const { uid, id } = req.params;
  const { name, price, quantity } = req.body;
  try {
    await db.query(
      'UPDATE items SET name = $1, price = $2, quantity = $3 WHERE id = $4 AND uid = $5',
      [name, price, quantity, id, uid]
    );
    res.status(200).json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/deleteItem/:id/:uid', verifyJWT, async (req, res) => {
  const { uid } = req.params;
  try {
    await db.query('DELETE FROM items WHERE id = $1 AND uid = $2', [id, uid]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(process.env.PORT, async () => {
  console.log(`Server listening on port ${process.env.PORT}`);
  db.connect();

  const createUserTableQuery = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `;

  const createItemTableQuery = `
    CREATE TABLE items (
      id SERIAL PRIMARY KEY,
      uid INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE
  );`;

  const tableExistsQuery = `
    SELECT tablename, EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = ANY($1)
    ) AS exists
    FROM (VALUES ('users'), ('items')) AS t(tablename);
  `;

  const res = await db.query(tableExistsQuery, [['users', 'items', 'orders']]);
  if (!res.rows[0].exists && !res.rows[1].exists) {
    db.query(createUserTableQuery)
      .then(() => {
        console.log('Users table created');
        return db.query(createItemTableQuery);
      })
      .then(() => {
        console.log('Items table created');
      })
      .catch((error) => {
        console.error('Error creating tables:', error);
      });
  } else {
    console.log('Tables already exist');
  }
});

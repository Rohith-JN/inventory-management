require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

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

app.get('/items', verifyJWT, async (req, res) => {
  const items = await db.query('SELECT * FROM items');
  res.json(items.rows);
});

app.get('/items/:id', verifyJWT, async (req, res) => {
  const { id } = req.params;
  const item = await db.query('SELECT * FROM items WHERE id = $1', [id]);
  if (item.rows.length === 0)
    return res.status(404).json({ message: 'Item not found' });
  res.json(item.rows[0]);
});

app.post('/items', verifyJWT, async (req, res) => {
  const { name, price, quantity } = req.body;
  try {
    await db.query(
      'INSERT INTO items (name, price, quantity) VALUES ($1, $2, $3)',
      [name, price, quantity]
    );
    res.status(201).json({ message: 'Item created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/items/:id', verifyJWT, async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity } = req.body;
  try {
    await db.query(
      'UPDATE items SET name = $1, price = $2, quantity = $3 WHERE id = $4',
      [name, price, quantity, id]
    );
    res.status(200).json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/items/:id', verifyJWT, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
  db.connect().then(() =>
    console.log(
      `Connected to database: inventory running on PORT ${process.env.PGPORT}`
    )
  );
  // run migration to create tables
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { jwtSecret } = require('../config/jwt.config');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    const token = jwt.sign({ id: result.insertId }, jwtSecret, { expiresIn: '1h' });
    
    res.status(201).json({ token, userId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    
    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    
    const token = jwt.sign({ id: users[0].id }, jwtSecret, { expiresIn: '1h' });
    res.json({ token, userId: users[0].id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
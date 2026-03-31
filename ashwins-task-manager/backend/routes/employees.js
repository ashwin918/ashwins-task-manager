const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get all employees (admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, email, department, is_active, created_at,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = users.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = users.id AND status = 'completed') as completed_tasks
       FROM users WHERE role = 'employee' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add employee (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, full_name, email, department } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ message: 'Username, password, and full name are required' });
  }
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const result = await pool.query(
      `INSERT INTO users (username, password, full_name, email, department, role)
       VALUES ($1, $2, $3, $4, $5, 'employee') RETURNING id, username, full_name, email, department, created_at`,
      [username, password, full_name, email, department]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update employee (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { full_name, email, department, password, is_active } = req.body;
  const { id } = req.params;
  try {
    let query = `UPDATE users SET full_name=$1, email=$2, department=$3, is_active=$4`;
    let params = [full_name, email, department, is_active];
    if (password) {
      query += `, password=$5 WHERE id=$6 RETURNING id, username, full_name, email, department, is_active`;
      params.push(password, id);
    } else {
      query += ` WHERE id=$5 RETURNING id, username, full_name, email, department, is_active`;
      params.push(id);
    }
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete employee (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [req.params.id, 'employee']);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

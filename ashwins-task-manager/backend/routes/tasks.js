const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get tasks - admin sees all, employee sees own
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `SELECT t.*, 
        u1.full_name as assigned_to_name, u1.username as assigned_to_username,
        u2.full_name as assigned_by_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.assigned_by = u2.id
        ORDER BY t.created_at DESC`;
      params = [];
    } else {
      query = `SELECT t.*, 
        u1.full_name as assigned_to_name, u1.username as assigned_to_username,
        u2.full_name as assigned_by_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.assigned_by = u2.id
        WHERE t.assigned_to = $1
        ORDER BY t.created_at DESC`;
      params = [req.user.id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single task
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u1.full_name as assigned_to_name, u2.full_name as assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    
    // Get activity log
    const updates = await pool.query(
      `SELECT tu.*, u.full_name FROM task_updates tu
       LEFT JOIN users u ON tu.updated_by = u.id
       WHERE tu.task_id = $1 ORDER BY tu.updated_at DESC`,
      [req.params.id]
    );
    res.json({ ...result.rows[0], updates: updates.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, assigned_to, priority, due_date } = req.body;
  if (!title || !assigned_to) {
    return res.status(400).json({ message: 'Title and assigned employee are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date, status, completion_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 0)
       RETURNING *`,
      [title, description, assigned_to, req.user.id, priority || 'medium', due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update task (admin can update all fields, employee can only update progress)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Task not found' });
    const task = existing.rows[0];

    if (req.user.role === 'employee' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own tasks' });
    }

    let updatedTask;
    if (req.user.role === 'admin') {
      const { title, description, assigned_to, priority, status, due_date, completion_percentage } = req.body;
      const result = await pool.query(
        `UPDATE tasks SET title=$1, description=$2, assigned_to=$3, priority=$4,
         status=$5, due_date=$6, completion_percentage=$7, updated_at=NOW()
         WHERE id=$8 RETURNING *`,
        [title, description, assigned_to, priority, status, due_date, completion_percentage, id]
      );
      updatedTask = result.rows[0];
    } else {
      const { completion_percentage, comment } = req.body;
      let status = task.status;
      if (completion_percentage === 100) status = 'completed';
      else if (completion_percentage > 0) status = 'in_progress';
      
      const result = await pool.query(
        `UPDATE tasks SET completion_percentage=$1, status=$2, updated_at=NOW()
         WHERE id=$3 RETURNING *`,
        [completion_percentage, status, id]
      );
      updatedTask = result.rows[0];

      // Log the update
      await pool.query(
        `INSERT INTO task_updates (task_id, updated_by, old_percentage, new_percentage, old_status, new_status, comment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, req.user.id, task.completion_percentage, completion_percentage, task.status, status, comment || null]
      );
    }
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete task (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    let stats;
    if (req.user.role === 'admin') {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status='completed') as completed,
          COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status='pending') as pending,
          COUNT(*) FILTER (WHERE status='on_hold') as on_hold,
          ROUND(AVG(completion_percentage), 1) as avg_completion,
          (SELECT COUNT(*) FROM users WHERE role='employee' AND is_active=TRUE) as total_employees
        FROM tasks
      `);
      stats = result.rows[0];
    } else {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status='completed') as completed,
          COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status='pending') as pending,
          ROUND(AVG(completion_percentage), 1) as avg_completion
        FROM tasks WHERE assigned_to = $1
      `, [req.user.id]);
      stats = result.rows[0];
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'pending', completion_percentage: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    axios.get('/api/tasks').then(r => setTasks(r.data));
    axios.get('/api/employees').then(r => setEmployees(r.data));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditTask(null); setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'pending', completion_percentage: 0 }); setError(''); setShowModal(true); };
  const openEdit = (t) => { setEditTask(t); setForm({ ...t, due_date: t.due_date ? t.due_date.split('T')[0] : '' }); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (editTask) await axios.put(`/api/tasks/${editTask.id}`, form);
      else await axios.post('/api/tasks', form);
      setShowModal(false); load();
      setSuccess(editTask ? 'Task updated!' : 'Task assigned!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await axios.delete(`/api/tasks/${id}`); load();
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>All Tasks</h1>
          <p style={styles.sub}>{tasks.length} total tasks</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Assign Task</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div style={styles.filters}>
        {['all', 'pending', 'in_progress', 'completed', 'on_hold'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
            <span style={styles.filterCount}>
              {f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.tableWrap}>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><h3>No tasks found</h3><p>Assign tasks to your team members</p></div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>{['Task', 'Assigned To', 'Priority', 'Status', 'Progress', 'Due Date', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.taskTitle}>{t.title}</div>
                    {t.description && <div style={styles.taskDesc}>{t.description.substring(0, 60)}{t.description.length > 60 ? '...' : ''}</div>}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.assignee}>
                      <div style={styles.miniAvatar}>{t.assigned_to_name?.[0]?.toUpperCase() || '?'}</div>
                      <span>{t.assigned_to_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td style={styles.td}><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                  <td style={styles.td}><span className={`badge badge-${t.status}`}>{t.status?.replace('_', ' ')}</span></td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="progress-bar-wrap" style={{ width: '70px' }}>
                        <div className="progress-bar-fill" style={{ width: `${t.completion_percentage}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text2)', minWidth: '30px' }}>{t.completion_percentage}%</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {t.due_date ? (
                      <span style={{ fontSize: '13px', color: new Date(t.due_date) < new Date() && t.status !== 'completed' ? 'var(--warn)' : 'var(--text2)' }}>
                        {new Date(t.due_date).toLocaleDateString()}
                      </span>
                    ) : <span style={{ color: 'var(--text3)', fontSize: '13px' }}>—</span>}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editTask ? 'Edit Task' : 'Assign New Task'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Task Title *</label>
                <input className="input" placeholder="Enter task title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input" rows={3} placeholder="Task details, requirements..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Assign To *</label>
                  <select className="input" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} required>
                    <option value="">Select employee...</option>
                    {employees.filter(e => e.is_active).map(e => (
                      <option key={e.id} value={e.id}>{e.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input className="input" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                {editTask && (
                  <div className="form-group">
                    <label>Status</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                )}
                {editTask && (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Completion: {form.completion_percentage}%</label>
                    <input type="range" min="0" max="100" value={form.completion_percentage}
                      onChange={e => setForm({ ...form, completion_percentage: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : editTask ? 'Update Task' : 'Assign Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '1400px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800' },
  sub: { color: 'var(--text2)', fontSize: '14px', marginTop: '4px' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' },
  filterActive: { background: 'rgba(108,99,255,0.12)', borderColor: 'var(--accent)', color: 'var(--accent2)' },
  filterCount: { background: 'var(--bg3)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' },
  tableWrap: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--bg2)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 20px', fontSize: '14px', verticalAlign: 'middle' },
  taskTitle: { fontWeight: '600', marginBottom: '2px' },
  taskDesc: { fontSize: '12px', color: 'var(--text3)', marginTop: '2px' },
  assignee: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  miniAvatar: { width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 },
};

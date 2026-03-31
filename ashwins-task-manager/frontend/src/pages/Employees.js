import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', email: '', department: '', is_active: true });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => axios.get('/api/employees').then(r => setEmployees(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditEmp(null); setForm({ username: '', password: '', full_name: '', email: '', department: '', is_active: true }); setError(''); setShowModal(true); };
  const openEdit = (emp) => { setEditEmp(emp); setForm({ ...emp, password: '' }); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (editEmp) {
        await axios.put(`/api/employees/${editEmp.id}`, form);
        setSuccess('Employee updated!');
      } else {
        await axios.post('/api/employees', form);
        setSuccess('Employee added!');
      }
      setShowModal(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    await axios.delete(`/api/employees/${id}`);
    load();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employees</h1>
          <p style={styles.sub}>{employees.length} team members</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div style={styles.grid}>
        {employees.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon">👥</div>
            <h3>No employees yet</h3>
            <p>Add your first team member to get started</p>
          </div>
        ) : employees.map(emp => (
          <div key={emp.id} style={styles.empCard}>
            <div style={styles.cardTop}>
              <div style={{ ...styles.avatar, opacity: emp.is_active ? 1 : 0.5 }}>{emp.full_name[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.empName}>{emp.full_name}</div>
                <div style={styles.empUser}>@{emp.username}</div>
              </div>
              {!emp.is_active && <span style={styles.inactiveBadge}>Inactive</span>}
            </div>

            {emp.email && <div style={styles.empInfo}>📧 {emp.email}</div>}
            {emp.department && <div style={styles.empInfo}>🏢 {emp.department}</div>}

            <div style={styles.empStats}>
              <div style={styles.stat}>
                <div style={styles.statVal}>{emp.total_tasks}</div>
                <div style={styles.statLbl}>Total</div>
              </div>
              <div style={styles.stat}>
                <div style={{ ...styles.statVal, color: 'var(--success)' }}>{emp.completed_tasks}</div>
                <div style={styles.statLbl}>Done</div>
              </div>
              <div style={styles.stat}>
                <div style={{ ...styles.statVal, color: 'var(--gold)' }}>{emp.total_tasks - emp.completed_tasks}</div>
                <div style={styles.statLbl}>Active</div>
              </div>
            </div>

            <div style={styles.actions}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}>✏️ Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>🗑️ Remove</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editEmp ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="input" placeholder="John Doe" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input className="input" placeholder="johndoe" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required disabled={!!editEmp} />
                </div>
                <div className="form-group">
                  <label>{editEmp ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="input" type="password" placeholder="Set password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editEmp} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="input" type="email" placeholder="john@company.com" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Department</label>
                  <input className="input" placeholder="Engineering, Sales, HR..." value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
                {editEmp && (
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: '8px' }} />
                      Active Employee
                    </label>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : editEmp ? 'Update' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800' },
  sub: { color: 'var(--text2)', fontSize: '14px', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  empCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '18px', color: '#fff', flexShrink: 0 },
  empName: { fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empUser: { fontSize: '13px', color: 'var(--text3)', marginTop: '2px' },
  inactiveBadge: { fontSize: '11px', background: 'rgba(255,107,107,0.1)', color: 'var(--warn)', padding: '2px 8px', borderRadius: '10px', flexShrink: 0 },
  empInfo: { fontSize: '13px', color: 'var(--text2)' },
  empStats: { display: 'flex', gap: '8px', background: 'var(--bg3)', borderRadius: '8px', padding: '12px' },
  stat: { flex: 1, textAlign: 'center' },
  statVal: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' },
  statLbl: { fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  actions: { display: 'flex', gap: '8px' },
};

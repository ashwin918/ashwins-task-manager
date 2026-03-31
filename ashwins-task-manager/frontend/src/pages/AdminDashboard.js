import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    axios.get('/api/tasks/stats/overview').then(r => setStats(r.data));
    axios.get('/api/tasks').then(r => setRecentTasks(r.data.slice(0, 5)));
  }, []);

  const statCards = stats ? [
    { label: 'Total Employees', value: stats.total_employees, icon: '👥', color: '#6c63ff' },
    { label: 'Total Tasks', value: stats.total_tasks, icon: '📋', color: '#4ecdc4' },
    { label: 'Completed', value: stats.completed, icon: '✅', color: '#51cf66' },
    { label: 'In Progress', value: stats.in_progress, icon: '⚡', color: '#ffd43b' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: '#ff9632' },
    { label: 'Avg. Completion', value: `${stats.avg_completion || 0}%`, icon: '📊', color: '#8b83ff' },
  ] : [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.sub}>Welcome back, <strong>{user?.full_name}</strong></p>
        </div>
        <div style={styles.dateChip}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <div key={i} style={{ ...styles.statCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Tasks</h2>
        <div style={styles.tableWrap}>
          {recentTasks.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>No tasks yet</h3><p>Create tasks from the Tasks section</p></div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Task', 'Assigned To', 'Priority', 'Status', 'Progress'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(t => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.taskTitle}>{t.title}</div>
                      {t.due_date && <div style={styles.due}>Due: {new Date(t.due_date).toLocaleDateString()}</div>}
                    </td>
                    <td style={styles.td}><span style={styles.empBadge}>{t.assigned_to_name || 'Unassigned'}</span></td>
                    <td style={styles.td}><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td style={styles.td}><span className={`badge badge-${t.status}`}>{t.status?.replace('_', ' ')}</span></td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-wrap" style={{ width: '80px' }}>
                          <div className="progress-bar-fill" style={{ width: `${t.completion_percentage}%` }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text2)', width: '30px' }}>{t.completion_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800' },
  sub: { color: 'var(--text2)', fontSize: '14px', marginTop: '4px' },
  dateChip: { padding: '8px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '13px', color: 'var(--text2)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', transition: 'transform 0.2s', cursor: 'default' },
  statValue: { fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '800', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: 'var(--text2)', marginTop: '6px' },
  section: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'var(--bg2)' },
  tr: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  td: { padding: '14px 24px', fontSize: '14px', verticalAlign: 'middle' },
  taskTitle: { fontWeight: '500', marginBottom: '2px' },
  due: { fontSize: '12px', color: 'var(--text3)' },
  empBadge: { fontSize: '13px', color: 'var(--accent2)', fontWeight: '500' },
};

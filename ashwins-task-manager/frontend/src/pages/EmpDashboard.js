import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function EmpDashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    axios.get('/api/tasks/stats/overview').then(r => setStats(r.data));
    axios.get('/api/tasks').then(r => setTasks(r.data.slice(0, 4)));
  }, []);

  const priorityColor = { low: 'var(--success)', medium: 'var(--gold)', high: '#ff9632', urgent: 'var(--warn)' };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Workspace</h1>
          <p style={styles.sub}>Welcome, <strong>{user?.full_name}</strong> {user?.department && `· ${user.department}`}</p>
        </div>
        <div style={styles.dateChip}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {stats && (
        <div style={styles.statsRow}>
          {[
            { label: 'Total Assigned', value: stats.total_tasks, color: 'var(--accent)', icon: '📋' },
            { label: 'Completed', value: stats.completed, color: 'var(--success)', icon: '✅' },
            { label: 'In Progress', value: stats.in_progress, color: 'var(--accent3)', icon: '⚡' },
            { label: 'Pending', value: stats.pending, color: 'var(--gold)', icon: '⏳' },
          ].map((s, i) => (
            <div key={i} style={{ ...styles.statCard, borderLeft: `3px solid ${s.color}` }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <div>
                <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
                <div style={styles.statLbl}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats && parseInt(stats.total_tasks) > 0 && (
        <div style={styles.progressSection}>
          <div style={styles.progressLabel}>
            <span>Overall Completion</span>
            <strong style={{ color: 'var(--accent2)' }}>{stats.avg_completion || 0}%</strong>
          </div>
          <div className="progress-bar-wrap" style={{ height: '10px' }}>
            <div className="progress-bar-fill" style={{ width: `${stats.avg_completion || 0}%` }} />
          </div>
        </div>
      )}

      <h2 style={styles.sectionTitle}>Recent Tasks</h2>
      <div style={styles.taskGrid}>
        {tasks.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon">🎉</div>
            <h3>No tasks assigned yet</h3>
            <p>Your tasks will appear here once assigned by admin</p>
          </div>
        ) : tasks.map(t => (
          <div key={t.id} style={{ ...styles.taskCard, borderTop: `3px solid ${priorityColor[t.priority]}` }}>
            <div style={styles.taskHead}>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              <span className={`badge badge-${t.status}`}>{t.status?.replace('_', ' ')}</span>
            </div>
            <div style={styles.taskName}>{t.title}</div>
            {t.description && <div style={styles.taskDesc}>{t.description.substring(0, 80)}{t.description.length > 80 ? '...' : ''}</div>}
            <div style={styles.taskFoot}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Progress</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-bar-wrap" style={{ width: '80px' }}>
                    <div className="progress-bar-fill" style={{ width: `${t.completion_percentage}%` }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent2)' }}>{t.completion_percentage}%</span>
                </div>
              </div>
              {t.due_date && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Due</div>
                  <div style={{ fontSize: '13px', color: new Date(t.due_date) < new Date() && t.status !== 'completed' ? 'var(--warn)' : 'var(--text2)' }}>
                    {new Date(t.due_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '1100px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800' },
  sub: { color: 'var(--text2)', fontSize: '14px', marginTop: '4px' },
  dateChip: { padding: '8px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '13px', color: 'var(--text2)' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' },
  statVal: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800', lineHeight: 1 },
  statLbl: { fontSize: '13px', color: 'var(--text2)', marginTop: '4px' },
  progressSection: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '28px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text2)', marginBottom: '10px' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '16px' },
  taskGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  taskCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  taskHead: { display: 'flex', gap: '8px' },
  taskName: { fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '15px' },
  taskDesc: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 },
  taskFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function EmpTasks() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [pct, setPct] = useState(0);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => axios.get('/api/tasks').then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);

  const openTask = async (task) => {
    setSelected(task);
    setPct(task.completion_percentage);
    setComment('');
    const res = await axios.get(`/api/tasks/${task.id}`);
    setDetails(res.data);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/tasks/${selected.id}`, { completion_percentage: pct, comment });
      setSuccess('Progress updated!');
      load();
      const res = await axios.get(`/api/tasks/${selected.id}`);
      setDetails(res.data);
      setSelected({ ...selected, completion_percentage: pct });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const priorityColor = { low: 'var(--success)', medium: 'var(--gold)', high: '#ff9632', urgent: 'var(--warn)' };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Tasks</h1>
          <p style={styles.sub}>{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div style={styles.filters}>
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}>
            {f === 'all' ? 'All' : f.replace('_', ' ')}
            <span style={styles.filterCount}>{f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length}</span>
          </button>
        ))}
      </div>

      <div style={styles.layout}>
        {/* Task List */}
        <div style={styles.taskList}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎉</div>
              <h3>No tasks here</h3>
              <p>Nothing in this category</p>
            </div>
          ) : filtered.map(t => (
            <div key={t.id}
              onClick={() => openTask(t)}
              style={{ ...styles.taskItem, ...(selected?.id === t.id ? styles.taskItemActive : {}), borderLeft: `3px solid ${priorityColor[t.priority]}` }}>
              <div style={styles.itemTop}>
                <span className={`badge badge-${t.status}`} style={{ fontSize: '11px' }}>{t.status?.replace('_', ' ')}</span>
                <span className={`badge badge-${t.priority}`} style={{ fontSize: '11px' }}>{t.priority}</span>
              </div>
              <div style={styles.itemTitle}>{t.title}</div>
              <div style={styles.itemProgress}>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${t.completion_percentage}%` }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--accent2)', fontWeight: '600', minWidth: '30px', textAlign: 'right' }}>{t.completion_percentage}%</span>
              </div>
              {t.due_date && (
                <div style={{ fontSize: '12px', color: new Date(t.due_date) < new Date() && t.status !== 'completed' ? 'var(--warn)' : 'var(--text3)', marginTop: '6px' }}>
                  📅 {new Date(t.due_date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Task Detail */}
        <div style={styles.taskDetail}>
          {!selected ? (
            <div style={styles.noSelect}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text2)' }}>Select a task</h3>
              <p style={{ color: 'var(--text3)', fontSize: '14px', marginTop: '6px' }}>Click on a task to view details and update progress</p>
            </div>
          ) : (
            <div>
              <div style={styles.detailHeader}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span className={`badge badge-${selected.priority}`}>{selected.priority}</span>
                  <span className={`badge badge-${selected.status}`}>{selected.status?.replace('_', ' ')}</span>
                </div>
                <h2 style={styles.detailTitle}>{selected.title}</h2>
                {details?.description && <p style={styles.detailDesc}>{details.description}</p>}
                <div style={styles.detailMeta}>
                  {details?.assigned_by_name && <span>👤 Assigned by: <strong>{details.assigned_by_name}</strong></span>}
                  {details?.due_date && <span>📅 Due: <strong>{new Date(details.due_date).toLocaleDateString()}</strong></span>}
                </div>
              </div>

              <div style={styles.updateBox}>
                <h3 style={styles.updateTitle}>Update Progress</h3>
                <div style={styles.pctDisplay}>
                  <span style={styles.pctNumber}>{pct}%</span>
                  <span style={styles.pctLabel}>
                    {pct === 0 ? 'Not started' : pct < 25 ? 'Just started' : pct < 50 ? 'Early stage' : pct < 75 ? 'Halfway there' : pct < 100 ? 'Almost done!' : '✅ Complete!'}
                  </span>
                </div>
                <input
                  type="range" min="0" max="100" value={pct}
                  onChange={e => setPct(parseInt(e.target.value))}
                  style={styles.slider}
                  disabled={selected.status === 'completed' && pct === 100}
                />
                <div style={styles.pctMarks}>
                  {[0, 25, 50, 75, 100].map(v => (
                    <button key={v} onClick={() => setPct(v)} style={{ ...styles.pctBtn, ...(pct === v ? styles.pctBtnActive : {}) }}>{v}%</button>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Comment (optional)</label>
                  <textarea className="input" rows={2} placeholder="Add a note about your progress..." value={comment} onChange={e => setComment(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <button className="btn btn-primary" onClick={handleUpdate} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? '⏳ Updating...' : '✓ Update Progress'}
                </button>
              </div>

              {details?.updates?.length > 0 && (
                <div style={styles.activityLog}>
                  <h3 style={styles.updateTitle}>Activity Log</h3>
                  {details.updates.map(u => (
                    <div key={u.id} style={styles.logItem}>
                      <div style={styles.logDot} />
                      <div>
                        <div style={styles.logText}>
                          Updated from <strong>{u.old_percentage}%</strong> → <strong style={{ color: 'var(--accent2)' }}>{u.new_percentage}%</strong>
                          {u.old_status !== u.new_status && <span style={{ color: 'var(--text3)' }}> · status: {u.new_status?.replace('_', ' ')}</span>}
                        </div>
                        {u.comment && <div style={styles.logComment}>"{u.comment}"</div>}
                        <div style={styles.logTime}>{new Date(u.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px', maxWidth: '1200px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800' },
  sub: { color: 'var(--text2)', fontSize: '14px', marginTop: '4px' },
  filters: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' },
  filterActive: { background: 'rgba(108,99,255,0.12)', borderColor: 'var(--accent)', color: 'var(--accent2)' },
  filterCount: { background: 'var(--bg3)', padding: '1px 7px', borderRadius: '10px', fontSize: '11px' },
  layout: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  taskItem: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' },
  taskItemActive: { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent), var(--shadow2)' },
  itemTop: { display: 'flex', gap: '6px', marginBottom: '8px' },
  itemTitle: { fontWeight: '600', fontSize: '14px', marginBottom: '10px', lineHeight: 1.3 },
  itemProgress: { display: 'flex', alignItems: 'center', gap: '8px' },
  taskDetail: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px', minHeight: '400px' },
  noSelect: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center' },
  detailHeader: { marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' },
  detailTitle: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '10px', lineHeight: 1.3 },
  detailDesc: { color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '12px' },
  detailMeta: { display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text2)', flexWrap: 'wrap' },
  updateBox: { background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' },
  updateTitle: { fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px', marginBottom: '16px' },
  pctDisplay: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' },
  pctNumber: { fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: '800', color: 'var(--accent2)' },
  pctLabel: { fontSize: '14px', color: 'var(--text2)' },
  slider: { width: '100%', accentColor: 'var(--accent)', height: '6px', marginBottom: '12px', cursor: 'pointer' },
  pctMarks: { display: 'flex', gap: '8px', marginBottom: '4px' },
  pctBtn: { flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' },
  pctBtnActive: { background: 'rgba(108,99,255,0.15)', borderColor: 'var(--accent)', color: 'var(--accent2)', fontWeight: '600' },
  activityLog: { borderTop: '1px solid var(--border)', paddingTop: '20px' },
  logItem: { display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' },
  logDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginTop: '5px', flexShrink: 0 },
  logText: { fontSize: '13px', color: 'var(--text2)', marginBottom: '3px' },
  logComment: { fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic', marginBottom: '3px' },
  logTime: { fontSize: '12px', color: 'var(--text3)' },
};

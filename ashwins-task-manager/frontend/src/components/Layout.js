import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navAdmin = [
  { to: '/admin', label: 'Dashboard', icon: '⬡', end: true },
  { to: '/admin/employees', label: 'Employees', icon: '👥' },
  { to: '/admin/tasks', label: 'All Tasks', icon: '✓' },
];

const navEmp = [
  { to: '/dashboard', label: 'My Dashboard', icon: '⬡', end: true },
  { to: '/dashboard/tasks', label: 'My Tasks', icon: '✓' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'admin' ? navAdmin : navEmp;

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={styles.wrap}>
      <aside style={styles.sidebar}>
        <div style={styles.sideTop}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>A</div>
            <div>
              <div style={styles.brandName}>Ashwin's</div>
              <div style={styles.brandSub}>Task Manager</div>
            </div>
          </div>

          <div style={styles.userCard}>
            <div style={styles.avatar}>{user?.full_name?.[0]?.toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.userName}>{user?.full_name}</div>
              <div style={styles.userRole}>{user?.role === 'admin' ? '🔑 Administrator' : '👤 Employee'}</div>
            </div>
          </div>

          <nav style={styles.nav}>
            {nav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navActive : {}),
                })}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          ↩ Sign Out
        </button>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: '240px',
    minHeight: '100vh',
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
  },
  sideTop: { display: 'flex', flexDirection: 'column', gap: '24px' },
  brand: { display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' },
  brandIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '18px', color: '#fff',
  },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px', lineHeight: 1.2 },
  brandSub: { fontSize: '11px', color: 'var(--text3)' },
  userCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px', borderRadius: '10px',
    background: 'var(--bg3)', border: '1px solid var(--border)',
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px', color: '#fff',
    flexShrink: 0,
  },
  userName: { fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: '11px', color: 'var(--text3)', marginTop: '2px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '8px',
    fontSize: '14px', fontWeight: '500', color: 'var(--text2)',
    transition: 'all 0.15s',
    textDecoration: 'none',
  },
  navActive: {
    background: 'rgba(108,99,255,0.12)', color: 'var(--accent2)',
    borderLeft: '2px solid var(--accent)',
    paddingLeft: '10px',
  },
  navIcon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  logoutBtn: {
    width: '100%', padding: '10px', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text3)', fontSize: '14px', fontWeight: '500',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  main: { flex: 1, overflow: 'auto', background: 'var(--bg)' },
};

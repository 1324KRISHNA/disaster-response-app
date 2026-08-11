import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CloudRain, Map as MapIcon, AlertTriangle, FileText, Settings, LogOut, Bell, Moon, Sun } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Layout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, title: 'Dashboard' },
    ...(user.role !== 'field_agent' ? [{ path: '/weather', icon: CloudRain, title: 'Weather Data' }] : []),
    { path: '/map', icon: MapIcon, title: 'Live Map' },
    { path: '/alerts', icon: AlertTriangle, title: 'Alerts' },
    ...(user.role !== 'field_agent' ? [{ path: '/reports', icon: FileText, title: 'Reports' }] : []),
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '80px', borderRadius: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', zIndex: 10 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-blue), #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '48px' }}>
          <AlertTriangle color="white" size={24} />
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)' }} title={item.title}>
                <Icon size={24} />
              </Link>
            );
          })}
        </nav>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <button onClick={() => setIsDark(!isDark)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Toggle Theme">
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Settings">
            <Settings size={24} />
          </button>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Logout">
            <LogOut size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--glass-border)', zIndex: 10 }}>
          <h2 style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>{title}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontSize: '13px', fontWeight: '600' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }}></div>
              All Systems Operational
            </div>
            <button onClick={() => navigate('/alerts')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative' }} title="View Alerts">
              <Bell size={20} />
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'var(--accent-red)', borderRadius: '50%' }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '24px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {getInitials(user.name)}
              </div>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

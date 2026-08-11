import React, { useState } from 'react';
import Layout from '../components/Layout';
import { AlertTriangle, Info, ShieldAlert, Search, Filter } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';
import { useNavigate } from 'react-router-dom';
import LocationName from '../components/LocationName';

export default function Alerts() {
  const { incidents } = useIncidents();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const getStyleForType = (type) => {
    switch (type) {
      case 'CRITICAL': return { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'WARNING': return { color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'ADVISORY': return { color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.1)' };
      default: return { color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const getIconForType = (type, color) => {
    switch (type) {
      case 'CRITICAL': return <ShieldAlert size={20} color={color} />;
      case 'WARNING': return <AlertTriangle size={20} color={color} />;
      case 'ADVISORY': return <Info size={20} color={color} />;
      default: return <Info size={20} color={color} />;
    }
  };

  const filteredAlerts = incidents.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) || a.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <Layout title="Active Alerts">
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Search alerts by title or location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '48px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={18} style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }} color="var(--text-secondary)" />
            <select
              className="glass-input"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{ 
                paddingLeft: '44px', 
                width: 'auto', 
                appearance: 'auto',
                color: severityFilter === 'CRITICAL' ? 'var(--accent-red)' : 
                       severityFilter === 'WARNING' ? 'var(--accent-amber)' : 
                       severityFilter === 'ADVISORY' ? 'var(--accent-blue)' : 'var(--text-primary)'
              }}
            >
              <option value="ALL" style={{ color: 'var(--text-primary)' }}>All Severities</option>
              <option value="CRITICAL" style={{ color: 'var(--accent-red)' }}>Critical</option>
              <option value="WARNING" style={{ color: 'var(--accent-amber)' }}>Warning</option>
              <option value="ADVISORY" style={{ color: 'var(--accent-blue)' }}>Advisory</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAlerts.map(alert => {
            const style = getStyleForType(alert.severity);
            return (
              <div key={alert.id} className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ background: style.bg, padding: '12px', borderRadius: '50%' }}>
                  {getIconForType(alert.severity, style.color)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{alert.title}</h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${style.color}`, color: style.color, fontWeight: '600', letterSpacing: '1px' }}>
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                        {alert.type}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(alert.time).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: '500' }}>
                    <LocationName lat={alert.lat} lng={alert.lng} />
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>{alert.desc}</p>
                </div>
                <div>
                  <button onClick={() => navigate('/map', { state: { lat: alert.lat, lng: alert.lng } })} className="glass-button" style={{ padding: '8px 16px', fontSize: '12px', width: 'auto' }}>
                    View Map
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredAlerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              No alerts match your search criteria.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

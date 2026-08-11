import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';
import LocationName from './LocationName';

export default function ReportModal({ isOpen, onClose, coordinates }) {
  const { reportIncident } = useIncidents();
  const [type, setType] = useState('FLOOD');
  const [severity, setSeverity] = useState('WARNING');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    reportIncident({
      type,
      severity,
      title: `${type} REPORTED`,
      desc,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });
    setDesc('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        
        <h3 style={{ margin: '0 0 24px 0', color: 'var(--text-primary)' }}>Report an Incident</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Coordinates</label>
            <div className="glass-input" style={{ opacity: 0.7, padding: '10px 14px', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
              {coordinates ? <LocationName lat={coordinates.lat} lng={coordinates.lng} /> : 'Unknown Location'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Incident Type</label>
            <select className="glass-input" value={type} onChange={e => setType(e.target.value)}>
              <option value="FLOOD">Flood</option>
              <option value="WILDFIRE">Wildfire</option>
              <option value="EARTHQUAKE">Earthquake</option>
              <option value="CYCLONE">Cyclone</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Severity</label>
            <select className="glass-input" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="ADVISORY">Advisory</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="glass-input" rows="3" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Briefly describe the situation..."></textarea>
          </div>

          <button type="submit" className="glass-button" style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--accent-green)', color: '#000' }}>
            <Send size={16} /> Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}

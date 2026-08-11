import React, { useState } from 'react';
import Layout from '../components/Layout';
import { User, Bell, Map as MapIcon, Shield } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useIncidents } from '../context/IncidentContext';

export default function Settings() {
  const { user, updateProfile } = useUser();
  const { reportIncident } = useIncidents();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateProfile(name, email);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <Layout title="System Settings">
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Profile Settings */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <User size={20} color="var(--accent-blue)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Profile Settings</h3>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" className="glass-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email Address</label>
              <input type="email" className="glass-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Bell size={20} color="var(--accent-amber)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Notification Preferences</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                defaultChecked 
                onChange={(e) => {
                  if (e.target.checked) {
                    reportIncident({
                      type: 'TEST',
                      lat: 0,
                      lng: 0,
                      severity: 'ADVISORY',
                      title: 'Test Alert Banner',
                      desc: 'This is a sample of how alerts will appear on your screen.'
                    });
                  }
                }}
              />
              <span style={{ fontSize: '14px' }}>Enable Global Alert Banners</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                defaultChecked 
                onChange={(e) => {
                  if (e.target.checked) {
                    reportIncident({
                      type: 'TEST',
                      lat: 0,
                      lng: 0,
                      severity: 'CRITICAL',
                      title: 'Siren Test Alert',
                      desc: 'This is a sample of how critical alerts will sound.'
                    });
                  }
                }}
              />
              <span style={{ fontSize: '14px' }}>Play Siren Sound for Critical Alerts</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: '14px' }}>Receive Email Digests</span>
            </label>
          </div>
        </div>

        {/* Map Preferences */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <MapIcon size={20} color="var(--accent-green)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Map Preferences</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: '14px' }}>Auto-fly to reported incidents</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span style={{ fontSize: '14px' }}>Show USGS live earthquake data</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
          {isSaved && <span style={{ color: 'var(--accent-green)', fontSize: '14px' }}>Saved successfully!</span>}
          <button className="glass-button" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)' }}>Cancel</button>
          <button onClick={handleSave} className="glass-button" style={{ width: 'auto', background: 'var(--accent-green)', color: '#000' }}>Save Changes</button>
        </div>

      </div>
    </Layout>
  );
}

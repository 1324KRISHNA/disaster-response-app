import React from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import LiveMap from '../components/LiveMap';

export default function MapFullScreen() {
  const location = useLocation();
  const searchCenter = location.state && location.state.lat && location.state.lng 
    ? { lat: location.state.lat, lng: location.state.lng } 
    : null;

  return (
    <Layout title="Live Disaster Map">
      <div style={{ padding: '24px', height: '100%', boxSizing: 'border-box' }}>
        <div className="glass-panel" style={{ width: '100%', height: 'calc(100vh - 120px)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
          <LiveMap searchCenter={searchCenter} />
        </div>
      </div>
    </Layout>
  );
}

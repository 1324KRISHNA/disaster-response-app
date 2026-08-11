import React from 'react';
import Layout from '../components/Layout';
import { useLocation } from 'react-router-dom';

export default function PlaceholderPage({ title }) {
  const location = useLocation();
  const description = {
    '/weather': 'Real-time weather data and trends from NOAA and OpenWeatherMap will appear here.',
    '/map': 'Full-screen interactive Live Disaster Map with detailed layers will appear here.',
    '/alerts': 'Comprehensive list of all historical and active alerts with filtering will appear here.',
    '/reports': 'PDF report generation and historical data logs will appear here.'
  }[location.pathname] || 'Module under development.';

  return (
    <Layout title={title}>
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>{title} Module</h2>
        <p style={{ textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
          {description}
        </p>
        <div style={{ marginTop: '32px', padding: '16px 32px', border: '1px dashed var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
          Coming in Phase 2
        </div>
      </div>
    </Layout>
  );
}

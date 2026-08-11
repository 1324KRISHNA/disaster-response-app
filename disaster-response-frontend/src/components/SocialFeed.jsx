import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function SocialFeed({ onReportClick }) {
  const [feed, setFeed] = useState([]);
  const feedRef = useRef(null);
  
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/social/feed');
        const data = await response.json();
        setFeed(data);
      } catch (err) {
        console.error("Failed to fetch social feed:", err);
      }
    };

    fetchFeed(); // Initial fetch
    
    // Poll for new social feed data
    const interval = setInterval(fetchFeed, 4500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel" style={{
      width: '320px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--glass-border)',
      background: 'rgba(15, 23, 42, 0.7)',
      borderRadius: 0
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={20} color="#3b82f6" />
        <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Citizen Intel Feed</h3>
        <span style={{ marginLeft: 'auto', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>LIVE</span>
      </div>
      
      <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {feed.filter(Boolean).map((post, i) => (
          <div key={i} onClick={() => onReportClick && onReportClick(post)} style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            animation: 'slideInRight 0.4s ease-out'
          }}
          className="hover-bg-light"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>{post?.user}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                <Clock size={12} /> {post?.time}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: 1.4 }}>{post?.text}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
               <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>#{post?.type}</span>
               <button style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                 <CheckCircle2 size={12} /> Verify
               </button>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .hover-bg-light:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

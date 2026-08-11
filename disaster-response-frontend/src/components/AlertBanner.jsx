import React, { useEffect, useState } from 'react';
import { useIncidents } from '../context/IncidentContext';
import { ShieldAlert, X } from 'lucide-react';

export default function AlertBanner() {
  const { latestIncident, clearLatest } = useIncidents();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (latestIncident) {
      setVisible(true);
      // Play a siren sound (mocking with a basic browser beep or audio API)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1);
      } catch (e) {
        console.warn("Audio play failed", e);
      }

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(clearLatest, 500); // Wait for transition
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestIncident, clearLatest]);

  if (!latestIncident) return null;

  return (
    <div style={{
      position: 'fixed',
      top: visible ? '20px' : '-100px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      transition: 'top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      background: 'rgba(239, 68, 68, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(239, 68, 68, 0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      minWidth: '400px'
    }}>
      <ShieldAlert size={28} className="pulse-critical" />
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>NEW INCIDENT REPORTED</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          {latestIncident.title} - {latestIncident.desc}
        </p>
      </div>
      <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
        <X size={20} />
      </button>
    </div>
  );
}

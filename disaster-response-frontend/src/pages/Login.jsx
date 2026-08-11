import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveWallpaper from '../components/LiveWallpaper';
import { Activity, ShieldAlert, Satellite, RadioReceiver, User, ShieldHalf } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState('commander'); // 'commander' or 'field_agent'
  const navigate = useNavigate();
  const { updateRole, updateProfile } = useUser();
  const panelRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!panelRef.current) return;
    const { left, top, width, height } = panelRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    
    // Slight 3D tilt effect
    panelRef.current.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!panelRef.current) return;
    panelRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
    panelRef.current.style.transition = 'transform 0.5s ease';
  };

  const handleMouseEnter = () => {
    if (!panelRef.current) return;
    panelRef.current.style.transition = 'none';
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (isSignup) {
      if (email && phone && password) {
        setOtpSent(true);
      }
    } else {
      if (email && password) {
        updateRole(selectedRole);
        updateProfile(email.split('@')[0], email);
        navigate('/dashboard');
      }
    }
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (otp.length === 6 || otp === '123456') {
      updateRole(selectedRole);
      updateProfile(email.split('@')[0], email);
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LiveWallpaper />
      
      <header className="glass-panel" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0', padding: '12px 24px', display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px', color: 'var(--accent-green)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }}></div>
          SYSTEM ACTIVE
        </div>
        
        <div className="ticker-wrap" style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <div className="ticker-content" style={{ display: 'flex', gap: '48px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Satellite size={14} /> NASA EarthData: LIVE</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RadioReceiver size={14} /> USGS Seismic API: 12ms ping</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> IoT Sensors: 128/128 Online</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Weather API: Syncing...</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Satellite size={14} /> NASA EarthData: LIVE</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RadioReceiver size={14} /> USGS Seismic API: 12ms ping</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> IoT Sensors: 128/128 Online</span>
          </div>
        </div>
      </header>
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10vw' }}>
        <div 
          ref={panelRef}
          className="glass-panel"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={handleMouseEnter}
          style={{ width: '400px', padding: '40px', transformStyle: 'preserve-3d', transition: 'transform 0.5s ease' }}
        >
          <div style={{ transform: 'translateZ(30px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ShieldAlert color="var(--accent-red)" size={32} className="pulse-critical" style={{ borderRadius: '50%' }} />
              <h1 style={{ fontSize: '24px', fontWeight: '600', letterSpacing: '1px' }}>COMMAND CENTER</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              Predicting disasters before they happen.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setSelectedRole('commander')}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: selectedRole === 'commander' ? 'var(--accent-blue)' : 'transparent', color: selectedRole === 'commander' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', transition: 'all 0.2s' }}>
                <ShieldHalf size={16} /> Command
              </button>
              <button 
                onClick={() => setSelectedRole('field_agent')}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: selectedRole === 'field_agent' ? 'var(--accent-blue)' : 'transparent', color: selectedRole === 'field_agent' ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', transition: 'all 0.2s' }}>
                <User size={16} /> Field Agent
              </button>
            </div>

            {!otpSent ? (
              isSignup ? (
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      className="glass-input" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@gov.in"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      className="glass-input" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Password
                    </label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required 
                    />
                  </div>
                  <button type="submit" className="glass-button" style={{ marginTop: '8px' }}>
                    Send OTP Verification
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsSignup(false)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}
                  >
                    Already have an account? Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Agent ID / Email
                    </label>
                    <input 
                      type="email" 
                      className="glass-input" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@gov.in"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Password
                    </label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required 
                    />
                  </div>
                  <button type="submit" className="glass-button" style={{ marginTop: '8px' }}>
                    Access Dashboard
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsSignup(true)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}
                  >
                    Don't have an account? Sign up
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Verify Phone Number (OTP)
                  </label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="• • • • • •"
                    maxLength={6}
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }}
                    required 
                  />
                </div>
                <button type="submit" className="glass-button" style={{ marginTop: '8px' }}>
                  Verify & Create Account
                </button>
                <button 
                  type="button" 
                  onClick={() => setOtpSent(false)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}
                >
                  &larr; Back to Details
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}

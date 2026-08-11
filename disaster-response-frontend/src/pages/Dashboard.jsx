import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip as TooltipJS, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import LiveMap from '../components/LiveMap';
import InteractiveGlobe from '../components/InteractiveGlobe';
import Layout from '../components/Layout';
import { useIncidents } from '../context/IncidentContext';
import { useUser } from '../context/UserContext';
import { Activity, X, ShieldAlert, AlertTriangle, Info, MapPin, Search, Globe } from 'lucide-react';
import LocationName from '../components/LocationName';
import ResourceCapacityModal from '../components/ResourceCapacityModal';
import Tooltip from '../components/Tooltip';
import SocialFeed from '../components/SocialFeed';

ChartJS.register(ArcElement, TooltipJS, Legend, CategoryScale, LinearScale, BarElement, Title);

const RiskChart = ({ value, color }) => {
  const data = {
    labels: ['Risk', 'Safe'],
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [color, 'rgba(255, 255, 255, 0.05)'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        cutout: '80%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    animation: { animateScale: true, animateRotate: true, duration: 2000 },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Doughnut data={data} options={options} />
      <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <span style={{ fontSize: '36px', fontWeight: '700', color: color }}>{value}%</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { incidents } = useIncidents();
  const { user } = useUser();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(true); // Open by default
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [riskLocation, setRiskLocation] = useState(null);

  const updateRiskLocation = async (lat, lng) => {
    // Realistic geographic heuristics for a more accurate prototype
    let floodBase = 15, eqBase = 10, wfBase = 15;
    
    // Earthquakes (Ring of fire: Japan, California, Andes, Himalayas)
    if ((lng > 125 && lng < 150 && lat > 30 && lat < 45) || 
        (lng < -114 && lng > -125 && lat > 32 && lat < 42) || 
        (lng > -80 && lng < -65 && lat > -35 && lat < 10) || 
        (lng > 70 && lng < 95 && lat > 25 && lat < 35)) {
       eqBase = 75; 
    }
    
    // Wildfires (California, Australia, Mediterranean)
    if ((lng < -114 && lng > -125 && lat > 32 && lat < 42) || 
        (lng > 110 && lng < 155 && lat < -10 && lat > -45) || 
        (lng > -10 && lng < 30 && lat > 35 && lat < 45)) {
       wfBase = 80;
    }
    
    // Floods (Florida/Gulf, Bangladesh, SE Asia, UK, Bengaluru/South India Urban)
    if ((lng > -95 && lng < -80 && lat > 25 && lat < 32) || 
        (lng > 88 && lng < 92 && lat > 21 && lat < 26) || 
        (lng > 100 && lng < 120 && lat > 10 && lat < 25) ||
        (lng > -6 && lng < 2 && lat > 50 && lat < 55) ||
        (lng > 75 && lng < 80 && lat > 10 && lat < 15)) { 
       floodBase = 85;
    }
    
    // Add deterministic variance based on precise coordinates
    const variance1 = Math.floor(Math.abs(Math.sin(lat * lng)) * 15);
    const variance2 = Math.floor(Math.abs(Math.cos(lat + lng)) * 15);
    const variance3 = Math.floor(Math.abs(Math.sin(lat - lng)) * 15);
    
    // Fetch actual rainfall data
    let rainfall = 0;
    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation`);
      const weatherData = await weatherRes.json();
      if (weatherData && weatherData.current) {
        rainfall = weatherData.current.precipitation;
      }
    } catch (we) {
      console.warn("Could not fetch rainfall", we);
    }
    // LSTM Sigmoid Output Simulation for Flood Risk
    const w_rain = 1.5; // Heavy weight on live rainfall
    const b = (floodBase > 50) ? -1.0 : -3.5; // Base bias (negative so no rain = low risk)
    const geoFactor = (Math.sin(lat) * 0.2) + (Math.cos(lng) * 0.2); // Minor terrain variance
    const logit = (rainfall * w_rain) + geoFactor + b;
    const floodProb = 1 / (1 + Math.exp(-logit)); // Sigmoid activation function
    
    setRiskLocation({ 
      lat, lng, 
      flood: Math.min(99, Math.floor(floodProb * 100)), // Display actual predicted value
      earthquake: Math.max(0, Math.min(99, eqBase + variance2 - 25)), // Subtract 25% from predicted value
      wildfire: Math.max(0, Math.min(99, wfBase + variance3 - 25)), // Subtract 25% from predicted value
      rainfall
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setRiskLocation(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        await updateRiskLocation(lat, lng);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try again in a few moments.");
    }
    setIsSearching(false);
  };

  const getStyleForType = (type) => {
    switch (type) {
      case 'CRITICAL': return { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-red)' };
      case 'WARNING': return { color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.1)', border: 'var(--accent-amber)' };
      case 'ADVISORY': return { color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.1)', border: 'var(--accent-blue)' };
      default: return { color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.1)', border: 'var(--accent-green)' };
    }
  };

  // Default Weather Fetch
  const [defaultRainfall, setDefaultRainfall] = useState('0.0');
  
  const getRainType = (mm) => {
    const val = parseFloat(mm);
    if (isNaN(val) || val === 0) return "No Rain";
    if (val < 2.5) return "Light Rain";
    if (val < 7.6) return "Moderate Rain";
    if (val < 50) return "Heavy Rain";
    return "Violent Storm";
  };

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=precipitation`)
      .then(r => r.json())
      .then(d => { if (d.current) setDefaultRainfall(d.current.precipitation) })
      .catch(() => {});
  }, []);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }
  };

  // Mock data for analytics panel
  const resourceData = {
    labels: ['Medical', 'Fire', 'Rescue', 'Shelter', 'Supplies'],
    datasets: [
      {
        label: 'Available Units',
        data: [45, 20, 30, 80, 60],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Deployed Units',
        data: [20, 15, 25, 30, 40],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      }
    ],
  };

  return (
    <Layout title="Command Dashboard">
      <div style={{ padding: '24px', position: 'relative', overflowX: 'hidden', marginLeft: feedOpen ? '320px' : '0', transition: 'margin-left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: 'minmax(120px, auto)', gap: '24px', maxWidth: '1600px', margin: '0 auto', transition: 'margin-right 0.3s' }}>
          
          {/* Action Header */}
          <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-12px' }}>
            {user.role !== 'field_agent' ? (
              <>
                <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <Search size={16} color="var(--text-secondary)" />
                  </button>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Analyze risk for location..."
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px', outline: 'none', width: '250px' }}
                  />
                  {isSearching && <Activity size={14} color="var(--accent-blue)" style={{ animation: 'spin 2s linear infinite' }} />}
                </form>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', width: 'auto' }}>
                    <Globe size={16} />
                    <select onChange={handleLanguageChange} style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <option value="en" style={{ color: '#000' }}>English</option>
                      <option value="es" style={{ color: '#000' }}>Español</option>
                      <option value="hi" style={{ color: '#000' }}>हिन्दी</option>
                      <option value="zh-CN" style={{ color: '#000' }}>中文</option>
                      <option value="ar" style={{ color: '#000' }}>العربية</option>
                      <option value="fr" style={{ color: '#000' }}>Français</option>
                    </select>
                  </div>
                  <Tooltip text="Toggle the live citizen intel feed" position="bottom">
                    <button onClick={() => setFeedOpen(!feedOpen)} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', width: 'auto', background: feedOpen ? 'rgba(59, 130, 246, 0.2)' : 'var(--glass-bg)' }}>
                      <Activity size={18} /> Social Feed
                    </button>
                  </Tooltip>
                  <Tooltip text="View total, occupied, and available beds/units across all locations" position="bottom">
                    <button onClick={() => setCapacityModalOpen(true)} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', width: 'auto' }}>
                      <ShieldAlert size={18} /> Resource Capacity
                    </button>
                  </Tooltip>

                  <Tooltip text="Open detailed charts and metrics for resource allocation" position="bottom">
                    <button onClick={() => setAnalyticsOpen(true)} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', width: 'auto' }}>
                      <Activity size={18} /> Live Analytics
                    </button>
                  </Tooltip>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', width: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginLeft: 'auto' }}>
                <MapPin size={18} /> Field Agent Mode Active
              </div>
            )}
          </div>

          {/* Risk Meters - Top Row - Hidden for Field Agents */}
          {user.role !== 'field_agent' && (
            <>
              <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Flood Risk (LSTM)</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <MapPin size={10} />
                    <LocationName key={`f-${riskLocation?.lat || 12.9716}`} lat={riskLocation ? riskLocation.lat : 12.9716} lng={riskLocation ? riskLocation.lng : 77.5946} />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiskChart value={riskLocation?.flood ?? 0} color="var(--accent-red)" />
                </div>
              </div>
              
              <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Earthquake Risk (ML)</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <MapPin size={10} />
                    <LocationName key={`e-${riskLocation?.lat || 12.9716}`} lat={riskLocation ? riskLocation.lat : 12.9716} lng={riskLocation ? riskLocation.lng : 77.5946} />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiskChart value={riskLocation?.earthquake ?? 0} color="var(--accent-green)" />
                </div>
              </div>

              <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Wildfire Risk (CNN)</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <MapPin size={10} />
                    <LocationName key={`w-${riskLocation?.lat || 12.9716}`} lat={riskLocation ? riskLocation.lat : 12.9716} lng={riskLocation ? riskLocation.lng : 77.5946} />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiskChart value={riskLocation?.wildfire ?? 0} color="var(--accent-amber)" />
                </div>
              </div>

              <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Current Rainfall</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <MapPin size={10} />
                    <LocationName key={`r-${riskLocation?.lat || 12.9716}`} lat={riskLocation ? riskLocation.lat : 12.9716} lng={riskLocation ? riskLocation.lng : 77.5946} />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '42px', fontWeight: '700', color: 'var(--accent-blue)', lineHeight: '1' }}>
                    {riskLocation && riskLocation.rainfall !== undefined ? riskLocation.rainfall : defaultRainfall}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>mm / hr</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px' }}>
                    {getRainType(riskLocation && riskLocation.rainfall !== undefined ? riskLocation.rainfall : defaultRainfall)}
                  </span>
                </div>
              </div>
            </>
          )}

            {/* Live Disaster Map */}
            <div className="glass-panel" style={{ gridColumn: user.role === 'field_agent' ? 'span 12' : 'span 8', gridRow: 'span 4', padding: '20px', position: 'relative', overflow: 'hidden' }}>
               <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>Live Disaster Map</h3>
               <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                 <LiveMap searchCenter={riskLocation ? { lat: riskLocation.lat, lng: riskLocation.lng } : null} />
               </div>
            </div>

            {/* 3D Globe - Hidden for field agents */}
            {user.role !== 'field_agent' && (
              <div className="glass-panel" style={{ gridColumn: 'span 4', gridRow: 'span 2', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                 <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>Global Activity</h3>
                 <div style={{ width: '100%', height: '100%' }}>
                   <InteractiveGlobe onMarkerClick={updateRiskLocation} />
                 </div>
              </div>
            )}

            {/* Active Alerts Panel (Using Context) */}
            <div className="glass-panel" style={{ gridColumn: user.role === 'field_agent' ? 'span 12' : 'span 4', gridRow: 'span 2', padding: '20px', display: 'flex', flexDirection: 'column' }}>
               <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Active System Alerts</h3>
               <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: user.role === 'field_agent' ? 'row' : 'column', gap: '12px', paddingRight: '4px' }}>
                 {incidents.slice(0, 5).map(incident => {
                   const style = getStyleForType(incident.severity);
                   return (
                     <div key={incident.id} style={{ padding: '12px', background: style.bg, borderLeft: `4px solid ${style.border}`, borderRadius: '4px', flex: user.role === 'field_agent' ? 1 : 'none' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <strong style={{ color: style.color, fontSize: '13px' }}>{incident.title}</strong>
                           <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', border: `1px solid ${style.color}`, color: style.color, fontWeight: '600' }}>
                             {incident.severity}
                           </span>
                         </div>
                         <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(incident.time).toLocaleTimeString()}</span>
                       </div>
                       <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{incident.desc}</p>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '11px', marginTop: '6px' }}>
                         <MapPin size={12} />
                         <LocationName lat={incident.lat} lng={incident.lng} />
                       </div>
                     </div>
                   );
                 })}
                 {incidents.length === 0 && (
                   <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '32px' }}>No active incidents.</p>
                 )}
               </div>
            </div>

            {/* Live Data Sources strip */}
            <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Data Sources:</span>
               <div style={{ display: 'flex', gap: '32px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ color: 'var(--accent-green)' }}>●</span> NASA EarthData</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ color: 'var(--accent-green)' }}>●</span> NOAA Weather API</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ color: 'var(--accent-green)' }}>●</span> USGS Seismic API</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}><span style={{ color: 'var(--accent-green)' }}>●</span> IoT Sensors (128/128)</div>
               </div>
            </div>

        </div>

        {/* Sliding Analytics Panel */}
        <div style={{
          position: 'fixed',
          top: 0,
          right: analyticsOpen ? 0 : '-450px',
          width: '400px',
          height: '100vh',
          background: 'rgba(10, 15, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          transition: 'right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 999,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity size={24} color="var(--accent-green)" /> Live Analytics
            </h2>
            <button onClick={() => setAnalyticsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Resource Deployment</h3>
            <div style={{ height: '250px', marginBottom: '32px' }}>
              <Bar 
                data={resourceData} 
                options={{
                  responsive: true, maintainAspectRatio: false,
                  scales: {
                    x: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#999' } },
                    y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#999' } }
                  },
                  plugins: { legend: { labels: { color: '#999' } } }
                }} 
              />
            </div>

            <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>System Health</h3>
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>Server Uptime</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>99.99%</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: '99%', background: 'var(--accent-green)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>API Latency (USGS)</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>42ms</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
                <div style={{ width: '15%', background: 'var(--accent-blue)', height: '100%', borderRadius: '3px' }}></div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <ResourceCapacityModal 
        isOpen={capacityModalOpen} 
        onClose={() => setCapacityModalOpen(false)} 
      />

      {/* Social Feed Sliding Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: feedOpen ? '0' : '-320px',
        width: '320px',
        height: '100vh',
        zIndex: 998,
        transition: 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: feedOpen ? '10px 0 30px rgba(0,0,0,0.5)' : 'none'
      }}>
        <SocialFeed onReportClick={(post) => setRiskLocation({ lat: post.lat, lng: post.lng })} />
      </div>
      
    </Layout>
  );
}

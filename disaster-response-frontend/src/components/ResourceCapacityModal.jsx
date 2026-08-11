import React, { useState } from 'react';
import { X, PlusSquare, Home, Shield, Activity, Search, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

export default function ResourceCapacityModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [displayLocation, setDisplayLocation] = useState('Global Overview');
  const [expandedCard, setExpandedCard] = useState(null);
  
  const generateLocalizedData = (seedString) => {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const m1 = (Math.abs(hash) % 100) / 100 + 0.1;
    const m2 = (Math.abs(hash >> 2) % 100) / 100 + 0.1;
    const m3 = (Math.abs(hash >> 4) % 10) / 10 + 0.5;

    const hTotal = Math.floor(5000 * m1);
    const hOcc = Math.floor(hTotal * (0.6 + (m2 * 0.3)));
    
    const sTotal = Math.floor(20000 * m2);
    const sOcc = Math.floor(sTotal * (0.3 + (m1 * 0.5)));
    
    const nTotal = Math.floor(10 * m3) + 2;
    const nOcc = Math.floor(nTotal * (0.2 + (m2 * 0.6)));

    const prefixes = ['Central', 'City', 'Regional', 'Metro', 'District', 'State', 'Local'];
    const getPrefix = (i) => prefixes[(Math.abs(hash) + i) % prefixes.length];

    const generateDetails = (count, type, totalCapacity, totalOcc) => {
      let items = [];
      let remainingTotal = totalCapacity;
      let remainingOcc = totalOcc;
      
      for(let i=0; i<count; i++) {
        let name = `${getPrefix(i)} ${type}`;
        if (type === 'NDRF Battalion') name = `NDRF ${getPrefix(i)} Bn.`;
        
        if (i === count - 1) {
           items.push({ id: i, name, total: remainingTotal, occupied: remainingOcc });
        } else {
           let t = Math.max(1, Math.floor(remainingTotal / (count - i + 1.2)));
           let o = Math.floor(remainingOcc / (count - i + 1.2));
           if (o > t) o = t;
           items.push({ id: i, name, total: t, occupied: o });
           remainingTotal -= t;
           remainingOcc -= o;
        }
      }
      return items;
    };

    return {
      hospitals: { 
        total: hTotal, occupied: hOcc, available: hTotal - hOcc,
        details: generateDetails(Math.max(3, Math.floor(5 * m1)), 'General Hospital', hTotal, hOcc)
      },
      shelters: { 
        total: sTotal, occupied: sOcc, available: sTotal - sOcc,
        details: generateDetails(Math.max(4, Math.floor(6 * m2)), 'Relief Shelter', sTotal, sOcc)
      },
      ndrf: { 
        total: nTotal, occupied: nOcc, available: nTotal - nOcc,
        details: generateDetails(Math.min(nTotal, 5), 'NDRF Battalion', nTotal, nOcc)
      }
    };
  };

  const [currentData, setCurrentData] = useState(generateLocalizedData('Global Overview'));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setExpandedCard(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const placeName = data[0].display_name.split(',')[0];
        setDisplayLocation(placeName);
        setCurrentData(generateLocalizedData(placeName));
      } else {
        setDisplayLocation(searchQuery);
        setCurrentData(generateLocalizedData(searchQuery));
      }
    } catch (error) {
      console.error('Failed to fetch location data:', error);
      setDisplayLocation(searchQuery);
      setCurrentData(generateLocalizedData(searchQuery));
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const calculatePercent = (occupied, total) => total > 0 ? Math.round((occupied / total) * 100) : 0;

  const CapacityCard = ({ id, title, icon: Icon, data, color, unit }) => {
    const isExpanded = expandedCard === id;
    
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)', transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: color, padding: '10px', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <button 
            onClick={() => setExpandedCard(isExpanded ? null : id)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            {isExpanded ? 'Hide Details' : 'View Facilities'}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total {unit}</span>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{data.total.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Occupied/Deployed</span>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--accent-red)' }}>{data.occupied.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Available</span>
            <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--accent-green)' }}>{data.available.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Capacity Usage</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{calculatePercent(data.occupied, data.total)}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                background: `linear-gradient(90deg, ${color}, var(--accent-red))`, 
                width: `${calculatePercent(data.occupied, data.total)}%`,
                borderRadius: '3px',
                transition: 'width 0.5s ease-out'
              }} 
            />
          </div>
        </div>

        {isExpanded && data.details && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Individual Facilities</h4>
            {data.details.map((detail, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{detail.name}</span>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Total: <strong style={{ color: 'var(--text-primary)' }}>{detail.total.toLocaleString()}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Used: <strong style={{ color: 'var(--accent-red)' }}>{detail.occupied.toLocaleString()}</strong>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Available: <strong style={{ color: 'var(--accent-green)' }}>{(detail.total - detail.occupied).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={24} color="var(--accent-blue)" />
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>Live Resource Capacity</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--text-secondary)" />
            <span style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>{displayLocation}</span>
          </div>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="submit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <Search size={16} color="var(--text-secondary)" />
            </button>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specific location..."
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px', outline: 'none', width: '220px' }}
            />
            {isSearching && <Activity size={14} color="var(--accent-blue)" style={{ animation: 'spin 2s linear infinite' }} />}
          </form>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CapacityCard 
            id="hospitals"
            title="Emergency Hospitals" 
            icon={PlusSquare} 
            data={currentData.hospitals} 
            color="#3b82f6" 
            unit="Beds"
          />
          <CapacityCard 
            id="shelters"
            title="Safe Shelters" 
            icon={Home} 
            data={currentData.shelters} 
            color="#10b981" 
            unit="Spaces"
          />
          <CapacityCard 
            id="ndrf"
            title="NDRF Battalions" 
            icon={Shield} 
            data={currentData.ndrf} 
            color="#f59e0b" 
            unit="Battalions"
          />
        </div>
      </div>
    </div>
  );
}

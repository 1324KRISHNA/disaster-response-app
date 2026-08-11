import React, { createContext, useContext, useState, useEffect } from 'react';

const IncidentContext = createContext();

export const useIncidents = () => useContext(IncidentContext);

export const IncidentProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    // Fetch initial incidents from backend
    const fetchIncidents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/incidents');
        const data = await response.json();
        setIncidents(data);
      } catch (err) {
        console.error("Failed to fetch incidents from backend:", err);
      }
    };
    fetchIncidents();
  }, []);
  
  const [latestIncident, setLatestIncident] = useState(null);

  useEffect(() => {
    localStorage.setItem('disaster_incidents', JSON.stringify(incidents));
  }, [incidents]);

  const [resources, setResources] = useState([
    { id: 'res1', type: 'fire', name: 'Engine 42', lat: 12.96, lng: 77.58, status: 'idle', targetId: null },
    { id: 'res2', type: 'medical', name: 'Ambulance A', lat: 12.98, lng: 77.61, status: 'idle', targetId: null },
    { id: 'res3', type: 'fire', name: 'Engine 19', lat: 13.01, lng: 77.55, status: 'idle', targetId: null },
    { id: 'res4', type: 'medical', name: 'Ambulance B', lat: 12.93, lng: 77.62, status: 'idle', targetId: null },
    { id: 'res5', type: 'ndrf', name: 'NDRF Bn 1', lat: 12.99, lng: 77.53, status: 'idle', targetId: null },
    { id: 'res6', type: 'ndrf', name: 'NDRF Bn 2', lat: 12.91, lng: 77.59, status: 'idle', targetId: null }
  ]);

  const [evacuationRoutes, setEvacuationRoutes] = useState([]);

  // Active System Alerts (Live Polling)
  useEffect(() => {
    let alertedIds = new Set();
    const pollAlerts = async () => {
      try {
        // Fetch recent earthquakes
        const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
        const data = await res.json();
        
        // Find quakes we haven't alerted for yet
        const newQuakes = data.features.filter(f => !alertedIds.has(f.id) && f.properties.mag >= 1.5);
        
        if (newQuakes.length > 0) {
          const q = newQuakes[0]; // Process one at a time to avoid spamming alerts
          alertedIds.add(q.id);
          
          reportIncident({
            type: 'EARTHQUAKE',
            lat: q.geometry.coordinates[1],
            lng: q.geometry.coordinates[0],
            severity: q.properties.mag >= 4 ? 'CRITICAL' : (q.properties.mag >= 2.5 ? 'WARNING' : 'ADVISORY'),
            title: `System Alert: M ${q.properties.mag.toFixed(1)} Earthquake Detected`,
            desc: q.properties.place
          });
        }
      } catch(err) {
        console.error("Alert polling failed", err);
      }
    };

    // Initial poll after 5 seconds to demonstrate the active alert system
    const timeout = setTimeout(pollAlerts, 5000);
    // Then check every 30 seconds
    const interval = setInterval(pollAlerts, 30000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const reportIncident = async (incident) => {
    try {
      const response = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident)
      });
      const newIncident = await response.json();
      setIncidents(prev => [newIncident, ...prev]);
      setLatestIncident(newIncident); // Trigger alert banner
    } catch (err) {
      console.error("Failed to report incident to backend:", err);
    }
  };

  const dispatchResource = (incidentId) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return false;

    // Find all idle resources
    const idleResources = resources.filter(r => r.status === 'idle');
    if (idleResources.length === 0) return false;

    // Find closest idle resource
    let closestResource = null;
    let minDistance = Infinity;

    idleResources.forEach(r => {
      // Basic Euclidean distance for simplicity in picking nearest
      const dist = Math.sqrt(Math.pow(r.lat - incident.lat, 2) + Math.pow(r.lng - incident.lng, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closestResource = r;
      }
    });

    if (!closestResource) return false;

    setResources(prev => prev.map(r => 
      r.id === closestResource.id ? { ...r, status: 'deployed', targetId: incidentId } : r
    ));
    return true;
  };

  const startEvacuation = (incidentId, shelterCoords) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return false;
    
    // Check if already evacuating
    if (evacuationRoutes.some(e => e.incidentId === incidentId)) return false;

    setEvacuationRoutes(prev => [...prev, {
      id: Date.now().toString(),
      incidentId,
      origin: { lat: incident.lat, lng: incident.lng },
      destination: shelterCoords
    }]);
    return true;
  };

  const clearLatest = () => setLatestIncident(null);

  return (
    <IncidentContext.Provider value={{ 
      incidents, reportIncident, latestIncident, clearLatest, 
      resources, dispatchResource,
      evacuationRoutes, startEvacuation
    }}>
      {children}
    </IncidentContext.Provider>
  );
};

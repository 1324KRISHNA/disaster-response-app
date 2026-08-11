import React, { useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useIncidents } from '../context/IncidentContext';
import ReportModal from './ReportModal';
import { Ambulance, Flame, PlusSquare, Home, Shield } from 'lucide-react';
import Tooltip from './Tooltip';

const mapStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px',
};

// Custom Hook to manage Geolocation map centering
function useLocationUpdater(center, hasLocation) {
  const map = useMap();
  useEffect(() => {
    if (hasLocation && center && map) {
      map.panTo(center);
      map.setZoom(12);
    }
  }, [center, hasLocation, map]);
}

// Wrapper component for Circle
function MapCircle({ center, radius, options, onClick }) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [circle, setCircle] = useState(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map || !maps) return;
    const c = new maps.Circle({
      map,
      center,
      radius,
      ...options,
    });
    
    const listener = c.addListener('click', (e) => {
      if (onClickRef.current) onClickRef.current(e);
    });
    
    setCircle(c);
    return () => {
      listener.remove();
      c.setMap(null);
    };
  }, [map, maps]); // Omit options and center/radius to avoid recreation

  useEffect(() => {
    if (circle) {
      circle.setCenter(center);
      circle.setRadius(radius);
      if (options) circle.setOptions(options);
    }
  }, [circle, center, radius, options]);

  return null;
}

// Wrapper component for Polyline
function MapPolyline({ path, options }) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    if (!map || !maps) return;
    const p = new maps.Polyline({
      map,
      path,
      ...options,
    });
    setPolyline(p);
    return () => {
      p.setMap(null);
    };
  }, [map, maps]);

  useEffect(() => {
    if (polyline) {
      polyline.setPath(path);
      polyline.setOptions(options);
    }
  }, [polyline, path, options]);

  return null;
}

// Wrapper component for Heatmap
function MapHeatmap({ data, options }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');
  const [heatmap, setHeatmap] = useState(null);

  // Stringify to deep compare data and options easily, avoiding infinite re-renders
  const dataStr = JSON.stringify(data);
  const optionsStr = JSON.stringify(options);

  useEffect(() => {
    if (!map || !visualization || !window.google) return;
    try {
      const points = (data || []).map(pt => new window.google.maps.LatLng(pt.lat, pt.lng));
      const layer = new visualization.HeatmapLayer({
        data: points,
        ...options
      });
      setHeatmap(layer);
      layer.setMap(map);
      
      return () => {
        layer.setMap(null);
      };
    } catch (e) {
      console.error("Heatmap initialization error:", e);
    }
  }, [map, visualization]); // Recreate only if map or library changes

  useEffect(() => {
    if (heatmap && window.google) {
      try {
        const points = (data || []).map(pt => new window.google.maps.LatLng(pt.lat, pt.lng));
        heatmap.setData(points);
        if (options) heatmap.setOptions(options);
      } catch (e) {
        console.error("Heatmap update error:", e);
      }
    }
  }, [heatmap, dataStr, optionsStr]); // Rely on stringified deep values

  return null;
}


// Wrapper component for Directions/Routing with straight line fallback
function MapDirections({ origin, destination, options }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routeFailed, setRouteFailed] = useState(false);

  const originStr = JSON.stringify(origin);
  const destStr = JSON.stringify(destination);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: options?.polylineOptions || { strokeColor: '#3b82f6', strokeWeight: 4 }
    });
    setDirectionsRenderer(renderer);
    return () => renderer.setMap(null);
  }, [routesLibrary, map]); // Ignore options changes for simplicity

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;
    
    directionsService.route({
      origin,
      destination,
      travelMode: 'DRIVING'
    })
    .then(response => {
      setRouteFailed(false);
      if (directionsRenderer.getMap() == null) directionsRenderer.setMap(map);
      directionsRenderer.setDirections(response);
    })
    .catch((e) => {
      console.warn("Directions API failed, fallback to straight line.", e);
      directionsRenderer.setMap(null);
      setRouteFailed(true);
    });
  }, [directionsService, directionsRenderer, originStr, destStr]); // Use stringified deps

  if (routeFailed) {
    return <MapPolyline path={[origin, destination]} options={{
      strokeColor: options?.polylineOptions?.strokeColor || '#3b82f6',
      strokeWeight: 4,
      strokeOpacity: 0.8
    }} />;
  }

  return null;
}

export default function LiveMap({ searchCenter }) {
  const [center, setCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bengaluru
  const [hasLocation, setHasLocation] = useState(false);
  const [liveQuakes, setLiveQuakes] = useState([]);
  
  // React to searchCenter changes
  useEffect(() => {
    if (searchCenter) {
      setCenter(searchCenter);
      setHasLocation(true);
    }
  }, [searchCenter]);
  
  // Incident Context
  const { incidents, resources, dispatchResource, evacuationRoutes, startEvacuation } = useIncidents();
  const [timeOffset, setTimeOffset] = useState(0);
  const [weatherData, setWeatherData] = useState({});
  const fetchedIds = useRef(new Set());

  // Modals & InfoWindows
  const [modalOpen, setModalOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState(null);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showShelters, setShowShelters] = useState(false);
  const [showNDRF, setShowNDRF] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Store info window content { position: {lat, lng}, content: JSX }
  const [infoWindow, setInfoWindow] = useState(null);

  // Note: we can only call useLocationUpdater inside a component that is a child of <Map>, 
  // but <LiveMap> renders <Map>. We must extract map-dependent logic into a child.
  
  return (
    <div style={{ width: '100%', height: '100%', zIndex: 1, position: 'relative' }}>
      <Map
        defaultCenter={center}
        defaultZoom={5}
        mapId="DEMO_MAP_ID"
        style={mapStyle}
        disableDefaultUI={true}
        colorScheme="DARK"
        onClick={(e) => {
          setClickCoords({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
          setModalOpen(true);
          setInfoWindow(null);
        }}
      >
        <MapInner 
          center={center} 
          hasLocation={hasLocation}
          setCenter={setCenter}
          setHasLocation={setHasLocation}
          searchCenter={searchCenter}
        />

        {showHeatmap && (
          <MapHeatmap 
            data={incidents.map(i => ({ lat: i.lat, lng: i.lng }))} 
            options={{ radius: 60, opacity: 0.7 }}
          />
        )}

        {hasLocation && (
          <AdvancedMarker 
            position={center} 
            onClick={() => setInfoWindow({
              position: center,
              content: (
                <div style={{color: '#000'}}>
                  <strong>Your Current Location</strong><br/>
                  Agent active in field.
                </div>
              )
            })}
          />
        )}

        {/* Render Reported Incidents from Context */}
        {incidents.map((incident) => {
          const weather = weatherData[incident.id];
          const driftedCenter = calculateDrift(incident.lat, incident.lng, weather, timeOffset, incident.type);
          const expansionFactor = 1 + (timeOffset / 24); 
          const baseRadius = incident.severity === 'CRITICAL' ? 5000 : 3000;
          const currentRadius = baseRadius * expansionFactor;
          const opacity = Math.max(0.2, 0.8 - (timeOffset / 48));
          const color = getIncidentColor(incident.severity);

          return (
            <MapCircle 
              key={`circle-${incident.id}`}
              center={driftedCenter}
              radius={currentRadius}
              options={{
                fillColor: color,
                fillOpacity: opacity,
                strokeColor: color,
                strokeWeight: 2,
                clickable: true
              }}
              onClick={(e) => {
                setInfoWindow({
                  position: driftedCenter,
                  content: (
                    <div style={{color: '#000'}}>
                      <strong>{incident.title}</strong><br/>
                      Type: {incident.type}<br/>
                      Severity: {incident.severity}<br/>
                      Reported: {new Date(incident.time).toLocaleTimeString()}<br/>
                      {weather && (
                        <>
                          <span style={{ fontSize: '11px', color: '#3b82f6' }}>
                            Local Wind: {weather.windSpeed} km/h @ {weather.windDirection}°
                          </span><br/>
                        </>
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>{incident.desc}</span>
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            dispatchResource(incident.id);
                            setInfoWindow(null);
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', width: '100%', background: '#f3f4f6', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', color: '#000' }}
                        >
                          Dispatch Nearest Resource
                        </button>
                        <button 
                          onClick={() => {
                            // Find nearest shelter (mock coordinates)
                            const shelterCoords = { lat: incident.lat + 0.05, lng: incident.lng + 0.05 };
                            startEvacuation(incident.id, shelterCoords);
                            setInfoWindow(null);
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Generate Evacuation Route
                        </button>
                      </div>
                    </div>
                  )
                });
              }}
            />
          );
        })}

        {/* Render Resources and Polylines */}
        {resources.map((resource) => (
          <React.Fragment key={`resource-${resource.id}`}>
            <AdvancedMarker 
              position={{ lat: resource.lat, lng: resource.lng }}
              onClick={() => {
                setInfoWindow({
                  position: { lat: resource.lat, lng: resource.lng },
                  content: (
                    <div style={{color: '#000'}}>
                      <strong>{resource.name}</strong><br/>
                      Type: {resource.type}<br/>
                      Status: {resource.status.toUpperCase()}
                    </div>
                  )
                });
              }}
            >
              <div style={{
                background: resource.type === 'medical' ? '#ef4444' : '#f97316',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                color: '#fff',
                border: '2px solid white'
              }}>
                {resource.type === 'medical' ? <Ambulance size={18} /> : <Flame size={18} />}
              </div>
            </AdvancedMarker>
            
            {resource.status === 'deployed' && resource.targetId && (
              <MapDirections 
                origin={{ lat: resource.lat, lng: resource.lng }}
                destination={{
                  lat: incidents.find(i => i.id === resource.targetId)?.lat || resource.lat,
                  lng: incidents.find(i => i.id === resource.targetId)?.lng || resource.lng,
                }}
                options={{
                  polylineOptions: { strokeColor: '#3b82f6', strokeWeight: 4, strokeOpacity: 0.8 }
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Render Evacuation Routes */}
        {evacuationRoutes.map((route) => (
          <MapDirections 
            key={route.id}
            origin={route.origin}
            destination={route.destination}
            options={{
              polylineOptions: { strokeColor: '#10b981', strokeWeight: 4, strokeOpacity: 0.8 }
            }}
          />
        ))}

        {/* Predictive Danger Zones based on timeOffset */}
        {timeOffset > 0 && incidents.filter(i => ['WILDFIRE', 'FLOOD', 'CHEMICAL SPILL'].includes(i.type)).map(incident => {
          // Spread rate: 500 meters per hour for wildfire, 200 for flood, 300 for spill
          const spreadRate = incident.type === 'WILDFIRE' ? 500 : incident.type === 'FLOOD' ? 200 : 300;
          const baseRadius = 1000; // Base 1km radius
          const predictedRadius = baseRadius + (spreadRate * timeOffset);
          
          const colors = {
            'WILDFIRE': '#f97316',
            'FLOOD': '#3b82f6',
            'CHEMICAL SPILL': '#a855f7'
          };
          
          return (
            <MapCircle 
              key={`pred-${incident.id}`}
              center={{ lat: incident.lat, lng: incident.lng }}
              radius={predictedRadius}
              options={{
                strokeColor: colors[incident.type],
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: colors[incident.type],
                fillOpacity: 0.15 + (timeOffset * 0.01), // opacity increases slightly with time to show intensity
                clickable: false
              }}
            />
          );
        })}

        {showHospitals && [...Array(3)].map((_, i) => (
          <AdvancedMarker key={`hosp-${i}`} position={{ lat: center.lat + (Math.sin(i) * 0.05), lng: center.lng + (Math.cos(i) * 0.05) }} onClick={() => setInfoWindow({ position: { lat: center.lat + (Math.sin(i) * 0.05), lng: center.lng + (Math.cos(i) * 0.05) }, content: <div style={{color: '#000'}}><strong>Emergency Hospital {i+1}</strong><br/>Capacity: 500</div>})}>
             <div style={{ background: '#3b82f6', padding: '4px', borderRadius: '4px', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}><PlusSquare size={16}/></div>
          </AdvancedMarker>
        ))}

        {showShelters && [...Array(4)].map((_, i) => (
          <AdvancedMarker key={`shlt-${i}`} position={{ lat: center.lat + (Math.cos(i*2) * 0.08), lng: center.lng + (Math.sin(i*2) * 0.08) }} onClick={() => setInfoWindow({ position: { lat: center.lat + (Math.cos(i*2) * 0.08), lng: center.lng + (Math.sin(i*2) * 0.08) }, content: <div style={{color: '#000'}}><strong>Safe Shelter {i+1}</strong><br/>Supplies Available</div>})}>
             <div style={{ background: '#10b981', padding: '4px', borderRadius: '4px', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}><Home size={16}/></div>
          </AdvancedMarker>
        ))}

        {showNDRF && [...Array(2)].map((_, i) => (
          <AdvancedMarker key={`ndrf-${i}`} position={{ lat: center.lat - (Math.sin(i+1) * 0.06), lng: center.lng - (Math.cos(i+1) * 0.06) }} onClick={() => setInfoWindow({ position: { lat: center.lat - (Math.sin(i+1) * 0.06), lng: center.lng - (Math.cos(i+1) * 0.06) }, content: <div style={{color: '#000'}}><strong>NDRF Battalion {i+1}</strong><br/>Status: Standby</div>})}>
             <div style={{ background: '#f59e0b', padding: '4px', borderRadius: '4px', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}><Shield size={16}/></div>
          </AdvancedMarker>
        ))}

        {/* Render Live USGS Earthquakes */}
        {liveQuakes.map((quake) => {
          const weather = weatherData[quake.id];
          const driftedCenter = { lat: quake.lat, lng: quake.lng }; // Earthquakes do not drift with wind
          const expansionFactor = 1 + (timeOffset / 24); 
          const currentRadius = (quake.mag * 15000) * expansionFactor;
          const opacity = Math.max(0.1, 0.5 - (timeOffset / 48));

          return (
            <MapCircle 
              key={`quake-${quake.id}`}
              center={driftedCenter}
              radius={currentRadius}
              options={{
                fillColor: '#9333ea',
                fillOpacity: opacity,
                strokeColor: '#9333ea',
                strokeWeight: 1,
                clickable: true
              }}
              onClick={() => {
                setInfoWindow({
                  position: driftedCenter,
                  content: (
                    <div style={{color: '#000'}}>
                      <strong>LIVE: Earthquake Magnitude {quake.mag}</strong><br/>
                      Location: {quake.place}<br/>
                      Time: {quake.time}<br/>
                      {weather && (
                        <>
                          <span style={{ fontSize: '11px', color: '#3b82f6' }}>
                            Local Wind: {weather.windSpeed} km/h @ {weather.windDirection}°
                          </span><br/>
                        </>
                      )}
                      <span style={{ fontSize: '11px', color: '#666' }}>Source: USGS API</span>
                    </div>
                  )
                });
              }}
            />
          );
        })}

        {infoWindow && (
          <InfoWindow
            position={infoWindow.position}
            onCloseClick={() => setInfoWindow(null)}
          >
            {infoWindow.content}
          </InfoWindow>
        )}
      </Map>

      <WeatherFetcher 
        incidents={incidents}
        liveQuakes={liveQuakes}
        weatherData={weatherData}
        setWeatherData={setWeatherData}
        fetchedIds={fetchedIds}
      />

      <QuakeFetcher setLiveQuakes={setLiveQuakes} />

      {/* Timeline Slider Overlay */}
      <div className="glass-panel" style={{ 
        position: 'absolute', 
        bottom: '30px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000, 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        width: '400px',
        maxWidth: '90%'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', color: timeOffset === 0 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
          Now
        </span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input 
            type="range" 
            min="0" 
            max="24" 
            step="1" 
            value={timeOffset} 
            onChange={(e) => setTimeOffset(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
            <span>0h</span>
            <span>+12h</span>
            <span>+24h</span>
          </div>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', color: timeOffset > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
          +{timeOffset}h Forecast
        </span>
      </div>

      {/* Map Controls */}
      <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 1001, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Tooltip text="Toggle nearby Emergency Hospitals on the map" position="right">
          <button 
            onClick={() => setShowHospitals(!showHospitals)} 
            onDoubleClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=Emergency+Hospital', '_blank')}
            style={{ background: showHospitals ? 'rgba(59, 130, 246, 0.4)' : 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', cursor: 'pointer' }}
          >
            <PlusSquare size={14}/> Emergency Hospitals
          </button>
        </Tooltip>
        
        <Tooltip text="Toggle safe evacuation Shelters on the map" position="right">
          <button 
            onClick={() => setShowShelters(!showShelters)} 
            onDoubleClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=Safe+Shelter', '_blank')}
            style={{ background: showShelters ? 'rgba(16, 185, 129, 0.4)' : 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', cursor: 'pointer' }}
          >
            <Home size={14}/> Safe Shelters
          </button>
        </Tooltip>
        
        <Tooltip text="Toggle National Disaster Response Force (NDRF) units" position="right">
          <button 
            onClick={() => setShowNDRF(!showNDRF)} 
            onDoubleClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=NDRF+Battalion', '_blank')}
            style={{ background: showNDRF ? 'rgba(245, 158, 11, 0.4)' : 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', cursor: 'pointer' }}
          >
            <Shield size={14}/> NDRF Battalions
          </button>
        </Tooltip>
        
        <Tooltip text="Visualize incident density and danger zones" position="right">
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)} 
            style={{ background: showHeatmap ? 'rgba(239, 68, 68, 0.4)' : 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', cursor: 'pointer' }}
          >
            <Flame size={14}/> Risk Heatmap
          </button>
        </Tooltip>
      </div>

      {/* Report Modal */}
      <ReportModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        coordinates={clickCoords} 
      />
    </div>
  );
}

// Inner component to safely useMap() hook
function MapInner({ center, hasLocation, setCenter, setHasLocation, searchCenter }) {
  useLocationUpdater(center, hasLocation);
  
  useEffect(() => {
    if (searchCenter) return; // Do not overwrite with geolocation if we navigated here specifically for an alert
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          setHasLocation(true);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setHasLocation(true); 
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setHasLocation(true);
    }
  }, [setCenter, setHasLocation]);

  return null;
}

// Helpers
function QuakeFetcher({ setLiveQuakes }) {
  useEffect(() => {
    const fetchQuakes = async () => {
      try {
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
        const data = await response.json();
        const recentQuakes = data.features.slice(0, 20).map(f => ({
          id: f.id,
          mag: f.properties.mag,
          place: f.properties.place,
          time: new Date(f.properties.time).toLocaleString(),
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }));
        setLiveQuakes(recentQuakes);
      } catch (err) {
        console.error("Failed to fetch USGS data", err);
      }
    };
    fetchQuakes();
    const interval = setInterval(fetchQuakes, 60000); 
    return () => clearInterval(interval);
  }, [setLiveQuakes]);
  return null;
}

function WeatherFetcher({ incidents, liveQuakes, weatherData, setWeatherData, fetchedIds }) {
  useEffect(() => {
    const fetchMissingWeather = async () => {
      const allItems = [...incidents, ...liveQuakes];
      const missingItems = allItems.filter(item => !fetchedIds.current.has(item.id));
      
      if (missingItems.length === 0) return;

      missingItems.forEach(item => fetchedIds.current.add(item.id));

      const newWeatherData = {};
      await Promise.all(missingItems.map(async (item) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${item.lat}&longitude=${item.lng}&current=wind_speed_10m,wind_direction_10m`);
          const data = await res.json();
          if (data.current) {
            newWeatherData[item.id] = {
              windSpeed: data.current.wind_speed_10m,
              windDirection: data.current.wind_direction_10m 
            };
          }
        } catch (e) {
          console.error('Failed to fetch weather for item', item.id);
        }
      }));

      if (Object.keys(newWeatherData).length > 0) {
        setWeatherData(prev => ({ ...prev, ...newWeatherData }));
      }
    };

    fetchMissingWeather();
  }, [incidents, liveQuakes, fetchedIds, setWeatherData]);
  return null;
}

const calculateDrift = (lat, lng, weather, timeOffset, type = 'WILDFIRE') => {
  if (!weather || timeOffset === 0) return { lat, lng };
  // Only wildfires, cyclones, and gas/chemical incidents drift with wind. Earthquakes and floods generally do not.
  if (type === 'EARTHQUAKE' || type === 'FLOOD') return { lat, lng };
  
  const blowDirection = (weather.windDirection + 180) % 360;
  
  const rad = blowDirection * (Math.PI / 180);
  const distanceKm = weather.windSpeed * timeOffset;
  
  const latDrift = Math.cos(rad) * (distanceKm / 111);
  const lngDrift = Math.sin(rad) * (distanceKm / (111 * Math.cos(lat * (Math.PI / 180))));
  
  return { lat: lat + latDrift, lng: lng + lngDrift };
};

const getIncidentColor = (severity) => {
  switch(severity) {
    case 'CRITICAL': return '#ef4444';
    case 'WARNING': return '#f59e0b';
    case 'ADVISORY': return '#3b82f6';
    default: return '#10b981';
  }
};

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Html, Stars } from '@react-three/drei';
import { useIncidents } from '../context/IncidentContext';

// Helper to convert lat/lng to 3D Cartesian coordinates
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return [x, y, z];
}

const getIncidentColor = (severity) => {
  switch(severity) {
    case 'CRITICAL': return '#ef4444'; // red
    case 'WARNING': return '#f59e0b'; // amber
    case 'ADVISORY': return '#3b82f6'; // blue
    default: return '#10b981'; // green
  }
};

function PulsingMarker({ position, color, title, severity, onClick }) {
  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <div className="globe-marker-container" onClick={onClick}>
        <div className="globe-marker-pulse" style={{ backgroundColor: color }}></div>
        <div className="globe-marker-core" style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}` }}></div>
        
        {/* Tooltip on Hover */}
        <div className="globe-marker-tooltip">
          <strong style={{ color: color }}>{severity}</strong>
          <br/>{title}
        </div>
      </div>
    </Html>
  );
}

function Globe({ onMarkerClick }) {
  const globeRef = useRef();
  const { incidents } = useIncidents();
  const radius = 2.5;

  useFrame((state, delta) => {
    // Slow auto-rotation
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Base Globe */}
      <Sphere args={[radius, 64, 64]}>
        <meshStandardMaterial 
          color="#0b132b" 
          wireframe 
          transparent 
          opacity={0.3} 
          emissive="#1c2541"
          emissiveIntensity={0.8}
        />
      </Sphere>
      
      {/* Inner Solid Core to block back-face markers */}
      <Sphere args={[radius * 0.98, 32, 32]}>
         <meshBasicMaterial color="#050a15" />
      </Sphere>

      {/* Render Real Incidents as Glowing Markers */}
      {incidents.map(incident => {
        const pos = latLngToVector3(incident.lat, incident.lng, radius);
        const color = getIncidentColor(incident.severity);
        return (
          <PulsingMarker 
            key={incident.id} 
            position={pos} 
            color={color} 
            title={incident.title}
            severity={incident.severity}
            onClick={(e) => {
              e.stopPropagation();
              if (onMarkerClick) onMarkerClick(incident.lat, incident.lng);
            }}
          />
        );
      })}
    </group>
  );
}

export default function InteractiveGlobe({ onMarkerClick }) {
  return (
    <>
      {/* Injecting CSS for the pulsing animations and tooltips */}
      <style>{`
        .globe-marker-container {
          position: relative;
          width: 30px;
          height: 30px;
          cursor: pointer;
        }
        .globe-marker-pulse {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          border-radius: 50%;
          opacity: 0.6;
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .globe-marker-core {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .globe-marker-tooltip {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 15, 20, 0.9);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          backdrop-filter: blur(4px);
        }
        .globe-marker-container:hover .globe-marker-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-5px);
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <Canvas camera={{ position: [0, 0, 6] }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 3, 5]} intensity={2} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Globe onMarkerClick={onMarkerClick} />
        <OrbitControls 
          enableZoom={true} 
          minDistance={3}
          maxDistance={10}
          autoRotate={false} 
          enablePan={false}
        />
      </Canvas>
    </>
  );
}

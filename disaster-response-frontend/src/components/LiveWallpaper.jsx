import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Plane, Sphere, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';

function NaturalParticles() {
  const ref = useRef();
  const count = 2000;
  
  const [positions, velocities, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    // Natural warm colors (sunlight, pollen, fireflies)
    const colorChoices = [
      new THREE.Color('#fde047'), // yellow-300
      new THREE.Color('#fef08a'), // yellow-200
      new THREE.Color('#86efac')  // green-300
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = Math.random() * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
      // Slow upward floating motion
      velocities[i] = 0.02 + Math.random() * 0.03; 
      
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return [positions, velocities, colors];
  }, []);

  useFrame((state) => {
    const positions = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += velocities[i];
      // Float side to side slightly
      positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.01;
      
      if (positions[i * 3 + 1] > 15) {
        positions[i * 3 + 1] = -5 - Math.random() * 5;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function Sunlight() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#e2e8f0" />
    </>
  );
}

function Ground() {
  const groundRef = useRef();

  useFrame((state) => {
    // Subtle breathing motion for natural feel
    groundRef.current.position.y = -8 + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <Plane ref={groundRef} args={[100, 100]} position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial 
        color="#064e3b" // Deep forest green
        roughness={0.8}
        metalness={0.1}
      />
    </Plane>
  );
}

function ColorfulGlobe() {
  const globeRef = useRef();
  const groupRef = useRef();
  const colorMap = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  useFrame((state, delta) => {
    // Constant slow rotation of the earth itself
    globeRef.current.rotation.y += delta * 0.05;
    
    // Interactive mouse tracking rotation for the group
    // state.pointer contains normalized mouse coordinates (-1 to +1)
    const targetX = -(state.pointer.y * Math.PI) / 6;
    const targetY = (state.pointer.x * Math.PI) / 6;
    
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
  });

  return (
    <group ref={groupRef} position={[-5.5, 0, -8]}>
      <Sphere ref={globeRef} args={[3.5, 64, 64]}>
        <meshStandardMaterial 
          map={colorMap}
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>
    </group>
  );
}

export default function LiveWallpaper() {
  return (
    <div className="animated-gradient-bg" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <React.Suspense fallback={null}>
          <fog attach="fog" args={['#000000', 5, 30]} />
          <Sunlight />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <NaturalParticles />
          <ColorfulGlobe />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

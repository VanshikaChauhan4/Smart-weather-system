import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, Cloud, Sparkles, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

type WeatherMode = 'CLEAR' | 'RAIN' | 'STORM' | 'NIGHT' | 'CLOUDY';

function WeatherParticles({ mode }: { mode: WeatherMode }) {
  const pointsRef = useRef<any>(null);
  const count = mode === 'RAIN' || mode === 'STORM' ? 3000 : 0;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current || count === 0) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const speed = mode === 'STORM' ? 25 : 15;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= delta * speed;
      // Add slight wind drift
      pos[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.01;
      if (pos[i * 3 + 1] < -15) pos[i * 3 + 1] = 15;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={mode === 'STORM' ? "#94a3b8" : "#7dd3fc"}
        size={0.06}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

function SunRays() {
  const meshRef = useRef<any>(null);
  const meshRef2 = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.05;
    if (meshRef2.current) meshRef2.current.rotation.z = -state.clock.getElapsedTime() * 0.03;
  });

  return (
    <group position={[-12, 10, -10]}>
      {/* Core Glow */}
      <mesh ref={meshRef}>
        <circleGeometry args={[12, 32]} />
        <meshBasicMaterial 
          color="#fbbf24" 
          transparent 
          opacity={0.03} 
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Secondary Ray Layer */}
      <mesh ref={meshRef2} scale={1.5}>
        <circleGeometry args={[10, 6]} />
        <meshBasicMaterial 
          color="#fcd34d" 
          transparent 
          opacity={0.02} 
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight intensity={4} color="#fbbf24" distance={50} />
    </group>
  );
}

function AtmosphereLights({ mode }: { mode: WeatherMode }) {
  const lightRef = useRef<any>(null);
  
  useFrame((state) => {
    if (mode === 'STORM' && lightRef.current) {
      const flash = Math.random() > 0.985;
      lightRef.current.intensity = flash ? 10 : 0.2;
    }
  });

  return (
    <>
      <ambientLight intensity={mode === 'NIGHT' ? 0.2 : mode === 'STORM' ? 0.3 : 0.6} />
      <directionalLight position={[5, 10, 5]} intensity={mode === 'CLEAR' ? 2 : 0.5} color={mode === 'CLEAR' ? '#fff7ed' : '#e0f2fe'} />
      <pointLight 
        ref={lightRef} 
        position={[0, 15, 0]} 
        color="#e0f2fe" 
        intensity={0}
      />
      {mode === 'CLEAR' && <SunRays />}
    </>
  );
}

function DynamicClouds({ mode }: { mode: WeatherMode }) {
  if (mode === 'CLEAR' || mode === 'NIGHT') return null;
  
  const cloudColor = mode === 'STORM' ? '#1e293b' : mode === 'CLOUDY' ? '#cbd5e1' : '#f8fafc';
  const density = mode === 'STORM' ? 1.0 : mode === 'CLOUDY' ? 0.8 : 0.3;

  return (
    <group>
      <Cloud position={[-15, 5, -15]} speed={0.1} opacity={density} color={cloudColor} />
      <Cloud position={[15, -5, -12]} speed={0.12} opacity={density} color={cloudColor} />
      <Cloud position={[0, 10, -20]} speed={0.08} opacity={density * 0.5} color={cloudColor} />
      <Cloud position={[-5, -10, -10]} speed={0.05} opacity={density * 0.3} color={cloudColor} />
      {mode === 'STORM' && (
        <>
          <Cloud position={[0, 0, -25]} speed={0.4} opacity={1} color="#0f172a" depth={15} />
          <Cloud position={[20, 10, -20]} speed={0.3} opacity={0.8} color="#1e2s3b" />
        </>
      )}
    </group>
  );
}

export default function ThreeBackground({ weather = 'CLEAR' }: { weather?: WeatherMode }) {
  const [mode, setMode] = useState<WeatherMode>(weather);

  useEffect(() => {
    setMode(weather);
  }, [weather]);

  const theme = useMemo(() => {
    switch (mode) {
      case 'NIGHT': return { bg: '#020617', fog: '#020617' };
      case 'STORM': return { bg: '#0f172a', fog: '#1e293b' };
      case 'RAIN': return { bg: '#1e293b', fog: '#334155' };
      case 'CLOUDY': return { bg: '#334155', fog: '#475569' };
      default: return { bg: '#075985', fog: '#0c4a6e' };
    }
  }, [mode]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: theme.bg }}>
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} />
        <fogExp2 attach="fog" args={[theme.fog, 0.03]} />
        
        <AtmosphereLights mode={mode} />
        <WeatherParticles mode={mode} />
        <DynamicClouds mode={mode} />
        
        <Stars 
          radius={100} 
          depth={50} 
          count={mode === 'NIGHT' ? 5000 : 1000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />
        
        {mode === 'CLEAR' && <Sparkles count={50} scale={20} size={2} speed={0.5} opacity={0.1} />}
      </Canvas>
      
      {/* Dynamic Overlay Gradients */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${mode === 'STORM' ? 'opacity-80' : 'opacity-40'}`}
           style={{
             background: mode === 'NIGHT' 
               ? 'radial-gradient(circle at 50% 0%, rgba(30,58,138,0.2) 0%, transparent 70%)'
               : 'radial-gradient(circle at 50% 0%, rgba(56,189,248,0.15) 0%, transparent 70%)'
           }} 
      />
      
      {/* Digital Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
}

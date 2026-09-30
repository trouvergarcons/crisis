import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const LoginGlobe3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Master Group for rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Core Sphere (Dark Obsidian with glowing blue wireframe)
    const coreGeometry = new THREE.SphereGeometry(78, 36, 36);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x050e20,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(coreMesh);

    // 2. Wireframe Outer Shell
    const wireframeGeometry = new THREE.SphereGeometry(79, 28, 28);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    globeGroup.add(wireframeMesh);

    // 3. Latitude / Longitude Tactical Rings
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });

    // Equator and Tropics
    [0, 23.5, -23.5, 45, -45].forEach((lat) => {
      const rad = (lat * Math.PI) / 180;
      const r = Math.cos(rad) * 79.5;
      const y = Math.sin(rad) * 79.5;
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      ringGeo.setFromPoints(points);
      const ringLine = new THREE.Line(ringGeo, ringMaterial);
      globeGroup.add(ringLine);
    });

    // 4. Emergency Incident Hotspot Beacons (Simulating global coordinate alerts)
    // Convert lat/long to 3D Cartesian coords
    const latLongToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const emergencyLocations = [
      { lat: 37.77, lon: -122.41, color: 0xef4444, label: 'SF Bay - Critical' },
      { lat: 40.71, lon: -74.0, color: 0xf97316, label: 'NYC - High' },
      { lat: 35.68, lon: 139.76, color: 0xef4444, label: 'Tokyo - Flash Flood' },
      { lat: 51.5, lon: -0.12, color: 0x38bdf8, label: 'London - Active' },
      { lat: 19.07, lon: 72.87, color: 0xef4444, label: 'Mumbai - Collapse' },
      { lat: -33.86, lon: 151.2, color: 0x10b981, label: 'Sydney - Standby' },
      { lat: 28.61, lon: 77.2, color: 0xf97316, label: 'Delhi - Industrial Fire' },
    ];

    const beaconPointers: { mesh: THREE.Mesh; scaleDelta: number }[] = [];

    emergencyLocations.forEach((loc) => {
      const basePos = latLongToVector3(loc.lat, loc.lon, 79);
      const tipPos = latLongToVector3(loc.lat, loc.lon, 95);

      // Spike line
      const spikeGeo = new THREE.BufferGeometry().setFromPoints([basePos, tipPos]);
      const spikeMat = new THREE.LineBasicMaterial({
        color: loc.color,
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
      });
      const spikeLine = new THREE.Line(spikeGeo, spikeMat);
      globeGroup.add(spikeLine);

      // Beacon Orb
      const orbGeo = new THREE.SphereGeometry(2.2, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: loc.color,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.copy(tipPos);
      globeGroup.add(orb);
      beaconPointers.push({ mesh: orb, scaleDelta: Math.random() * 2 });
    });

    // 5. Orbiting Defense Constellation Particles
    const particlesCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      const angle = (i / particlesCount) * Math.PI * 2;
      const radius = 100 + (Math.random() - 0.5) * 20;
      const height = (Math.random() - 0.5) * 50;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Cyan to Sky blue palette
      colors[i * 3] = 0.2;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.95;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    globeGroup.add(particles);

    // 6. Equatorial Orbit Halo Ring
    const orbitRingGeo = new THREE.RingGeometry(110, 112, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    globeGroup.add(orbitRing);

    // Mouse Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.006;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      // Continuous subtle globe rotation if not dragging
      if (!isDragging) {
        globeGroup.rotation.y += 0.0035;
      }

      // Constellation ring counter-rotation
      particles.rotation.y -= 0.002;
      orbitRing.rotation.z += 0.004;

      // Beacon pulsing
      beaconPointers.forEach((b, idx) => {
        const s = 1 + Math.sin(elapsedTime * 4 + idx) * 0.35;
        b.mesh.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center">
      {/* Three.js DOM Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cybernetic HUD Target Crosshairs Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex items-center justify-between text-[10px] font-mono text-sky-400/80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ORBITAL SATELLITE RECON LINK [ONLINE]</span>
          </div>
          <div className="bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
            3D SPATIAL TELEMETRY
          </div>
        </div>

        {/* Center Target Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-sky-500/20 rounded-full flex items-center justify-center">
          <div className="w-36 h-36 border border-dashed border-sky-400/30 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
          <div className="absolute w-2 h-2 bg-red-500 rounded-full" />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div>INCIDENT SENSORS: <span className="text-emerald-400">GLOBAL ACTIVE</span></div>
          <div>ROTATION: <span className="text-sky-300">INTERACTIVE DRAG</span></div>
        </div>
      </div>
    </div>
  );
};

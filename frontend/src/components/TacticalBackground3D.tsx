import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TacticalBackground3DProps {
  isLoggedIn: boolean;
  isWarping: boolean;
  onWarpComplete?: () => void;
}

export const TacticalBackground3D: React.FC<TacticalBackground3DProps> = ({
  isLoggedIn,
  isWarping,
  onWarpComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Keep refs for animated parameters so the render loop can access current values without tearing down Three.js scene
  const isWarpingRef = useRef<boolean>(isWarping);
  isWarpingRef.current = isWarping;

  const isLoggedInRef = useRef<boolean>(isLoggedIn);
  isLoggedInRef.current = isLoggedIn;

  const onWarpCompleteRef = useRef<(() => void) | undefined>(onWarpComplete);
  onWarpCompleteRef.current = onWarpComplete;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.0018);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    // Initial camera position
    const targetCameraZ = isLoggedInRef.current ? 250 : 220;
    camera.position.set(0, 0, targetCameraZ);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Master Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0x0ea5e9, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2.5, 600);
    pointLight.position.set(120, 150, 200);
    scene.add(pointLight);

    // A. Central Core Sphere
    const coreRadius = 78;
    const coreGeometry = new THREE.SphereGeometry(coreRadius, 40, 40);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x050d1e,
      transparent: true,
      opacity: 0.88,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(coreMesh);

    // B. Glowing Wireframe Tactical Grid Shell
    const wireframeGeometry = new THREE.SphereGeometry(coreRadius + 1.2, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    globeGroup.add(wireframeMesh);

    // C. Tactical Latitude Rings
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });

    [0, 22.5, -22.5, 45, -45, 67.5, -67.5].forEach((lat) => {
      const rad = (lat * Math.PI) / 180;
      const r = Math.cos(rad) * (coreRadius + 1.8);
      const y = Math.sin(rad) * (coreRadius + 1.8);
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

    // D. Global Tactical Incident Hotspots
    const latLongToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const hotspots = [
      { lat: 37.77, lon: -122.41, color: 0xef4444 }, // SF Bay (Critical)
      { lat: 40.71, lon: -74.0, color: 0xf97316 },   // NYC (High)
      { lat: 35.68, lon: 139.76, color: 0xef4444 },  // Tokyo (Critical)
      { lat: 51.5, lon: -0.12, color: 0x38bdf8 },    // London (Active)
      { lat: 19.07, lon: 72.87, color: 0xef4444 },   // Mumbai (Critical)
      { lat: -33.86, lon: 151.2, color: 0x10b981 },  // Sydney (Standby)
      { lat: 28.61, lon: 77.2, color: 0xf97316 },    // Delhi (High)
      { lat: 48.85, lon: 2.35, color: 0x06b6d4 },    // Paris (Active)
    ];

    const beaconPointers: { mesh: THREE.Mesh; scaleDelta: number }[] = [];

    hotspots.forEach((loc) => {
      const basePos = latLongToVector3(loc.lat, loc.lon, coreRadius + 1);
      const tipPos = latLongToVector3(loc.lat, loc.lon, coreRadius + 18);

      const spikeGeo = new THREE.BufferGeometry().setFromPoints([basePos, tipPos]);
      const spikeMat = new THREE.LineBasicMaterial({
        color: loc.color,
        transparent: true,
        opacity: 0.85,
      });
      const spikeLine = new THREE.Line(spikeGeo, spikeMat);
      globeGroup.add(spikeLine);

      const orbGeo = new THREE.SphereGeometry(2.4, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: loc.color });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.copy(tipPos);
      globeGroup.add(orb);
      beaconPointers.push({ mesh: orb, scaleDelta: Math.random() * 2 });
    });

    // E. Orbiting Orbital Rings
    const orbitRingGeo1 = new THREE.RingGeometry(116, 118, 72);
    const orbitRingMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitRing1 = new THREE.Mesh(orbitRingGeo1, orbitRingMat1);
    orbitRing1.rotation.x = Math.PI / 2.3;
    globeGroup.add(orbitRing1);

    const orbitRingGeo2 = new THREE.RingGeometry(130, 131, 72);
    const orbitRingMat2 = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const orbitRing2 = new THREE.Mesh(orbitRingGeo2, orbitRingMat2);
    orbitRing2.rotation.x = -Math.PI / 3.2;
    orbitRing2.rotation.y = Math.PI / 6;
    globeGroup.add(orbitRing2);

    // F. Constellation / Warp Tunnel Particles
    const particlesCount = 450;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const originalPositions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 110 + Math.random() * 280;

      const px = dist * Math.sin(phi) * Math.cos(theta);
      const py = dist * Math.sin(phi) * Math.sin(theta);
      const pz = dist * Math.cos(phi);

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      originalPositions[i * 3] = px;
      originalPositions[i * 3 + 1] = py;
      originalPositions[i * 3 + 2] = pz;

      // Cyan to Sky Blue to White
      const rRatio = Math.random();
      if (rRatio > 0.8) {
        colors[i * 3] = 0.9;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.1;
        colors[i * 3 + 1] = 0.65 + Math.random() * 0.35;
        colors[i * 3 + 2] = 0.98;
      }
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Interactive Drag Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      // Allow drag rotation on login screen
      if (isLoggedInRef.current || isWarpingRef.current) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Window Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation & Warp State Machine
    let animationFrameId: number;
    const startTime = performance.now();

    let warpProgress = 0; // 0 to 1
    let warpHasTriggeredCallback = false;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      // Check warping status
      if (isWarpingRef.current) {
        warpProgress = Math.min(warpProgress + 0.018, 1);

        // Hyper-drive acceleration
        const easeWarp = Math.pow(warpProgress, 2.5);

        // Camera plunges forward through the globe
        camera.position.z = THREE.MathUtils.lerp(220, 22, easeWarp);
        camera.fov = THREE.MathUtils.lerp(45, 85, easeWarp);
        camera.updateProjectionMatrix();

        // Globe spins rapidly
        globeGroup.rotation.y += 0.04 + easeWarp * 0.12;
        globeGroup.rotation.x += 0.015;

        // Orbit rings accelerate
        orbitRing1.rotation.z += 0.08 + easeWarp * 0.2;
        orbitRing2.rotation.z -= 0.08 + easeWarp * 0.2;

        // Stretch constellation particles into hyper-space warp streaks
        const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;

        for (let i = 0; i < particlesCount; i++) {
          posArr[i * 3 + 2] -= (8 + easeWarp * 35);
          if (posArr[i * 3 + 2] < -100) {
            posArr[i * 3 + 2] = 400 + Math.random() * 100;
          }
        }
        posAttr.needsUpdate = true;

        // When warp reaches peak (~0.85), notify parent to switch pages
        if (warpProgress >= 0.85 && !warpHasTriggeredCallback) {
          warpHasTriggeredCallback = true;
          if (onWarpCompleteRef.current) {
            onWarpCompleteRef.current();
          }
        }
      } else {
        // Normal Ambient Mode (either login screen or post-login background)
        warpProgress = 0;
        warpHasTriggeredCallback = false;

        // Camera target positioning
        if (isLoggedInRef.current) {
          // Ambient post-login stance: positioned smoothly in background
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, 260, 0.05);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, 10, 0.05);
          camera.fov = THREE.MathUtils.lerp(camera.fov, 45, 0.05);
          camera.updateProjectionMatrix();

          // Subtle ambient rotation
          globeGroup.rotation.y += 0.0022;
          orbitRing1.rotation.z += 0.003;
          orbitRing2.rotation.z -= 0.0025;
          particles.rotation.y -= 0.001;
        } else {
          // Login screen stance: prominent, interactive
          if (!isDragging) {
            globeGroup.rotation.y += 0.0035;
          }
          camera.position.z = THREE.MathUtils.lerp(camera.position.z, 220, 0.05);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.05);
          camera.fov = THREE.MathUtils.lerp(camera.fov, 45, 0.05);
          camera.updateProjectionMatrix();

          orbitRing1.rotation.z += 0.005;
          orbitRing2.rotation.z -= 0.004;
          particles.rotation.y -= 0.0015;
        }

        // Return particles gently to original cloud shape if disturbed
        const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        for (let i = 0; i < particlesCount; i++) {
          posArr[i * 3] = THREE.MathUtils.lerp(posArr[i * 3], originalPositions[i * 3], 0.05);
          posArr[i * 3 + 1] = THREE.MathUtils.lerp(posArr[i * 3 + 1], originalPositions[i * 3 + 1], 0.05);
          posArr[i * 3 + 2] = THREE.MathUtils.lerp(posArr[i * 3 + 2], originalPositions[i * 3 + 2], 0.05);
        }
        posAttr.needsUpdate = true;
      }

      // Hotspot beacon scale pulsing
      beaconPointers.forEach((b, idx) => {
        const s = 1 + Math.sin(elapsedTime * 4.5 + idx) * 0.4;
        b.mesh.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousedown', onMouseDown);
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Three.js Canvas Container */}
      <div 
        ref={mountRef} 
        className={`w-full h-full ${!isLoggedIn ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`} 
      />

      {/* Cybernetic Dark Ambient Radial Vignette & Grid Glow */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Warp Flash Overlay during hyper-speed transition */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-sky-500/25 via-sky-300/40 to-white/60 pointer-events-none transition-opacity duration-300 ${
          isWarping ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

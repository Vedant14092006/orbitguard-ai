import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const MiniGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(6, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#06152b';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;

    for (let lat = -80; lat <= 80; lat += 30) {
      const y = ((90 - lat) / 180) * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    for (let lon = -180; lon <= 180; lon += 45) {
      const x = ((lon + 180) / 360) * 512;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    const earthMat = new THREE.MeshBasicMaterial({ map: tex, wireframe: false });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Orbit Ring 1 (LEO)
    const ringGeo1 = new THREE.RingGeometry(6.6, 6.7, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.5;
    ring1.rotation.y = 0.3;
    scene.add(ring1);

    // Orbit Ring 2 (Polar)
    const ringGeo2 = new THREE.RingGeometry(7.2, 7.3, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 1.3;
    ring2.rotation.y = -0.4;
    scene.add(ring2);

    // Swarm Particles
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      const r = 6.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      pPositions[i] = r * Math.cos(theta) * Math.cos(phi);
      pPositions[i + 1] = r * Math.sin(phi);
      pPositions[i + 2] = r * Math.sin(theta) * Math.cos(phi);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.12, transparent: true, opacity: 0.8 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Resize
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animate
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earthMesh.rotation.y += 0.005;
      ring1.rotation.z += 0.01;
      ring2.rotation.z -= 0.008;
      particles.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[220px]" />;
};

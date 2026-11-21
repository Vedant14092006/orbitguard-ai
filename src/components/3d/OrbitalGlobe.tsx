// ORBITGUARD AI - High-Performance 3D WebGL Orbital Engine
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  Info,
  X,
  Target,
  Compass,
  StepForward,
  ShieldAlert,
  Database,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { MOCK_SATELLITES } from '../../data/mockSatellites';
import { MOCK_DEBRIS } from '../../data/mockDebris';
import { REAL_TLE_CATALOG } from '../../data/realTleData';
import { propagateTle, fetchLiveCelestrakTle } from '../../services/realDataService';
import { OrbitalObject } from '../../types/orbit';
import { getOrbitalPosition, generateOrbitTrackPoints } from '../../services/telemetryService';
import { audioService } from '../../services/audioService';
import { Badge } from '../common/Badge';

export interface OrbitalFilters {
  showActive: boolean;
  showInactive: boolean;
  showDebris: boolean;
  showHighRiskOnly: boolean;
  showOrbits: boolean;
  showShells: boolean;
}

interface OrbitalGlobeProps {
  selectedObjectId?: string | null;
  onSelectObject?: (obj: OrbitalObject | null) => void;
  fullHeight?: boolean;
  externalFilters?: OrbitalFilters;
  onFilterChange?: (filters: OrbitalFilters) => void;
}

export const OrbitalGlobe: React.FC<OrbitalGlobeProps> = ({
  selectedObjectId,
  onSelectObject,
  fullHeight = true,
  externalFilters,
  onFilterChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(10);
  const [simTimeElapsedSec, setSimTimeElapsedSec] = useState<number>(0);

  const [filters, setFilters] = useState<OrbitalFilters>(
    externalFilters || {
      showActive: true,
      showInactive: true,
      showDebris: true,
      showHighRiskOnly: false,
      showOrbits: true,
      showShells: true
    }
  );

  useEffect(() => {
    if (externalFilters) setFilters(externalFilters);
  }, [externalFilters]);

  const updateFilters = (newFilters: Partial<OrbitalFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange?.(updated);
    audioService.playBlip();
  };

  const [selectedObj, setSelectedObj] = useState<OrbitalObject | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [isSyncingTle, setIsSyncingTle] = useState<boolean>(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('2026-11-21 15:42 UTC');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncCelestrak = async () => {
    setIsSyncingTle(true);
    setSyncFeedback(null);
    audioService.playBlip();

    try {
      const res = await fetchLiveCelestrakTle('stations');
      const nowStr = new Date().toUTCString().replace('GMT', 'UTC').slice(5, 22);
      setLastSyncTimestamp(nowStr);
      setSyncFeedback(
        res.source === 'LIVE_NETWORK'
          ? 'Live CelesTrak TLEs Synced'
          : res.source === 'CACHED_LOCAL'
          ? 'Cached TLEs (TTL 60m)'
          : 'Verified Offline Baseline'
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('Sync failed; baseline active');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncingTle(false);
    }
  };

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const satGroupRef = useRef<THREE.Group | null>(null);
  const debrisGroupRef = useRef<THREE.Group | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const shellsGroupRef = useRef<THREE.Group | null>(null);
  const redDebrisParticlesRef = useRef<THREE.Points | null>(null);
  const orangeDebrisParticlesRef = useRef<THREE.Points | null>(null);
  const whiteDebrisParticlesRef = useRef<THREE.Points | null>(null);
  const conjunctionLineRef = useRef<THREE.Line | null>(null);

  const satMeshesMap = useRef<Map<string, THREE.Group>>(new Map());
  const debrisMeshesMap = useRef<Map<string, THREE.Group>>(new Map());

  const timeOffsetRef = useRef<number>(0);
  const isMouseDownRef = useRef(false);
  const isRightMouseDownRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraDistanceRef = useRef(36);
  const cameraRotationRef = useRef({ theta: 0.8, phi: 1.2 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  const allObjects = [...MOCK_SATELLITES, ...MOCK_DEBRIS];

  const createEarthTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#040d21');
    oceanGrad.addColorStop(0.5, '#071738');
    oceanGrad.addColorStop(1, '#040d21');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1;
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.fillStyle = '#0f2d4a';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;

    const drawPoly = (pts: [number, number][]) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => {
        const x = (px / 100) * canvas.width;
        const y = (py / 100) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    drawPoly([[10, 20], [28, 16], [35, 25], [26, 44], [16, 44], [8, 32]]);
    drawPoly([[24, 52], [36, 54], [32, 80], [24, 88], [19, 68]]);
    drawPoly([[45, 20], [58, 18], [56, 36], [44, 38]]);
    drawPoly([[43, 42], [61, 44], [57, 75], [47, 78], [41, 58]]);
    drawPoly([[60, 18], [88, 20], [86, 52], [68, 50], [58, 36]]);
    drawPoly([[78, 65], [91, 64], [87, 82], [77, 80]]);
    drawPoly([[20, 92], [80, 92], [85, 98], [15, 98]]);

    ctx.fillStyle = '#fde047';
    for (let i = 0; i < 500; i++) {
      const cx = (0.12 + Math.random() * 0.78) * canvas.width;
      const cy = (0.18 + Math.random() * 0.64) * canvas.height;
      const r = Math.random() * 1.6 + 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  };

  const createCloudTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 55 + 20;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  };

  const createSatellite3DModel = (sat: OrbitalObject): THREE.Group => {
    const group = new THREE.Group();
    const isStation = sat.category === 'SPACE_STATION';
    const busGeo = isStation
      ? new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12)
      : new THREE.BoxGeometry(0.32, 0.32, 0.32);

    const busColor = sat.color ? new THREE.Color(sat.color) : new THREE.Color(0x00f0ff);
    const busMat = new THREE.MeshStandardMaterial({
      color: busColor,
      roughness: 0.3,
      metalness: 0.8
    });
    group.add(new THREE.Mesh(busGeo, busMat));

    const panelGeo = new THREE.BoxGeometry(isStation ? 1.5 : 0.85, 0.04, 0.26);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.2
    });
    group.add(new THREE.Mesh(panelGeo, panelMat));

    const ringGeo = new THREE.RingGeometry(0.48, 0.55, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: busColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    group.add(new THREE.Mesh(ringGeo, ringMat));

    group.userData = { id: sat.id, data: sat };
    return group;
  };

  const createDebris3DModel = (deb: OrbitalObject): THREE.Group => {
    const group = new THREE.Group();
    if (deb.type === 'ROCKET_BODY') {
      const rbGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.7, 10);
      const rbMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5, metalness: 0.7 });
      group.add(new THREE.Mesh(rbGeo, rbMat));
    } else {
      const fragGeo = new THREE.DodecahedronGeometry(0.18);
      const fragColor = deb.color === '#ffffff' ? 0xffffff : 0xef4444;
      const fragMat = new THREE.MeshStandardMaterial({ color: fragColor, roughness: 0.6, metalness: 0.4 });
      group.add(new THREE.Mesh(fragGeo, fragMat));
    }
    group.userData = { id: deb.id, data: deb };
    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(60, 25, 60);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.9);
    rimLight.position.set(-60, -25, -60);
    scene.add(rimLight);

    const earthRadius = 10;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthTex = createEarthTexture();
    const earthMat = new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.65, metalness: 0.25 });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMeshRef.current = earthMesh;
    scene.add(earthMesh);

    const cloudsGeo = new THREE.SphereGeometry(earthRadius * 1.015, 64, 64);
    const cloudsTex = createCloudTexture();
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    scene.add(cloudsMesh);

    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.045, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    const shellsGroup = new THREE.Group();
    shellsGroupRef.current = shellsGroup;
    const createShellRing = (radius: number, color: number, opacity: number) => {
      const ringGeo = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
      }
      ringGeo.setFromPoints(pts);
      return new THREE.Line(
        ringGeo,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending })
      );
    };
    shellsGroup.add(createShellRing(10.95, 0x00f0ff, 0.35));
    shellsGroup.add(createShellRing(20.0, 0xf59e0b, 0.25));
    shellsGroup.add(createShellRing(26.0, 0xa855f7, 0.35));
    scene.add(shellsGroup);

    const orbitGroup = new THREE.Group();
    orbitGroupRef.current = orbitGroup;
    scene.add(orbitGroup);

    allObjects.forEach((obj) => {
      const trackPts = generateOrbitTrackPoints(obj, 100);
      const trackVectors = trackPts.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const trackGeo = new THREE.BufferGeometry().setFromPoints(trackVectors);
      const trackMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(obj.color || (obj.type === 'SATELLITE' ? '#38bdf8' : '#ef4444')),
        transparent: true,
        opacity: 0.32
      });
      orbitGroup.add(new THREE.Line(trackGeo, trackMat));
    });

    const satGroup = new THREE.Group();
    satGroupRef.current = satGroup;
    MOCK_SATELLITES.forEach((sat) => {
      const model = createSatellite3DModel(sat);
      satMeshesMap.current.set(sat.id, model);
      satGroup.add(model);
    });
    scene.add(satGroup);

    const debGroup = new THREE.Group();
    debrisGroupRef.current = debGroup;
    MOCK_DEBRIS.forEach((deb) => {
      const model = createDebris3DModel(deb);
      debrisMeshesMap.current.set(deb.id, model);
      debGroup.add(model);
    });
    scene.add(debGroup);

    const createDebrisSwarm = (count: number, colorHex: number, minAlt: number, maxAlt: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = minAlt + Math.random() * (maxAlt - minAlt);
        const inc = (Math.random() - 0.5) * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        pos[i * 3] = r * Math.cos(theta) * Math.cos(inc);
        pos[i * 3 + 1] = r * Math.sin(inc);
        pos[i * 3 + 2] = r * Math.sin(theta) * Math.cos(inc);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      return new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: colorHex, size: 0.16, transparent: true, opacity: 0.85 })
      );
    };

    const redParticles = createDebrisSwarm(550, 0xef4444, 11.0, 11.6);
    redDebrisParticlesRef.current = redParticles;
    scene.add(redParticles);

    const orangeParticles = createDebrisSwarm(450, 0xf97316, 10.8, 12.4);
    orangeDebrisParticlesRef.current = orangeParticles;
    scene.add(orangeParticles);

    const whiteParticles = createDebrisSwarm(600, 0xffffff, 10.7, 13.0);
    whiteDebrisParticlesRef.current = whiteParticles;
    scene.add(whiteParticles);

    const conjGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const conjLine = new THREE.Line(
      conjGeo,
      new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3, transparent: true, opacity: 0.95 })
    );
    conjunctionLineRef.current = conjLine;
    scene.add(conjLine);

    const starsCount = 2500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 600;
      starPos[i + 1] = (Math.random() - 0.5) * 600;
      starPos[i + 2] = (Math.random() - 0.5) * 600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.7 })));

    const updateCameraPos = () => {
      const { theta, phi } = cameraRotationRef.current;
      const d = cameraDistanceRef.current;
      camera.position.x = d * Math.sin(phi) * Math.sin(theta) + targetLookAtRef.current.x;
      camera.position.y = d * Math.cos(phi) + targetLookAtRef.current.y;
      camera.position.z = d * Math.sin(phi) * Math.cos(theta) + targetLookAtRef.current.z;
      camera.lookAt(targetLookAtRef.current);
    };
    updateCameraPos();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = true;
      if (e.button === 2) isRightMouseDownRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current && !isRightMouseDownRef.current) return;
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (isMouseDownRef.current) {
        cameraRotationRef.current.theta -= dx * 0.005;
        cameraRotationRef.current.phi = Math.max(0.05, Math.min(Math.PI - 0.05, cameraRotationRef.current.phi - dy * 0.005));
      } else if (isRightMouseDownRef.current) {
        targetLookAtRef.current.x -= dx * 0.02;
        targetLookAtRef.current.y += dy * 0.02;
      }
      updateCameraPos();
    };

    const onMouseUp = () => {
      isMouseDownRef.current = false;
      isRightMouseDownRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistanceRef.current = Math.max(14, Math.min(85, cameraDistanceRef.current + e.deltaY * 0.03));
      updateCameraPos();
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const interactives: THREE.Object3D[] = [];
      satMeshesMap.current.forEach((grp) => {
        if (grp.visible) interactives.push(...grp.children);
      });
      debrisMeshesMap.current.forEach((grp) => {
        if (grp.visible) interactives.push(...grp.children);
      });

      const intersects = raycaster.intersectObjects(interactives);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const parentGrp = hit.parent;
        if (parentGrp && parentGrp.userData.data) {
          const objData = parentGrp.userData.data as OrbitalObject;
          setSelectedObj(objData);
          onSelectObject?.(objData);
          audioService.playBlip();

          const pos = getOrbitalPosition(objData, timeOffsetRef.current);
          targetLookAtRef.current.set(pos.x * 0.3, pos.y * 0.3, pos.z * 0.3);
          updateCameraPos();
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });
    domEl.addEventListener('click', onClick);
    domEl.addEventListener('contextmenu', (e) => e.preventDefault());

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      earthMesh.rotation.y += delta * 0.02;
      cloudsMesh.rotation.y += delta * 0.026;

      if (isPlaying) {
        const timeInc = delta * simSpeed;
        timeOffsetRef.current += timeInc;
        setSimTimeElapsedSec((prev) => prev + timeInc);
      }

      const targetTime = new Date(Date.now() + timeOffsetRef.current * 1000);

      MOCK_SATELLITES.forEach((sat) => {
        const model = satMeshesMap.current.get(sat.id);
        if (model) {
          const tle = REAL_TLE_CATALOG.find((t) => t.noradId === sat.noradId);
          if (tle) {
            const prop = propagateTle(tle.line1, tle.line2, targetTime);
            model.position.set(prop.x, prop.y, prop.z);
          } else {
            const pos = getOrbitalPosition(sat, timeOffsetRef.current);
            model.position.set(pos.x, pos.y, pos.z);
          }
          model.lookAt(0, 0, 0);
          model.rotateZ(delta * 0.5);
        }
      });

      MOCK_DEBRIS.forEach((deb) => {
        const model = debrisMeshesMap.current.get(deb.id);
        if (model) {
          const tle = REAL_TLE_CATALOG.find((t) => t.noradId === deb.noradId);
          if (tle) {
            const prop = propagateTle(tle.line1, tle.line2, targetTime);
            model.position.set(prop.x, prop.y, prop.z);
          } else {
            const pos = getOrbitalPosition(deb, timeOffsetRef.current);
            model.position.set(pos.x, pos.y, pos.z);
          }
          model.rotation.x += delta * 0.4;
          model.rotation.y += delta * 0.3;
        }
      });

      if (redParticles) redParticles.rotation.y += delta * 0.012;
      if (orangeParticles) orangeParticles.rotation.y += delta * 0.009;
      if (whiteParticles) whiteParticles.rotation.y += delta * 0.015;

      const starlinkSat = MOCK_SATELLITES.find((s) => s.id === 'sat-starlink-5120');
      const cosmosDeb = MOCK_DEBRIS.find((d) => d.id === 'deb-cosmos-18420');
      if (starlinkSat && cosmosDeb && conjunctionLineRef.current) {
        const sModel = satMeshesMap.current.get(starlinkSat.id);
        const dModel = debrisMeshesMap.current.get(cosmosDeb.id);
        if (sModel && dModel) {
          const positions = conjunctionLineRef.current.geometry.attributes.position;
          positions.setXYZ(0, sModel.position.x, sModel.position.y, sModel.position.z);
          positions.setXYZ(1, dModel.position.x, dModel.position.y, dModel.position.z);
          positions.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (domEl.parentNode) domEl.parentNode.removeChild(domEl);
    };
  }, []);
  useEffect(() => {
    MOCK_SATELLITES.forEach((sat) => {
      const model = satMeshesMap.current.get(sat.id);
      if (model) {
        let isVis = true;
        if (sat.status === 'ACTIVE' && !filters.showActive) isVis = false;
        if (sat.status === 'INACTIVE' && !filters.showInactive) isVis = false;
        if (filters.showHighRiskOnly && sat.riskLevel !== 'CRITICAL' && sat.riskLevel !== 'HIGH') {
          isVis = false;
        }
        model.visible = isVis;
      }
    });

    MOCK_DEBRIS.forEach((deb) => {
      const model = debrisMeshesMap.current.get(deb.id);
      if (model) {
        let isVis = filters.showDebris;
        if (filters.showHighRiskOnly && deb.riskLevel !== 'CRITICAL' && deb.riskLevel !== 'HIGH') {
          isVis = false;
        }
        model.visible = isVis;
      }
    });

    if (redDebrisParticlesRef.current) redDebrisParticlesRef.current.visible = filters.showDebris;
    if (orangeDebrisParticlesRef.current) orangeDebrisParticlesRef.current.visible = filters.showDebris && !filters.showHighRiskOnly;
    if (whiteDebrisParticlesRef.current) whiteDebrisParticlesRef.current.visible = filters.showDebris && !filters.showHighRiskOnly;
    if (orbitGroupRef.current) orbitGroupRef.current.visible = filters.showOrbits;
    if (shellsGroupRef.current) shellsGroupRef.current.visible = filters.showShells;
  }, [filters]);

  useEffect(() => {
    if (selectedObjectId) {
      const found = allObjects.find((o) => o.id === selectedObjectId);
      if (found) setSelectedObj(found);
    }
  }, [selectedObjectId]);

  const handleResetCamera = () => {
    cameraRotationRef.current = { theta: 0.8, phi: 1.2 };
    cameraDistanceRef.current = 36;
    targetLookAtRef.current.set(0, 0, 0);
    audioService.playBlip();
  };

  const handleStepForward = () => {
    timeOffsetRef.current += 60;
    setSimTimeElapsedSec((prev) => prev + 60);
    audioService.playBlip();
  };

  const formatElapsedSimTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60) % 60;
    const hours = Math.floor(seconds / 3600);
    const secs = Math.floor(seconds % 60);
    return `+${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-cyan-500/30 bg-slate-950 select-none font-mono ${
        fullHeight ? 'h-[calc(100vh-8.5rem)]' : 'h-[500px]'
      }`}
    >
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP LEFT: Mission HUD Status Banner */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-xs tracking-wider uppercase">
            3D ORBITAL ENVIRONMENT // SGP4 + KEPLERIAN HYBRID
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            60 FPS
          </span>
        </div>

        <div className="px-3 py-1 rounded bg-slate-950/75 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2.5 backdrop-blur-sm pointer-events-none">
          <span>SIM TIME: <strong className="text-cyan-400">{formatElapsedSimTime(simTimeElapsedSec)}</strong></span>
          <span>&bull;</span>
          <span>SPEED: <strong className="text-amber-400">{simSpeed}x</strong></span>
          <span>&bull;</span>
          <span>MODE: <strong className="text-emerald-400">{isPlaying ? 'PROPAGATING' : 'PAUSED'}</strong></span>
        </div>

        {/* Live CelesTrak Data Feed Bar */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/85 border border-emerald-500/30 text-[10px] text-emerald-300 backdrop-blur-sm shadow-md">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>CELESTRAK SGP4: <strong>{lastSyncTimestamp}</strong></span>
          <button
            onClick={handleSyncCelestrak}
            disabled={isSyncingTle}
            className="ml-1 p-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors pointer-events-auto"
            title="Refresh CelesTrak TLEs"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncingTle ? 'animate-spin' : ''}`} />
          </button>
          {syncFeedback && (
            <span className="text-[9px] text-cyan-300 bg-cyan-950/80 px-1 rounded border border-cyan-500/30 animate-pulse">
              {syncFeedback}
            </span>
          )}
        </div>
      </div>

      {/* TOP RIGHT: Filter Toggle Group */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs shadow-xl">
          <button
            onClick={() => updateFilters({ showActive: !filters.showActive })}
            className={`px-2.5 py-1 rounded transition-colors text-[11px] flex items-center gap-1.5 ${
              filters.showActive
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Active Sats</span>
          </button>

          <button
            onClick={() => updateFilters({ showInactive: !filters.showInactive })}
            className={`px-2.5 py-1 rounded transition-colors text-[11px] flex items-center gap-1.5 ${
              filters.showInactive
                ? 'bg-amber-950 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Inactive Sats</span>
          </button>

          <button
            onClick={() => updateFilters({ showDebris: !filters.showDebris })}
            className={`px-2.5 py-1 rounded transition-colors text-[11px] flex items-center gap-1.5 ${
              filters.showDebris
                ? 'bg-orange-950 text-orange-300 border border-orange-500/40 font-bold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Space Debris</span>
          </button>

          <button
            onClick={() => updateFilters({ showHighRiskOnly: !filters.showHighRiskOnly })}
            className={`px-2.5 py-1 rounded transition-colors text-[11px] flex items-center gap-1.5 ${
              filters.showHighRiskOnly
                ? 'bg-red-950 text-red-300 border border-red-500/50 font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'text-slate-500 hover:text-red-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>High Risk Only</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => updateFilters({ showOrbits: !filters.showOrbits })}
            className={`px-2 py-1 rounded text-[11px] ${
              filters.showOrbits ? 'text-cyan-400 font-bold' : 'text-slate-600'
            }`}
            title="Toggle Orbital Curved Lines"
          >
            Orbits
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-1.5 rounded transition-colors ${
              showLegend ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Color Legend"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BOTTOM LEFT: Color Legend Card */}
      {showLegend && (
        <div className="absolute bottom-16 left-4 w-64 p-3 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 text-[11px] text-slate-300 space-y-2 z-10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Object Color Legend
            </span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
              <span>Active Satellites (Commercial/Sci)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span>Space Stations (ISS, Tiangong)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#eab308]" />
              <span>Navigation Belts (GPS, Galileo)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" />
              <span>Geostationary Shell (GEO)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span>Critical Debris (Cosmos/Fengyun)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]" />
              <span>Spent Rocket Bodies & Inactive</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
              <span>Trackable Lethal Shrapnel</span>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CENTER: Time Control HUD Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-xl bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 text-xs shadow-2xl z-10">
        <button
          onClick={() => {
            setIsPlaying(!isPlaying);
            audioService.playBlip();
          }}
          className={`p-2 rounded-lg flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title={isPlaying ? 'Pause Orbit Animation' : 'Resume Orbit Animation'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={handleStepForward}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          title="Step Forward +1 Minute"
        >
          <StepForward className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {[0.5, 1, 5, 10, 50, 100].map((spd) => (
          <button
            key={spd}
            onClick={() => {
              setSimSpeed(spd);
              audioService.playBlip();
            }}
            className={`px-2.5 py-1 rounded-md transition-all text-[11px] ${
              simSpeed === spd
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {spd}x
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={() => {
            timeOffsetRef.current = 0;
            setSimTimeElapsedSec(0);
            audioService.playBlip();
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors text-[10px]"
          title="Reset Simulation Time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* BOTTOM RIGHT: Interactive Target Information Panel */}
      {selectedObj && (() => {
        const liveTle = REAL_TLE_CATALOG.find((t) => t.noradId === selectedObj.noradId);
        const livePropState = liveTle
          ? propagateTle(liveTle.line1, liveTle.line2, new Date(Date.now() + timeOffsetRef.current * 1000))
          : null;

        return (
          <div className="absolute bottom-16 right-4 w-80 p-4 rounded-xl bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 text-xs shadow-2xl space-y-3 z-10 animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h3 className="font-bold text-slate-100 text-sm">{selectedObj.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {liveTle ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      NORAD #{selectedObj.noradId} (CELESTRAK SGP4)
                    </span>
                  ) : selectedObj.isSimulated ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 uppercase font-bold">
                      DEMO ID: #{selectedObj.noradId} (SIMULATED TESTBED)
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/40 uppercase font-bold">
                      NORAD TLE: #{selectedObj.noradId} (REAL OBSERVATION)
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedObj(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SGP4 Live Coordinates (If Real TLE Object) */}
            {livePropState && (
              <div className="p-2 rounded bg-slate-900/90 border border-emerald-500/30 text-[10px] space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SGP4 GEODETIC TELEMETRY
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">LIVE EPOCH</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Geodetic Lat:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {livePropState.latitudeDeg >= 0 ? `${livePropState.latitudeDeg}° N` : `${Math.abs(livePropState.latitudeDeg)}° S`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Geodetic Lon:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {livePropState.longitudeDeg >= 0 ? `${livePropState.longitudeDeg}° E` : `${Math.abs(livePropState.longitudeDeg)}° W`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">SGP4 Alt / Vel:</span>
                  <span className="font-mono text-slate-100 font-bold">
                    {livePropState.altitudeKm} km @ {livePropState.velocityKmS} km/s
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ORBITAL ALTITUDE</span>
                <strong className="text-cyan-400 font-bold">
                  {livePropState ? livePropState.altitudeKm : selectedObj.altitude} km
                </strong>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ORBITAL VELOCITY</span>
                <strong className="text-slate-200 font-bold">
                  {livePropState ? livePropState.velocityKmS : selectedObj.velocity} km/s
                </strong>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">INCLINATION</span>
                <strong className="text-slate-200 font-bold">
                  {livePropState ? livePropState.inclinationDeg : selectedObj.inclination}&deg;
                </strong>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">MISSION STATUS</span>
                <strong
                  className={
                    selectedObj.status === 'ACTIVE'
                      ? 'text-emerald-400 font-bold'
                      : selectedObj.status === 'FRAGMENTED'
                      ? 'text-red-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {selectedObj.status}
                </strong>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Collision Risk:</span>
                <Badge
                  label={selectedObj.riskLevel}
                  variant={
                    selectedObj.riskLevel === 'CRITICAL'
                      ? 'red'
                      : selectedObj.riskLevel === 'HIGH'
                      ? 'amber'
                      : 'emerald'
                  }
                  pulse={selectedObj.riskLevel === 'CRITICAL'}
                  size="xs"
                />
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Operator / Program:</span>
                <span className="text-slate-200 font-semibold truncate max-w-[170px]">
                  {selectedObj.operator}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Nation / Registry:</span>
                <span className="text-slate-300">{selectedObj.country}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Data Provenance:</span>
                <span className="text-cyan-400 font-mono text-[10px]">
                  {liveTle ? 'CelesTrak GP SGP4' : 'Analytical Keplerian'}
                </span>
              </div>

              {selectedObj.ssrRating && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Sustainability Rating:</span>
                  <span className="text-cyan-400 font-bold">{selectedObj.ssrRating} / 100</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const pos = getOrbitalPosition(selectedObj, timeOffsetRef.current);
                targetLookAtRef.current.set(pos.x * 0.4, pos.y * 0.4, pos.z * 0.4);
                audioService.playBlip();
              }}
              className="w-full py-2 rounded-md bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>FOCUS & TRACK SPACECRAFT</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
};

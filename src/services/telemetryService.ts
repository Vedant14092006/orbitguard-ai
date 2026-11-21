import { OrbitalObject } from '../types/orbit';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// Convert Keplerian elements to 3D Cartesian coordinates for Three.js visualization
// Earth radius normalized to 10 units in Three.js scene
const EARTH_RADIUS_KM = 6371;
const SCENE_EARTH_RADIUS = 10;
const ALTITUDE_SCALE = SCENE_EARTH_RADIUS / EARTH_RADIUS_KM;

export function getOrbitalPosition(
  obj: OrbitalObject,
  timeOffsetSeconds: number = 0
): Vector3D {
  // Mean motion in radians per second
  const periodSec = obj.period * 60;
  const meanMotion = (2 * Math.PI) / periodSec;
  
  // Phase angle from time and unique object seed
  const seed = (obj.noradId * 137.5) % 360;
  const initialAngleRad = (seed * Math.PI) / 180;
  const currentAngle = initialAngleRad + meanMotion * timeOffsetSeconds;
  
  // Orbital radius in scene units
  const rKm = EARTH_RADIUS_KM + obj.altitude;
  const rScene = rKm * ALTITUDE_SCALE;
  
  // Inclination in radians
  const incRad = (obj.inclination * Math.PI) / 180;
  
  // Orbital plane position
  const xOrb = rScene * Math.cos(currentAngle);
  const zOrb = rScene * Math.sin(currentAngle);
  
  // Apply inclination rotation around X axis
  const x = xOrb;
  const y = -zOrb * Math.sin(incRad);
  const z = zOrb * Math.cos(incRad);
  
  return { x, y, z };
}

export function generateOrbitTrackPoints(obj: OrbitalObject, segments: number = 100): Vector3D[] {
  const points: Vector3D[] = [];
  const rKm = EARTH_RADIUS_KM + obj.altitude;
  const rScene = rKm * ALTITUDE_SCALE;
  const incRad = (obj.inclination * Math.PI) / 180;
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const xOrb = rScene * Math.cos(angle);
    const zOrb = rScene * Math.sin(angle);
    
    const x = xOrb;
    const y = -zOrb * Math.sin(incRad);
    const z = zOrb * Math.cos(incRad);
    
    points.push({ x, y, z });
  }
  
  return points;
}

export function formatVelocity(v: number): string {
  return `${v.toFixed(2)} km/s`;
}

export function formatAltitude(alt: number): string {
  return `${alt.toLocaleString()} km`;
}


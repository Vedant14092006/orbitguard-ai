import { OrbitalObject, RiskLevel } from '../types/orbit';
import { MOCK_CONJUNCTIONS } from '../data/mockConjunctions';

export interface GroundTrackPoint {
  timeOffsetMin: number;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  isCurrentPosition?: boolean;
}

export interface SatelliteSafetyNotification {
  id: string;
  timestamp: string;
  type: 'WARNING' | 'ALERT' | 'INFO' | 'ACTION_REQUIRED';
  title: string;
  description: string;
  severity: RiskLevel;
  actionUrl?: string;
}

/**
 * Maps category to clear aerospace mission type description
 */
export function getMissionTypeLabel(category: string, name: string): string {
  if (name.includes('STARLINK') || name.includes('ONEWEB')) {
    return 'Low-Latency LEO Broadband Constellation';
  }
  if (name.includes('ISS') || name.includes('TIANGONG')) {
    return 'Crewed Space Station & Orbital Laboratory';
  }
  if (category === 'NAVIGATION') {
    return 'Global Navigation Satellite System (PNT)';
  }
  if (name.includes('SENTINEL') || category === 'SCIENTIFIC') {
    if (name.includes('HUBBLE')) return 'Space Astronomy & Optical Deep-Field Observatory';
    if (name.includes('GOES')) return 'Geostationary Meteorological & Earth Observation';
    return 'Multispectral Earth Observation & Environmental Monitoring';
  }
  if (category === 'DEFENSE') {
    return 'Radar Reconnaissance & Space Domain Awareness';
  }
  return 'Scientific Orbital Research & Testbed';
}

/**
 * Calculates debris flux exposure level based on orbital altitude and satellite cross-sectional area
 */
export function calculateDebrisExposureLevel(sat: OrbitalObject): RiskLevel {
  const alt = sat.altitude;
  const isLarge = sat.rcsSize === 'LARGE';

  // Cosmos-2251 and Fengyun-1C peak debris density corridor (740 - 860 km)
  if (alt >= 740 && alt <= 860) {
    return 'CRITICAL';
  }
  // Megaconstellation densest operational corridor (500 - 620 km)
  if (alt >= 500 && alt <= 620) {
    return isLarge ? 'CRITICAL' : 'HIGH';
  }
  // High LEO corridor (860 - 1400 km)
  if (alt > 860 && alt <= 1400) {
    return 'MODERATE';
  }
  // VLEO below 450 km (Rapid atmospheric self-cleansing)
  if (alt < 450) {
    return 'MODERATE';
  }
  // MEO and GEO regimes (vastly larger spatial volume, lower debris concentration)
  return 'LOW';
}

/**
 * Calculates estimated remaining mission life in years, or returns null if telemetry is unavailable
 */
export function getEstimatedMissionLife(sat: OrbitalObject): {
  lifeYears: number | null;
  status: 'DATA_AVAILABLE' | 'UNAVAILABLE_NO_TELEMETRY' | 'DERELICT_INACTIVE';
  explanation: string;
} {
  // If satellite is inactive or derelict (e.g. Envisat)
  if (sat.status === 'INACTIVE' || sat.status === 'DECAYING') {
    return {
      lifeYears: null,
      status: 'DERELICT_INACTIVE',
      explanation: 'UNAVAILABLE: Satellite is defunct or contact lost. Station-keeping capability exhausted.'
    };
  }

  // If satellite has no propellant telemetry (e.g. Hubble relies on gyroscopes, no onboard propulsion)
  if (!sat.health || sat.health.propellantKg === 0) {
    return {
      lifeYears: null,
      status: 'UNAVAILABLE_NO_TELEMETRY',
      explanation: 'UNAVAILABLE: Zero onboard station-keeping propellant. Orbital lifetime governed strictly by passive atmospheric drag.'
    };
  }

  // For active satellites with propulsion:
  // Estimate based on fuel mass and standard annual station-keeping budget (~6 - 12 kg/yr for LEO)
  const fuelKg = sat.health.propellantKg;
  let annualUsageKg = 8.5; // default for electric/ion
  if (sat.rcsSize === 'LARGE') {
    annualUsageKg = sat.health.propellantKg > 500 ? 180 : 18; // ISS vs large GEO/MEO
  }

  const estimatedYears = parseFloat(Math.min(15, Math.max(0.5, fuelKg / annualUsageKg)).toFixed(1));

  return {
    lifeYears: estimatedYears,
    status: 'DATA_AVAILABLE',
    explanation: `Estimated ${estimatedYears} years of operational life based on ${fuelKg} kg remaining propellant and battery degradation curve.`
  };
}

/**
 * Generates warning history for a satellite from Conjunction Data Messages
 */
export function getSatelliteWarningHistory(sat: OrbitalObject) {
  // Direct conjunctions matching targetObject
  const matches = MOCK_CONJUNCTIONS.filter(c => c.targetObject.id === sat.id);

  if (matches.length > 0) {
    return matches.map(c => ({
      id: c.id,
      tca: c.tca,
      missDistanceM: Math.round(c.missDistanceKm * 1000),
      chaserName: c.chaserObject.name,
      chaserNoradId: c.chaserObject.noradId,
      relativeVelKmS: c.relativeVelocityKmS,
      risk: c.riskLevel,
      actionTaken: c.maneuverExecuted
        ? 'Avoidance Burn Executed'
        : c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH'
        ? 'Avoidance Maneuver Recommended'
        : 'Active Tracking / Passivity'
    }));
  }

  // Generate representative historical telemetry warnings for fleet satellites
  return [
    {
      id: `cdm-hist-${sat.noradId}-01`,
      tca: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      missDistanceM: 840,
      chaserName: 'COSMOS-2251 DEBRIS',
      chaserNoradId: 34399,
      relativeVelKmS: 13.8,
      risk: 'MODERATE' as RiskLevel,
      actionTaken: 'Screened; Miss Distance Exceeded 800m'
    },
    {
      id: `cdm-hist-${sat.noradId}-02`,
      tca: new Date(Date.now() - 92 * 3600 * 1000).toISOString(),
      missDistanceM: 2300,
      chaserName: 'FENGYUN-1C FRAG',
      chaserNoradId: 31250,
      relativeVelKmS: 11.2,
      risk: 'LOW' as RiskLevel,
      actionTaken: 'Passive Monitoring'
    }
  ];
}

/**
 * Generates simulated orbital ground track coordinates for trajectory visualization
 */
export function generateGroundTrack(sat: OrbitalObject, pointsCount: number = 32): GroundTrackPoint[] {
  const points: GroundTrackPoint[] = [];
  const inc = Math.min(89, sat.inclination);
  const periodMin = sat.period || 95.0;

  for (let i = 0; i <= pointsCount; i++) {
    const fraction = i / pointsCount;
    const timeOffsetMin = Math.round(fraction * periodMin);
    const angleRad = (fraction * 2 * Math.PI);

    // Approximate sinusoidal sub-satellite latitude from inclination
    const latitude = parseFloat((inc * Math.sin(angleRad)).toFixed(2));

    // Approximate longitude drift accounting for Earth rotation
    const earthRotationDeg = fraction * (periodMin / 1440) * 360;
    const rawLon = (fraction * 360 - 180 - earthRotationDeg) % 360;
    const longitude = parseFloat((rawLon > 180 ? rawLon - 360 : rawLon < -180 ? rawLon + 360 : rawLon).toFixed(2));

    points.push({
      timeOffsetMin,
      latitude,
      longitude,
      altitudeKm: sat.altitude + Math.round(5 * Math.sin(angleRad * 2)),
      isCurrentPosition: i === 0
    });
  }

  return points;
}

/**
 * Generates concerning orbital events and safety notifications
 */
export function getSatelliteSafetyNotifications(sat: OrbitalObject): SatelliteSafetyNotification[] {
  const notifications: SatelliteSafetyNotification[] = [];

  const exposure = calculateDebrisExposureLevel(sat);
  const life = getEstimatedMissionLife(sat);

  // Debris exposure alert
  if (exposure === 'CRITICAL' || exposure === 'HIGH') {
    notifications.push({
      id: `notif-${sat.id}-exposure`,
      timestamp: 'Active Real-Time',
      type: 'ALERT',
      title: `High Spatial Debris Flux Corridor (${sat.altitude} km)`,
      description: `${sat.name} is operating in an orbital regime with elevated spatial debris fragment density. Conjunction screening rate is increased to 4-hour intervals.`,
      severity: exposure
    });
  }

  // Active Conjunction match
  const conjunction = MOCK_CONJUNCTIONS.find(c => c.targetObject.id === sat.id);
  if (conjunction && !conjunction.maneuverExecuted) {
    notifications.push({
      id: `notif-${sat.id}-conjunction`,
      timestamp: new Date(conjunction.tca).toLocaleTimeString(),
      type: 'ACTION_REQUIRED',
      title: `Pending Conjunction: Miss Distance ${Math.round(conjunction.missDistanceKm * 1000)}m`,
      description: `Close approach predicted with ${conjunction.chaserObject.name} at ${conjunction.relativeVelocityKmS} km/s. Collision probability Pc = ${conjunction.collisionProbability.toExponential(2)}.`,
      severity: conjunction.riskLevel
    });
  }

  // Deorbit compliance notification
  if (sat.health && !sat.health.deorbitRuleCompliant) {
    notifications.push({
      id: `notif-${sat.id}-deorbit`,
      timestamp: 'Audit Finding',
      type: 'WARNING',
      title: '5-Year Deorbit Non-Compliance Flag',
      description: 'Projected natural orbital decay exceeds mandated 5-year post-mission disposal threshold without active deorbit burn.',
      severity: 'MODERATE'
    });
  }

  // Battery / Thermal alert if degraded
  if (sat.health && sat.health.operationalStatus === 'DEGRADED') {
    notifications.push({
      id: `notif-${sat.id}-health`,
      timestamp: 'Telemetry Anomaly',
      type: 'WARNING',
      title: 'Bus Subsystem Telemetry Degraded',
      description: `Battery state-of-charge is at ${sat.health.batterySocPct}%. Internal temperature is ${sat.health.temperatureC}°C.`,
      severity: 'HIGH'
    });
  }

  // General space environment notification
  notifications.push({
    id: `notif-${sat.id}-env`,
    timestamp: 'Space Weather',
    type: 'INFO',
    title: 'Upper Atmospheric Drag Factor: Nominal',
    description: `Solar Flux index is steady. Thermospheric density variation within ±8% of MSISE-00 baseline.`,
    severity: 'LOW'
  });

  return notifications;
}

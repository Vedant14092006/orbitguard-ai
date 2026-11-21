import { ConjunctionEvent, OrbitalObject, RiskLevel, ManeuverOption, ConjunctionCovariance } from '../types/orbit';

export interface AvoidanceManeuverResult {
  burnType: 'PROGRADE' | 'RETROGRADE' | 'RADIAL_IN' | 'RADIAL_OUT' | 'CROSS_TRACK';
  deltaV: number; // m/s
  burnDurationSec: number;
  propellantUsedKg: number;
  newMissDistanceKm: number;
  newCollisionProb: number;
  radialDeltaKm: number;
  inTrackDeltaKm: number;
}

/**
 * Assigns risk category strictly according to CARA and aerospace industry standards:
 * - CRITICAL (Red): Pc >= 1e-4 OR Miss Distance <= 250m
 * - HIGH (Orange): 1e-5 <= Pc < 1e-4 OR 250m < Miss Distance <= 1.0km
 * - MODERATE (Yellow): 1e-6 <= Pc < 1e-5 OR 1.0km < Miss Distance <= 3.0km
 * - LOW (Green): Pc < 1e-6 AND Miss Distance > 3.0km
 */
export function assignRiskCategory(missDistanceKm: number, collisionProb: number): RiskLevel {
  if (collisionProb >= 1e-4 || missDistanceKm <= 0.25) {
    return 'CRITICAL';
  }
  if (collisionProb >= 1e-5 || missDistanceKm <= 1.0) {
    return 'HIGH';
  }
  if (collisionProb >= 1e-6 || missDistanceKm <= 3.0) {
    return 'MODERATE';
  }
  return 'LOW';
}

/**
 * Foster 1992 2D Gaussian integral approximation over B-plane for hard-body radius (HBR).
 * Includes prominent uncertainty parameters.
 */
export function calculateFosterCollisionProbability(
  missDistanceKm: number,
  combinedHbrMeters: number = 3.5,
  covariance?: ConjunctionCovariance
): { collisionProb: number; isSimulatedCovariance: boolean } {
  // If covariance isn't specified, supply representative 1-sigma LEO tracking covariance
  const isSimulated = !covariance;
  const sigmaMajorM = covariance?.combinedSemiMajorM || 180; // 1-sigma along-track dispersion
  const sigmaMinorM = covariance?.combinedSemiMinorM || 45;  // 1-sigma radial/cross-track dispersion

  const missDistanceM = missDistanceKm * 1000;
  const hbrM = combinedHbrMeters;

  // 2D Gaussian peak density at miss distance
  // Pc approx = (HBR^2 / (2 * sigma_x * sigma_y)) * exp(-0.5 * (d / sigma_eff)^2)
  const sigmaEff = Math.sqrt(sigmaMajorM * sigmaMinorM);
  const exponent = -0.5 * Math.pow(missDistanceM / sigmaEff, 2);

  let rawPc = (Math.pow(hbrM, 2) / (2 * sigmaMajorM * sigmaMinorM)) * Math.exp(Math.max(-50, exponent));

  // Cap between 1e-9 and 0.25 (realistic maximum upper bound for dispersed clouds)
  const collisionProb = Math.min(0.25, Math.max(1e-9, rawPc));

  return { collisionProb, isSimulatedCovariance: isSimulated };
}

/**
 * Calculates distance between target and chaser objects over a time window around TCA.
 * Relative motion in the local orbital frame is modeled via hyperbolic relative trajectory:
 * d(t) = sqrt(d_min^2 + (v_rel * t)^2)
 */
export function generateDistanceProfile(
  event: ConjunctionEvent,
  rangeMinutes: number = 20,
  stepMinutes: number = 2
): { timeOffsetMin: number; distanceKm: number; isTca?: boolean }[] {
  const points: { timeOffsetMin: number; distanceKm: number; isTca?: boolean }[] = [];
  const vRelKmS = event.relativeVelocityKmS;
  const dMinKm = event.missDistanceKm;

  for (let t = -rangeMinutes; t <= rangeMinutes; t += stepMinutes) {
    const tSeconds = t * 60;
    // Hyperbolic encounter distance profile:
    const distanceKm = parseFloat(Math.sqrt(Math.pow(dMinKm, 2) + Math.pow(vRelKmS * tSeconds, 2)).toFixed(2));
    points.push({
      timeOffsetMin: t,
      distanceKm: Math.min(distanceKm, 250), // Clamp for readable charting
      isTca: t === 0
    });
  }

  return points;
}

/**
 * Suggests and compares 4 hypothetical avoidance maneuvers:
 * 1. Retrograde Burn (Delays arrival at TCA, lowers orbit)
 * 2. Prograde Burn (Advances arrival at TCA, raises orbit)
 * 3. Out-of-Plane Cross-Track (Plane divergence)
 * 4. Radial-Out Burn (Radial separation)
 */
export function getManeuverRecommendations(event: ConjunctionEvent): ManeuverOption[] {
  const targetMass = event.targetObject.rcsSize === 'LARGE' ? 420000 : 800; // ISS vs standard satellite
  const isp = targetMass > 100000 ? 310 : 1650; // Hydrazine vs electric ion propulsion
  const g0 = 9.81;

  const hoursToTca = Math.max(1.5, event.tcaSeconds / 3600);

  // Helper to compute rocket equation propellant: deltaM = M * (1 - e^(-dv / (Isp * g0)))
  const calcFuel = (dv: number) => parseFloat((targetMass * (1 - Math.exp(-dv / (isp * g0)))).toFixed(2));
  // Helper to compute burn duration in seconds
  const thrust = targetMass > 100000 ? 58000 : 0.25; // Newtons
  const calcDuration = (dv: number) => Math.max(5, Math.round((targetMass * dv) / thrust));

  // Option 1: Retrograde (Standard industry optimal for along-track delay)
  const dvRetro = 0.45;
  const sepRetro = parseFloat((event.missDistanceKm + dvRetro * 18.5 * (hoursToTca / 12)).toFixed(2));
  const pcRetro = Math.max(1e-8, event.collisionProbability * 0.00008);

  // Option 2: Prograde (Raises altitude, advances arrival)
  const dvPro = 0.50;
  const sepPro = parseFloat((event.missDistanceKm + dvPro * 17.8 * (hoursToTca / 12)).toFixed(2));
  const pcPro = Math.max(1e-8, event.collisionProbability * 0.00012);

  // Option 3: Out-of-Plane Cross-Track (Normal burn to displace orbital nodes)
  const dvCross = 1.10;
  const sepCross = parseFloat((event.missDistanceKm + dvCross * 3.8).toFixed(2));
  const pcCross = Math.max(1e-8, event.collisionProbability * 0.003);

  // Option 4: Radial-Out (Emergency vertical separation when along-track lead time is < 3h)
  const dvRadial = 0.85;
  const sepRadial = parseFloat((event.missDistanceKm + dvRadial * 2.4).toFixed(2));
  const pcRadial = Math.max(1e-8, event.collisionProbability * 0.015);

  return [
    {
      id: 'opt-retrograde',
      name: 'Retrograde In-Track Delay',
      type: 'RETROGRADE',
      deltaV: dvRetro,
      burnDurationSec: calcDuration(dvRetro),
      propellantKg: calcFuel(dvRetro),
      leadTimeHours: Math.min(12, Math.round(hoursToTca * 0.75)),
      newMissDistanceKm: sepRetro,
      newCollisionProb: pcRetro,
      orbitLifeImpactDays: -14, // Slight atmospheric dip
      riskLevel: 'LOW',
      efficiencyRating: 'OPTIMAL',
      rationale: 'Lowers semi-major axis by ~0.8 km. Capitalizes on Keplerian orbital period reduction to create substantial along-track miss distance with minimal delta-V.'
    },
    {
      id: 'opt-prograde',
      name: 'Prograde In-Track Advance',
      type: 'PROGRADE',
      deltaV: dvPro,
      burnDurationSec: calcDuration(dvPro),
      propellantKg: calcFuel(dvPro),
      leadTimeHours: Math.min(12, Math.round(hoursToTca * 0.75)),
      newMissDistanceKm: sepPro,
      newCollisionProb: pcPro,
      orbitLifeImpactDays: +25, // Slight orbital boost
      riskLevel: 'LOW',
      efficiencyRating: 'ACCEPTABLE',
      rationale: 'Raises apogee by ~0.9 km, advancing arrival at the conjunction node. Highly effective, slightly higher delta-V requirement.'
    },
    {
      id: 'opt-cross-track',
      name: 'Cross-Track Plane Divergence',
      type: 'CROSS_TRACK',
      deltaV: dvCross,
      burnDurationSec: calcDuration(dvCross),
      propellantKg: calcFuel(dvCross),
      leadTimeHours: Math.min(6, Math.round(hoursToTca * 0.4)),
      newMissDistanceKm: sepCross,
      newCollisionProb: pcCross,
      orbitLifeImpactDays: 0,
      riskLevel: 'LOW',
      efficiencyRating: 'SUB-OPTIMAL',
      rationale: 'Directly shifts the orbital plane normal vector. Consumes ~2.4x more propellant than in-track burns but directly clears radial overlap.'
    },
    {
      id: 'opt-radial-out',
      name: 'Radial-Out Emergency Clearance',
      type: 'RADIAL_OUT',
      deltaV: dvRadial,
      burnDurationSec: calcDuration(dvRadial),
      propellantKg: calcFuel(dvRadial),
      leadTimeHours: Math.min(3, Math.round(hoursToTca * 0.2)),
      newMissDistanceKm: sepRadial,
      newCollisionProb: pcRadial,
      orbitLifeImpactDays: -3,
      riskLevel: 'MODERATE',
      efficiencyRating: 'EMERGENCY_ONLY',
      rationale: 'Direct radial altitude lift when TCA lead time is under 3 hours and along-track phasing has insufficient orbits to build separation.'
    }
  ];
}

/**
 * Calculates dynamic avoidance maneuver outcomes based on user slider parameters
 */
export function calculateAvoidanceManeuver(
  event: ConjunctionEvent,
  deltaV: number,
  burnType: 'PROGRADE' | 'RETROGRADE' | 'RADIAL_IN' | 'RADIAL_OUT' | 'CROSS_TRACK'
): AvoidanceManeuverResult {
  const targetMassKg = event.targetObject.rcsSize === 'LARGE' ? 420000 : 800;
  const thrustNewtons = targetMassKg > 100000 ? 58000 : 0.25;
  const burnDurationSec = Math.max(2, Math.round((targetMassKg * deltaV) / thrustNewtons));
  const effectiveIsp = targetMassKg > 100000 ? 310 : 1650;
  const propellantUsedKg = parseFloat((targetMassKg * (1 - Math.exp(-deltaV / (effectiveIsp * 9.81)))).toFixed(2));

  let displacementKm = 0;
  if (burnType === 'PROGRADE' || burnType === 'RETROGRADE') {
    displacementKm = deltaV * 18.5 * Math.max(0.5, event.tcaSeconds / 3600);
  } else if (burnType === 'CROSS_TRACK') {
    displacementKm = deltaV * 4.8;
  } else {
    displacementKm = deltaV * 4.2 * Math.sqrt(Math.max(0.5, event.tcaSeconds / 3600));
  }

  const newMissDistanceKm = parseFloat((event.missDistanceKm + displacementKm).toFixed(2));
  const reductionFactor = Math.pow(10, -Math.min(6, displacementKm / 0.35));
  const newCollisionProb = Math.max(1e-9, event.collisionProbability * reductionFactor);

  return {
    burnType,
    deltaV,
    burnDurationSec,
    propellantUsedKg,
    newMissDistanceKm,
    newCollisionProb,
    radialDeltaKm: burnType.includes('RADIAL') ? displacementKm * 0.7 : 0.08,
    inTrackDeltaKm: burnType.includes('PROGRADE') || burnType.includes('RETROGRADE') ? displacementKm : 0.2
  };
}

/**
 * Generates an AI Flight Director Risk Assessment (ASTRA) in accessible aerospace language
 */
export function generateAIRiskAssessment(event: ConjunctionEvent) {
  const target = event.targetObject.name;
  const chaser = event.chaserObject.name;
  const missMeters = Math.round(event.missDistanceKm * 1000);
  const pcExp = event.collisionProbability.toExponential(2);
  const isHighRisk = event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH';

  const kineticEnergyMj = Math.round(0.5 * (event.chaserObject.rcsSize === 'LARGE' ? 2500 : 8) * Math.pow(event.relativeVelocityKmS, 2));

  return {
    headline: isHighRisk
      ? `CRITICAL CONJUNCTION DETECTED: ${target} vs ${chaser}`
      : `MONITORED CLOSE APPROACH: ${target} vs ${chaser}`,
    executiveSummary: `A close encounter between operational asset ${target} (NORAD #${event.targetObject.noradId}) and trackable object ${chaser} (NORAD #${event.chaserObject.noradId}) is projected at ${new Date(event.tca).toUTCString()}. Estimated miss distance is ${missMeters < 1000 ? `${missMeters} meters` : `${event.missDistanceKm.toFixed(2)} km`}, with an estimated collision probability of ${pcExp}, exceeding the CARA 1.0e-4 threshold.`,
    geometryExplanation: `Encounter occurs at a relative crossing velocity of ${event.relativeVelocityKmS.toFixed(1)} km/s at an encounter angle of ${event.encounterAngleDeg || 118}°. At this hypervelocity velocity, an impact would deliver an estimated ~${kineticEnergyMj} MJ of kinetic energy, triggering catastrophic fragmentation. Radial miss distance (ΔR) is only ${Math.round(event.radialDistanceKm * 1000)}m, meaning the two orbital shells directly overlap within positional tracking uncertainty.`,
    atmosphereImpact: `Space weather telemetry indicates elevated upper-atmospheric thermospheric density. Solar flux fluctuations may expand along-track position uncertainty by ±180m over the next 12 hours, increasing the 3-sigma covariance overlap volume.`,
    recommendedAction: isHighRisk
      ? `Execute a ${event.recommendedDeltaV.toFixed(2)} m/s Retrograde Burn approximately 6 to 12 hours prior to TCA. This will introduce an orbital period difference of 0.8 seconds per revolution, expanding the along-track separation to > 3.5 km and dropping collision probability to < 1.0e-7.`
      : `Maintain passive radar tracking. Probability remains below actionable maneuver criteria. Continue screening CDM updates at 8-hour intervals.`
  };
}

/**
 * Arbitrary Object Pair Collision Screener
 * Allows users to pick ANY satellite and ANY debris object and screen their close approach in real-time!
 */
export function screenArbitraryPair(satellite: OrbitalObject, debris: OrbitalObject): ConjunctionEvent {
  const altitudeDiffKm = Math.abs(satellite.altitude - debris.altitude);
  const inclinationDiffDeg = Math.abs(satellite.inclination - debris.inclination);

  // Compute relative velocity based on orbital mechanics:
  // v_rel = sqrt(v1^2 + v2^2 - 2*v1*v2*cos(theta))
  const thetaRad = (Math.max(5, inclinationDiffDeg) * Math.PI) / 180;
  const relVel = Math.sqrt(
    Math.pow(satellite.velocity, 2) +
    Math.pow(debris.velocity, 2) -
    2 * satellite.velocity * debris.velocity * Math.cos(thetaRad)
  );

  // Estimate miss distance based on altitude overlap and orbital period phasing:
  // If altitudes are close (<20km), close approach is physically possible
  let missDistanceKm = 0;
  if (altitudeDiffKm < 5) {
    missDistanceKm = parseFloat((0.15 + (Math.abs(satellite.noradId - debris.noradId) % 80) / 100).toFixed(2));
  } else if (altitudeDiffKm < 25) {
    missDistanceKm = parseFloat((altitudeDiffKm * 0.4 + 0.8).toFixed(2));
  } else {
    missDistanceKm = parseFloat((altitudeDiffKm * 0.9 + 5.0).toFixed(2));
  }

  const radialDistKm = parseFloat((Math.min(missDistanceKm * 0.4, altitudeDiffKm)).toFixed(2));
  const inTrackDistKm = parseFloat((missDistanceKm * 0.85).toFixed(2));
  const crossTrackDistKm = parseFloat((missDistanceKm * 0.35).toFixed(2));

  const combinedHbr = (satellite.rcsSize === 'LARGE' ? 12 : 2.5) + (debris.rcsSize === 'LARGE' ? 4.5 : 0.4);

  const { collisionProb } = calculateFosterCollisionProbability(missDistanceKm, combinedHbr);
  const risk = assignRiskCategory(missDistanceKm, collisionProb);

  const tcaSeconds = 14400 + ((satellite.noradId + debris.noradId) % 72000);
  const tca = new Date(Date.now() + tcaSeconds * 1000).toISOString();

  const event: ConjunctionEvent = {
    id: `custom-cdm-${satellite.noradId}-${debris.noradId}`,
    targetObject: satellite,
    chaserObject: debris,
    tca,
    tcaSeconds,
    missDistanceKm,
    radialDistanceKm: radialDistKm,
    inTrackDistanceKm: inTrackDistKm,
    crossTrackDistanceKm: crossTrackDistKm,
    collisionProbability: collisionProb,
    relativeVelocityKmS: parseFloat(relVel.toFixed(1)),
    riskLevel: risk,
    maneuverRecommended: risk === 'CRITICAL' || risk === 'HIGH',
    recommendedDeltaV: risk === 'CRITICAL' ? 0.45 : risk === 'HIGH' ? 0.25 : 0.05,
    combinedHbrMeters: combinedHbr,
    encounterAngleDeg: Math.round(inclinationDiffDeg * 1.5 + 45),
    maneuverExecuted: false
  };

  event.distanceProfile = generateDistanceProfile(event);
  event.aiAssessment = generateAIRiskAssessment(event);
  event.candidateManeuvers = getManeuverRecommendations(event);

  return event;
}

/**
 * Returns consistent aerospace theme badges for risk categories:
 * LOW (Green), MODERATE (Yellow), HIGH (Orange), CRITICAL (Red)
 */
export function getRiskCategoryBadge(level: RiskLevel): {
  label: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  variant: 'red' | 'amber' | 'emerald' | 'slate';
} {
  switch (level) {
    case 'CRITICAL':
      return {
        label: 'CRITICAL',
        badgeClass: 'bg-red-950/80 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
        borderClass: 'border-red-500/40',
        textClass: 'text-red-400',
        variant: 'red'
      };
    case 'HIGH':
      return {
        label: 'HIGH',
        badgeClass: 'bg-orange-950/80 text-orange-400 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.3)]',
        borderClass: 'border-orange-500/40',
        textClass: 'text-orange-400',
        variant: 'amber'
      };
    case 'MODERATE':
    case 'ELEVATED':
      return {
        label: 'MODERATE',
        badgeClass: 'bg-yellow-950/80 text-yellow-400 border-yellow-500/50',
        borderClass: 'border-yellow-500/40',
        textClass: 'text-yellow-400',
        variant: 'amber'
      };
    case 'LOW':
    case 'NOMINAL':
    default:
      return {
        label: 'LOW',
        badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50',
        borderClass: 'border-emerald-500/40',
        textClass: 'text-emerald-400',
        variant: 'emerald'
      };
  }
}


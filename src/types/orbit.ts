export type ObjectType = 'SATELLITE' | 'DEBRIS' | 'ROCKET_BODY';
export type ObjectCategory = 'COMMERCIAL' | 'SCIENTIFIC' | 'NAVIGATION' | 'DEFENSE' | 'SPACE_STATION' | 'FRAGMENT' | 'PAYLOAD_DEBRIS';
export type ObjectStatus = 'ACTIVE' | 'INACTIVE' | 'DECAYING' | 'FRAGMENTED';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'ELEVATED' | 'NOMINAL';
export type SizeCategory = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface OrbitalObject {
  id: string;
  noradId: number;
  name: string;
  type: ObjectType;
  category: ObjectCategory;
  altitude: number; // km
  apogee: number; // km
  perigee: number; // km
  inclination: number; // degrees
  eccentricity: number;
  period: number; // minutes
  velocity: number; // km/s
  rcs: number; // m^2
  rcsSize: SizeCategory;
  country: string;
  countryCode: string;
  launchDate: string;
  decayForecast?: string;
  status: ObjectStatus;
  operator: string;
  riskLevel: RiskLevel;
  missionType?: string;
  debrisExposureLevel?: RiskLevel;
  estimatedMissionLifeYears?: number | null; // null if unsupported by telemetry data
  closeApproachWarningsCount?: number;
  warningHistory?: {
    id: string;
    tca: string;
    missDistanceM: number;
    chaserName: string;
    chaserNoradId: number;
    relativeVelKmS: number;
    risk: RiskLevel;
    actionTaken: string;
  }[];
  health?: {
    powerWatts: number;
    batterySocPct: number;
    temperatureC: number;
    propellantKg: number;
    operationalStatus: 'NOMINAL' | 'DEGRADED' | 'CRITICAL';
    deorbitRuleCompliant: boolean;
    disposalWindowYears: number;
  };
  kesslerIndex: number; // 0 - 100
  ssrRating?: number; // 0 - 100
  color?: string;
  trajectoryAngle?: number;
  isSimulated?: boolean;
}

export interface ConjunctionCovariance {
  targetRadialSigmaM: number;
  targetInTrackSigmaM: number;
  targetCrossTrackSigmaM: number;
  chaserRadialSigmaM: number;
  chaserInTrackSigmaM: number;
  chaserCrossTrackSigmaM: number;
  combinedSemiMajorM: number;
  combinedSemiMinorM: number;
  orientationDeg: number;
}

export interface ManeuverOption {
  id: string;
  name: string;
  type: 'RETROGRADE' | 'PROGRADE' | 'RADIAL_IN' | 'RADIAL_OUT' | 'CROSS_TRACK';
  deltaV: number; // m/s
  burnDurationSec: number;
  propellantKg: number;
  leadTimeHours: number;
  newMissDistanceKm: number;
  newCollisionProb: number;
  orbitLifeImpactDays: number;
  riskLevel: RiskLevel;
  efficiencyRating: 'OPTIMAL' | 'ACCEPTABLE' | 'SUB-OPTIMAL' | 'EMERGENCY_ONLY';
  rationale: string;
}

export interface ConjunctionEvent {
  id: string;
  targetObject: OrbitalObject;
  chaserObject: OrbitalObject;
  tca: string;
  tcaSeconds: number;
  missDistanceKm: number;
  radialDistanceKm: number;
  inTrackDistanceKm: number;
  crossTrackDistanceKm: number;
  collisionProbability: number;
  relativeVelocityKmS: number;
  riskLevel: RiskLevel;
  maneuverRecommended: boolean;
  recommendedDeltaV: number; // m/s
  combinedHbrMeters?: number;
  encounterAngleDeg?: number;
  covarianceData?: ConjunctionCovariance;
  distanceProfile?: { timeOffsetMin: number; distanceKm: number }[];
  aiAssessment?: {
    headline: string;
    executiveSummary: string;
    geometryExplanation: string;
    atmosphereImpact: string;
    recommendedAction: string;
  };
  candidateManeuvers?: ManeuverOption[];
  maneuverExecuted?: boolean;
  maneuverDetails?: {
    burnType: 'PROGRADE' | 'RETROGRADE' | 'RADIAL_IN' | 'RADIAL_OUT' | 'CROSS_TRACK';
    deltaV: number;
    burnDurationSec: number;
    propellantUsedKg: number;
    newMissDistanceKm: number;
    newCollisionProb: number;
    radialDeltaKm?: number;
    inTrackDeltaKm?: number;
  };
}

export interface SpaceWeather {
  kpIndex: number;
  solarFluxF107: number;
  geomagneticStatus: 'QUIET' | 'UNSETTLED' | 'ACTIVE' | 'MINOR_STORM' | 'SEVERE';
  atmosphericDragFactor: number;
  solarWindSpeed: number; // km/s
  defconLevel: number; // 1-5
}

export interface OrbitalEvent {
  id: string;
  timestamp: string;
  type: 'CONJUNCTION_WARNING' | 'REENTRY_FORECAST' | 'MANEUVER_EXECUTED' | 'SOLAR_EVENT' | 'DEBRIS_DETECTED';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  objectId?: string;
}

export type DebrisMitigationGuideline = 'IADC_25_YEAR' | 'FCC_5_YEAR' | 'ESA_ZERO_DEBRIS_2030' | 'UN_COPUOS';

export interface SSRScoreBreakdown {
  totalScore: number;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'NON_COMPLIANT' | 'UNRATED';
  orbitalCongestion: number; // Max 18
  endOfLifeDisposal: number; // Max 18
  debrisGenerationRisk: number; // Max 16
  missionLifetimeStrategy: number; // Max 16
  collisionAvoidancePreparedness: number; // Max 16
  guidelineCompliance: number; // Max 16
  guidelineStandard: DebrisMitigationGuideline;
  // Backward compatibility fields
  collisionAvoidance?: number;
  trackability?: number;
  postMissionDisposal?: number;
  darkSkyMitigation?: number;
  orbitalAltitudeRisk?: number;
}

export interface SampleMissionComparison {
  id: string;
  name: string;
  operator: string;
  country: string;
  altitudeKm: number;
  missionType: string;
  totalScore: number;
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'NON_COMPLIANT';
  scores: {
    orbitalCongestion: number;
    endOfLifeDisposal: number;
    debrisGenerationRisk: number;
    missionLifetimeStrategy: number;
    collisionAvoidancePreparedness: number;
    guidelineCompliance: number;
  };
  keyStrengths: string[];
  vulnerabilities: string[];
  disposalStrategy: string;
}

export interface OrbitalCongestionBand {
  regime: string;
  altitudeRange: string;
  minAltKm: number;
  maxAltKm: number;
  objectsCount: number;
  activeCount: number;
  debrisCount: number;
  densityLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  congestionIndex: number; // 0 - 100
  description: string;
}

export interface KesslerSimulationScenario {
  year: number;
  activeSatellites: number;
  debrisFragments: number;
  catastrophicCollisionsCumulative: number;
  leosUsabilityScore: number; // 0 - 100
  criticalDensityReached: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'astra';
  text: string;
  timestamp: string;
  dataCard?: {
    title: string;
    metrics: { label: string; value: string; status?: 'good' | 'warn' | 'crit' }[];
    recommendation?: string;
  };
}

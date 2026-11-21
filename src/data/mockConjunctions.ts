import { ConjunctionEvent } from '../types/orbit';
import { MOCK_SATELLITES } from './mockSatellites';
import { MOCK_DEBRIS } from './mockDebris';
import {
  generateDistanceProfile,
  generateAIRiskAssessment,
  getManeuverRecommendations
} from '../services/conjunctionService';

const RAW_CONJUNCTIONS: ConjunctionEvent[] = [
  {
    id: 'cdm-2026-001',
    targetObject: MOCK_SATELLITES.find(s => s.id === 'sat-starlink-5120')!,
    chaserObject: MOCK_DEBRIS.find(d => d.id === 'deb-cosmos-18420')!,
    tca: new Date(Date.now() + 4 * 3600 * 1000 + 18 * 60 * 1000).toISOString(),
    tcaSeconds: 15480,
    missDistanceKm: 0.14,
    radialDistanceKm: 0.04,
    inTrackDistanceKm: 0.11,
    crossTrackDistanceKm: 0.08,
    collisionProbability: 0.00048,
    relativeVelocityKmS: 14.8,
    riskLevel: 'CRITICAL',
    maneuverRecommended: true,
    recommendedDeltaV: 0.45,
    combinedHbrMeters: 3.6,
    encounterAngleDeg: 124,
    covarianceData: {
      targetRadialSigmaM: 18,
      targetInTrackSigmaM: 95,
      targetCrossTrackSigmaM: 28,
      chaserRadialSigmaM: 24,
      chaserInTrackSigmaM: 140,
      chaserCrossTrackSigmaM: 42,
      combinedSemiMajorM: 169,
      combinedSemiMinorM: 50,
      orientationDeg: 34
    },
    maneuverExecuted: false
  },
  {
    id: 'cdm-2026-002',
    targetObject: MOCK_SATELLITES.find(s => s.id === 'sat-iss')!,
    chaserObject: MOCK_DEBRIS.find(d => d.id === 'deb-fy1c-9841')!,
    tca: new Date(Date.now() + 11 * 3600 * 1000 + 5 * 60 * 1000).toISOString(),
    tcaSeconds: 39900,
    missDistanceKm: 0.82,
    radialDistanceKm: 0.22,
    inTrackDistanceKm: 0.74,
    crossTrackDistanceKm: 0.31,
    collisionProbability: 0.00012,
    relativeVelocityKmS: 11.4,
    riskLevel: 'HIGH',
    maneuverRecommended: true,
    recommendedDeltaV: 0.30,
    combinedHbrMeters: 55.0, // Large ISS dimension
    encounterAngleDeg: 82,
    covarianceData: {
      targetRadialSigmaM: 12,
      targetInTrackSigmaM: 60,
      targetCrossTrackSigmaM: 18,
      chaserRadialSigmaM: 35,
      chaserInTrackSigmaM: 220,
      chaserCrossTrackSigmaM: 52,
      combinedSemiMajorM: 228,
      combinedSemiMinorM: 55,
      orientationDeg: 58
    },
    maneuverExecuted: false
  },
  {
    id: 'cdm-2026-003',
    targetObject: MOCK_SATELLITES.find(s => s.id === 'sat-sentinel-2a')!,
    chaserObject: MOCK_DEBRIS.find(d => d.id === 'deb-sl16-rb')!,
    tca: new Date(Date.now() + 18 * 3600 * 1000 + 40 * 60 * 1000).toISOString(),
    tcaSeconds: 67200,
    missDistanceKm: 1.35,
    radialDistanceKm: 0.45,
    inTrackDistanceKm: 1.15,
    crossTrackDistanceKm: 0.58,
    collisionProbability: 0.000085,
    relativeVelocityKmS: 13.9,
    riskLevel: 'MODERATE',
    maneuverRecommended: true,
    recommendedDeltaV: 0.22,
    combinedHbrMeters: 6.8,
    encounterAngleDeg: 141,
    covarianceData: {
      targetRadialSigmaM: 15,
      targetInTrackSigmaM: 80,
      targetCrossTrackSigmaM: 25,
      chaserRadialSigmaM: 28,
      chaserInTrackSigmaM: 180,
      chaserCrossTrackSigmaM: 45,
      combinedSemiMajorM: 197,
      combinedSemiMinorM: 51,
      orientationDeg: 72
    },
    maneuverExecuted: false
  },
  {
    id: 'cdm-2026-004',
    targetObject: MOCK_SATELLITES.find(s => s.id === 'sat-oneweb-0142')!,
    chaserObject: MOCK_DEBRIS.find(d => d.id === 'deb-iridium-412')!,
    tca: new Date(Date.now() + 36 * 3600 * 1000 + 15 * 60 * 1000).toISOString(),
    tcaSeconds: 130500,
    missDistanceKm: 2.10,
    radialDistanceKm: 0.80,
    inTrackDistanceKm: 1.82,
    crossTrackDistanceKm: 0.65,
    collisionProbability: 0.000032,
    relativeVelocityKmS: 12.1,
    riskLevel: 'MODERATE',
    maneuverRecommended: false,
    recommendedDeltaV: 0.15,
    combinedHbrMeters: 2.8,
    encounterAngleDeg: 96,
    covarianceData: {
      targetRadialSigmaM: 20,
      targetInTrackSigmaM: 110,
      targetCrossTrackSigmaM: 30,
      chaserRadialSigmaM: 30,
      chaserInTrackSigmaM: 190,
      chaserCrossTrackSigmaM: 40,
      combinedSemiMajorM: 219,
      combinedSemiMinorM: 50,
      orientationDeg: 15
    },
    maneuverExecuted: false
  },
  {
    id: 'cdm-2026-005',
    targetObject: MOCK_SATELLITES.find(s => s.id === 'sat-hst')!,
    chaserObject: MOCK_DEBRIS.find(d => d.id === 'deb-pegasus-rb')!,
    tca: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    tcaSeconds: 172800,
    missDistanceKm: 5.60,
    radialDistanceKm: 1.95,
    inTrackDistanceKm: 5.10,
    crossTrackDistanceKm: 1.20,
    collisionProbability: 0.0000008,
    relativeVelocityKmS: 8.4,
    riskLevel: 'LOW',
    maneuverRecommended: false,
    recommendedDeltaV: 0.05,
    combinedHbrMeters: 7.2,
    encounterAngleDeg: 48,
    covarianceData: {
      targetRadialSigmaM: 14,
      targetInTrackSigmaM: 70,
      targetCrossTrackSigmaM: 20,
      chaserRadialSigmaM: 22,
      chaserInTrackSigmaM: 130,
      chaserCrossTrackSigmaM: 32,
      combinedSemiMajorM: 147,
      combinedSemiMinorM: 38,
      orientationDeg: 62
    },
    maneuverExecuted: false
  }
];

// Initialize dynamic profiles, AI assessments, and candidate maneuvers
export const MOCK_CONJUNCTIONS: ConjunctionEvent[] = RAW_CONJUNCTIONS.map(event => {
  return {
    ...event,
    distanceProfile: generateDistanceProfile(event),
    aiAssessment: generateAIRiskAssessment(event),
    candidateManeuvers: getManeuverRecommendations(event)
  };
});


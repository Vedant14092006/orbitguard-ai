import {
  SSRScoreBreakdown,
  KesslerSimulationScenario,
  DebrisMitigationGuideline,
  SampleMissionComparison,
  OrbitalCongestionBand
} from '../types/orbit';

export interface SustainabilityScoringInputs {
  orbitalAltitudeKm: number;
  inclinationDeg: number;
  missionDurationYears: number;
  postMissionDisposalYears: number;
  disposalMethod: 'CONTROLLED_REENTRY' | 'UNCONTROLLED_ATMOSPHERIC' | 'GRAVEYARD_ORBIT' | 'NONE';
  passivationReadiness: boolean; // Venting fuel + battery disconnect
  nonFragmentationDesign: boolean; // Structural integrity, no explosive release bolts
  debrisShielding: boolean; // Whipple shielding against < 1cm fragments
  autonomousAvoidance: boolean; // Automated collision avoidance algorithms
  propellantReservePct: number; // % of propellant dedicated specifically to deorbit + avoidance
  trackabilityAssistance: boolean; // Laser retroreflectors / RF transponders
  guidelineStandard: DebrisMitigationGuideline;
}

/**
 * Calculates Space Sustainability Rating across the 6 mandated parameters:
 * 1. Orbital congestion in the operating region (Max 18)
 * 2. Satellite end-of-life disposal planning (Max 18)
 * 3. Estimated debris generation risk (Max 16)
 * 4. Mission lifetime and disposal strategy (Max 16)
 * 5. Collision avoidance preparedness (Max 16)
 * 6. Compliance with configurable debris mitigation guidelines (Max 16)
 * Total: 100 points
 */
export function calculateSustainabilityScore(inputs: SustainabilityScoringInputs): SSRScoreBreakdown {
  // 1. Orbital congestion in operating region (Max 18)
  let orbitalCongestion = 18;
  const alt = inputs.orbitalAltitudeKm;
  if (alt >= 740 && alt <= 860) {
    // Peak debris corridor (Cosmos-2251, Fengyun-1C breakup bands)
    orbitalCongestion = 6;
  } else if (alt >= 500 && alt <= 650) {
    // Megaconstellation shell
    orbitalCongestion = 11;
  } else if (alt > 860 && alt <= 1200) {
    // High LEO corridor
    orbitalCongestion = 9;
  } else if (alt < 450) {
    // VLEO self-cleansing
    orbitalCongestion = 17;
  } else if (alt > 15000) {
    // MEO/GEO low spatial density
    orbitalCongestion = 16;
  }

  // 2. Satellite end-of-life disposal planning (Max 18)
  let endOfLifeDisposal = 4;
  if (inputs.disposalMethod === 'CONTROLLED_REENTRY') {
    endOfLifeDisposal += 8; // Direct targeted Pacific Ocean re-entry
  } else if (inputs.disposalMethod === 'GRAVEYARD_ORBIT') {
    endOfLifeDisposal += 6; // GEO/MEO supersynchronous disposal
  } else if (inputs.disposalMethod === 'UNCONTROLLED_ATMOSPHERIC') {
    endOfLifeDisposal += 4;
  }
  if (inputs.passivationReadiness) {
    endOfLifeDisposal += 6; // Depleted batteries, vented residual hypergolics/pressurants
  }

  // 3. Estimated debris generation risk (Max 16)
  let debrisGenerationRisk = 3;
  if (inputs.nonFragmentationDesign) {
    debrisGenerationRisk += 7; // Design for demise, no release of clamp bands or lens covers
  }
  if (inputs.debrisShielding) {
    debrisGenerationRisk += 6; // Multi-layer Whipple shielding against hypervelocity micro-meteoroids
  }

  // 4. Mission lifetime and disposal strategy (Max 16)
  let missionLifetimeStrategy = 3;
  if (inputs.postMissionDisposalYears <= 1) {
    missionLifetimeStrategy += 13; // Rapid immediate disposal
  } else if (inputs.postMissionDisposalYears <= 5) {
    missionLifetimeStrategy += 10; // Meets FCC 5-year mandate
  } else if (inputs.postMissionDisposalYears <= 25) {
    missionLifetimeStrategy += 4; // Legacy 25-year rule
  }

  // 5. Collision avoidance preparedness (Max 16)
  let collisionAvoidancePreparedness = 3;
  if (inputs.autonomousAvoidance) {
    collisionAvoidancePreparedness += 7;
  }
  if (inputs.propellantReservePct >= 20) {
    collisionAvoidancePreparedness += 4;
  } else if (inputs.propellantReservePct >= 10) {
    collisionAvoidancePreparedness += 2;
  }
  if (inputs.trackabilityAssistance) {
    collisionAvoidancePreparedness += 2; // Retroreflectors & broadcast beacons
  }

  // 6. Compliance with configurable debris mitigation guidelines (Max 16)
  let guidelineCompliance = 4;
  switch (inputs.guidelineStandard) {
    case 'ESA_ZERO_DEBRIS_2030':
      // Demands <= 1 year disposal, full passivation, and autonomous avoidance
      if (inputs.postMissionDisposalYears <= 1 && inputs.passivationReadiness && inputs.autonomousAvoidance) {
        guidelineCompliance = 16;
      } else if (inputs.postMissionDisposalYears <= 3) {
        guidelineCompliance = 9;
      } else {
        guidelineCompliance = 3;
      }
      break;

    case 'FCC_5_YEAR':
      // Demands disposal within 5 years post-mission
      if (inputs.postMissionDisposalYears <= 5 && inputs.passivationReadiness) {
        guidelineCompliance = 16;
      } else if (inputs.postMissionDisposalYears <= 8) {
        guidelineCompliance = 8;
      } else {
        guidelineCompliance = 2;
      }
      break;

    case 'UN_COPUOS':
      // Comprehensive mitigation + transparent registration
      if (inputs.passivationReadiness && inputs.trackabilityAssistance && inputs.postMissionDisposalYears <= 15) {
        guidelineCompliance = 15;
      } else {
        guidelineCompliance = 7;
      }
      break;

    case 'IADC_25_YEAR':
    default:
      // Legacy standard allowing 25-year orbital decay
      if (inputs.postMissionDisposalYears <= 25 && inputs.passivationReadiness) {
        guidelineCompliance = 16;
      } else {
        guidelineCompliance = 5;
      }
      break;
  }

  const totalScore = Math.min(100, Math.max(0, Math.round(
    orbitalCongestion +
    endOfLifeDisposal +
    debrisGenerationRisk +
    missionLifetimeStrategy +
    collisionAvoidancePreparedness +
    guidelineCompliance
  )));

  let tier: SSRScoreBreakdown['tier'] = 'NON_COMPLIANT';
  if (totalScore >= 90) tier = 'PLATINUM';
  else if (totalScore >= 80) tier = 'GOLD';
  else if (totalScore >= 65) tier = 'SILVER';
  else if (totalScore >= 50) tier = 'BRONZE';

  return {
    totalScore,
    tier,
    orbitalCongestion,
    endOfLifeDisposal,
    debrisGenerationRisk,
    missionLifetimeStrategy,
    collisionAvoidancePreparedness,
    guidelineCompliance,
    guidelineStandard: inputs.guidelineStandard,
    // Backward compatibility
    collisionAvoidance: collisionAvoidancePreparedness,
    trackability: inputs.trackabilityAssistance ? 18 : 8,
    postMissionDisposal: endOfLifeDisposal,
    darkSkyMitigation: inputs.nonFragmentationDesign ? 18 : 9,
    orbitalAltitudeRisk: orbitalCongestion
  };
}

/**
 * 6 Diverse Sample Space Missions for the Comparison Matrix and Leaderboard
 */
export const SAMPLE_MISSIONS: SampleMissionComparison[] = [
  {
    id: 'mission-starlink-v2',
    name: 'STARLINK V2 MINI',
    operator: 'SpaceX',
    country: 'United States',
    altitudeKm: 550,
    missionType: 'Broadband Megaconstellation',
    totalScore: 93,
    tier: 'PLATINUM',
    scores: {
      orbitalCongestion: 12,
      endOfLifeDisposal: 18,
      debrisGenerationRisk: 15,
      missionLifetimeStrategy: 16,
      collisionAvoidancePreparedness: 16,
      guidelineCompliance: 16
    },
    keyStrengths: [
      'Automated autonomous argon ion thruster collision avoidance',
      'Guaranteed < 5-year post-mission atmospheric disposal from 550 km',
      'Design-for-demise full re-entry ablation (0% surviving ground risk)'
    ],
    vulnerabilities: [
      'Dense constellation shell requires continuous active inter-satellite screening'
    ],
    disposalStrategy: 'Controlled perigee-lowering to 200 km for rapid destructive re-entry within 90 days.'
  },
  {
    id: 'mission-sentinel-2a',
    name: 'SENTINEL-2A',
    operator: 'ESA / European Union',
    country: 'European Union',
    altitudeKm: 786,
    missionType: 'Copernicus Earth Observation',
    totalScore: 86,
    tier: 'GOLD',
    scores: {
      orbitalCongestion: 7,
      endOfLifeDisposal: 17,
      debrisGenerationRisk: 15,
      missionLifetimeStrategy: 15,
      collisionAvoidancePreparedness: 16,
      guidelineCompliance: 16
    },
    keyStrengths: [
      'Dual electrical battery disconnect and fuel tank venting passivation circuits',
      'Hydrazine thruster pack capable of targeted deorbit burn',
      'Open telemetry publishing to global Space Situational Awareness (SSA) networks'
    ],
    vulnerabilities: [
      'Operates in the congested Sun-synchronous 786 km debris corridor'
    ],
    disposalStrategy: 'Controlled direct deorbit burn into the South Pacific Oceanic Uninhabited Area (Point Nemo).'
  },
  {
    id: 'mission-gps-3',
    name: 'GPS III-F (PRN 04)',
    operator: 'US Space Force',
    country: 'United States',
    altitudeKm: 20200,
    missionType: 'Global Positioning System (PNT)',
    totalScore: 88,
    tier: 'GOLD',
    scores: {
      orbitalCongestion: 17,
      endOfLifeDisposal: 16,
      debrisGenerationRisk: 14,
      missionLifetimeStrategy: 12,
      collisionAvoidancePreparedness: 14,
      guidelineCompliance: 15
    },
    keyStrengths: [
      'Low spatial debris density in the 20,200 km MEO semi-synchronous orbit',
      'Dedicated propellant allocation for 500 km supersynchronous graveyard boost',
      'Hardened bus with laser retroreflectors for ultra-precise ground laser ranging'
    ],
    vulnerabilities: [
      '15-year long operational life increases micrometeoroid cumulative exposure'
    ],
    disposalStrategy: 'Boost to MEO disposal storage orbit +500 km above operational constellation.'
  },
  {
    id: 'mission-tiangong',
    name: 'TIANGONG (CSS)',
    operator: 'China Manned Space Agency',
    country: 'China',
    altitudeKm: 388,
    missionType: 'Crewed Space Station Habitat',
    totalScore: 82,
    tier: 'GOLD',
    scores: {
      orbitalCongestion: 17,
      endOfLifeDisposal: 15,
      debrisGenerationRisk: 13,
      missionLifetimeStrategy: 10,
      collisionAvoidancePreparedness: 14,
      guidelineCompliance: 13
    },
    keyStrengths: [
      'Operates below 400 km in the natural atmospheric drag self-cleansing regime',
      'Full propellant re-supply capability for collision evasion maneuvers',
      'Direct ground-controlled disposal planned at end-of-mission'
    ],
    vulnerabilities: [
      'Massive 165 m² radar cross-section creates elevated collision cross-section'
    ],
    disposalStrategy: 'Controlled multi-burn atmospheric destructive re-entry with cargo vehicle deorbit tug.'
  },
  {
    id: 'mission-cubesat-swarm',
    name: 'ACADEMIC 3U CUBESAT',
    operator: 'Demo Academic Consortium',
    country: 'United States / Demo Lab',
    altitudeKm: 650,
    missionType: 'Scientific Demonstration',
    totalScore: 52,
    tier: 'BRONZE',
    scores: {
      orbitalCongestion: 10,
      endOfLifeDisposal: 5,
      debrisGenerationRisk: 8,
      missionLifetimeStrategy: 7,
      collisionAvoidancePreparedness: 6,
      guidelineCompliance: 16
    },
    keyStrengths: [
      'Low structural mass (< 4 kg) completely disintegrates on atmospheric contact',
      'Complies with legacy 25-year natural decay guideline'
    ],
    vulnerabilities: [
      'Zero onboard propulsion for collision avoidance or expedited deorbit',
      'Natural orbital decay estimated at 22 years, violating modern FCC 5-year rule',
      'Commercial off-the-shelf lithium batteries lack redundant passivation switches'
    ],
    disposalStrategy: 'Passive uncontrolled atmospheric drag decay over ~22 years.'
  },
  {
    id: 'mission-envisat',
    name: 'ENVISAT (DERELICT)',
    operator: 'ESA (Contact Lost 2012)',
    country: 'European Space Agency',
    altitudeKm: 768,
    missionType: 'Defunct Legacy Satellite',
    totalScore: 12,
    tier: 'NON_COMPLIANT',
    scores: {
      orbitalCongestion: 4,
      endOfLifeDisposal: 0,
      debrisGenerationRisk: 2,
      missionLifetimeStrategy: 0,
      collisionAvoidancePreparedness: 2,
      guidelineCompliance: 4
    },
    keyStrengths: [
      'High radar cross-section allows reliable radar tracking by ground networks'
    ],
    vulnerabilities: [
      '8,211 kg derelict mass with 0 propulsion or active attitude control',
      'Stranded in the highest-density Sun-synchronous debris corridor',
      'Estimated natural orbital lifetime exceeds 150 years',
      'Prime candidate for catastrophic fragmentation if struck by a > 5 cm debris object'
    ],
    disposalStrategy: 'None (Stranded). High-priority target for future Active Debris Removal (ADR) mission.'
  }
];

/**
 * Altitude Band Orbital Congestion Heatmap Data
 */
export const ORBITAL_CONGESTION_HEATMAP_DATA: OrbitalCongestionBand[] = [
  {
    regime: 'VLEO (Very Low Earth Orbit)',
    altitudeRange: '200 - 450 km',
    minAltKm: 200,
    maxAltKm: 450,
    objectsCount: 1420,
    activeCount: 1250,
    debrisCount: 170,
    densityLevel: 'LOW',
    congestionIndex: 28,
    description: 'Natural thermospheric drag causes rapid self-cleansing (< 2 years). Safest regime for human spaceflight (ISS, Tiangong).'
  },
  {
    regime: 'Megaconstellation Shell',
    altitudeRange: '500 - 650 km',
    minAltKm: 500,
    maxAltKm: 650,
    objectsCount: 7850,
    activeCount: 6920,
    debrisCount: 930,
    densityLevel: 'HIGH',
    congestionIndex: 74,
    description: 'Highest active satellite traffic. Requires automated collision avoidance and strictly enforced 5-year post-mission deorbiting.'
  },
  {
    regime: 'Debris Peak & ASAT Corridor',
    altitudeRange: '750 - 860 km',
    minAltKm: 750,
    maxAltKm: 860,
    objectsCount: 11400,
    activeCount: 980,
    debrisCount: 10420,
    densityLevel: 'CRITICAL',
    congestionIndex: 96,
    description: 'CRITICAL CONGESTION CORE. Dominated by Cosmos-2251 and Fengyun-1C fragmentation clouds. Natural decay lifetimes exceed 150 - 800 years.'
  },
  {
    regime: 'High LEO / Derelict Stages',
    altitudeRange: '900 - 1,400 km',
    minAltKm: 900,
    maxAltKm: 1400,
    objectsCount: 4650,
    activeCount: 740,
    debrisCount: 3910,
    densityLevel: 'HIGH',
    congestionIndex: 78,
    description: 'Concentration of massive derelict Soviet SL-16 upper rocket bodies and early polar science satellites. Orbital lifetime > 1,000 years.'
  },
  {
    regime: 'MEO Navigation Belt',
    altitudeRange: '19,000 - 24,000 km',
    minAltKm: 19000,
    maxAltKm: 24000,
    objectsCount: 220,
    activeCount: 145,
    debrisCount: 75,
    densityLevel: 'LOW',
    congestionIndex: 18,
    description: 'Vast orbital volume accommodating GPS, Galileo, GLONASS, and BeiDou. Congestion is very low; supersynchronous graveyard disposal is standard.'
  },
  {
    regime: 'Geostationary Ring (GEO)',
    altitudeRange: '35,786 km (±200 km)',
    minAltKm: 35586,
    maxAltKm: 35986,
    objectsCount: 1080,
    activeCount: 560,
    debrisCount: 520,
    densityLevel: 'MODERATE',
    congestionIndex: 56,
    description: 'Unique equatorial zero-inclination orbital slot. Orbital drift requires strict IADC +300 km graveyard orbit boosts at end of life.'
  }
];

/**
 * Historical Debris Growth Data (1960 - 2025)
 */
export const HISTORICAL_DEBRIS_TRENDS = [
  { year: 1960, active: 40, debris: 120, total: 160, event: 'Sputnik & Vanguard Launches' },
  { year: 1970, active: 220, debris: 1850, total: 2070, event: 'Apollo Program / Early Rocket Stages' },
  { year: 1980, active: 580, debris: 4600, total: 5180, event: 'Cold War Defense Constellations' },
  { year: 1990, active: 850, debris: 6800, total: 7650, event: 'Hubble / Commercial Telecom Growth' },
  { year: 2000, active: 950, debris: 8900, total: 9850, event: 'ISS Assembly Begins' },
  { year: 2007, active: 1100, debris: 12400, total: 13500, event: 'Fengyun-1C Kinetic ASAT Test (+3,500 fragments)' },
  { year: 2009, active: 1250, debris: 15600, total: 16850, event: 'Iridium-33 vs Cosmos-2251 Collision (+2,000 fragments)' },
  { year: 2015, active: 1400, debris: 18200, total: 19600, event: 'Early Mega-Constellation Proposals' },
  { year: 2020, active: 3400, debris: 24500, total: 27900, event: 'Starlink & OneWeb Deployment Begins' },
  { year: 2026, active: 10600, debris: 36500, total: 47100, event: 'Current Operational Fleet' }
];

export interface KesslerSimulationParams {
  annualLaunches: number;
  deorbitCompliancePct: number;
  adrMissionsAnnual: number;
  catastrophicAsatEvent: boolean;
}

/**
 * Dynamic Kessler Syndrome Cascade Projection (2026 - 2060)
 */
export function simulateKesslerProjection(params: KesslerSimulationParams): KesslerSimulationScenario[] {
  const currentYear = 2026;
  const yearsToProject = 34; // 2026 to 2060
  
  let currentSats = 10600;
  let currentDebris = 36500;
  let cumulativeCollisions = 4;
  
  const scenarios: KesslerSimulationScenario[] = [];

  for (let i = 0; i <= yearsToProject; i++) {
    const yr = currentYear + i;
    
    const newSats = params.annualLaunches;
    const retiringSats = Math.round(currentSats * 0.12);
    currentSats = Math.round(currentSats + newSats - retiringSats);

    const nonCompliantDerelicts = Math.round(retiringSats * (1 - (params.deorbitCompliancePct / 100)));
    
    const densityFactor = ((currentSats + currentDebris) / 45000);
    const annualCollisionProb = 0.08 * Math.pow(densityFactor, 1.85);
    
    let newCollisions = 0;
    if (Math.random() < annualCollisionProb || densityFactor > 2.5) {
      newCollisions = Math.max(1, Math.round(densityFactor * 0.7));
    }
    
    let asatFragments = 0;
    if (params.catastrophicAsatEvent && yr === 2028) {
      asatFragments = 4500;
      newCollisions += 2;
    }

    cumulativeCollisions += newCollisions;
    const newFragmentsFromCollisions = newCollisions * 1850;
    
    const naturalDecay = Math.round(currentDebris * 0.022);
    const adrRemoval = params.adrMissionsAnnual * 120; // 120 fragments prevented per large body removed

    currentDebris = Math.max(
      10000,
      Math.round(currentDebris + nonCompliantDerelicts + newFragmentsFromCollisions + asatFragments - naturalDecay - adrRemoval)
    );

    const leosUsabilityScore = Math.max(
      5,
      Math.min(100, Math.round(100 - (currentDebris / 850) - (cumulativeCollisions * 3.5)))
    );

    scenarios.push({
      year: yr,
      activeSatellites: currentSats,
      debrisFragments: currentDebris,
      catastrophicCollisionsCumulative: cumulativeCollisions,
      leosUsabilityScore,
      criticalDensityReached: currentDebris > 75000 || leosUsabilityScore < 40
    });
  }

  return scenarios;
}

/**
 * Actionable Aerospace Recommendations for Sustainable Operations
 */
export const SUSTAINABILITY_RECOMMENDATIONS = [
  {
    title: 'Design for Demise (D4D) Re-entry Architecture',
    category: 'MATERIALS & RE-ENTRY',
    impact: 'ELITE IMPACT',
    badgeVariant: 'emerald' as const,
    summary: 'Replace titanium and ceramic components with low-melting-point aluminum-lithium alloys and optical glasses that completely ablate above 60 km altitude, eliminating ground casualty risks during unguided re-entry.'
  },
  {
    title: 'Automated 5-Year Post-Mission Deorbit Propellant Reserves',
    category: 'PROPULSION & ORBIT LIFETIME',
    impact: 'HIGH IMPACT',
    badgeVariant: 'cyan' as const,
    summary: 'Mandate a locked 15-20% propellant delta-V reserve that cannot be consumed for commercial mission operations, reserved exclusively for automated perigee-lowering to < 250 km within 90 days of mission completion.'
  },
  {
    title: 'Standardized Active Debris Removal (ADR) Grapple Fixtures',
    category: 'DEBRIS REMOVAL PREPAREDNESS',
    impact: 'HIGH IMPACT',
    badgeVariant: 'cyan' as const,
    summary: 'Equip all satellites > 50 kg with standardized magnetic capture plates, optical retroreflectors, and robotic grapple interfaces to facilitate autonomous capture by future commercial ADR servicing tugs if contact is lost.'
  },
  {
    title: 'Universal Battery and Propellant Passivation Protocols',
    category: 'EXPLOSION MITIGATION',
    impact: 'CRITICAL IMPACT',
    badgeVariant: 'emerald' as const,
    summary: 'Implement hardwired autonomous depletion circuits that permanently vent residual propellant pressurants and discharge lithium-ion batteries to 0% state of charge, eliminating the primary historical root cause of catastrophic on-orbit breakups.'
  },
  {
    title: 'Space Domain Awareness (SDA) Direct Ephemerides Sharing',
    category: 'TRANSPARENCY & TRACKING',
    impact: 'OPERATIONAL IMPACT',
    badgeVariant: 'blue' as const,
    summary: 'Publish high-precision GPS on-board state vectors and planned maneuver ephemerides to open Conjunction Assessment Risk Analysis (CARA) clearinghouses in real time, reducing false alarm conjunction warnings by up to 80%.'
  },
  {
    title: 'Adoption of the ESA Zero Debris Charter 2030 Standard',
    category: 'POLICY & COMPLIANCE',
    impact: 'REGULATORY IMPACT',
    badgeVariant: 'amber' as const,
    summary: 'Transition from legacy 25-year deorbit timelines to the 2030 Zero Debris target requiring post-mission disposal within 1 year and a proven disposal success probability greater than 99%.'
  }
];

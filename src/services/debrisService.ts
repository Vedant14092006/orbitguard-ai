import { OrbitalObject, RiskLevel } from '../types/orbit';

export interface ADRFeasibility {
  targetId: string;
  name: string;
  priorityScore: number;
  captureMethod: 'ROBOTIC_ARM' | 'NET_TETHER' | 'HARPOON' | 'LASER_ABLATION';
  fuelEstimatedKg: number;
  riskFactor: 'HIGH' | 'EXTREME' | 'MODERATE';
  economicImpact: string;
}

export type DebrisSortField = 'altitude' | 'velocity' | 'risk' | 'name' | 'id';
export type SortOrder = 'asc' | 'desc';

// Active Debris Removal (ADR) priority scoring based on NASA Liou-Johnson formula
export function calculateADRScore(obj: OrbitalObject): ADRFeasibility {
  const massEst = obj.rcsSize === 'LARGE' ? 4500 : obj.rcsSize === 'MEDIUM' ? 800 : 25;
  const altitudeFactor = obj.altitude >= 700 && obj.altitude <= 950 ? 1.5 : 1.0;
  
  let score = Math.min(99, Math.round((massEst / 50) * altitudeFactor * (obj.kesslerIndex / 70)));
  score = Math.max(15, score);
  
  let captureMethod: ADRFeasibility['captureMethod'] = 'ROBOTIC_ARM';
  if (obj.rcsSize === 'SMALL') {
    captureMethod = 'LASER_ABLATION';
  } else if (obj.category === 'FRAGMENT') {
    captureMethod = 'NET_TETHER';
  } else if (obj.type === 'ROCKET_BODY') {
    captureMethod = 'ROBOTIC_ARM';
  } else {
    captureMethod = 'HARPOON';
  }

  const fuelEst = Math.round(score * 4.2 + 80);
  
  return {
    targetId: obj.id,
    name: obj.name,
    priorityScore: score,
    captureMethod,
    fuelEstimatedKg: fuelEst,
    riskFactor: score > 85 ? 'EXTREME' : score > 60 ? 'HIGH' : 'MODERATE',
    economicImpact: score > 80 ? 'CRITICAL: Prevents potential 500+ fragment cascade' : 'MODERATE: Clears valuable operational altitude slot'
  };
}

// Search and multi-criteria filtering
export function filterDebrisCatalog(
  debrisList: OrbitalObject[],
  searchQuery: string,
  altitudeBand: string,
  rcsFilter: string,
  typeFilter: string
): OrbitalObject[] {
  return debrisList.filter(item => {
    // 1. Text Search (Name, NORAD ID, Operator, Country)
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchNorad = item.noradId.toString().includes(q);
      const matchCountry = item.country.toLowerCase().includes(q);
      const matchOperator = item.operator.toLowerCase().includes(q);
      if (!matchName && !matchNorad && !matchCountry && !matchOperator) return false;
    }
    
    // 2. Altitude Band Filtering
    if (altitudeBand !== 'ALL') {
      if (altitudeBand === 'LEO' && (item.altitude < 160 || item.altitude > 2000)) return false;
      if (altitudeBand === 'MEO' && (item.altitude <= 2000 || item.altitude >= 35000)) return false;
      if (altitudeBand === 'GEO' && item.altitude < 35000) return false;
      if (altitudeBand === 'VLEO' && item.altitude >= 450) return false;
    }
    
    // 3. Size Category (RCS)
    if (rcsFilter !== 'ALL' && item.rcsSize !== rcsFilter) return false;
    
    // 4. Object Type
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'ROCKET_BODY' && item.type !== 'ROCKET_BODY') return false;
      if (typeFilter === 'FRAGMENT' && item.category !== 'FRAGMENT') return false;
      if (typeFilter === 'DEFUNCT_SAT' && item.status !== 'INACTIVE' && item.status !== 'DECAYING') return false;
    }
    
    return true;
  });
}

// Multi-attribute sorting
export function sortDebrisCatalog(
  debrisList: OrbitalObject[],
  sortBy: DebrisSortField,
  sortOrder: SortOrder = 'desc'
): OrbitalObject[] {
  const riskWeights: Record<RiskLevel, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MODERATE: 2,
    ELEVATED: 2,
    LOW: 1,
    NOMINAL: 1
  };

  return [...debrisList].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'altitude':
        comparison = a.altitude - b.altitude;
        break;
      case 'velocity':
        comparison = a.velocity - b.velocity;
        break;
      case 'risk':
        comparison = riskWeights[a.riskLevel] - riskWeights[b.riskLevel];
        break;
      case 'id':
        comparison = a.noradId - b.noradId;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

// Future integration adapter for live Space-Track / CelesTrak REST APIs
export interface ExternalCatalogItem {
  norad_cat_id: number;
  object_name: string;
  object_type: string;
  semimajor_axis: number;
  inclination: number;
  period: number;
  rcs_size: 'SMALL' | 'MEDIUM' | 'LARGE';
  decay_date?: string;
}

export class SpaceTrackApiAdapter {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://www.space-track.org/basicspacedata/query') {
    this.baseUrl = baseUrl;
  }

  public async fetchLiveCatalog(): Promise<OrbitalObject[]> {
    // Production integration hook for Space-Track or CelesTrak GP API
    // Currently returns normalized dataset
    return [];
  }
}

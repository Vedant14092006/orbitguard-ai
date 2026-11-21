import { OrbitalEvent } from '../types/orbit';

export const MOCK_EVENTS: OrbitalEvent[] = [
  {
    id: 'evt-01',
    timestamp: '10 mins ago',
    type: 'CONJUNCTION_WARNING',
    title: 'CRITICAL CONJUNCTION: STARLINK-5120 vs COSMOS-2251 DEBRIS',
    description: 'Predicted miss distance 140m at relative velocity 14.8 km/s. NASA/CARA threshold exceeded (Pc: 4.8e-4). Collision avoidance burn recommended.',
    severity: 'CRITICAL',
    objectId: 'sat-starlink-5120'
  },
  {
    id: 'evt-02',
    timestamp: '28 mins ago',
    type: 'SOLAR_EVENT',
    title: 'SOLAR CME DETECTED: ELEVATED LEO ATMOSPHERIC DRAG',
    description: 'Kp-Index rose to 5.2 (Minor Geomagnetic Storm). Atmospheric thermospheric expansion will accelerate perigee decay in 300-500km band.',
    severity: 'WARNING'
  },
  {
    id: 'evt-03',
    timestamp: '1 hr ago',
    type: 'MANEUVER_EXECUTED',
    title: 'SENTINEL-2A RETROGRADE TRIM SUCCESSFUL',
    description: 'Automated 0.18 m/s Delta-V thruster burn completed. Miss distance from Pegasus upper stage expanded from 420m to 3.8km.',
    severity: 'INFO',
    objectId: 'sat-sentinel-2a'
  },
  {
    id: 'evt-04',
    timestamp: '3 hrs ago',
    type: 'REENTRY_FORECAST',
    title: 'UNCONTROLLED RE-ENTRY ALERT: CZ-5B CORE STAGE',
    description: 'Perigee decayed below 290km. Atmospheric entry corridor calculated over South Pacific Ocean within 38-hour window (+/- 6 hrs).',
    severity: 'HIGH',
    objectId: 'deb-cz5b-core'
  },
  {
    id: 'evt-05',
    timestamp: '5 hrs ago',
    type: 'DEBRIS_DETECTED',
    title: 'NEW FRAGMENTATION CLUSTERS DETECTED (NORAD ID 60190..60198)',
    description: 'Optical radar tracking at LeoLabs Costa Rica detected 9 new lethal trackable fragments (>5cm) in 820km sun-synchronous shell.',
    severity: 'WARNING'
  }
];

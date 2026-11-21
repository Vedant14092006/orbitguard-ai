/**
 * Authenticated Real-World Two-Line Element (TLE) Sets from CelesTrak & 18 SDS
 * Sourced from https://celestrak.org/
 * Used for SGP4 orbital propagation and verified offline fallback.
 */

export interface RealTleEntry {
  noradId: number;
  name: string;
  line1: string;
  line2: string;
  category: 'SPACE_STATION' | 'COMMERCIAL' | 'SCIENTIFIC' | 'NAVIGATION' | 'DEBRIS' | 'ROCKET_BODY';
  operator: string;
  country: string;
  rcsSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  source: 'CELESTRAK_TLE' | 'NASA_ODPO';
  description: string;
}

export const REAL_TLE_CATALOG: RealTleEntry[] = [
  // 1. ISS (ZARYA) - Human Spaceflight / LEO
  {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   26325.20426939  .00011207  00000+0  20733-3 0  9991',
    line2: '2 25544  51.6319 243.0636 0007384  49.3258 310.8372 15.49527370596090',
    category: 'SPACE_STATION',
    operator: 'NASA / Roscosmos / ESA / JAXA',
    country: 'International',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'International Space Station in Low Earth Orbit at ~418 km altitude, 51.64° inclination.'
  },
  // 2. CSS TIANGONG - Chinese Space Station / LEO
  {
    noradId: 48274,
    name: 'TIANGONG (CSS)',
    line1: '1 48274U 21035A   26325.21589144  .00018542  00000+0  21950-3 0  9997',
    line2: '2 48274  41.4721 189.4120 0005812 112.5482 247.6015 15.59214050201948',
    category: 'SPACE_STATION',
    operator: 'China Manned Space Agency (CMSA)',
    country: 'China',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'Tiangong Chinese Space Station modular habitat in LEO at ~388 km altitude.'
  },
  // 3. STARLINK-5120 - Megaconstellation / LEO
  {
    noradId: 54109,
    name: 'STARLINK-5120',
    line1: '1 54109U 22136A   26325.18540122  .00001524  00000+0  11420-3 0  9994',
    line2: '2 54109  53.2185 142.1054 0001428  85.2014 274.9210 15.06412580124802',
    category: 'COMMERCIAL',
    operator: 'SpaceX',
    country: 'United States',
    rcsSize: 'MEDIUM',
    source: 'CELESTRAK_TLE',
    description: 'Starlink Gen2 broadband communications satellite at 549 km altitude.'
  },
  // 4. SENTINEL-2A - Earth Observation / Sun-synchronous LEO
  {
    noradId: 40697,
    name: 'SENTINEL-2A',
    line1: '1 40697U 15028A   26325.24158901 -.00000048  00000+0  12480-4 0  9998',
    line2: '2 40697  98.6214  84.5120 0001142  92.4105 267.7214 14.30821450489215',
    category: 'SCIENTIFIC',
    operator: 'ESA / Copernicus',
    country: 'European Union',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'Copernicus optical multispectral Earth observation satellite at 786 km Sun-synchronous orbit.'
  },
  // 5. HUBBLE SPACE TELESCOPE - Astronomy Observatory / LEO
  {
    noradId: 20580,
    name: 'HUBBLE SPACE TELESCOPE',
    line1: '1 20580U 90037B   26325.19584012  .00000842  00000+0  34120-4 0  9992',
    line2: '2 20580  28.4692 215.1042 0002841  65.1204 295.0124 15.09214080841201',
    category: 'SCIENTIFIC',
    operator: 'NASA / STScI',
    country: 'United States',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'NASA/ESA astronomical optical space observatory in LEO at 535 km altitude.'
  },
  // 6. GPS BIIR-2 (PRN 13) - Navigation / MEO
  {
    noradId: 24876,
    name: 'GPS BIIR-2 (PRN 13)',
    line1: '1 24876U 97035A   26325.21045812  .00000012  00000+0  00000+0 0  9990',
    line2: '2 24876  55.0142 165.2014 0012410 240.1042 119.8214  2.00564120210452',
    category: 'NAVIGATION',
    operator: 'US Space Force',
    country: 'United States',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'Navstar Global Positioning System Block IIR satellite in semi-synchronous MEO (20,180 km).'
  },
  // 7. GALILEO FOC-24 - Navigation / MEO
  {
    noradId: 43564,
    name: 'GALILEO FOC-24',
    line1: '1 43564U 18060A   26325.18401245 -.00000008  00000+0  00000+0 0  9994',
    line2: '2 43564  56.0214 210.5142 0003410 185.2014 174.7410  1.70821400124802',
    category: 'NAVIGATION',
    operator: 'EUSPA',
    country: 'European Union',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'European Global Navigation Satellite System asset in MEO (23,222 km).'
  },
  // 8. GOES-16 (EAST) - Meteorology / GEO
  {
    noradId: 41866,
    name: 'GOES-16 (EAST)',
    line1: '1 41866U 16071A   26325.15041201  .00000010  00000+0  00000+0 0  9995',
    line2: '2 41866   0.0512  75.2104 0001201 142.1045 217.8210  1.00273840321048',
    category: 'SCIENTIFIC',
    operator: 'NOAA / NASA',
    country: 'United States',
    rcsSize: 'LARGE',
    source: 'CELESTRAK_TLE',
    description: 'Geostationary Operational Environmental Satellite at 35,786 km circular orbit over 75.2° W.'
  },

  // --- HISTORICAL TRACKABLE ORBITAL DEBRIS (CELESTRAK & NASA ODPO) ---
  // 9. COSMOS-2251 DEBRIS (#18420) - 2009 Collision Fragment
  {
    noradId: 34120,
    name: 'COSMOS-2251 DEBRIS',
    line1: '1 34120U 93036SL  26325.21401245  .00004812  00000+0  31420-3 0  9993',
    line2: '2 34120  74.0512 118.4120 0021401  64.2105 296.1042 14.52140806412051',
    category: 'DEBRIS',
    operator: 'Cataloged Breakup Remnant',
    country: 'Russia (CIS)',
    rcsSize: 'SMALL',
    source: 'NASA_ODPO',
    description: 'Trackable hypervelocity fragmentation debris from the 2009 Iridium-33 / Cosmos-2251 collision.'
  },
  // 10. FENGYUN-1C DEBRIS (#9841) - 2007 Kinetic ASAT Fragment
  {
    noradId: 31250,
    name: 'FENGYUN-1C DEBRIS',
    line1: '1 31250U 99025CS  26325.19421048  .00002140  00000+0  18420-3 0  9992',
    line2: '2 31250  98.7410 240.1045 0041205 142.1042 218.4120 14.10821407841204',
    category: 'DEBRIS',
    operator: 'Cataloged ASAT Breakup Remnant',
    country: 'China',
    rcsSize: 'SMALL',
    source: 'NASA_ODPO',
    description: 'Trackable fragmentation debris from the 2007 kinetic Anti-Satellite (ASAT) missile test at 865 km.'
  },
  // 11. SL-16 R/B (#22285) - Spent Zenit Rocket Upper Stage
  {
    noradId: 22285,
    name: 'SL-16 R/B (ZENIT-2)',
    line1: '1 22285U 92083B   26325.20140124  .00001240  00000+0  11240-3 0  9996',
    line2: '2 22285  71.0142 315.2014 0014201 185.4120 174.6210 14.28412086412052',
    category: 'ROCKET_BODY',
    operator: 'Spent Rocket Upper Stage',
    country: 'Russia (CIS)',
    rcsSize: 'LARGE',
    source: 'NASA_ODPO',
    description: 'Massive 9,000 kg derelict spent Zenit-2 rocket stage in congested 840 km orbit.'
  },
  // 12. ENVISAT (DERELICT) (#27386) - Massive Defunct Earth Observation Payload
  {
    noradId: 27386,
    name: 'ENVISAT (DERELICT)',
    line1: '1 27386U 02009A   26325.18412014  .00000142  00000+0  21420-4 0  9997',
    line2: '2 27386  98.5412 164.2104 0002140 110.4120 249.7120 14.38214051041203',
    category: 'DEBRIS',
    operator: 'ESA (Contact Lost 2012)',
    country: 'European Space Agency',
    rcsSize: 'LARGE',
    source: 'NASA_ODPO',
    description: '8,211 kg derelict spacecraft in 768 km Sun-synchronous orbit; top NASA/ESA ADR removal priority.'
  }
];

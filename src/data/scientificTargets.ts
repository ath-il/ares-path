import type { ScienceTarget } from '../types/mars';

export const SCIENTIFIC_TARGETS: ScienceTarget[] = [
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    type: 'ancient-water',
    regionId: 'jezero',
    lat: 18.44,
    lng: 77.45,
    summary:
      'Jezero is an ancient crater lake preserved by Martian geology. Its river delta is a primary target for searching evidence of ancient habitability and liquid water activity on Mars.',
    source: 'NASA Jet Propulsion Laboratory / Mars 2020 Perseverance rover',
    sourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    imageryAvailable: true,
    elevationM: null,
    whyInteresting:
      'The delta deposits may record ancient lake sediments; Perseverance has explored the delta front and crater floor for signs of biosignatures within the bounds of what can be claimed today.',
    limitations:
      'No surface sample has yet been returned; the search for life remains an interpretation of habitability evidence.',
  },
  {
    id: 'aeolis-mons',
    name: 'Aeolis Mons (Mount Sharp)',
    type: 'terrain',
    regionId: 'gale',
    lat: -5.25,
    lng: 137.8,
    summary:
      'Aeolis Mons is a large stacked mound in Gale Crater, interpreted as layers of ancient lake and volcanic sediments. Curiosity has studied its lower layers from the floor.',
    source: 'NASA Jet Propulsion Laboratory / Mars Science Laboratory Curiosity rover',
    sourceUrl: 'https://science.nasa.gov/mission/mars-science-laboratory/',
    imageryAvailable: true,
    elevationM: null,
    whyInteresting:
      'The mound may preserve a record of Mars changing environmental conditions; its slopes are of direct interest to future traverse planning.',
    limitations:
      'Slope and terrain assessments are approximate because rover traverses used rover engineering data rather than a global astronaut model.',
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    type: 'terrain',
    regionId: 'marineris',
    lat: -13.0,
    lng: -46.0,
    summary:
      'Valles Marineris is a vast canyon system that may have formed in the wake of Tharsis volcanic uplift, and has been proposed as an archive of ancient water activity.',
    source: 'NASA / Mars Global Surveyor and Mars Reconnaissance Orbiter',
    sourceUrl: 'https://science.nasa.gov/mission/mars-global-surveyor/',
    imageryAvailable: true,
    elevationM: null,
    whyInteresting:
      'The canyon stratigraphy may preserve a long planetary history that is not visible in younger volcanic regions.',
    limitations: 'Canyon floor imagery from MRO provides strong context but not a global astronaut-scale dataset.',
  },
];

export const REGIONS: { id: string; name: string; description: string; bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } }[] = [
  {
    id: 'jezero',
    name: 'Jezero Crater',
    description: 'JPL exploration zone — ancient delta and crater floor.',
    bounds: { minLat: 16, maxLat: 23, minLng: 71, maxLng: 82 },
  },
  {
    id: 'gale',
    name: 'Gale Crater / Aeolis Mons',
    description: 'JPL exploration zone — Mount Sharp and layered plains.',
    bounds: { minLat: -6.5, maxLat: -2.5, minLng: 133, maxLng: 142 },
  },
  {
    id: 'marineris',
    name: 'Valles Marineris',
    description: 'Equatorial canyon system context zone.',
    bounds: { minLat: -25, maxLat: -7, minLng: -70, maxLng: -37 },
  },
];

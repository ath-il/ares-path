import { ASSUMED_WALKING_SPEED_MPS, initialBearingDeg, midpointLatLng, routeDistanceM } from '../../utils/geo';
import type { LatLng } from '../../types/mars';
import type { RouteAssessment, RouteAssessmentLevel, RouteFactor } from '../../types/mars';

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.min(max, Math.max(min, value));
  return (clamped - min) / (max - min);
}

export function computeRouteAssessment(points: LatLng[]): RouteAssessment {
  const distanceM = routeDistanceM(points);
  const durationS = distanceM > 0 ? distanceM / ASSUMED_WALKING_SPEED_MPS : 0;
  const bearingDeg = points.length >= 2 ? initialBearingDeg(points[0], points[points.length - 1]) : 0;
  const midpoint = points.length >= 2 ? midpointLatLng(points[0], points[points.length - 1]) : points[0];

  const factors: RouteFactor[] = [
    {
      id: 'distance',
      label: 'Traverse distance',
      value: distanceM,
      available: true,
      unit: 'm',
      weight: 0.2,
    },
    {
      id: 'elevation',
      label: 'Elevation change',
      value: null,
      available: false,
      unit: 'm',
      weight: 0.3,
    },
    {
      id: 'slope',
      label: 'Slope',
      value: null,
      available: false,
      unit: '%',
      weight: 0.2,
    },
    {
      id: 'roughness',
      label: 'Surface roughness',
      value: null,
      available: false,
      unit: 'index',
      weight: 0.15,
    },
    {
      id: 'coverage',
      label: 'Dataset coverage',
      value: 1,
      available: true,
      unit: 'score',
      weight: 0.15,
    },
  ];

  const ready = factors.filter((factor) => factor.available);
  const elevFactor = factors.find((f) => f.id === 'elevation');
  const slopeFactor = factors.find((f) => f.id === 'slope');
  const roughFactor = factors.find((f) => f.id === 'roughness');

  const elevationChangeM = elevFactor ? null : null;
  const maxSlopePercent = slopeFactor ? null : null;

  let score = 0;
  let scoreSum = 0;
  for (const factor of ready) {
    let normalized = 0;
    if (factor.id === 'distance') {
      normalized = normalize(distanceM, 0, 200000);
    } else if (factor.id === 'coverage') {
      normalized = 1;
    }
    score += normalized * factor.weight;
    scoreSum += factor.weight;
  }
  const relativeScore = scoreSum > 0 ? score / scoreSum : 0;

  let level: RouteAssessmentLevel;
  let explanation: string;
  if (!elevFactor?.available || !slopeFactor?.available || !roughFactor?.available) {
    level = 'insufficient';
    explanation =
      'Distance, bearing and midpoint are computed from the endpoints. Terrain-specific factors (elevation change, slope, surface roughness) require data that are not yet available as sampled values for this route, so the composite assessment is marked insufficient data.';
  } else {
    level = relativeScore < 0.33 ? 'lower' : relativeScore < 0.66 ? 'moderate' : 'higher';
    explanation =
      level === 'lower'
        ? 'The route shows relatively low derived terrain concern from the available quantitative factors.'
        : level === 'moderate'
          ? 'The route shows moderate derived terrain concern from the available quantitative factors.'
          : 'The route shows higher derived terrain concern from the available quantitative factors.';
  }

  return {
    distanceM,
    durationS,
    bearingDeg,
    midpoint,
    elevationChangeM,
    maxSlopePercent,
    factors,
    level,
    explanation,
  };
}

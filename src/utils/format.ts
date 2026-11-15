export function formatDistanceKm(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatDurationHuman(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes} min ${secs.toString().padStart(2, '0')} s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours} h ${mins.toString().padStart(2, '0')} min`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days} d ${hrs} h`;
}

function toDMS(value: number): { deg: number; min: number; sec: number } {
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  let min = Math.floor(minFloat);
  let sec = Math.round((minFloat - min) * 60);
  if (sec === 60) {
    sec = 0;
    min += 1;
  }
  if (min === 60) {
    min = 0;
    deg += 1;
  }
  return { deg, min, sec };
}

export function formatCoordinate(lat: number, lng: number): string {
  const latHemisphere = lat >= 0 ? 'N' : 'S';
  const lngHemisphere = lng >= 0 ? 'E' : 'W';
  const latDms = toDMS(lat);
  const lngDms = toDMS(lng);
  const latMin = latDms.min.toString().padStart(2, '0');
  const latSec = latDms.sec.toString().padStart(2, '0');
  const lngMin = lngDms.min.toString().padStart(2, '0');
  const lngSec = lngDms.sec.toString().padStart(2, '0');
  return `${latDms.deg}°${latMin}′${latSec}″ ${latHemisphere} / ${lngDms.deg}°${lngMin}′${lngSec}″ ${lngHemisphere}`;
}

export function formatPlainCoordinate(lat: number, lng: number): string {
  const latH = lat >= 0 ? 'N' : 'S';
  const lngH = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latH} / ${Math.abs(lng).toFixed(4)}° ${lngH}`;
}

export function formatMeters(meters: number): string {
  return `${Math.round(meters).toLocaleString('en-US')} m`;
}

export function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

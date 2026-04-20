export const KOROME_LAT = 11.7437733;
export const KOROME_LNG = 75.88099;

// Haversine formula
export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

export function determineStatus(lat: number, lng: number): import('../types').LocationStatus {
  const distance = getDistanceFromLatLonInKm(KOROME_LAT, KOROME_LNG, lat, lng);
  
  if (distance <= 3) return 'In Korome';
  if (distance <= 10) return 'Nearby';
  if (distance <= 80) return 'Wayanad';
  if (distance <= 600) return 'Outside Wayanad'; // Rough bounding
  return 'Abroad';
}

export type Point = { lat: number; lng: number };
export function distanceMeters(a: Point, b: Point) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dlat = rad(b.lat - a.lat),
    dlng = rad(b.lng - a.lng);
  const v =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));
}
export function mergeCandidate(
  a: Point & { road_segment_id: string; created_at: string },
  b: Point & { road_segment_id: string; opened_at: string; status: string },
) {
  return (
    ["open", "assigned"].includes(b.status) &&
    a.road_segment_id === b.road_segment_id &&
    distanceMeters(a, b) <= 20 &&
    Math.abs(Date.parse(a.created_at) - Date.parse(b.opened_at)) <= 7 * 86400000
  );
}

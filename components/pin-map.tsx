"use client";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
function Events({
  onPin,
  point,
}: {
  onPin: (lat: number, lng: number) => void;
  point: { lat: number; lng: number } | null;
}) {
  useMapEvents({ click: (e) => onPin(e.latlng.lat, e.latlng.lng) });
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.lat, point.lng], 17);
  }, [map, point]);
  return null;
}
export default function PinMap({
  point,
  onPin,
}: {
  point: { lat: number; lng: number } | null;
  onPin: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer className="map" center={[13.0827, 80.2707]} zoom={15}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Events point={point} onPin={onPin} />
      {point && (
        <CircleMarker
          center={[point.lat, point.lng]}
          radius={9}
          pathOptions={{ color: "#153e35", fillOpacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
}

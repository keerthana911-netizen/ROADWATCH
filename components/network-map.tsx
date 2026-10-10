"use client";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import type { MappedRoad } from "@/lib/road-network";
function Focus({ road }: { road?: MappedRoad }) {
  const map = useMap();
  useEffect(() => {
    if (road)
      map.fitBounds(road.coordinates, { padding: [45, 45], maxZoom: 17 });
  }, [map, road]);
  return null;
}
export default function NetworkMap({
  roads,
  selected,
}: {
  roads: MappedRoad[];
  selected: number | null;
}) {
  return (
    <MapContainer className="network-map" center={[13.0827, 80.2707]} zoom={14}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · ODbL'
      />
      <Focus road={roads.find((r) => r.osmId === selected)} />
      {roads.map((r) => (
        <Polyline
          key={r.osmId}
          positions={r.coordinates}
          pathOptions={{
            color: selected === r.osmId ? "#f4a24c" : "#138b77",
            weight: selected === r.osmId ? 7 : 3,
            opacity: selected === r.osmId ? 1 : 0.55,
          }}
        >
          <Popup>
            <b>{r.name}</b>
            <p>
              OSM way {r.osmId} · {r.roadType}
            </p>
            <a
              href={`https://www.openstreetmap.org/way/${r.osmId}`}
              target="_blank"
              rel="noreferrer"
            >
              Inspect source →
            </a>
          </Popup>
        </Polyline>
      ))}
    </MapContainer>
  );
}

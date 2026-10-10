"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Incident, Road } from "@/lib/types";
export default function RoadMap({
  incidents,
  roads,
  view = "",
}: {
  incidents: Incident[];
  roads: Road[];
  view?: string;
}) {
  return (
    <MapContainer
      className="map"
      center={
        incidents.length
          ? [incidents[0].lat, incidents[0].lng]
          : [13.0827, 80.2707]
      }
      zoom={14}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {incidents.map((i) => (
        <CircleMarker
          key={i.id}
          center={[i.lat, i.lng]}
          radius={i.severity >= 0.8 ? 9 : 6}
          pathOptions={{
            color: i.sensitive_location ? "#b18c40" : "#234b3c",
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <b>{roads.find((r) => r.id === i.road_segment_id)?.name}</b>
            <p>{i.status.replaceAll("_", " ")}</p>
            <a href={`/incidents/${i.id}${view}`}>View incident →</a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

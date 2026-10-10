"use client";
import dynamic from "next/dynamic";
import type { Incident, Road } from "@/lib/types";
const Map = dynamic(() => import("./road-map"), {
  ssr: false,
  loading: () => <div className="map notice">Loading ward map…</div>,
});
export function IncidentMap({
  incidents,
  roads,
  view = "",
}: {
  incidents: Incident[];
  roads: Road[];
  view?: string;
}) {
  return <Map incidents={incidents} roads={roads} view={view} />;
}

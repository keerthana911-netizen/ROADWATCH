"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search, ExternalLink, MapPin, LocateFixed } from "lucide-react";
import type { MappedRoad } from "@/lib/road-network";
const NetworkMap = dynamic(() => import("./network-map"), {
  ssr: false,
  loading: () => (
    <div className="network-map notice">Loading the sourced road network…</div>
  ),
});
export function RoadExplorer({ roads }: { roads: MappedRoad[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const filtered = useMemo(
    () =>
      roads.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [roads, search],
  );
  const active = filtered.find((r) => r.osmId === selected);
  return (
    <div className="network-grid">
      <section className="panel network-list">
        <div className="panel-title">
          <h2>Explore real streets</h2>
          <span className="badge green">{filtered.length} SEGMENTS</span>
        </div>
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">Search Chennai streets</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a street name…"
            type="search"
          />
        </label>
        <div className="network-scroll">
          {filtered.map((r) => (
            <button
              type="button"
              key={r.osmId}
              className={`network-row ${selected === r.osmId ? "selected" : ""}`}
              onClick={() => setSelected(r.osmId)}
            >
              <span className="network-icon">
                <MapPin size={17} />
              </span>
              <span>
                <strong>{r.name}</strong>
                <small>
                  {r.roadType} · OSM way {r.osmId}
                </small>
              </span>
              <LocateFixed size={16} />
            </button>
          ))}
          {!filtered.length && (
            <p className="empty">
              No street matches “{search}”. Try another name.
            </p>
          )}
        </div>
        <p className="breakdown">
          Segments with the same name may be separate mapped sections of one
          street.
        </p>
      </section>
      <section className="panel network-canvas">
        <div className="panel-title">
          <div>
            <h2>{active?.name ?? "Central Chennai road network"}</h2>
            <p className="breakdown">
              {active
                ? "Selected geometry highlighted on the map"
                : "Choose a street to inspect its mapped geometry"}
            </p>
          </div>
          {active && (
            <a
              href={`https://www.openstreetmap.org/way/${active.osmId}`}
              target="_blank"
              rel="noreferrer"
              className="button secondary small"
            >
              Source
              <ExternalLink size={13} />
            </a>
          )}
        </div>
        <NetworkMap roads={filtered} selected={active?.osmId ?? null} />
        <div className="map-legend">
          <span>
            <i />
            Real mapped road geometry
          </span>
          <span>
            <i className="selected" />
            Selected segment
          </span>
        </div>
        <p className="section-note">
          This map shows sourced road geometry. It does not claim that a road
          has potholes, that a repair happened, or that the sample matches an
          official ward boundary.
        </p>
      </section>
    </div>
  );
}

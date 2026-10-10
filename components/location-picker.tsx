"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
const PinMap = dynamic(() => import("./pin-map"), {
  ssr: false,
  loading: () => <div className="map notice">Loading OpenStreetMap…</div>,
});
export default function LocationPicker() {
  const [point, setPoint] = useState<{
    lat: number;
    lng: number;
    source: "gps" | "manual_pin";
  } | null>(null);
  const [message, setMessage] = useState(
    "Try GPS, or tap the map to place your pin.",
  );
  function gps() {
    if (!navigator.geolocation) {
      setMessage("GPS unavailable. Place a pin on the map.");
      return;
    }
    setMessage("Locating…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPoint({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          source: "gps",
        });
        setMessage(
          `GPS location captured (±${Math.round(p.coords.accuracy)} m). Adjust the pin if needed.`,
        );
      },
      () =>
        setMessage(
          "GPS permission denied or unavailable. Tap the map to place your pin.",
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  return (
    <div>
      <button type="button" onClick={gps} className="button secondary small">
        ◎ Use my location
      </button>
      <p>{message}</p>
      <PinMap
        point={point}
        onPin={(lat, lng) => {
          setPoint({ lat, lng, source: "manual_pin" });
          setMessage("Manual pin selected. Confirm it marks the pothole.");
        }}
      />
      <input type="hidden" name="lat" value={point?.lat ?? ""} />
      <input type="hidden" name="lng" value={point?.lng ?? ""} />
      <input
        type="hidden"
        name="source"
        value={point?.source ?? "manual_pin"}
      />
      <p>
        {point
          ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)} · ${point.source === "gps" ? "GPS" : "Manual pin"}`
          : "A location is required. Tap the map before submitting."}
      </p>
    </div>
  );
}

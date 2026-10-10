import type { Event } from "@/lib/types";
export function Timeline({ events }: { events: Event[] }) {
  return (
    <ol className="timeline">
      {[...events]
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .map((e) => (
          <li key={e.id}>
            <b style={{ fontSize: 12, textTransform: "capitalize" }}>
              {e.to_status.replaceAll("_", " ")}
            </b>
            <p>{e.reason}</p>
            <small>
              {new Date(e.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              · actor {e.actor_id.slice(-4)}
            </small>
          </li>
        ))}
    </ol>
  );
}

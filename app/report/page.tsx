import Link from "next/link";
import { requireRole, configured } from "@/lib/supabase";
import { submitReport } from "@/lib/actions";
import LocationPicker from "@/components/location-picker";
import { VoiceNote } from "@/components/voice-note";
import { PracticeWorkspace } from "@/components/practice-workspace";
export const dynamic = "force-dynamic";
export default async function Report() {
  let roads: { id: string; name: string }[] = [];
  if (configured()) {
    const s = await requireRole(["citizen"]);
    const { data } = await s.db
      .from("road_segments")
      .select("id,name")
      .order("name");
    roads = data ?? [];
  }
  return (
    <main className="main wide">
      <Link href="/" className="mini-link">
        ← Back to RoadWatch
      </Link>
      <div className="heading">
        <div>
          <span className="eyebrow">CITIZEN REPORT</span>
          <h1>Make your road heard.</h1>
          <p>A photo. A pin. A permanent ticket.</p>
        </div>
      </div>
      {!configured() ? (
        <PracticeWorkspace />
      ) : (
        <form action={submitReport} className="panel">
          <label>
            Road segment
            <select name="segment" required>
              <option value="">Choose the road</option>
              {roads.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Photo of the pothole
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <small>Private storage · JPEG, PNG or WebP · up to 6 MB</small>
          <h3 style={{ marginTop: 24 }}>Where is it?</h3>
          <LocationPicker />
          <VoiceNote />
          <button className="button" disabled={!configured()}>
            Create my ticket →
          </button>
          <p className="section-note">
            Your ticket stays yours, even when reports are grouped into one
            repair job. An officer confirms every grouping.
          </p>
        </form>
      )}
    </main>
  );
}

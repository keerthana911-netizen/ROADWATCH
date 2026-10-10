"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  changePractice,
  emptyPractice,
  practiceSchema,
  practiceRoads,
  practiceError,
  type Practice,
  type PracticeAction,
} from "@/lib/practice";
import { priority } from "@/lib/priority";
import type { Role } from "@/lib/workflow";
import { FileExport } from "./file-export";
const storageKey = "roadwatch-practice-v1";
const stages = [
  "submitted",
  "assigned",
  "repaired_pending_review",
  "closed",
] as const;
const names = [
  "Report received",
  "Repair assigned",
  "Ready for review",
  "Verified & closed",
];
async function readPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Use a JPEG, PNG or WebP photo.");
  if (!file.size || file.size > 2 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 2 MB.");
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () =>
      reject(new Error("Photo could not be read. Choose it again."));
    r.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("The file is not a readable image."));
    img.src = url;
  });
  return url;
}
export function PracticeWorkspace() {
  const [state, setState] = useState<Practice>(emptyPractice);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("citizen");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [before, setBefore] = useState("/dataset-potholes/potholes1.png");
  const [after, setAfter] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const d = practiceSchema.parse(JSON.parse(saved));
        setState(d);
        setSelected(d.tickets[0]?.id ?? "");
      }
    } catch {
      setError(
        "Saved practice data could not be read. Use Reset practice to start fresh; other RoadWatch data is unaffected.",
      );
    }
    setReady(true);
  }, []);
  const current = state.tickets.find((t) => t.id === selected);
  function commit(action: PracticeAction) {
    setError("");
    setNotice("");
    try {
      const next = changePractice(state, action, role);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setState(next);
      setSelected(action.id);
      setNotice(
        action.type === "submit"
          ? "Ticket created and saved in this browser. Next: switch to Officer and assign the repair."
          : action.type === "assign"
            ? "Repair assigned. Next: record an after-photo in the Officer view."
            : action.type === "repair"
              ? "Evidence saved. Next: switch to Reviewer to inspect and verify."
              : "Repair verified. Your ticket and full timeline remain available after reload.",
      );
      setAfter("");
    } catch (e) {
      setError(
        practiceError(e) +
          (e instanceof DOMException
            ? " Browser storage may be blocked or full. Free space or use smaller photos and retry; this step was not saved."
            : ""),
      );
    }
  }
  async function upload(file: File | undefined, kind: "before" | "after") {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await readPhoto(file);
      kind === "before" ? setBefore(url) : setAfter(url);
    } catch (e) {
      setError(practiceError(e));
    } finally {
      setBusy(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    commit({
      type: "submit",
      id: crypto.randomUUID(),
      input: {
        road: String(f.get("road")) as (typeof practiceRoads)[number],
        note: String(f.get("note")),
        lat: Number(f.get("lat")),
        lng: Number(f.get("lng")),
        before,
      },
    });
  }
  function exportSession() {
    setExportOpen(true);
  }
  if (!ready)
    return (
      <div className="panel" role="status">
        Loading your practice workspace…
      </div>
    );
  const p =
    current?.severity != null
      ? priority(current.severity, current.sensitive, current.created)
      : null;
  return (
    <>
      <div className="notice">
        <b>Interactive practice · saved only in this browser.</b> Role switches
        simulate the workflow; they are not authentication. Photos stay on this
        device. The shared dashboard remains read only.
      </div>
      <div className="practice-toolbar">
        <div className="range-switch" aria-label="Practice role">
          {(["citizen", "officer", "reviewer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => {
                setRole(r);
                setError("");
              }}
            >
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="actions">
          <button
            className="button secondary small"
            onClick={exportSession}
            disabled={!state.tickets.length}
          >
            Export session
          </button>
          <button
            className="button secondary small"
            onClick={() => setResetOpen(true)}
          >
            Reset practice
          </button>
        </div>
      </div>
      {exportOpen && (
        <section className="panel csv-preview" aria-label="Practice export">
          <b>Practice session export</b>
          <p>
            This file includes your browser-local tickets, photos and timeline.
          </p>
          <FileExport
            text={JSON.stringify(
              {
                ...state,
                scope:
                  "Browser-local practice, not authenticated municipal records",
              },
              null,
              2,
            )}
            filename="roadwatch-practice.json"
            mime="application/json"
            label="Download JSON"
            disabled={!state.tickets.length}
          />
          <button
            type="button"
            className="button secondary small"
            onClick={() => setExportOpen(false)}
          >
            Close export
          </button>
        </section>
      )}
      {resetOpen && (
        <div className="notice">
          Clear your browser&apos;s practice tickets and photos? Export first if
          you want to keep them.
          <div className="actions">
            <button
              className="button small"
              onClick={() => {
                try {
                  localStorage.removeItem(storageKey);
                  setState({ version: 1, tickets: [] });
                  setSelected("");
                  setError("");
                  setNotice("Practice cleared. Ready for a fresh report.");
                  setBefore("/dataset-potholes/potholes1.png");
                  setAfter("");
                  setResetOpen(false);
                } catch (e) {
                  setError(practiceError(e));
                }
              }}
            >
              Clear practice data
            </button>
            <button
              className="button secondary small"
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="notice practice-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}
      <div className="practice-layout">
        <section className="panel">
          <span className="eyebrow">{role.toUpperCase()} WORKSPACE</span>
          {role === "citizen" ? (
            <>
              <h2>A photo. A pin. A ticket.</h2>
              <p className="section-note">
                Create a report, then follow it through assignment, repair and
                verification. The location below is an illustrative Chennai pin.
              </p>
              <form onSubmit={submit}>
                <label>
                  Road segment
                  <select name="road" required>
                    {practiceRoads.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Damage description
                  <textarea
                    name="note"
                    required
                    minLength={10}
                    maxLength={500}
                    rows={3}
                    placeholder="Describe the damage and its impact on the road."
                  />
                </label>
                <div className="practice-coordinates">
                  <label>
                    Latitude
                    <input
                      name="lat"
                      type="number"
                      step="any"
                      min={-90}
                      max={90}
                      required
                      defaultValue="13.073"
                    />
                  </label>
                  <label>
                    Longitude
                    <input
                      name="lng"
                      type="number"
                      step="any"
                      min={-180}
                      max={180}
                      required
                      defaultValue="80.260"
                    />
                  </label>
                </div>
                <label>
                  Before-photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void upload(e.target.files?.[0], "before")}
                  />
                </label>
                <small>
                  JPEG, PNG or WebP · up to 2 MB · browser storage only
                </small>
                <img
                  className="practice-photo"
                  src={before}
                  alt="Selected damage evidence"
                />
                <p className="section-note">
                  {before.startsWith("/")
                    ? "Default: real CC0 dataset photo, paired with a simulated location. You can upload your own photo."
                    : "Your selected photo stays in this browser."}
                </p>
                <button className="button" disabled={busy}>
                  {busy ? "Reading photo…" : "Create practice ticket →"}
                </button>
              </form>
            </>
          ) : !current ? (
            <>
              <h2>No ticket selected yet.</h2>
              <p>
                Create a citizen report first. Your new ticket will appear here
                for assignment and review.
              </p>
              <button className="button" onClick={() => setRole("citizen")}>
                Start a report
              </button>
            </>
          ) : role === "officer" ? (
            <>
              <h2>Confirm. Assign. Repair.</h2>
              {current.status === "submitted" ? (
                <form
                  key={current.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    commit({
                      type: "assign",
                      id: current.id,
                      severity: Number(f.get("severity")),
                      sensitive: f.get("sensitive") === "on",
                      contractor: String(f.get("contractor")),
                      due: String(f.get("due")),
                    });
                  }}
                >
                  <p>
                    Inspect the citizen&apos;s evidence before confirming
                    severity. No AI classification is used in this practice.
                  </p>
                  <label>
                    Confirmed severity
                    <select name="severity">
                      <option value="0.3">Minor · 0.3</option>
                      <option value="0.6">Moderate · 0.6</option>
                      <option value="0.9">Severe · 0.9</option>
                    </select>
                  </label>
                  <label className="practice-check">
                    <input type="checkbox" name="sensitive" /> Near a school or
                    hospital
                  </label>
                  <label>
                    Contractor
                    <input
                      name="contractor"
                      required
                      minLength={2}
                      maxLength={80}
                      placeholder="e.g. City Works"
                    />
                  </label>
                  <label>
                    Repair due date
                    <input
                      name="due"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      defaultValue={new Date(Date.now() + 86400000)
                        .toISOString()
                        .slice(0, 10)}
                      required
                    />
                  </label>
                  <button className="button">Confirm and assign repair</button>
                </form>
              ) : current.status === "assigned" ? (
                <>
                  <p>
                    Record an after-photo. A repaired job stays open until a
                    reviewer verifies it.
                  </p>
                  <label>
                    After-photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        void upload(e.target.files?.[0], "after")
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() => setAfter("/demo-repair.png")}
                  >
                    Use labeled repair illustration
                  </button>
                  {after && (
                    <>
                      <img
                        className="practice-photo"
                        src={after}
                        alt="Selected repair evidence"
                      />
                      <p className="section-note">
                        {after.startsWith("/")
                          ? "Illustration for workflow rehearsal, not evidence of an actual repair."
                          : "Your uploaded repair photo; stored on this device."}
                      </p>
                    </>
                  )}
                  <button
                    className="button"
                    disabled={!after || busy}
                    onClick={() =>
                      commit({ type: "repair", id: current.id, after })
                    }
                  >
                    Record repair for review
                  </button>
                </>
              ) : (
                <p>
                  {current.status === "closed"
                    ? "This repair has been verified. The timeline remains available."
                    : "This job is awaiting reviewer verification. Switch to Reviewer to continue."}
                </p>
              )}
            </>
          ) : (
            <>
              <h2>Evidence before closure.</h2>
              {current.status === "repaired_pending_review" ? (
                <form
                  key={current.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    commit({
                      type: "verify",
                      id: current.id,
                      note: String(
                        new FormData(e.currentTarget).get("verification"),
                      ),
                    });
                  }}
                >
                  <p>
                    Compare before and after evidence on the right. In real
                    operations, use an authenticated reviewer and genuine repair
                    evidence.
                  </p>
                  <label>
                    Reviewer verification note
                    <textarea
                      name="verification"
                      required
                      minLength={10}
                      maxLength={500}
                      rows={3}
                      placeholder="Describe what you checked before closing this practice job."
                    />
                  </label>
                  <button className="button">Verify and close ticket</button>
                </form>
              ) : (
                <p>
                  {current.status === "closed"
                    ? "Verified and closed. The citizen ticket and its history have been preserved."
                    : "This ticket is not ready for review. An officer must assign and record repair evidence first."}
                </p>
              )}
            </>
          )}
        </section>
        <section className="panel" aria-label="Practice ticket history">
          <span className="eyebrow">
            YOUR PRACTICE TICKETS · {state.tickets.length}/10
          </span>
          <h2>A promise you can follow.</h2>
          {!state.tickets.length ? (
            <div className="practice-empty">
              <h3>Your first ticket starts here.</h3>
              <p>
                Choose a road, describe the pothole, and submit. We&apos;ll save
                the ticket and show the next step.
              </p>
              <Link href="/presentation" className="mini-link">
                See the 3-minute demo script →
              </Link>
            </div>
          ) : (
            <>
              <label>
                Choose ticket
                <select
                  value={selected}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    setAfter("");
                    setError("");
                  }}
                >
                  {state.tickets.map((t, i) => (
                    <option key={t.id} value={t.id}>
                      {t.road} · {names[stages.indexOf(t.status)]} · #
                      {state.tickets.length - i}
                    </option>
                  ))}
                </select>
              </label>
              {current && (
                <>
                  <div className="practice-id">
                    PRACTICE-{current.id.slice(0, 8).toUpperCase()}
                  </div>
                  <h3>{current.road}</h3>
                  <p>{current.note}</p>
                  <small>
                    Pin: {current.lat.toFixed(5)}, {current.lng.toFixed(5)} ·
                    simulated location
                  </small>
                  <ol className="practice-steps" aria-label="Ticket progress">
                    {names.map((n, i) => (
                      <li
                        key={n}
                        aria-current={
                          i === stages.indexOf(current.status)
                            ? "step"
                            : undefined
                        }
                        className={
                          i <= stages.indexOf(current.status) ? "done" : ""
                        }
                      >
                        {i + 1}. {n}
                      </li>
                    ))}
                  </ol>
                  {p && (
                    <div className="notice">
                      <b>Priority {p.score}/100</b>
                      <p>
                        Severity {p.components.severity.toFixed(1)} + sensitive
                        location {p.components.sensitive} + waiting{" "}
                        {p.components.waiting.toFixed(1)}. Report count never
                        changes priority.
                      </p>
                      <small>
                        {current.contractor} · due {current.due}
                      </small>
                    </div>
                  )}
                  <div className="practice-evidence">
                    <figure>
                      <img src={current.before} alt="Before repair" />
                      <figcaption>
                        Before{" "}
                        {current.before.startsWith("/")
                          ? "· real dataset photo; simulated location"
                          : "· your local upload"}
                      </figcaption>
                    </figure>
                    {current.after && (
                      <figure>
                        <img src={current.after} alt="After repair" />
                        <figcaption>
                          After{" "}
                          {current.after.startsWith("/")
                            ? "· repair illustration"
                            : "· your local upload"}
                        </figcaption>
                      </figure>
                    )}
                  </div>
                  <h3>Permanent ticket timeline</h3>
                  <ol className="practice-timeline">
                    {current.events.map((e, i) => (
                      <li key={i}>
                        <b>{e.role[0].toUpperCase() + e.role.slice(1)}</b>
                        <time>{new Date(e.at).toLocaleString()}</time>
                        <p>{e.text}</p>
                      </li>
                    ))}
                  </ol>
                  {state.tickets.some(
                    (t) =>
                      t.id !== current.id &&
                      t.road === current.road &&
                      t.status === "closed",
                  ) && (
                    <div className="notice">
                      <b>Same-road repair history found.</b> An earlier verified
                      practice repair exists on this road. Inspect its
                      contractor and date before planning another job. This
                      road-level hint does not automatically merge reports.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

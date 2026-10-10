import Link from "next/link";
const criteria = [
  {
    title: "Product Experience / UX",
    weight: "25%",
    evidence:
      "One entry point leads through report, assignment, repair evidence and verification. Each saved step names the next action. Mobile layouts, empty states and keyboard-accessible forms keep the main flow usable.",
    href: "/try",
    label: "Try the main flow",
  },
  {
    title: "Problem–Solution Fit",
    weight: "20%",
    evidence:
      "Duplicate complaints retain citizen tickets, repair priority is explainable, and repeat failures preserve contractor and warranty history. RoadWatch addresses follow-through and accountability after the first complaint.",
    href: "/?filter=repeat",
    label: "Inspect repair memory",
  },
  {
    title: "Execution & Prioritisation",
    weight: "20%",
    evidence:
      "The MVP centers on one complete workflow. Maps, evidence provenance and audit views support it. Live Supabase integration and trained ML are explicitly separated from the deployed practice. Actual event build time must be reported by the team.",
    href: "/try",
    label: "Show the working scope",
  },
  {
    title: "Presentation & Explanation",
    weight: "15%",
    evidence:
      "A three-minute script, architecture walkthrough, known limitations and Q&A are provided below. Lead with the working workflow, then explain the design choices.",
    href: "#demo-script",
    label: "Rehearse the demo",
  },
  {
    title: "Innovation / Thoughtful Details",
    weight: "10%",
    evidence:
      "Human-confirmed grouping, reviewer-only closure, repair memory, transparent priority contributions, real dataset provenance and a labeled heuristic make accountability inspectable.",
    href: "/analytics",
    label: "Inspect decisions and audit",
  },
  {
    title: "Teamwork & Response to Questions",
    weight: "10%",
    evidence:
      "Use the ownership and rehearsal checklist below. Each member should explain their actual contribution and answer questions about its tradeoffs. This page cannot prove teamwork or predict judges’ scores.",
    href: "#team-handoff",
    label: "Prepare the team handoff",
  },
];
const questions = [
  [
    "What is the problem?",
    "A reported pothole is not a verified repair. Citizens lose visibility when complaints are grouped, while repeat failures lose their repair history. RoadWatch keeps the ticket, evidence, accountable contractor and verification trail together.",
  ],
  [
    "What works end to end today?",
    "The public practice workspace creates a report, saves it in the browser, assigns a repair, records after-evidence, and closes it through reviewer verification. Reload preserves the ticket and timeline. The shared dashboard is a separate read-only fixture.",
  ],
  [
    "Is the public practice authenticated or shared between devices?",
    "No. It is an explicit browser-local rehearsal with role previews. The production code includes Supabase Auth, database RLS and private storage, but those integrations require project credentials and live verification. Do not describe the practice as a deployed multiuser backend.",
  ],
  [
    "What is real data and what is simulated?",
    "Six pothole photos and VOC annotation boxes come from the CC0 Kaggle dataset. The Chennai road sample comes from OpenStreetMap. Ticket locations, contractor records, repair dates and the repair illustration are simulated. Dataset boxes are labels, not model predictions.",
  ],
  [
    "Why not merge nearby reports automatically?",
    "Proximity can be misleading, especially with GPS drift or adjacent roads. A candidate must share the road segment and meet the distance and time rules. An officer confirms grouping; the citizen’s ticket remains intact.",
  ],
  [
    "How do you prevent popularity from distorting priority?",
    "Priority is 50 × severity + 30 × sensitive-location flag + 20 × capped waiting fraction. Duplicate report count does not increase the score. Every component is visible.",
  ],
  [
    "What does AI decide?",
    "AI suggests evidence interpretation and optional assistance. Human decisions control grouping, assignment and verification. No live OpenAI key is configured for this public demo, and the risk score is an explained heuristic rather than a calibrated ML probability.",
  ],
  [
    "How do you validate inputs and handle failures?",
    "The practice validates location bounds, descriptions, image readability and size, contractors, due dates and verification notes. Transition rules block unauthorized role actions and closure without repair evidence. Storage failures leave the prior state intact with a recoverable error.",
  ],
  [
    "What would you ship next?",
    "Connect and verify Supabase Auth, RLS and private photo storage; test the real multirole lifecycle; then train and evaluate a pothole model on licensed data. Field-verify road alignment and repair evidence before operational use.",
  ],
];
export default function Presentation() {
  return (
    <main className="main wide presentation">
      <Link href="/" className="mini-link">
        ← Back to RoadWatch
      </Link>
      <div className="heading">
        <div>
          <span className="eyebrow">ROADWATCH / FINALS PREPARATION</span>
          <h1>Show the promise. Prove the flow.</h1>
          <p>
            A meaningful MVP with a working practice lifecycle, inspectable
            rules and honest boundaries.
          </p>
        </div>
        <Link href="/try" className="button">
          Launch live practice →
        </Link>
      </div>
      <section className="panel">
        <span className="eyebrow">THE PITCH</span>
        <h2>A complaint ends. Accountability doesn’t.</h2>
        <p>
          RoadWatch turns pothole reports into permanent citizen tickets and
          verified repair histories. Officers prioritize repairs using visible
          rules, reviewers check the evidence, and repeat failures retain the
          contractor and warranty memory.
        </p>
        <div className="notice">
          <b>Evaluation scope:</b> the deployed interactive practice works
          locally in a visitor&apos;s browser. The shared operational dashboard
          uses illustrative records. Live municipal authentication, backend
          writes and live AI remain unconfigured.
        </div>
      </section>
      <h2>Coverage of the finals matrix</h2>
      <p className="section-note">
        These are evidence links and preparation aids, not guaranteed scores.
        Tie-break order: UX → execution → problem–solution fit.
      </p>
      <div className="criteria-grid">
        {criteria.map((c) => (
          <section className="panel" key={c.title}>
            <span className="badge green">{c.weight}</span>
            <h3>{c.title}</h3>
            <p>{c.evidence}</p>
            <Link className="mini-link" href={c.href}>
              {c.label} →
            </Link>
          </section>
        ))}
      </div>
      <section className="panel" id="demo-script">
        <span className="eyebrow">THREE-MINUTE DEMO</span>
        <h2>Let the product tell the story.</h2>
        <ol className="presentation-script">
          <li>
            <b>0:00–0:25 · The broken promise</b>
            <p>
              Explain why a complaint number alone cannot prove that a road was
              fixed or identify why it failed again.
            </p>
          </li>
          <li>
            <b>0:25–1:30 · One working lifecycle</b>
            <p>
              Open practice. Create a report with a dataset photo, description
              and pin. Switch to Officer, confirm severity and assign a
              contractor. Record the explicitly labeled repair illustration.
              Switch to Reviewer, inspect evidence and verify with a note.
            </p>
            <Link href="/try" className="mini-link">
              Start the practice →
            </Link>
          </li>
          <li>
            <b>1:30–2:00 · Show the proof</b>
            <p>
              Reload to show the preserved ticket and timeline. Explain
              browser-local storage and role simulation. Export the session if
              judges want to inspect it.
            </p>
          </li>
          <li>
            <b>2:00–2:35 · The road remembers</b>
            <p>
              Open the shared dashboard&apos;s repeat-failure example. Show
              prior contractor, warranty window and explainable priority. Point
              out which records are simulated.
            </p>
            <Link href="/?filter=repeat" className="mini-link">
              Open repair memory →
            </Link>
          </li>
          <li>
            <b>2:35–3:00 · Choices and next milestone</b>
            <p>
              Explain deterministic outcomes, human review and the optional AI
              layer. State the next milestone: configuring and verifying the
              live backend.
            </p>
          </li>
        </ol>
      </section>
      <section className="panel">
        <span className="eyebrow">ARCHITECTURE & CHOICES</span>
        <h2>Two explicit modes. One set of rules.</h2>
        <div className="architecture-flow" aria-label="Practice architecture">
          <div>
            <b>Browser UI</b>
            <small>React · validation · role preview</small>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <b>Workflow rules</b>
            <small>Transitions · priority · evidence gates</small>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <b>Local persistence</b>
            <small>Tickets · photos · timeline · JSON export</small>
          </div>
        </div>
        <p>
          The root app uses Next.js App Router and TypeScript. The public
          hosting copy uses the Sites Vinext adapter on a Cloudflare Worker.
          Practice progress is stored on the device; server-rendered dashboard
          records are fixtures.
        </p>
        <p>
          The separate live integration uses Supabase Auth,
          Postgres/PostGIS/pgvector, row-level security and private photo
          storage. Optional OpenAI calls are isolated behind human confirmation
          and failure handling. Without credentials, these services remain
          disabled.
        </p>
        <p>
          <b>Why this scope:</b> a visitor can evaluate the full lifecycle
          immediately without account setup. The practice shows behavior while
          avoiding claims that browser role switches provide real authorization.
        </p>
      </section>
      <section className="panel" id="team-handoff">
        <span className="eyebrow">TEAM OWNERSHIP</span>
        <h2>Every member should own an answer.</h2>
        <p>
          Before presenting, record real names and contributions in{" "}
          <code>docs/FINALS-HANDOFF.md</code>. Use your actual event timeline;
          do not claim the app was built in 3–4 hours unless your records
          support it.
        </p>
        <ul>
          <li>
            Product and UX owner: explain the user problem and demonstrate the
            main flow.
          </li>
          <li>
            Workflow and backend owner: explain transitions, permissions,
            evidence gates and the unconfigured live integration.
          </li>
          <li>
            Data and AI owner: explain photo provenance, road data, heuristics
            and AI limitations.
          </li>
          <li>
            Demo and QA owner: rehearse on the presentation device, check
            persistence, and handle recovery during Q&A.
          </li>
        </ul>
        <p>
          Small teams can combine these responsibilities. Agree on who answers
          each topic, rehearse a handoff, and make every claim traceable to the
          working app or project history.
        </p>
      </section>
      <section className="panel">
        <span className="eyebrow">JUDGE Q&A</span>
        <h2>Clear answers, visible evidence.</h2>
        {questions.map(([q, a]) => (
          <details className="judge-answer" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </main>
  );
}

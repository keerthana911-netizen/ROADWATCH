import Link from "next/link";
import { PracticeWorkspace } from "@/components/practice-workspace";
export default function TryPage() {
  return (
    <main className="main wide">
      <Link className="mini-link" href="/">
        ← Back to dashboard
      </Link>
      <div className="heading">
        <div>
          <span className="eyebrow">ROADWATCH / TRY THE COMPLETE FLOW</span>
          <h1>From pothole to promise kept.</h1>
          <p>
            Report → assign → record repair → reviewer verification. Try every
            step and keep the timeline.
          </p>
        </div>
        <Link className="button secondary" href="/presentation">
          Presentation & Q&A
        </Link>
      </div>
      <PracticeWorkspace />
    </main>
  );
}

"use client";
import { useRef, useState } from "react";
import { Play, ArrowRight, ArrowLeft, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
export function JudgeTour({
  groupedHref,
  memoryHref,
}: {
  groupedHref: string;
  memoryHref: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Try the complete core flow",
      body: "Create a browser-local practice ticket, switch to Officer to assign and record repair evidence, then switch to Reviewer to verify closure. Reload to show the preserved timeline. Role switches are simulation, not authentication.",
      href: "/try",
      label: "Start the interactive practice",
    },
    {
      title: "Start with real evidence",
      body: "Inspect six public pothole photos and their source annotations. Demo ticket locations and repair histories remain simulated. The boxes are dataset labels, not AI predictions.",
      href: "/evidence",
      label: "Inspect the dataset photos",
    },
    {
      title: "Start with the promise",
      body: "Rules decide real outcomes. AI only suggests. An authenticated officer confirms grouping, and a reviewer verifies closure.",
      href: "/analytics",
      label: "Inspect governance",
    },
    {
      title: "Five voices, one repair",
      body: "Open the earlier repair. Every citizen keeps a permanent ticket when duplicate reports become one repair job.",
      href: groupedHref,
      label: "See the grouped tickets",
    },
    {
      title: "Explain the priority",
      body: "Inspect severity, sensitive location, and waiting time. Report volume never increases a priority score. Check the overdue queue.",
      href: "/?filter=overdue",
      label: "Open overdue queue",
    },
    {
      title: "Evidence before closure",
      body: "A repair needs an after-photo and reviewer verification. Citizens cannot change statuses. The seed has a repair ready for review.",
      href: "/?filter=review&view=reviewer",
      label: "Open review queue",
    },
    {
      title: "Make AI accountable",
      body: "Inspect pending and accepted suggestions, their input snapshots, and the human decision actor. An accepted suggestion still needs confirmation.",
      href: "/analytics",
      label: "Open AI audit",
    },
    {
      title: "End on repair memory",
      body: "Show the recurrence, earlier contractor, elapsed failure days, and warranty window. Expand the HIGH risk score to explain each contribution.",
      href: memoryHref,
      label: "Show the repeat failure",
    },
  ];
  const current = steps[step];
  return (
    <>
      <button
        type="button"
        className="button tour-button"
        onClick={() => {
          setStep(0);
          dialog.current?.showModal();
        }}
      >
        <Play size={14} />
        3-minute walkthrough
      </button>
      <dialog ref={dialog} className="tour-dialog" aria-labelledby="tour-title">
        <button
          className="tour-close button secondary small"
          aria-label="Close walkthrough"
          onClick={() => dialog.current?.close()}
        >
          <X size={18} />
        </button>
        <span className="eyebrow">
          JUDGE’S WALKTHROUGH · {step + 1} OF {steps.length}
        </span>
        <div className="tour-progress">
          {steps.map((s, n) => (
            <button
              type="button"
              key={s.title}
              aria-label={`Go to step ${n + 1}: ${s.title}`}
              aria-current={n === step ? "step" : undefined}
              className={n <= step ? "filled" : ""}
              onClick={() => setStep(n)}
            />
          ))}
        </div>
        <span className="tour-symbol">
          <ShieldCheck size={28} />
        </span>
        <h2 id="tour-title">{current.title}</h2>
        <p>{current.body}</p>
        <Link
          href={current.href}
          className="button"
          onClick={() => dialog.current?.close()}
        >
          {current.label}
          <ArrowRight size={15} />
        </Link>
        <div className="tour-nav">
          <button
            type="button"
            className="button secondary small"
            disabled={step === 0}
            onClick={() => setStep((n) => n - 1)}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <small>Demo records remain clearly labeled.</small>
          <button
            type="button"
            className="button secondary small"
            disabled={step === steps.length - 1}
            onClick={() => setStep((n) => n + 1)}
          >
            Next
            <ArrowRight size={14} />
          </button>
        </div>
      </dialog>
    </>
  );
}

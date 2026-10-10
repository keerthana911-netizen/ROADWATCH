import { login } from "@/lib/auth-actions";
import { configured } from "@/lib/supabase";
import Link from "next/link";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams;
  if (!configured())
    return (
      <main className="login">
        <Link href="/" className="brand">
          ◈ RoadWatch
        </Link>
        <div className="panel">
          <span className="eyebrow">EXPLORE ROADWATCH</span>
          <h1>Choose your perspective.</h1>
          <p>
            The public dashboard uses illustrative records. Account sign-in and
            shared changes require a configured Supabase backend.
          </p>
          <Link href="/try" className="button">
            Try the complete repair flow →
          </Link>
          <p>
            Practice reporting, assignment and verification with tickets saved
            in your browser.
          </p>
          <div className="actions">
            <Link href="/?view=citizen" className="button secondary">
              Citizen view
            </Link>
            <Link href="/?view=officer" className="button secondary">
              Officer view
            </Link>
            <Link href="/?view=reviewer" className="button secondary">
              Reviewer view
            </Link>
          </div>
          <p className="section-note">
            Perspective switches simulate roles; they do not sign you in.
          </p>
        </div>
      </main>
    );
  return (
    <main className="login">
      <Link href="/" className="brand">
        ◈ RoadWatch
      </Link>
      <div className="panel">
        <span className="eyebrow">A BETTER ROAD STARTS HERE</span>
        <h1>
          Every report.
          <br />
          Remembered.
        </h1>
        <p>Track the journey from a citizen’s photo to a verified repair.</p>
        {p.error && (
          <p role="alert" className="error">
            {p.error}
          </p>
        )}
        <form action={login}>
          <label>
            Email
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button disabled={!configured()} className="button">
            Sign in →
          </button>
        </form>
        <p className="section-note">
          Use the account provided by your administrator.
        </p>
      </div>
    </main>
  );
}

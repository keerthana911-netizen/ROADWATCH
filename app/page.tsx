import { loadData } from "@/lib/data";
import { Shell } from "@/components/shell";
import { Dashboard } from "@/components/dashboard";
import { aiEnabled } from "@/lib/ai";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    view?: string;
    q?: string;
    sort?: string;
    status?: string;
  }>;
}) {
  const p = await searchParams;
  const filter =
    typeof p.filter === "string" &&
    ["all", "repeat", "overdue", "review", "unassigned"].includes(p.filter)
      ? p.filter
      : "all";
  const q = typeof p.q === "string" ? p.q.slice(0, 200) : "";
  const sort =
    typeof p.sort === "string" && ["priority", "oldest", "due"].includes(p.sort)
      ? p.sort
      : "priority";
  const status =
    typeof p.status === "string" &&
    ["open", "assigned", "repaired_pending_review"].includes(p.status)
      ? p.status
      : "all";
  const d = await loadData(p.view);
  return (
    <Shell d={d} active={p.filter === "repeat" ? "memory" : "dashboard"}>
      <Dashboard
        d={d}
        filter={filter}
        q={q}
        sort={sort}
        status={status}
        ai={aiEnabled()}
      />
    </Shell>
  );
}

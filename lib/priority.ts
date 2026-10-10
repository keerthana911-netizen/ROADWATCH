export function priority(
  severity: number,
  sensitive: boolean,
  openedAt: string,
  now: Date = new Date(),
) {
  const days = Math.max(0, (now.getTime() - Date.parse(openedAt)) / 86400000);
  const components = {
    severity: 50 * Math.max(0, Math.min(1, severity)),
    sensitive: sensitive ? 30 : 0,
    waiting: 20 * Math.min(days / 7, 1),
  };
  return {
    score: Math.round(
      components.severity + components.sensitive + components.waiting,
    ),
    components,
    days,
  };
}
export function overdue(
  dueDate: string,
  status: string,
  now: Date = new Date(),
) {
  return (
    !["closed", "repaired_pending_review"].includes(status) &&
    dueDate < now.toISOString().slice(0, 10)
  );
}

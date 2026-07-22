export function isAtPlanLimit(currentCount: number, limit: number) {
  return Number.isFinite(limit) && currentCount >= limit;
}

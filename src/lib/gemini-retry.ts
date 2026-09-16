/**
 * Vertex googleSearch often dies with 504 DEADLINE_EXCEEDED. Retrying that same
 * heavy request spends another minute and fails the same way. Rate limits are
 * the only retry that can still produce grounded candidates.
 */
export function isRetryableGeminiSearchError(message: string) {
  if (/504|DEADLINE_EXCEEDED|deadline expired|timeout|abort/i.test(message)) {
    return false;
  }
  return /429|quota|rate|resource_exhausted|temporar/i.test(message);
}

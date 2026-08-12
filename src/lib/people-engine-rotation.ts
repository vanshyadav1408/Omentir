type SourceWithKey = {
  key: string;
};

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return length ? hash % length : 0;
}

export function planPeopleEngineSourceRun<T extends SourceWithKey>(
  sources: T[],
  cursorKey: string | undefined,
  limit: number,
) {
  const startIndex = cursorKey
    ? sources.findIndex((source) => source.key === cursorKey)
    : -1;
  const ordered =
    startIndex > 0
      ? [...sources.slice(startIndex), ...sources.slice(0, startIndex)]
      : sources;

  return ordered.slice(0, Math.max(0, limit)).map((source, index) => ({
    source,
    // Point beyond the selected window on its last item. Wrapping within the
    // window would make every later source unreachable on future daily runs.
    nextSource: ordered.length ? ordered[(index + 1) % ordered.length] : undefined,
  }));
}

export function selectDailyTargetLocation(
  query: string,
  locations: string[],
  asOfMs = Date.now(),
) {
  if (!locations.length) return undefined;
  const utcDay = Math.floor(asOfMs / (24 * 60 * 60 * 1000));
  return locations[(stableIndex(query, locations.length) + utcDay) % locations.length];
}

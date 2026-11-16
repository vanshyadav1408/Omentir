// Helpers for LinkedIn's internal web API ("Voyager"). REST endpoints answer in
// a normalized form: `data` holds references (`*elements`, `*profile`) and the
// referenced entities live flat in `included`, each with an `entityUrn` and a
// `$type`. Parsers find entities by urn or by `$type` suffix rather than by a
// fixed path, so LinkedIn adding or moving a wrapper does not break them.

export type VoyagerEntity = Record<string, unknown> & {
  entityUrn?: string;
  $type?: string;
};

export type VoyagerResponse = {
  data?: Record<string, unknown>;
  included?: VoyagerEntity[];
  elements?: unknown[];
  paging?: { start?: number; count?: number; total?: number };
};

export function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function str(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

// LinkedIn wraps most visible text as { text: "..." } (TextViewModel), and
// messaging GraphQL wraps names the same way.
export function text(value: unknown): string | undefined {
  if (typeof value === "string") return str(value);
  const record = asObject(value);
  if (!record) return undefined;
  return str(record.text) || text(record.attributedText);
}

export class VoyagerIndex {
  private byUrn = new Map<string, VoyagerEntity>();
  readonly entities: VoyagerEntity[];

  constructor(response: VoyagerResponse | null | undefined) {
    this.entities = asArray(response?.included).filter(
      (entity): entity is VoyagerEntity => Boolean(asObject(entity)),
    );
    for (const entity of this.entities) {
      if (typeof entity.entityUrn === "string") this.byUrn.set(entity.entityUrn, entity);
    }
  }

  get(urn: unknown) {
    return typeof urn === "string" ? this.byUrn.get(urn) : undefined;
  }

  // Follows a `*field` reference on an entity, or returns an inline object.
  ref(entity: Record<string, unknown> | null | undefined, field: string) {
    if (!entity) return undefined;
    const inline = asObject(entity[field]);
    if (inline) return inline as VoyagerEntity;
    return this.get(entity[`*${field}`]);
  }

  refs(entity: Record<string, unknown> | null | undefined, field: string) {
    if (!entity) return [];
    const inline = asArray(entity[field]).map(asObject).filter(Boolean) as VoyagerEntity[];
    if (inline.length) return inline;
    return asArray(entity[`*${field}`])
      .map((urn) => this.get(urn))
      .filter((item): item is VoyagerEntity => Boolean(item));
  }

  ofType(...suffixes: string[]) {
    return this.entities.filter((entity) =>
      suffixes.some((suffix) => typeof entity.$type === "string" && entity.$type.endsWith(suffix)),
    );
  }
}

// The ordered top-level results of a normalized collection response.
export function collectionElements(response: VoyagerResponse, index: VoyagerIndex) {
  const data = asObject(response.data);
  const refs = asArray(data?.["*elements"]);
  if (refs.length) {
    return refs.map((urn) => index.get(urn)).filter((item): item is VoyagerEntity => Boolean(item));
  }
  return [...asArray(data?.elements), ...asArray(response.elements)]
    .map(asObject)
    .filter(Boolean) as VoyagerEntity[];
}

export function collectionTotal(response: VoyagerResponse) {
  const paging = asObject(asObject(response.data)?.paging) || asObject(response.paging);
  const total = Number(paging?.total);
  return Number.isFinite(total) ? total : undefined;
}

// Largest rendition of a LinkedIn VectorImage ({ rootUrl, artifacts }).
export function vectorImageUrl(value: unknown): string | undefined {
  const image = asObject(value);
  if (!image) return undefined;
  const nested =
    asObject(image.vectorImage) ||
    asObject(asObject(image.displayImageReference)?.vectorImage) ||
    asObject(asObject(image.displayImageReferenceResolutionResult)?.vectorImage) ||
    asObject(image["com.linkedin.common.VectorImage"]) ||
    null;
  if (nested && nested !== image) return vectorImageUrl(nested);

  const rootUrl = str(image.rootUrl);
  const artifacts = asArray(image.artifacts)
    .map(asObject)
    .filter((artifact): artifact is Record<string, unknown> => Boolean(artifact))
    .sort((a, b) => Number(b.width || 0) - Number(a.width || 0));
  const segment = str(artifacts[0]?.fileIdentifyingUrlPathSegment);
  if (rootUrl && segment) return `${rootUrl}${segment}`;
  // Search results leave rootUrl empty and put the whole url in the segment.
  if (segment?.startsWith("https://")) return segment;
  const url = str(image.url);
  return url?.startsWith("https://") ? url : undefined;
}

// urn:li:fsd_profile:ACo..., urn:li:fs_miniProfile:ACo..., urn:li:member:123
export function profileIdFromUrn(urn: unknown) {
  const value = str(urn);
  if (!value) return undefined;
  const match = value.match(/^urn:li:(?:fsd_profile|fs_miniProfile|fs_profile|fs_normalized_profile|member|person):([^,)]+)$/);
  return match?.[1];
}

export function profileUrn(memberId: string) {
  return `urn:li:fsd_profile:${memberId}`;
}

// urn:li:fs_normalized_company:123 / urn:li:fsd_company:123 / urn:li:company:123
export function companyIdFromUrn(urn: unknown) {
  const match = str(urn)?.match(/^urn:li:(?:fs_normalized_company|fsd_company|fs_company|company|organization):(\d+)$/);
  return match?.[1];
}

export function activityIdFromUrn(urn: unknown) {
  const match = str(urn)?.match(/urn:li:(?:activity|ugcPost|share):(\d+)/);
  return match?.[1];
}

// LinkedIn activity ids are time-ordered: the top 41 bits are the creation
// time in epoch milliseconds. Exact, unlike the "2d" label in the feed.
export function activityTimestamp(activityId: string | undefined) {
  if (!activityId || !/^\d{15,22}$/.test(activityId)) return undefined;
  const ms = Number(BigInt(activityId) >> BigInt(22));
  // Sanity window: LinkedIn launched in 2003; nothing can be from the future.
  if (ms < Date.UTC(2003, 0, 1) || ms > Date.now() + 24 * 60 * 60 * 1000) return undefined;
  return new Date(ms).toISOString();
}

export function isoFromMillis(value: unknown) {
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : undefined;
}

// Rest.li 2.0 query encoding: values inside List(...) / (key:value) must also
// escape the characters Rest.li uses as syntax.
export function restliEncode(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function restliList(values: string[]) {
  return `List(${values.map(restliEncode).join(",")})`;
}

import type { Agent, ProductProfile } from "./types";

// Location enforcement for lead discovery. LinkedIn returns whatever the
// searching account's network surfaces, ignoring the target country entirely -
// so a search for "Head of Sales" often over-weights the account owner's home
// market even when the agent targets another region. We enforce the target
// country ourselves by matching each discovered lead's profile location against
// the agent's target locations and dropping the ones that clearly don't belong.
//
// Matching is deliberately country-level and alias-aware: LinkedIn locations
// rarely name the country ("San Francisco Bay Area", "Greater London",
// "Bengaluru"), so each supported target country carries its demonyms,
// abbreviations, states/provinces, and major metros. A lead whose location is
// blank/unknown is KEPT (many search results omit it until enriched) - only a
// location that is present AND matches no target is dropped.

// Fold accents, lowercase, and collapse every non-alphanumeric run to a single
// space so "Montréal, Québec" and "montreal quebec" compare equal.
function canonical(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Whole-phrase match so short aliases like "us"/"uk" can't match inside
// "Houston"/"Ukraine". Padding with spaces turns "contains word" into a plain
// substring test on canonical, space-delimited strings.
function containsPhrase(haystack: string, phrase: string): boolean {
  const needle = canonical(phrase);
  if (!needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

// Country -> aliases (name, demonyms, abbreviations, states/provinces, metros).
// Focused on the English-speaking B2B markets that are the realistic targets;
// countries not listed still match on their own name via the fallback below.
// Ambiguous single tokens (e.g. "Victoria", "Georgia") are intentionally left
// out - a false keep is cheaper than dropping a legitimate lead.
const COUNTRY_ALIASES: Record<string, string[]> = {
  "united states": [
    "united states", "united states of america", "usa", "u s a", "us", "u s",
    "america", "silicon valley",
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "florida", "hawaii", "idaho", "illinois",
    "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland",
    "massachusetts", "michigan", "minnesota", "mississippi", "missouri",
    "montana", "nebraska", "nevada", "new hampshire", "new jersey",
    "new mexico", "new york", "north carolina", "north dakota", "ohio",
    "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
    "south dakota", "tennessee", "texas", "utah", "vermont", "virginia",
    "washington", "west virginia", "wisconsin", "wyoming",
    "new york city", "san francisco", "san francisco bay area", "bay area",
    "los angeles", "greater los angeles", "seattle", "greater seattle area",
    "austin", "boston", "greater boston", "chicago", "denver", "miami",
    "atlanta", "dallas", "dallas fort worth", "houston", "philadelphia",
    "washington dc", "washington dc baltimore area", "phoenix", "san diego",
    "portland", "minneapolis", "detroit", "pittsburgh", "nashville",
    "charlotte", "salt lake city", "raleigh", "tampa", "orlando",
  ],
  canada: [
    "canada", "canadian",
    "ontario", "quebec", "british columbia", "alberta", "manitoba",
    "saskatchewan", "nova scotia", "new brunswick", "newfoundland",
    "prince edward island",
    "toronto", "greater toronto area", "vancouver", "montreal", "calgary",
    "ottawa", "edmonton", "winnipeg", "mississauga",
  ],
  "united kingdom": [
    "united kingdom", "uk", "u k", "britain", "great britain", "british",
    "england", "scotland", "wales", "northern ireland",
    "london", "greater london", "manchester", "birmingham", "edinburgh",
    "bristol", "leeds", "glasgow", "liverpool", "cambridge", "oxford",
    "sheffield", "nottingham", "cardiff", "belfast",
  ],
  ireland: ["ireland", "irish", "dublin", "cork", "galway"],
  australia: [
    "australia", "australian", "new south wales", "queensland",
    "western australia", "south australia", "tasmania",
    "australian capital territory", "sydney", "melbourne",
    "brisbane", "perth", "adelaide", "canberra", "gold coast",
    // LinkedIn renders many Australian locations as "City, ST" ("Salisbury,
    // SA", "Sydney, NSW") - match the state abbreviations too.
    "nsw", "vic", "qld", "sa", "wa", "act", "tas",
  ],
  "new zealand": ["new zealand", "auckland", "wellington", "christchurch"],
  singapore: ["singapore"],
  "united arab emirates": [
    "united arab emirates", "uae", "u a e", "dubai", "abu dhabi", "sharjah",
  ],
  india: [
    "india", "indian", "bangalore", "bengaluru", "mumbai", "delhi",
    "new delhi", "gurgaon", "gurugram", "hyderabad", "chennai", "pune",
    "kolkata", "ahmedabad", "noida", "maharashtra", "karnataka",
    "tamil nadu", "telangana", "gujarat",
  ],
  germany: [
    "germany", "german", "deutschland", "berlin", "munich", "munchen",
    "hamburg", "frankfurt", "cologne", "koln", "stuttgart",
  ],
  france: [
    "france", "french", "paris", "lyon", "marseille", "toulouse", "ile de france",
  ],
  netherlands: [
    "netherlands", "dutch", "holland", "amsterdam", "rotterdam", "the hague",
    "utrecht", "eindhoven",
  ],
  spain: ["spain", "spanish", "espana", "madrid", "barcelona", "valencia", "seville"],
  italy: ["italy", "italian", "italia", "rome", "milan", "milano", "turin", "naples"],
  switzerland: [
    "switzerland", "swiss", "zurich", "geneva", "basel", "bern", "lausanne",
  ],
  sweden: ["sweden", "swedish", "stockholm", "gothenburg", "malmo"],
  norway: ["norway", "norwegian", "oslo", "bergen"],
  denmark: ["denmark", "danish", "copenhagen", "aarhus"],
  finland: ["finland", "finnish", "helsinki", "espoo"],
  poland: ["poland", "polish", "warsaw", "krakow", "wroclaw", "gdansk"],
  portugal: ["portugal", "portuguese", "lisbon", "porto"],
  belgium: ["belgium", "belgian", "brussels", "antwerp", "ghent"],
  austria: ["austria", "austrian", "vienna", "salzburg", "graz"],
  israel: ["israel", "israeli", "tel aviv", "jerusalem", "haifa"],
  japan: ["japan", "japanese", "tokyo", "osaka", "yokohama", "kyoto"],
  "south korea": ["south korea", "korea", "korean", "seoul", "busan"],
  brazil: ["brazil", "brazilian", "brasil", "sao paulo", "rio de janeiro"],
  mexico: ["mexico", "mexican", "mexico city", "guadalajara", "monterrey"],
  "south africa": [
    "south africa", "south african", "johannesburg", "cape town", "durban",
  ],
};

// Multi-country regions users pick from LOCATION_SUGGESTIONS. Each expands to
// the union of member-country alias lists so "North America" keeps US + Canada
// leads without requiring every state to be listed twice here.
const REGION_COUNTRIES: Record<string, string[]> = {
  "north america": ["united states", "canada", "mexico"],
  europe: [
    "united kingdom", "ireland", "germany", "france", "netherlands", "spain",
    "italy", "switzerland", "sweden", "norway", "denmark", "finland", "poland",
    "portugal", "belgium", "austria",
  ],
  "western europe": [
    "united kingdom", "ireland", "germany", "france", "netherlands", "spain",
    "italy", "switzerland", "portugal", "belgium", "austria",
  ],
  "eastern europe": ["poland"],
  nordics: ["sweden", "norway", "denmark", "finland"],
  benelux: ["belgium", "netherlands"],
  dach: ["germany", "austria", "switzerland"],
  emea: [
    "united kingdom", "ireland", "germany", "france", "netherlands", "spain",
    "italy", "switzerland", "sweden", "norway", "denmark", "finland", "poland",
    "portugal", "belgium", "austria", "united arab emirates", "israel",
    "south africa",
  ],
  apac: [
    "australia", "new zealand", "singapore", "india", "japan", "south korea",
  ],
  "southeast asia": ["singapore"],
  latam: ["brazil", "mexico"],
  mena: ["united arab emirates", "israel"],
};

// The set of match phrases for one target: its country-alias list if we know
// the country, a region expansion if it's a multi-country region, otherwise
// the target string itself (covers a specific metro the user typed).
function aliasesForTarget(target: string): string[] {
  const key = canonical(target);
  if (!key) return [];

  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];

  if (REGION_COUNTRIES[key]) {
    const phrases = new Set<string>();
    for (const country of REGION_COUNTRIES[key]) {
      for (const alias of COUNTRY_ALIASES[country] || [country]) {
        phrases.add(alias);
      }
    }
    return Array.from(phrases);
  }

  // Reverse lookup: user typed "US", "USA", "London", "Bengaluru", etc.
  for (const aliases of Object.values(COUNTRY_ALIASES)) {
    if (aliases.some((alias) => canonical(alias) === key)) {
      return aliases;
    }
  }

  return [target];
}

// Expand region targets ("EMEA", "APAC") into concrete country names for
// LinkedIn's location parameter lookup, which only understands real places.
// Countries, metros, and anything else pass through unchanged.
export function searchableLocationNames(targets: string[]): string[] {
  const names = new Set<string>();
  for (const target of targets) {
    const key = canonical(target);
    if (!key) continue;
    for (const name of REGION_COUNTRIES[key] || [target.trim()]) {
      names.add(name);
    }
  }
  return Array.from(names);
}

// Target locations for an agent: the agent's own filters take precedence, with
// the workspace product profile's preferred locations as the fallback so a
// signals-mode agent (which has no filters set) still inherits a global target.
export function agentTargetLocations(agent: Agent, profile: ProductProfile | null): string[] {
  const own = agent.filters?.locations?.filter((value) => value.trim()) ?? [];
  if (own.length) return own;
  return profile?.preferredLocations?.filter((value) => value.trim()) ?? [];
}

// True if this lead should be kept for the given target locations. No targets
// => keep everything (feature off). Blank/unknown location => keep (allow
// unknown). Otherwise keep only when the location matches a target's aliases.
export function matchesTargetLocation(
  location: string | undefined,
  targets: string[],
): boolean {
  if (!targets.length) return true;
  const haystack = canonical(location || "");
  if (!haystack) return true;

  for (const target of targets) {
    for (const alias of aliasesForTarget(target)) {
      if (containsPhrase(haystack, alias)) return true;
    }
  }
  return false;
}

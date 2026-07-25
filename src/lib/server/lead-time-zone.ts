// Which clock a send window is measured against.
//
// The send window exists to protect the *recipient* - "don't land in someone's
// notifications at 3am" - so it has to be read in the lead's local time, not
// the workspace's. A Bengaluru workspace running a 9-6 business window at US
// leads was, before this, sending at 9am IST = 11:30pm ET the previous night:
// exactly the behaviour the window was added to prevent.
//
// The only location signal we have is the lead's free-text LinkedIn location
// ("San Francisco Bay Area", "Greater London", "Bengaluru, Karnataka, India"),
// so this resolves that string to an IANA zone. Resolution is country-first:
// most countries are a single zone, so naming the country answers the question
// outright, and the metro/state tables below only ever have to disambiguate
// *within* the handful of countries that span several zones. That ordering is
// what keeps "Cambridge, England" out of Boston and "San Jose, Costa Rica" out
// of California. Anything we can't place returns null and the caller falls back
// to the workspace zone, which is the pre-existing behaviour.

// Extension-qualified so this module resolves under `node --test`'s type
// stripping as well as the bundler - same as runtime-mode.ts's importers.
import { COUNTRY_ALIASES, canonical, containsPhrase } from "./geo.ts";

// Every country we can place, and the zone to use when nothing narrower is
// known. For the multi-zone countries below this is their commercial centre,
// which is the best available guess once the narrower tables have missed.
const COUNTRY_ZONES: Record<string, string> = {
  "united states": "America/New_York",
  canada: "America/Toronto",
  "united kingdom": "Europe/London",
  ireland: "Europe/Dublin",
  australia: "Australia/Sydney",
  "new zealand": "Pacific/Auckland",
  singapore: "Asia/Singapore",
  "hong kong": "Asia/Hong_Kong",
  malaysia: "Asia/Kuala_Lumpur",
  thailand: "Asia/Bangkok",
  vietnam: "Asia/Ho_Chi_Minh",
  philippines: "Asia/Manila",
  indonesia: "Asia/Jakarta",
  "united arab emirates": "Asia/Dubai",
  "saudi arabia": "Asia/Riyadh",
  qatar: "Asia/Qatar",
  india: "Asia/Kolkata",
  pakistan: "Asia/Karachi",
  bangladesh: "Asia/Dhaka",
  "sri lanka": "Asia/Colombo",
  china: "Asia/Shanghai",
  taiwan: "Asia/Taipei",
  japan: "Asia/Tokyo",
  "south korea": "Asia/Seoul",
  germany: "Europe/Berlin",
  france: "Europe/Paris",
  netherlands: "Europe/Amsterdam",
  belgium: "Europe/Brussels",
  luxembourg: "Europe/Luxembourg",
  spain: "Europe/Madrid",
  portugal: "Europe/Lisbon",
  italy: "Europe/Rome",
  switzerland: "Europe/Zurich",
  austria: "Europe/Vienna",
  sweden: "Europe/Stockholm",
  norway: "Europe/Oslo",
  denmark: "Europe/Copenhagen",
  finland: "Europe/Helsinki",
  iceland: "Atlantic/Reykjavik",
  estonia: "Europe/Tallinn",
  latvia: "Europe/Riga",
  lithuania: "Europe/Vilnius",
  poland: "Europe/Warsaw",
  "czech republic": "Europe/Prague",
  slovakia: "Europe/Bratislava",
  hungary: "Europe/Budapest",
  romania: "Europe/Bucharest",
  bulgaria: "Europe/Sofia",
  greece: "Europe/Athens",
  croatia: "Europe/Zagreb",
  serbia: "Europe/Belgrade",
  slovenia: "Europe/Ljubljana",
  ukraine: "Europe/Kyiv",
  turkey: "Europe/Istanbul",
  russia: "Europe/Moscow",
  israel: "Asia/Jerusalem",
  egypt: "Africa/Cairo",
  kenya: "Africa/Nairobi",
  nigeria: "Africa/Lagos",
  ghana: "Africa/Accra",
  morocco: "Africa/Casablanca",
  "south africa": "Africa/Johannesburg",
  brazil: "America/Sao_Paulo",
  mexico: "America/Mexico_City",
  argentina: "America/Argentina/Buenos_Aires",
  chile: "America/Santiago",
  colombia: "America/Bogota",
  peru: "America/Lima",
  uruguay: "America/Montevideo",
  "costa rica": "America/Costa_Rica",
  panama: "America/Panama",
};

// Names and demonyms that identify a country but aren't its key above. Metros
// and states come free from geo.ts's COUNTRY_ALIASES, which already carries
// them for lead discovery; these fill in the forms that list doesn't have.
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "united states of america": "united states",
  usa: "united states",
  "u s a": "united states",
  america: "united states",
  canadian: "canada",
  uk: "united kingdom",
  "u k": "united kingdom",
  britain: "united kingdom",
  "great britain": "united kingdom",
  british: "united kingdom",
  england: "united kingdom",
  scotland: "united kingdom",
  wales: "united kingdom",
  "northern ireland": "united kingdom",
  irish: "ireland",
  australian: "australia",
  uae: "united arab emirates",
  "u a e": "united arab emirates",
  indian: "india",
  japanese: "japan",
  korea: "south korea",
  korean: "south korea",
  german: "germany",
  deutschland: "germany",
  french: "france",
  dutch: "netherlands",
  holland: "netherlands",
  belgian: "belgium",
  spanish: "spain",
  espana: "spain",
  portuguese: "portugal",
  italian: "italy",
  italia: "italy",
  swiss: "switzerland",
  austrian: "austria",
  swedish: "sweden",
  norwegian: "norway",
  danish: "denmark",
  finnish: "finland",
  polish: "poland",
  czechia: "czech republic",
  israeli: "israel",
  "south african": "south africa",
  brazilian: "brazil",
  brasil: "brazil",
  mexican: "mexico",
};

type CountrySubzones = {
  // Metros whose zone differs from the country default.
  cities?: Record<string, string>;
  // States, provinces and territories.
  regions?: Record<string, string>;
  // Postal abbreviations. Kept per-country because two letters collide freely
  // across countries ("WA" is Washington and Western Australia both).
  codes?: Record<string, string>;
};

// Only countries that actually span zones need narrowing. Everything else is
// answered by COUNTRY_ZONES alone.
const SUBZONES: Record<string, CountrySubzones> = {
  "united states": {
    cities: {
      // Eastern
      "new york": "America/New_York",
      "new york city": "America/New_York",
      nyc: "America/New_York",
      brooklyn: "America/New_York",
      boston: "America/New_York",
      cambridge: "America/New_York",
      philadelphia: "America/New_York",
      pittsburgh: "America/New_York",
      atlanta: "America/New_York",
      miami: "America/New_York",
      "fort lauderdale": "America/New_York",
      tampa: "America/New_York",
      orlando: "America/New_York",
      jacksonville: "America/New_York",
      charlotte: "America/New_York",
      raleigh: "America/New_York",
      durham: "America/New_York",
      richmond: "America/New_York",
      baltimore: "America/New_York",
      "washington dc": "America/New_York",
      "washington d c": "America/New_York",
      "district of columbia": "America/New_York",
      detroit: "America/New_York",
      cleveland: "America/New_York",
      columbus: "America/New_York",
      cincinnati: "America/New_York",
      indianapolis: "America/Indiana/Indianapolis",
      louisville: "America/New_York",
      buffalo: "America/New_York",
      hartford: "America/New_York",
      providence: "America/New_York",
      // Central
      chicago: "America/Chicago",
      dallas: "America/Chicago",
      "fort worth": "America/Chicago",
      houston: "America/Chicago",
      austin: "America/Chicago",
      "san antonio": "America/Chicago",
      nashville: "America/Chicago",
      memphis: "America/Chicago",
      "new orleans": "America/Chicago",
      "kansas city": "America/Chicago",
      minneapolis: "America/Chicago",
      "st paul": "America/Chicago",
      "st louis": "America/Chicago",
      "saint louis": "America/Chicago",
      milwaukee: "America/Chicago",
      madison: "America/Chicago",
      "oklahoma city": "America/Chicago",
      tulsa: "America/Chicago",
      omaha: "America/Chicago",
      "des moines": "America/Chicago",
      // Mountain / Arizona
      denver: "America/Denver",
      boulder: "America/Denver",
      "colorado springs": "America/Denver",
      "salt lake city": "America/Denver",
      albuquerque: "America/Denver",
      boise: "America/Denver",
      phoenix: "America/Phoenix",
      scottsdale: "America/Phoenix",
      tempe: "America/Phoenix",
      tucson: "America/Phoenix",
      mesa: "America/Phoenix",
      // Pacific and beyond
      "san francisco": "America/Los_Angeles",
      "bay area": "America/Los_Angeles",
      "silicon valley": "America/Los_Angeles",
      "palo alto": "America/Los_Angeles",
      "mountain view": "America/Los_Angeles",
      sunnyvale: "America/Los_Angeles",
      cupertino: "America/Los_Angeles",
      "santa clara": "America/Los_Angeles",
      "san mateo": "America/Los_Angeles",
      "san jose": "America/Los_Angeles",
      oakland: "America/Los_Angeles",
      berkeley: "America/Los_Angeles",
      "los angeles": "America/Los_Angeles",
      "santa monica": "America/Los_Angeles",
      pasadena: "America/Los_Angeles",
      irvine: "America/Los_Angeles",
      "long beach": "America/Los_Angeles",
      "san diego": "America/Los_Angeles",
      sacramento: "America/Los_Angeles",
      fresno: "America/Los_Angeles",
      "las vegas": "America/Los_Angeles",
      reno: "America/Los_Angeles",
      seattle: "America/Los_Angeles",
      bellevue: "America/Los_Angeles",
      redmond: "America/Los_Angeles",
      tacoma: "America/Los_Angeles",
      spokane: "America/Los_Angeles",
      portland: "America/Los_Angeles",
      eugene: "America/Los_Angeles",
      anchorage: "America/Anchorage",
      honolulu: "Pacific/Honolulu",
    },
    regions: {
      alabama: "America/Chicago",
      alaska: "America/Anchorage",
      arizona: "America/Phoenix",
      arkansas: "America/Chicago",
      california: "America/Los_Angeles",
      colorado: "America/Denver",
      connecticut: "America/New_York",
      delaware: "America/New_York",
      florida: "America/New_York",
      georgia: "America/New_York",
      hawaii: "Pacific/Honolulu",
      idaho: "America/Denver",
      illinois: "America/Chicago",
      indiana: "America/Indiana/Indianapolis",
      iowa: "America/Chicago",
      kansas: "America/Chicago",
      kentucky: "America/New_York",
      louisiana: "America/Chicago",
      maine: "America/New_York",
      maryland: "America/New_York",
      massachusetts: "America/New_York",
      michigan: "America/New_York",
      minnesota: "America/Chicago",
      mississippi: "America/Chicago",
      missouri: "America/Chicago",
      montana: "America/Denver",
      nebraska: "America/Chicago",
      nevada: "America/Los_Angeles",
      "new hampshire": "America/New_York",
      "new jersey": "America/New_York",
      "new mexico": "America/Denver",
      "north carolina": "America/New_York",
      "north dakota": "America/Chicago",
      ohio: "America/New_York",
      oklahoma: "America/Chicago",
      oregon: "America/Los_Angeles",
      pennsylvania: "America/New_York",
      "rhode island": "America/New_York",
      "south carolina": "America/New_York",
      "south dakota": "America/Chicago",
      tennessee: "America/Chicago",
      texas: "America/Chicago",
      utah: "America/Denver",
      vermont: "America/New_York",
      virginia: "America/New_York",
      washington: "America/Los_Angeles",
      "west virginia": "America/New_York",
      wisconsin: "America/Chicago",
      wyoming: "America/Denver",
    },
    // Codes that are also ordinary English words ("in", "or", "me", "la",
    // "ok", "hi", "co") are left out: matching them inside a location string
    // costs more than the leads they would place.
    codes: {
      al: "America/Chicago", ak: "America/Anchorage", az: "America/Phoenix",
      ar: "America/Chicago", ca: "America/Los_Angeles", ct: "America/New_York",
      dc: "America/New_York", fl: "America/New_York", ga: "America/New_York",
      il: "America/Chicago", ks: "America/Chicago", ky: "America/New_York",
      md: "America/New_York", mi: "America/New_York", mn: "America/Chicago",
      ms: "America/Chicago", mo: "America/Chicago", mt: "America/Denver",
      nv: "America/Los_Angeles", nh: "America/New_York", nj: "America/New_York",
      nm: "America/Denver", ny: "America/New_York", nc: "America/New_York",
      nd: "America/Chicago", pa: "America/New_York", ri: "America/New_York",
      sc: "America/New_York", sd: "America/Chicago", tn: "America/Chicago",
      tx: "America/Chicago", ut: "America/Denver", vt: "America/New_York",
      va: "America/New_York", wa: "America/Los_Angeles", wv: "America/New_York",
      wi: "America/Chicago", wy: "America/Denver",
    },
  },
  canada: {
    cities: {
      toronto: "America/Toronto",
      mississauga: "America/Toronto",
      ottawa: "America/Toronto",
      montreal: "America/Toronto",
      "quebec city": "America/Toronto",
      winnipeg: "America/Winnipeg",
      regina: "America/Regina",
      saskatoon: "America/Regina",
      calgary: "America/Edmonton",
      edmonton: "America/Edmonton",
      vancouver: "America/Vancouver",
      burnaby: "America/Vancouver",
      victoria: "America/Vancouver",
      halifax: "America/Halifax",
      "st johns": "America/St_Johns",
    },
    regions: {
      ontario: "America/Toronto",
      quebec: "America/Toronto",
      "nova scotia": "America/Halifax",
      "new brunswick": "America/Halifax",
      "prince edward island": "America/Halifax",
      newfoundland: "America/St_Johns",
      manitoba: "America/Winnipeg",
      saskatchewan: "America/Regina",
      alberta: "America/Edmonton",
      "british columbia": "America/Vancouver",
    },
    codes: {
      on: "America/Toronto", qc: "America/Toronto", ns: "America/Halifax",
      nb: "America/Halifax", pe: "America/Halifax", nl: "America/St_Johns",
      mb: "America/Winnipeg", sk: "America/Regina", ab: "America/Edmonton",
      bc: "America/Vancouver",
    },
  },
  australia: {
    cities: {
      sydney: "Australia/Sydney",
      canberra: "Australia/Sydney",
      newcastle: "Australia/Sydney",
      melbourne: "Australia/Melbourne",
      geelong: "Australia/Melbourne",
      brisbane: "Australia/Brisbane",
      "gold coast": "Australia/Brisbane",
      cairns: "Australia/Brisbane",
      perth: "Australia/Perth",
      adelaide: "Australia/Adelaide",
      hobart: "Australia/Hobart",
      darwin: "Australia/Darwin",
    },
    regions: {
      "new south wales": "Australia/Sydney",
      "australian capital territory": "Australia/Sydney",
      victoria: "Australia/Melbourne",
      queensland: "Australia/Brisbane",
      "western australia": "Australia/Perth",
      "south australia": "Australia/Adelaide",
      tasmania: "Australia/Hobart",
      "northern territory": "Australia/Darwin",
    },
    codes: {
      nsw: "Australia/Sydney", act: "Australia/Sydney",
      vic: "Australia/Melbourne", qld: "Australia/Brisbane",
      wa: "Australia/Perth", sa: "Australia/Adelaide",
      tas: "Australia/Hobart", nt: "Australia/Darwin",
    },
  },
  brazil: {
    cities: {
      "sao paulo": "America/Sao_Paulo",
      "rio de janeiro": "America/Sao_Paulo",
      "belo horizonte": "America/Sao_Paulo",
      brasilia: "America/Sao_Paulo",
      curitiba: "America/Sao_Paulo",
      "porto alegre": "America/Sao_Paulo",
      recife: "America/Recife",
      fortaleza: "America/Fortaleza",
      salvador: "America/Bahia",
      manaus: "America/Manaus",
    },
  },
  mexico: {
    cities: {
      "mexico city": "America/Mexico_City",
      guadalajara: "America/Mexico_City",
      monterrey: "America/Monterrey",
      tijuana: "America/Tijuana",
      cancun: "America/Cancun",
    },
  },
  russia: {
    cities: {
      moscow: "Europe/Moscow",
      "saint petersburg": "Europe/Moscow",
      "st petersburg": "Europe/Moscow",
      novosibirsk: "Asia/Novosibirsk",
      yekaterinburg: "Asia/Yekaterinburg",
    },
  },
  indonesia: {
    cities: {
      jakarta: "Asia/Jakarta",
      bandung: "Asia/Jakarta",
      surabaya: "Asia/Jakarta",
      bali: "Asia/Makassar",
      denpasar: "Asia/Makassar",
    },
  },
};

// Longest phrase first, so "new york" beats "york" and "south australia" beats
// "australia" within one table.
function sortedKeys(table: Record<string, string>) {
  return Object.keys(table).sort((a, b) => b.length - a.length);
}

function firstMatch(haystack: string, table: Record<string, string> | undefined) {
  if (!table) return undefined;
  for (const key of sortedKeys(table)) {
    if (containsPhrase(haystack, key)) return table[key];
  }
  return undefined;
}

// phrase -> country key, for identifying which country a location names. Built
// from the country names themselves, the demonyms above, and geo.ts's alias
// lists, which already enumerate each country's states and major metros.
const COUNTRY_LOOKUP: Record<string, string> = (() => {
  const lookup: Record<string, string> = {};
  for (const country of Object.keys(COUNTRY_ZONES)) lookup[country] = country;
  for (const [alias, country] of Object.entries(COUNTRY_NAME_ALIASES)) {
    lookup[alias] = country;
  }
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (!COUNTRY_ZONES[country]) continue;
    for (const alias of aliases) {
      const key = canonical(alias);
      // Two-letter aliases are too collision-prone to identify a country on
      // their own - geo.ts lists "SA"/"WA" for Australia, which are equally
      // South Australia and the US states they abbreviate. They stay in the
      // per-country `codes` tables, where a country is already established.
      if (key.length <= 2 || lookup[key]) continue;
      lookup[key] = country;
    }
  }
  return lookup;
})();

const COUNTRY_LOOKUP_KEYS = Object.keys(COUNTRY_LOOKUP).sort((a, b) => b.length - a.length);

function detectCountry(haystack: string) {
  for (const key of COUNTRY_LOOKUP_KEYS) {
    if (containsPhrase(haystack, key)) return COUNTRY_LOOKUP[key];
  }
  return undefined;
}

// Last resort for a location that names no country at all ("Boise", "Greater
// Seattle Area"): try every multi-zone country's metros, most specific first.
// Ordered so the largest market wins a genuine tie.
const UNSCOPED_ORDER = ["united states", "canada", "australia", "brazil", "mexico", "russia", "indonesia"];

function resolveWithoutCountry(haystack: string) {
  for (const country of UNSCOPED_ORDER) {
    const hit = firstMatch(haystack, SUBZONES[country]?.cities);
    if (hit) return hit;
  }
  for (const country of UNSCOPED_ORDER) {
    const hit = firstMatch(haystack, SUBZONES[country]?.regions);
    if (hit) return hit;
  }
  // US postal codes only: with no country named, "WA" is far likelier to be
  // Washington than Western Australia.
  return firstMatch(haystack, SUBZONES["united states"].codes);
}

// Resolution is memoised on the raw location string: the tick resolves the same
// handful of locations over and over, and the tables are static.
const resolutionCache = new Map<string, string | null>();
const RESOLUTION_CACHE_LIMIT = 2000;

/**
 * The lead's IANA timezone, or null when their location is blank or names
 * nowhere we recognise. Never throws - an unrecognised location is the normal
 * case for an unenriched profile, not an error.
 */
export function resolveLeadTimeZone(location: string | undefined): string | null {
  const raw = location?.trim() || "";
  if (!raw) return null;

  const cached = resolutionCache.get(raw);
  if (cached !== undefined) return cached;

  const haystack = canonical(raw);
  let zone: string | null = null;

  if (haystack) {
    const country = detectCountry(haystack);
    if (!country) {
      zone = resolveWithoutCountry(haystack) || null;
    } else {
      const subzones = SUBZONES[country];
      zone =
        firstMatch(haystack, subzones?.cities) ||
        firstMatch(haystack, subzones?.regions) ||
        firstMatch(haystack, subzones?.codes) ||
        COUNTRY_ZONES[country] ||
        null;
    }
  }

  // Bounded so a workspace with tens of thousands of distinct locations can't
  // grow this without limit across a long-lived process.
  if (resolutionCache.size >= RESOLUTION_CACHE_LIMIT) resolutionCache.clear();
  resolutionCache.set(raw, zone);
  return zone;
}

/**
 * The zone a send window should be measured in for this lead: their own, with
 * the workspace's as the fallback for leads we can't place. Callers pass the
 * result straight to the planner.
 */
export function sendWindowTimeZoneForLead(
  location: string | undefined,
  workspaceTimeZone: string | undefined,
): string | undefined {
  return resolveLeadTimeZone(location) || workspaceTimeZone;
}

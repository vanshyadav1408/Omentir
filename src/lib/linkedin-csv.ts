export type CsvLinkedInLead = {
  linkedInUrl: string;
  name: string;
  title: string;
  company: string;
  location: string;
};

export type ParsedLinkedInLeadCsv = {
  leads: CsvLinkedInLead[];
  skipped: number;
};

export const LINKEDIN_CSV_MAX_BYTES = 1_000_000;
const MAX_UNIQUE_LEADS = 500;

function headerKey(value: string) {
  return value.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(csv: string) {
  let comma = 0;
  let semicolon = 0;
  let tab = 0;
  let quoted = false;
  const sample = csv.slice(0, 8000);
  for (let index = 0; index < sample.length; index += 1) {
    const char = sample[index];
    if (char === '"') {
      if (quoted && sample[index + 1] === '"') {
        index += 1;
        continue;
      }
      quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (char === ",") comma += 1;
    else if (char === ";") semicolon += 1;
    else if (char === "\t") tab += 1;
  }
  if (tab > comma && tab >= semicolon) return "\t";
  if (semicolon > comma) return ";";
  return ",";
}

function parseRows(csv: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const URL_HEADER_ALIASES = new Set([
  "linkedinurl",
  "linkedinprofileurl",
  "profileurl",
  "linkedin",
  "personlinkedinurl",
  "personlinkedinprofile",
  "linkedinprofile",
  "profilelink",
  "linkedinlink",
  "leadlinkedinurl",
  "memberurl",
  "personurl",
]);

const WEAK_URL_HEADERS = new Set(["url", "profile", "link", "website"]);

function isCompanyishHeader(header: string) {
  return /(company|account|organization|employer)/.test(header);
}

function namedUrlColumnIndex(headers: string[]) {
  const exact = headers.findIndex((header) => URL_HEADER_ALIASES.has(header));
  if (exact >= 0) return exact;
  return headers.findIndex(
    (header) =>
      header.includes("linkedin") &&
      /url|profile|link/.test(header) &&
      !isCompanyishHeader(header),
  );
}

function personProfileUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return "";
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return "";
  if (!/^\/(in|pub)\//i.test(parsed.pathname)) return "";
  return `https://www.linkedin.com${parsed.pathname.replace(/\/$/, "")}`;
}

function urlColumnByValues(rows: string[][], startRow: number) {
  if (!rows.length) return -1;
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  let bestIndex = -1;
  let bestCount = 0;
  for (let column = 0; column < width; column += 1) {
    let count = 0;
    for (let row = startRow; row < rows.length; row += 1) {
      if (personProfileUrl(rows[row]?.[column] || "")) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      bestIndex = column;
    }
  }
  return bestCount > 0 ? bestIndex : -1;
}

function resolveHeaderAndUrlColumn(rows: string[][]) {
  const scan = Math.min(10, rows.length);
  for (let index = 0; index < scan; index += 1) {
    // A dumped list of profile URLs has no header. Treating the first URL as
    // a column name used to drop that person because "https" matches "url".
    if (rows[index].some((cell) => personProfileUrl(cell))) continue;
    const headers = rows[index].map(headerKey);
    const named = namedUrlColumnIndex(headers);
    if (named >= 0) return { headerRow: index, urlIndex: named };
    const weak = headers.findIndex(
      (header) => WEAK_URL_HEADERS.has(header) && !isCompanyishHeader(header),
    );
    if (weak >= 0) {
      const detected = urlColumnByValues(rows, index + 1);
      return { headerRow: index, urlIndex: detected >= 0 ? detected : weak };
    }
  }

  const detected = urlColumnByValues(rows, 0);
  if (detected < 0) throw new Error('Add a "LinkedIn URL" column to the CSV.');
  if (personProfileUrl(rows[0][detected] || "")) {
    return { headerRow: -1, urlIndex: detected };
  }
  return { headerRow: 0, urlIndex: detected };
}

export function decodeCsvBytes(bytes: Uint8Array) {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export function parseLinkedInLeadCsv(csv: string): ParsedLinkedInLeadCsv {
  if (!csv.trim()) throw new Error("Choose a CSV file with LinkedIn profiles.");
  if (csv.length > LINKEDIN_CSV_MAX_BYTES) {
    throw new Error("CSV files must be smaller than 1 MB.");
  }
  const rows = parseRows(csv, detectDelimiter(csv));
  if (!rows.length) throw new Error("The CSV must contain a header and at least one lead.");

  const { headerRow, urlIndex } = resolveHeaderAndUrlColumn(rows);
  const headers = headerRow >= 0 ? rows[headerRow].map(headerKey) : [];
  const find = (...aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
  const nameIndex = find("name", "fullname", "contactname", "leadname");
  const firstNameIndex = find("firstname");
  const lastNameIndex = find("lastname");
  const titleIndex = find("title", "jobtitle", "headline", "position", "currenttitle");
  const companyIndex = find("company", "companyname", "accountname", "organization");
  const locationIndex = find("location");
  const dataRows = headerRow >= 0 ? rows.slice(headerRow + 1) : rows;
  if (!dataRows.length) throw new Error("The CSV must contain a header and at least one lead.");

  const seen = new Set<string>();
  const leads: CsvLinkedInLead[] = [];
  let skipped = 0;
  for (const row of dataRows) {
    const linkedInUrl = personProfileUrl(row[urlIndex] || "");
    if (!linkedInUrl) {
      if (row.some(Boolean)) skipped += 1;
      continue;
    }
    if (seen.has(linkedInUrl.toLowerCase())) continue;
    seen.add(linkedInUrl.toLowerCase());
    const name =
      nameIndex >= 0
        ? row[nameIndex] || ""
        : [row[firstNameIndex] || "", row[lastNameIndex] || ""].filter(Boolean).join(" ");
    leads.push({
      linkedInUrl,
      name: name.trim() || "LinkedIn member",
      title: titleIndex >= 0 ? row[titleIndex] || "" : "",
      company: companyIndex >= 0 ? row[companyIndex] || "" : "",
      location: locationIndex >= 0 ? row[locationIndex] || "" : "",
    });
    if (leads.length > MAX_UNIQUE_LEADS) {
      throw new Error("A CSV can contain at most 500 unique leads.");
    }
  }

  if (!leads.length) {
    throw new Error(
      skipped
        ? "Need public LinkedIn profile URLs (linkedin.com/in/...). Company pages and Sales Navigator links are skipped."
        : "The CSV does not contain any LinkedIn profiles.",
    );
  }
  return { leads, skipped };
}

export type CsvLinkedInLead = { linkedInUrl: string; name: string; title: string; company: string; location: string };

function parseRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const headerKey = (value: string) => value.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function parseLinkedInLeadCsv(csv: string): CsvLinkedInLead[] {
  if (!csv.trim()) throw new Error("Choose a CSV file with LinkedIn profiles.");
  if (csv.length > 1_000_000) throw new Error("CSV files must be smaller than 1 MB.");
  const rows = parseRows(csv);
  if (rows.length < 2) throw new Error("The CSV must contain a header and at least one lead.");
  const headers = rows[0].map(headerKey);
  const find = (...aliases: string[]) => headers.findIndex((header) => aliases.includes(header));
  const urlIndex = find("linkedinurl", "linkedinprofileurl", "profileurl", "linkedin");
  if (urlIndex < 0) throw new Error('Add a "LinkedIn URL" column to the CSV.');
  const nameIndex = find("name", "fullname"), firstNameIndex = find("firstname"), lastNameIndex = find("lastname");
  const titleIndex = find("title", "jobtitle", "headline"), companyIndex = find("company", "companyname"), locationIndex = find("location");
  const seen = new Set<string>(), leads: CsvLinkedInLead[] = [];
  for (const [offset, row] of rows.slice(1).entries()) {
    const rawUrl = row[urlIndex]?.trim() || "";
    let parsed: URL;
    try { parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`); }
    catch { throw new Error(`Row ${offset + 2} has an invalid LinkedIn URL.`); }
    const host = parsed.hostname.toLowerCase();
    if ((host !== "linkedin.com" && !host.endsWith(".linkedin.com")) || !/^\/(in|pub)\//i.test(parsed.pathname)) {
      throw new Error(`Row ${offset + 2} must contain a LinkedIn person profile URL.`);
    }
    const linkedInUrl = `https://www.linkedin.com${parsed.pathname.replace(/\/$/, "")}`;
    if (seen.has(linkedInUrl.toLowerCase())) continue;
    seen.add(linkedInUrl.toLowerCase());
    const name = nameIndex >= 0 ? row[nameIndex] || "" : [row[firstNameIndex] || "", row[lastNameIndex] || ""].filter(Boolean).join(" ");
    leads.push({ linkedInUrl, name: name.trim() || "LinkedIn member", title: titleIndex >= 0 ? row[titleIndex] || "" : "", company: companyIndex >= 0 ? row[companyIndex] || "" : "", location: locationIndex >= 0 ? row[locationIndex] || "" : "" });
    if (leads.length > 500) throw new Error("A CSV can contain at most 500 unique leads.");
  }
  if (!leads.length) throw new Error("The CSV does not contain any LinkedIn profiles.");
  return leads;
}

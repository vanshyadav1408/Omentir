import { spawnSync } from "node:child_process";

const baseline = { errors: 50, warnings: 8 };
const result = spawnSync("npx", ["eslint", ".", "--format", "json"], {
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
});

if (result.error) throw result.error;

let reports;
try {
  reports = JSON.parse(result.stdout || "[]");
} catch {
  process.stderr.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(1);
}

const totals = reports.reduce(
  (sum, report) => ({
    errors: sum.errors + report.errorCount,
    warnings: sum.warnings + report.warningCount,
  }),
  { errors: 0, warnings: 0 },
);

console.log(`Lint baseline: ${totals.errors} errors, ${totals.warnings} warnings.`);
if (totals.errors > baseline.errors || totals.warnings > baseline.warnings) {
  console.error(`Lint regression. Baseline allows at most ${baseline.errors} errors and ${baseline.warnings} warnings.`);
  process.exit(1);
}

/**
 * Hosted Omentir product identity.
 *
 * One codebase runs both the managed product (omentir.com) and self-hosted
 * installs (`RUN_LOCALLY=TRUE`). That is intentional.
 *
 * - Hosted mode uses these defaults for public brand, support, and hosted-only
 *   mail (signup welcome, contact form, founder notifications). They are not
 *   secrets - the same addresses appear on the public website.
 * - Production can override any value with env vars without a code change.
 * - Local mode must never depend on these for correctness. Marketing and
 *   hosted mail are gated off; transactional mail uses the operator's own
 *   `RESEND_FROM_EMAIL` only.
 *
 * Do not "scrub" these for open source. Removing them would break the hosted
 * product or force a second codebase. Gate by mode instead.
 */

function envOr(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

/** Public customer support / feedback address. */
export function hostedSupportEmail() {
  return envOr("HOSTED_SUPPORT_EMAIL", "hi@omentir.com");
}

/** Primary founder/ops contact shown on marketing and in-app contact. */
export function hostedContactEmail() {
  return envOr("HOSTED_CONTACT_EMAIL", "vansh@omentir.com");
}

/** Default From for operational (transactional) mail when Resend is configured. */
export function hostedTransactionalFrom() {
  return envOr("RESEND_FROM_EMAIL", "Omentir <notifications@omentir.com>");
}

/** Hosted-only: contact form sender. */
export function hostedContactFormFrom() {
  return envOr("HOSTED_CONTACT_FORM_FROM", "Omentir Contact <contact-page@omentir.com>");
}

/** Hosted-only: contact form inbox. */
export function hostedContactFormTo() {
  return envOr("HOSTED_CONTACT_FORM_TO", hostedContactEmail());
}

/** Hosted-only: new-signup internal notification From. */
export function hostedNewSignupFrom() {
  return envOr("HOSTED_NEW_SIGNUP_FROM", "Omentir New User <new-user@omentir.com>");
}

/** Hosted-only: new-signup internal notification To. */
export function hostedNewSignupTo() {
  return envOr("HOSTED_NEW_SIGNUP_TO", "notifications@omentir.com");
}

/** Hosted-only: marketing welcome From. */
export function hostedWelcomeFrom() {
  return envOr("HOSTED_WELCOME_FROM", "Vansh from Omentir <hi@omentir.com>");
}

/** Public source repository, shown in marketing as `owner/name`. */
export function hostedGithubRepo() {
  return envOr("HOSTED_GITHUB_REPO", "vanshyadav1408/Omentir");
}

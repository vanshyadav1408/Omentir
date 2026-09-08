// Keep this in lockstep with the Product users / Product pages tiles in PostHog.
export const PRODUCT_APP_PATH_REGEX =
  "^/(agents|leads|campaigns|settings|messages|activity|dashboard|overview|actions|onboarding|api-keys|my-product)";

export function isProductAppPath(pathname: string): boolean {
  return new RegExp(PRODUCT_APP_PATH_REGEX).test(pathname);
}

export function skipStaticParamsOnVpsSidecar(): boolean {
  // production-build.sh sets NEXT_DIST_DIR only for the VPS sidecar compile.
  // That compile SIGKILLs at "Generating static pages (0/889)".
  return Boolean(process.env.NEXT_DIST_DIR);
}

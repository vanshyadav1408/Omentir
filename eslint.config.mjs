import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Blog/marketing prose contains thousands of literal apostrophes and
      // quotes ("don't", "you're"). React escapes these fine at runtime, so the
      // rule only produces noise (~2800 false errors) that drowns real signal.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;

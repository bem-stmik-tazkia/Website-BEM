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
    // Ignore helper scripts (they use CommonJS require() by design)
    "scripts/**",
    "apply_policy.js",
    "check_berita_rls.js",
    "query_karya.js",
    "check_dups.mjs",
    "update_karya_detail_i18n.js",
  ]),
  {
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────
      // Allow `any` in select situations (legacy code / third-party types)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars as warnings only
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow CommonJS require() where ESM is not feasible
      "@typescript-eslint/no-require-imports": "warn",

      // ── React ────────────────────────────────────────────────────────────
      // Allow unescaped entities (", ', etc.) in JSX text
      "react/no-unescaped-entities": "off",
      // Downgrade setState-in-effect to a warning (many patterns are fine)
      "react-hooks/set-state-in-effect": "warn",
      // Downgrade exhaustive-deps to a warning
      "react-hooks/exhaustive-deps": "warn",
      // prefer-const: warning only
      "prefer-const": "warn",

      // ── Next.js ──────────────────────────────────────────────────────────
      // Downgrade <img> warnings (some components need raw img)
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;

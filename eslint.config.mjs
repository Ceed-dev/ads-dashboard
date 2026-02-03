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
    // External project directories (accidentally nested)
    "ads-dashboard/**",
    "ceed-ads/**",
    "ceed-publisher-console/**",
    "ceed-ads-ios-sdk/**",
    "CeedAdsIOSSample/**",
    "ClipLoop/**",
    "ClipPulse/**",
    "english-pal-bot/**",
    "finance-dashboard/**",
    "InvoiceFlow/**",
    "kumo-shogun/**",
    "linguapal/**",
    "multi-agent-shogun/**",
    "quest-web/**",
    "quest/**",
    "sales-ops-hub/**",
    "shungo0222/**",
    "synthetic-chat-user-benchmark/**",
  ]),
]);

export default eslintConfig;

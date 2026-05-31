import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}", "middleware.ts", "test/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/*",
                "@/lib/*",
                "@/server/*",
                "@/hooks/*",
                "@/stores/*",
                "@/services/*",
              ],
              message:
                "Legacy import path. Use @/domains/* or @/shared/* instead.",
            },
            {
              group: ["@/src/shared/*"],
              message: "Use @/shared/* instead of @/src/shared/*.",
            },
            {
              group: ["@/domains/marketplace/_legacy/*"],
              message:
                "Do not import legacy adapters directly. Use @/domains/marketplace/publication instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/**/*.{ts,tsx}",
      "test/**/*.{ts,tsx}",
    ],
    ignores: ["src/domains/marketplace/listings/**"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/domains/marketplace/listings/domain/listing-types",
              message:
                "Use @/domains/marketplace/shared/domain/publication-type-registry instead.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

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
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

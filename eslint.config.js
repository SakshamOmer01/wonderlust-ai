/** @type {import('eslint').Linter.Config[]} */
import nextCoreWebVitals from "eslint-config-next/core-web-vitals.js";

const baseConfig = nextCoreWebVitals.extends || {};

export default [
  {
    ...baseConfig,
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

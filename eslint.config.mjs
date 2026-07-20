import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "out/**",
      "src/generated/**",
    ],
  },
];

export default eslintConfig;

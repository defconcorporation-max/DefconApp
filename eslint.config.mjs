import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals"),
    {
        rules: {
            // Allow unused vars prefixed with _
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
            // Allow any type (too many to fix at once)
            "@typescript-eslint/no-explicit-any": "off",
            // Allow empty catch blocks (used in migration patterns)
            "no-empty": ["warn", { allowEmptyCatch: true }],
            // Disable img element rule (handled by next/image in components that need it)
            "@next/next/no-img-element": "off",
            // Allow React hooks exhaustive-deps warnings (many complex callbacks)
            "react-hooks/exhaustive-deps": "warn",
            // Allow unescaped entities in JSX (French text has apostrophes)
            "react/no-unescaped-entities": "off",
        },
    },
    {
        ignores: [
            "scripts/**",
            "*.config.*",
            ".next/**",
        ],
    },
];

export default eslintConfig;
